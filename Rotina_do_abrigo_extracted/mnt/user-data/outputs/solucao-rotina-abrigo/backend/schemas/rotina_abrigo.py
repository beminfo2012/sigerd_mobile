from datetime import date, datetime, time
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------
# Catálogo padrão (doutrina)
# ---------------------------------------------------------------------
class RotinaPadraoOut(BaseModel):
    id: UUID
    codigo: str
    atividade: str
    categoria: str
    horario_sugerido_inicio: time
    horario_sugerido_fim: Optional[time] = None
    padrao_recorrencia: str
    intervalo_horas: Optional[int] = None
    descricao: Optional[str] = None

    class Config:
        orm_mode = True


# ---------------------------------------------------------------------
# Item de rotina do abrigo
# ---------------------------------------------------------------------
class RotinaItemIn(BaseModel):
    atividade: str
    categoria: str
    horario_inicio: time
    horario_fim: Optional[time] = None
    padrao_recorrencia: str = "horario_fixo"
    intervalo_horas: Optional[int] = None
    dias_semana: Optional[List[int]] = None  # None = todos os dias; 0=domingo..6=sábado
    observacao: Optional[str] = None
    responsavel_id: Optional[UUID] = None
    ordem: int = 0


class RotinaItemOut(BaseModel):
    id: UUID
    abrigo_id: UUID
    atividade: str
    categoria: str
    horario_inicio: time
    horario_fim: Optional[time] = None
    padrao_recorrencia: str
    intervalo_horas: Optional[int] = None
    dias_semana: Optional[List[int]] = None
    observacao: Optional[str] = None
    responsavel_id: Optional[UUID] = None
    ordem: int
    ativo: bool

    class Config:
        orm_mode = True


class AplicarModeloPadraoIn(BaseModel):
    codigos: Optional[List[str]] = None  # None = aplica o catálogo inteiro


# ---------------------------------------------------------------------
# Execução diária
# ---------------------------------------------------------------------
class ConfirmarExecucaoIn(BaseModel):
    status: str = Field(..., description="'realizada' ou 'nao_realizada'")
    observacao: Optional[str] = None


class ExecucaoOut(BaseModel):
    id: UUID
    rotina_item_id: UUID
    data_referencia: date
    status: str
    data_hora_confirmacao: Optional[datetime] = None
    observacao: Optional[str] = None

    class Config:
        orm_mode = True


class RotinaItemComExecucaoOut(RotinaItemOut):
    execucao_hoje: Optional[ExecucaoOut] = None


# ---------------------------------------------------------------------
# Regras de convivência
# ---------------------------------------------------------------------
class RegraConvivenciaIn(BaseModel):
    texto_regra: str = Field(..., min_length=1)
    ordem: int = 0


class RegraConvivenciaOut(BaseModel):
    id: UUID
    texto_regra: str
    ordem: int

    class Config:
        orm_mode = True
