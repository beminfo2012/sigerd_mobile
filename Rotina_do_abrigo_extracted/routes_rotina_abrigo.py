"""
Endpoints REST — Rotina de Funcionamento e Regras de Convivência do Abrigo.

Monte com: app.include_router(router, prefix="/api/abrigos")
"""
from datetime import date
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import io

from app.db.session import get_db
from app.security.auth import get_current_user, require_permission
from app.models.rotina_abrigo import CatalogoRotinaPadraoAbrigo, StatusExecucaoRotina
from app.schemas.rotina_abrigo import (
    RotinaPadraoOut, RotinaItemIn, RotinaItemOut, RotinaItemComExecucaoOut,
    AplicarModeloPadraoIn, ConfirmarExecucaoIn, ExecucaoOut,
    RegraConvivenciaIn, RegraConvivenciaOut,
)
from app.services import rotina_abrigo_service as svc

router = APIRouter(tags=["Abrigos - Rotina"])


@router.get("/catalogo-rotina-padrao", response_model=List[RotinaPadraoOut])
def listar_catalogo_rotina(db: Session = Depends(get_db), usuario=Depends(get_current_user)):
    return db.query(CatalogoRotinaPadraoAbrigo).order_by(CatalogoRotinaPadraoAbrigo.ordem_padrao).all()


@router.post("/{abrigo_id}/rotina/aplicar-modelo-padrao", response_model=List[RotinaItemOut])
def aplicar_modelo_padrao(
    abrigo_id: UUID,
    payload: AplicarModeloPadraoIn,
    db: Session = Depends(get_db),
    usuario=Depends(require_permission("abrigo.gerenciar_rotina")),
):
    """Copia o catálogo doutrinário (ou parte dele) para a rotina do
    abrigo, como ponto de partida editável — nunca sobrescreve itens
    já criados manualmente."""
    return svc.aplicar_modelo_padrao(db, abrigo_id, payload.codigos)


@router.get("/{abrigo_id}/rotina", response_model=List[RotinaItemComExecucaoOut])
def listar_rotina_do_dia(
    abrigo_id: UUID,
    data_referencia: Optional[date] = None,
    db: Session = Depends(get_db),
    usuario=Depends(get_current_user),
):
    """Grade horária do abrigo, já com o status de execução do dia
    informado (ou de hoje, se data_referencia não for passada) — usado
    tanto para exibir a grade quanto para o checklist diário."""
    dia = data_referencia or date.today()
    itens = svc.listar_rotina(db, abrigo_id)
    resultado = []
    for item in itens:
        execucao = svc.obter_execucao_do_dia(db, item.id, dia)
        resultado.append(
            RotinaItemComExecucaoOut(
                **RotinaItemOut.from_orm(item).dict(),
                execucao_hoje=ExecucaoOut.from_orm(execucao) if execucao else None,
            )
        )
    return resultado


@router.post("/{abrigo_id}/rotina", response_model=RotinaItemOut, status_code=status.HTTP_201_CREATED)
def criar_item_rotina(
    abrigo_id: UUID,
    payload: RotinaItemIn,
    db: Session = Depends(get_db),
    usuario=Depends(require_permission("abrigo.gerenciar_rotina")),
):
    return svc.criar_item_rotina(db, abrigo_id, payload.dict())


@router.put("/rotina/{item_id}", response_model=RotinaItemOut)
def atualizar_item_rotina(
    item_id: UUID,
    payload: RotinaItemIn,
    db: Session = Depends(get_db),
    usuario=Depends(require_permission("abrigo.gerenciar_rotina")),
):
    return svc.atualizar_item_rotina(db, item_id, payload.dict())


@router.delete("/rotina/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_item_rotina(
    item_id: UUID,
    db: Session = Depends(get_db),
    usuario=Depends(require_permission("abrigo.gerenciar_rotina")),
):
    svc.remover_item_rotina(db, item_id)


@router.post("/rotina/{item_id}/confirmar", response_model=ExecucaoOut)
def confirmar_execucao(
    item_id: UUID,
    payload: ConfirmarExecucaoIn,
    db: Session = Depends(get_db),
    usuario=Depends(get_current_user),
):
    """Checklist diário — qualquer operador em campo pode marcar um item
    da rotina como cumprido ou não cumprido. Se o abrigo estiver
    vinculado a uma operação ativa, o registro também aparece
    automaticamente no Diário Operacional daquela operação."""
    novo_status = (
        StatusExecucaoRotina.REALIZADA if payload.status == "realizada"
        else StatusExecucaoRotina.NAO_REALIZADA
    )
    return svc.confirmar_execucao(db, item_id, novo_status, usuario.id, payload.observacao)


@router.get("/{abrigo_id}/regras-convivencia", response_model=List[RegraConvivenciaOut])
def listar_regras(abrigo_id: UUID, db: Session = Depends(get_db), usuario=Depends(get_current_user)):
    return svc.listar_regras(db, abrigo_id)


@router.post("/{abrigo_id}/regras-convivencia/aplicar-padrao", response_model=List[RegraConvivenciaOut])
def aplicar_regras_padrao(
    abrigo_id: UUID, db: Session = Depends(get_db),
    usuario=Depends(require_permission("abrigo.gerenciar_rotina")),
):
    return svc.aplicar_regras_padrao(db, abrigo_id)


@router.post("/{abrigo_id}/regras-convivencia", response_model=RegraConvivenciaOut,
             status_code=status.HTTP_201_CREATED)
def adicionar_regra(
    abrigo_id: UUID, payload: RegraConvivenciaIn, db: Session = Depends(get_db),
    usuario=Depends(require_permission("abrigo.gerenciar_rotina")),
):
    return svc.adicionar_regra(db, abrigo_id, payload.texto_regra, payload.ordem)


@router.delete("/regras-convivencia/{regra_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_regra(
    regra_id: UUID, db: Session = Depends(get_db),
    usuario=Depends(require_permission("abrigo.gerenciar_rotina")),
):
    svc.remover_regra(db, regra_id)


@router.get("/{abrigo_id}/rotina/mural-impressao")
def imprimir_mural(abrigo_id: UUID, db: Session = Depends(get_db), usuario=Depends(get_current_user)):
    """PDF pronto para impressão e afixação em local visível do abrigo:
    grade de horários + regras de convivência."""
    conteudo = svc.gerar_mural_pdf(db, abrigo_id)
    return StreamingResponse(
        io.BytesIO(conteudo),
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="mural_rotina_{abrigo_id}.pdf"'},
    )
