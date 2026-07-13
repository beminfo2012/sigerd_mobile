"""
Endpoints REST — Animais de Estimação dos Abrigados.

Monte com: app.include_router(router, prefix="/api/abrigos")
Monte também: app.include_router(pontos_router, prefix="/api/pontos-apoio-animal")
"""
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.security.auth import get_current_user, require_permission
from app.models.animal_abrigo import PontoApoioAnimal, StatusEncaminhamentoAnimal
from app.schemas.animal_abrigo import (
    AnimalIn, AnimalOut, EncaminharAnimalIn, AtualizarStatusEncaminhamentoIn,
    PontoApoioAnimalIn, PontoApoioAnimalOut, PontoApoioComDisponibilidadeOut,
    SugestaoPontosApoioOut, EncaminhamentoResumoOut,
)
from app.services import animal_abrigo_service as svc

router = APIRouter(tags=["Abrigos - Animais de Estimação"])
pontos_router = APIRouter(tags=["Pontos de Apoio Animal"])


def _serializar_animal(animal) -> AnimalOut:
    encaminhamento = animal.encaminhamento_ativo
    encaminhamento_out = None
    if encaminhamento:
        encaminhamento_out = EncaminhamentoResumoOut(
            id=encaminhamento.id,
            ponto_apoio_id=encaminhamento.ponto_apoio_id,
            ponto_apoio_nome=encaminhamento.ponto_apoio.nome,
            status=encaminhamento.status.value,
            distancia_km_no_momento=float(encaminhamento.distancia_km_no_momento)
                if encaminhamento.distancia_km_no_momento is not None else None,
            data_encaminhamento=encaminhamento.data_encaminhamento,
        )
    return AnimalOut(
        id=animal.id, tutor_pessoa_id=animal.tutor_pessoa_id, abrigo_humano_id=animal.abrigo_humano_id,
        nome=animal.nome, especie=animal.especie.value, raca=animal.raca,
        porte=animal.porte.value if animal.porte else None,
        vacinado_antirrabica=animal.vacinado_antirrabica,
        temperamento_observacoes=animal.temperamento_observacoes,
        condicao_saude_observacoes=animal.condicao_saude_observacoes,
        encaminhamento_ativo=encaminhamento_out,
    )


@router.get("/{abrigo_id}/animais", response_model=List[AnimalOut])
def listar_animais(abrigo_id: UUID, db: Session = Depends(get_db), usuario=Depends(get_current_user)):
    animais = svc.listar_animais_do_abrigo(db, abrigo_id)
    return [_serializar_animal(a) for a in animais]


@router.post("/{abrigo_id}/animais", response_model=AnimalOut, status_code=status.HTTP_201_CREATED)
def cadastrar_animal(
    abrigo_id: UUID, payload: AnimalIn, db: Session = Depends(get_db),
    usuario=Depends(get_current_user),
):
    """Registro do animal no momento da chegada do tutor ao abrigo —
    o tutor (pessoa abrigada) já deve estar cadastrado."""
    animal = svc.cadastrar_animal(db, abrigo_id, payload.dict())
    return _serializar_animal(animal)


