"""
AnimalAbrigoService

Responsabilidades:
1. Cadastro do animal de estimação vinculado ao tutor (pessoa abrigada).
2. Cálculo de distância (Haversine) entre a referência de localização do
   tutor e os pontos de apoio animal disponíveis, para sugerir sempre o
   mais próximo com vaga.
3. Encaminhamento do animal a um ponto de apoio (área dentro do próprio
   abrigo, canil municipal, CCZ ou ONG parceira) e acompanhamento do
   status até eventual devolução ao tutor.

Referência de localização usada para "proximidade ao tutor": preferencialmente
o endereço residencial de origem do abrigado (campo já deve existir no
cadastro de pessoas abrigadas, usado também para o planejamento de retorno
após o desastre); na ausência de coordenadas do endereço de origem, usa-se
a localização do próprio abrigo humano como aproximação razoável.
"""
from __future__ import annotations

import math
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.abrigo import Abrigo
from app.models.pessoa_abrigada import PessoaAbrigada  # ajustar ao módulo real
from app.models.animal_abrigo import (
    AnimalEstimacao, AnimalEncaminhamento, PontoApoioAnimal,
    StatusEncaminhamentoAnimal,
)


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    raio_terra_km = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lon2 - lon1)
    a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    return raio_terra_km * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _referencia_localizacao_tutor(
    db: Session, animal: AnimalEstimacao
) -> tuple[Optional[float], Optional[float], str]:
    """Retorna (latitude, longitude, origem) de referência para calcular
    proximidade.

    origem informa de onde veio a referência, para transparência na UI:
    - 'endereco_tutor' — melhor caso, usa o endereço residencial do tutor
    - 'abrigo'          — fallback, usa a localização do abrigo humano
    - 'indisponivel'    — nem tutor nem abrigo têm coordenadas cadastradas

    IMPORTANTE: esta função NUNCA levanta exceção. A ausência de
    coordenadas é uma situação esperada (endereço do tutor pode não ter
    sido geocodificado, sobretudo em cadastro feito às pressas durante o
    desastre) e não pode bloquear o encaminhamento do animal — apenas
    significa que a ordenação por proximidade não poderá ser aplicada, e
    quem chamou esta função deve tratar esse caso (ver
    sugerir_pontos_por_proximidade / encaminhar_animal)."""
    tutor = db.query(PessoaAbrigada).get(animal.tutor_pessoa_id)
    if tutor is not None and tutor.endereco_latitude and tutor.endereco_longitude:
        return float(tutor.endereco_latitude), float(tutor.endereco_longitude), "endereco_tutor"

    abrigo = db.query(Abrigo).get(animal.abrigo_humano_id)
    if abrigo is not None and abrigo.latitude is not None and abrigo.longitude is not None:
        return float(abrigo.latitude), float(abrigo.longitude), "abrigo"

    return None, None, "indisponivel"


# ---------------------------------------------------------------------
# Cadastro do animal
# ---------------------------------------------------------------------
def cadastrar_animal(db: Session, abrigo_humano_id: UUID, dados: dict) -> AnimalEstimacao:
    tutor = db.query(PessoaAbrigada).get(dados["tutor_pessoa_id"])
    if tutor is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Pessoa abrigada (tutor) não encontrada.")

    animal = AnimalEstimacao(abrigo_humano_id=abrigo_humano_id, **dados)
    db.add(animal)
    db.commit()
    db.refresh(animal)
    return animal


def listar_animais_do_abrigo(db: Session, abrigo_humano_id: UUID) -> List[AnimalEstimacao]:
    return (
        db.query(AnimalEstimacao)
        .filter(AnimalEstimacao.abrigo_humano_id == abrigo_humano_id, AnimalEstimacao.ativo.is_(True))
        .order_by(AnimalEstimacao.created_at)
        .all()
    )


# ---------------------------------------------------------------------
# Sugestão de pontos de apoio por proximidade + vaga
# ---------------------------------------------------------------------
def _ocupacao_atual(db: Session, ponto_apoio_id: UUID) -> int:
    return (
        db.query(AnimalEncaminhamento)
        .filter(
            AnimalEncaminhamento.ponto_apoio_id == ponto_apoio_id,
            AnimalEncaminhamento.ativo.is_(True),
            AnimalEncaminhamento.status.in_([
                StatusEncaminhamentoAnimal.ENCAMINHADO, StatusEncaminhamentoAnimal.NO_LOCAL,
            ]),
        )
        .count()
    )


