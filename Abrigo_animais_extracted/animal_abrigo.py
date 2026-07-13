from datetime import date, datetime
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------
# Ponto de apoio animal
# ---------------------------------------------------------------------
class PontoApoioAnimalIn(BaseModel):
    nome: str
    tipo: str
    abrigo_humano_vinculado_id: Optional[UUID] = None
    endereco: str
    latitude: float
    longitude: float
    capacidade_maxima: int
    telefone_contato: Optional[str] = None


class PontoApoioAnimalOut(BaseModel):
    id: UUID
    nome: str
    tipo: str
    endereco: str
    latitude: float
    longitude: float
    capacidade_maxima: int
    telefone_contato: Optional[str] = None

    class Config:
        orm_mode = True


class PontoApoioComDisponibilidadeOut(PontoApoioAnimalOut):
    ocupacao_atual: int
    vagas_disponiveis: int
    distancia_km: Optional[float] = None


class SugestaoPontosApoioOut(BaseModel):
    referencia_origem: str  # 'endereco_tutor' | 'abrigo' | 'indisponivel' | 'ignorado_pelo_operador'
    itens: List[PontoApoioComDisponibilidadeOut]


# ---------------------------------------------------------------------
# Animal
# ---------------------------------------------------------------------
class AnimalIn(BaseModel):
    tutor_pessoa_id: UUID
    nome: str
    especie: str
    raca: Optional[str] = None
    porte: Optional[str] = None
    idade_estimada_anos: Optional[float] = None
    sexo: Optional[str] = None
    castrado: Optional[bool] = None
    vacinado_antirrabica: bool = False
    data_ultima_vacina: Optional[date] = None
    microchip_numero: Optional[str] = None
    temperamento_observacoes: Optional[str] = None
    condicao_saude_observacoes: Optional[str] = None


class EncaminhamentoResumoOut(BaseModel):
    id: UUID
    ponto_apoio_id: UUID
    ponto_apoio_nome: str
    status: str
    distancia_km_no_momento: Optional[float] = None
    data_encaminhamento: datetime

    class Config:
        orm_mode = True


class AnimalOut(BaseModel):
    id: UUID
    tutor_pessoa_id: UUID
    abrigo_humano_id: UUID
    nome: str
    especie: str
    raca: Optional[str] = None
    porte: Optional[str] = None
    vacinado_antirrabica: bool
    temperamento_observacoes: Optional[str] = None
    condicao_saude_observacoes: Optional[str] = None
    encaminhamento_ativo: Optional[EncaminhamentoResumoOut] = None

    class Config:
        orm_mode = True


class EncaminharAnimalIn(BaseModel):
    ponto_apoio_id: UUID
    observacao: Optional[str] = None
    ignorar_proximidade: bool = False


class AtualizarStatusEncaminhamentoIn(BaseModel):
    status: str = Field(..., description="'no_local' | 'devolvido_ao_tutor' | 'obito'")
    observacao: Optional[str] = None