@router.get("/animais/{animal_id}/pontos-sugeridos", response_model=SugestaoPontosApoioOut)
def sugerir_pontos(
    animal_id: UUID, apenas_com_vaga: bool = True, ignorar_proximidade: bool = False,
    db: Session = Depends(get_db), usuario=Depends(get_current_user),
):
    """Lista os pontos de apoio animal ordenados do mais próximo ao mais
    distante do endereço do tutor (ou do abrigo, como aproximação),
    já filtrando por vaga disponível.

    Se `ignorar_proximidade=true`, o cálculo de distância é pulado
    deliberadamente (a pedido do operador) e a lista volta ordenada por
    nome, cobrindo todos os pontos disponíveis independentemente de onde
    o tutor mora. O mesmo acontece automaticamente, mesmo sem o parâmetro,
    quando não há nenhuma coordenada disponível (nem do tutor, nem do
    abrigo) — o endpoint nunca falha por falta dessa informação.
    """
    sugestao = svc.sugerir_pontos_por_proximidade(db, animal_id, apenas_com_vaga, ignorar_proximidade)
    itens = [
        PontoApoioComDisponibilidadeOut(
            id=s["ponto"].id, nome=s["ponto"].nome, tipo=s["ponto"].tipo,
            endereco=s["ponto"].endereco, latitude=float(s["ponto"].latitude),
            longitude=float(s["ponto"].longitude), capacidade_maxima=s["ponto"].capacidade_maxima,
            telefone_contato=s["ponto"].telefone_contato,
            ocupacao_atual=s["ocupacao_atual"], vagas_disponiveis=s["vagas_disponiveis"],
            distancia_km=s["distancia_km"],
        )
        for s in sugestao["itens"]
    ]
    return SugestaoPontosApoioOut(referencia_origem=sugestao["referencia_origem"], itens=itens)


@router.post("/animais/{animal_id}/encaminhar", response_model=EncaminhamentoResumoOut,
             status_code=status.HTTP_201_CREATED)
def encaminhar_animal(
    animal_id: UUID, payload: EncaminharAnimalIn, db: Session = Depends(get_db),
    usuario=Depends(require_permission("abrigo.gerenciar_animais")),
):
    encaminhamento = svc.encaminhar_animal(
        db, animal_id, payload.ponto_apoio_id, usuario.id, payload.observacao, payload.ignorar_proximidade
    )
    return EncaminhamentoResumoOut(
        id=encaminhamento.id, ponto_apoio_id=encaminhamento.ponto_apoio_id,
        ponto_apoio_nome=encaminhamento.ponto_apoio.nome, status=encaminhamento.status.value,
        distancia_km_no_momento=float(encaminhamento.distancia_km_no_momento)
            if encaminhamento.distancia_km_no_momento is not None else None,
        data_encaminhamento=encaminhamento.data_encaminhamento,
    )


@router.put("/animais/encaminhamento/{encaminhamento_id}/status", response_model=EncaminhamentoResumoOut)
def atualizar_status(
    encaminhamento_id: UUID, payload: AtualizarStatusEncaminhamentoIn,
    db: Session = Depends(get_db), usuario=Depends(require_permission("abrigo.gerenciar_animais")),
):
    """Atualiza o ciclo de vida do encaminhamento: chegada no ponto de
    apoio, devolução ao tutor (reencontro), ou óbito."""
    novo_status = StatusEncaminhamentoAnimal(payload.status)
    encaminhamento = svc.atualizar_status_encaminhamento(db, encaminhamento_id, novo_status, payload.observacao)
    return EncaminhamentoResumoOut(
        id=encaminhamento.id, ponto_apoio_id=encaminhamento.ponto_apoio_id,
        ponto_apoio_nome=encaminhamento.ponto_apoio.nome, status=encaminhamento.status.value,
        distancia_km_no_momento=float(encaminhamento.distancia_km_no_momento)
            if encaminhamento.distancia_km_no_momento is not None else None,
        data_encaminhamento=encaminhamento.data_encaminhamento,
    )


# ---------------------------------------------------------------------
# Cadastro dos pontos de apoio (tela administrativa, fora do abrigo)
# ---------------------------------------------------------------------
@pontos_router.get("", response_model=List[PontoApoioAnimalOut])
def listar_pontos_apoio(db: Session = Depends(get_db), usuario=Depends(get_current_user)):
    return db.query(PontoApoioAnimal).filter(PontoApoioAnimal.ativo.is_(True)).all()


@pontos_router.post("", response_model=PontoApoioAnimalOut, status_code=status.HTTP_201_CREATED)
def criar_ponto_apoio(
    payload: PontoApoioAnimalIn, db: Session = Depends(get_db),
    usuario=Depends(require_permission("abrigo.gerenciar_animais")),
):
    ponto = PontoApoioAnimal(**payload.dict())
    db.add(ponto)
    db.commit()
    db.refresh(ponto)
    return ponto