def sugerir_pontos_por_proximidade(
    db: Session, animal_id: UUID, apenas_com_vaga: bool = True, ignorar_proximidade: bool = False
) -> dict:
    """Retorna os pontos de apoio ativos, com a ocupação/vaga calculada
    em tempo real.

    Comportamento:
    - ignorar_proximidade=False (padrão): tenta ordenar do mais próximo
      ao mais distante da referência de localização do tutor. Se não
      houver nenhuma coordenada disponível (nem do tutor, nem do
      abrigo), a função NÃO falha — automaticamente cai para o modo
      'ignorado' e devolve a lista sem distância, sinalizando o motivo
      em `referencia_origem`.
    - ignorar_proximidade=True: pulo deliberado do cálculo de distância,
      a pedido do operador (ex.: quer ver todos os pontos disponíveis
      independentemente de onde o tutor mora). Lista ordenada por nome.

    O retorno inclui `referencia_origem` ('endereco_tutor' | 'abrigo' |
    'indisponivel' | 'ignorado_pelo_operador') para a UI explicar ao
    operador com base em que a lista foi ordenada.
    """
    animal = db.query(AnimalEstimacao).get(animal_id)
    if animal is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Animal não encontrado.")

    pontos = db.query(PontoApoioAnimal).filter(PontoApoioAnimal.ativo.is_(True)).all()

    def _montar_lista_sem_distancia():
        itens = []
        for p in pontos:
            ocupacao = _ocupacao_atual(db, p.id)
            vagas = p.capacidade_maxima - ocupacao
            if apenas_com_vaga and vagas <= 0:
                continue
            itens.append({
                "ponto": p, "ocupacao_atual": ocupacao,
                "vagas_disponiveis": vagas, "distancia_km": None,
            })
        itens.sort(key=lambda r: r["ponto"].nome)
        return itens

    if ignorar_proximidade:
        return {"itens": _montar_lista_sem_distancia(), "referencia_origem": "ignorado_pelo_operador"}

    lat_ref, lon_ref, origem = _referencia_localizacao_tutor(db, animal)

    if origem == "indisponivel":
        # Nenhuma coordenada disponível — não bloqueia o fluxo, apenas
        # não é possível ordenar por distância.
        return {"itens": _montar_lista_sem_distancia(), "referencia_origem": "indisponivel"}

    resultado = []
    for p in pontos:
        ocupacao = _ocupacao_atual(db, p.id)
        vagas = p.capacidade_maxima - ocupacao
        if apenas_com_vaga and vagas <= 0:
            continue
        distancia = _haversine_km(lat_ref, lon_ref, float(p.latitude), float(p.longitude))
        resultado.append({
            "ponto": p,
            "ocupacao_atual": ocupacao,
            "vagas_disponiveis": vagas,
            "distancia_km": round(distancia, 2),
        })

    resultado.sort(key=lambda r: r["distancia_km"])
    return {"itens": resultado, "referencia_origem": origem}


# ---------------------------------------------------------------------
# Encaminhamento
# ---------------------------------------------------------------------
def encaminhar_animal(
    db: Session, animal_id: UUID, ponto_apoio_id: UUID, usuario_id: UUID,
    observacao: Optional[str] = None, ignorar_proximidade: bool = False,
) -> AnimalEncaminhamento:
    animal = db.query(AnimalEstimacao).get(animal_id)
    if animal is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Animal não encontrado.")

    ponto = db.query(PontoApoioAnimal).get(ponto_apoio_id)
    if ponto is None or not ponto.ativo:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Ponto de apoio não encontrado ou inativo.")

    ocupacao = _ocupacao_atual(db, ponto_apoio_id)
    if ocupacao >= ponto.capacidade_maxima:
        raise HTTPException(status.HTTP_409_CONFLICT, f"O ponto de apoio '{ponto.nome}' está sem vagas.")

    # Encerra encaminhamento ativo anterior, se houver (transferência)
    anterior = (
        db.query(AnimalEncaminhamento)
        .filter(AnimalEncaminhamento.animal_id == animal_id, AnimalEncaminhamento.ativo.is_(True))
        .first()
    )
    if anterior:
        anterior.ativo = False

    # A distância só é calculada quando o operador não pediu para
    # ignorá-la E existe alguma referência de localização disponível.
    # Em qualquer outro caso, o encaminhamento segue normalmente com
    # distancia_km_no_momento = NULL — a ausência dessa informação nunca
    # impede o encaminhamento do animal.
    distancia = None
    if not ignorar_proximidade:
        lat_ref, lon_ref, origem = _referencia_localizacao_tutor(db, animal)
        if origem != "indisponivel":
            distancia = round(_haversine_km(lat_ref, lon_ref, float(ponto.latitude), float(ponto.longitude)), 2)

    novo = AnimalEncaminhamento(
        animal_id=animal_id,
        ponto_apoio_id=ponto_apoio_id,
        distancia_km_no_momento=distancia,
        status=StatusEncaminhamentoAnimal.ENCAMINHADO,
        usuario_responsavel_id=usuario_id,
        observacao=observacao,
    )
    db.add(novo)
    db.commit()
    db.refresh(novo)
    return novo


def atualizar_status_encaminhamento(
    db: Session, encaminhamento_id: UUID, novo_status: StatusEncaminhamentoAnimal, observacao: Optional[str] = None
) -> AnimalEncaminhamento:
    encaminhamento = db.query(AnimalEncaminhamento).get(encaminhamento_id)
    if encaminhamento is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Encaminhamento não encontrado.")

    encaminhamento.status = novo_status
    if observacao:
        encaminhamento.observacao = observacao
    if novo_status == StatusEncaminhamentoAnimal.NO_LOCAL:
        encaminhamento.data_chegada_local = datetime.utcnow()
    if novo_status == StatusEncaminhamentoAnimal.DEVOLVIDO_AO_TUTOR:
        encaminhamento.data_devolucao_tutor = datetime.utcnow()
        encaminhamento.ativo = False  # ciclo do encaminhamento encerrado; animal está de volta com o tutor
    if novo_status == StatusEncaminhamentoAnimal.OBITO:
        encaminhamento.ativo = False
        animal = db.query(AnimalEstimacao).get(encaminhamento.animal_id)
        if animal:
            animal.ativo = False  # encerra o cadastro ativo do animal, preserva histórico

    db.commit()
    db.refresh(encaminhamento)
    return encaminhamento
