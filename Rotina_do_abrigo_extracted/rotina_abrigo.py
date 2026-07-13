import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    Column, String, Text, Boolean, Integer, ForeignKey, DateTime, Time, Enum
)
from sqlalchemy.dialects.postgresql import UUID, ARRAY, SMALLINT
from sqlalchemy.orm import relationship

from app.db.base import Base  # ajustar ao Base real do projeto


class CategoriaRotinaAbrigo(str, enum.Enum):
    ALIMENTACAO = "alimentacao"
    HIGIENE = "higiene"
    DESCANSO = "descanso"
    ADMINISTRATIVO = "administrativo"
    SAUDE = "saude"
    RECREACAO = "recreacao"
    RELIGIOSO = "religioso"
    SEGURANCA = "seguranca"


class PadraoRecorrenciaRotina(str, enum.Enum):
    HORARIO_FIXO = "horario_fixo"
    INTERVALO_HORAS = "intervalo_horas"


class CatalogoRotinaPadraoAbrigo(Base):
    """Modelo sugerido pela doutrina — mestre, único no SIGERD. Usado para
    'Aplicar modelo padrão' em qualquer abrigo novo, e depois ajustado
    livremente ao contexto cultural/local pela administração do abrigo."""
    __tablename__ = "catalogo_rotina_padrao_abrigo"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    codigo = Column(String(40), unique=True, nullable=False)
    atividade = Column(String(120), nullable=False)
    categoria = Column(Enum(CategoriaRotinaAbrigo, name="categoria_rotina_abrigo"), nullable=False)
    horario_sugerido_inicio = Column(Time, nullable=False)
    horario_sugerido_fim = Column(Time, nullable=True)
    padrao_recorrencia = Column(Enum(PadraoRecorrenciaRotina, name="padrao_recorrencia_rotina"),
                                 default=PadraoRecorrenciaRotina.HORARIO_FIXO, nullable=False)
    intervalo_horas = Column(Integer, nullable=True)  # ex.: lactário a cada 3h
    descricao = Column(Text, nullable=True)
    ordem_padrao = Column(Integer, default=0, nullable=False)


class AbrigoRotinaItem(Base):
    __tablename__ = "abrigo_rotina_item"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    abrigo_id = Column(UUID(as_uuid=True), ForeignKey("abrigos.id"), nullable=False)
    atividade = Column(String(120), nullable=False)
    categoria = Column(Enum(CategoriaRotinaAbrigo, name="categoria_rotina_abrigo"), nullable=False)
    horario_inicio = Column(Time, nullable=False)
    horario_fim = Column(Time, nullable=True)
    padrao_recorrencia = Column(Enum(PadraoRecorrenciaRotina, name="padrao_recorrencia_rotina"),
                                 default=PadraoRecorrenciaRotina.HORARIO_FIXO, nullable=False)
    intervalo_horas = Column(Integer, nullable=True)
    dias_semana = Column(ARRAY(SMALLINT), nullable=True)  # NULL = todos os dias
    observacao = Column(Text, nullable=True)
    responsavel_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=True)
    ordem = Column(Integer, default=0, nullable=False)
    ativo = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow,
                         onupdate=datetime.utcnow, nullable=False)

    execucoes = relationship("AbrigoRotinaExecucao", back_populates="rotina_item")


class StatusExecucaoRotina(str, enum.Enum):
    PENDENTE = "pendente"
    REALIZADA = "realizada"
    NAO_REALIZADA = "nao_realizada"


class AbrigoRotinaExecucao(Base):
    """Evidência diária de cumprimento da rotina — relevante para
    auditoria (TCE-ES) e, quando o abrigo estiver vinculado a uma
    Operação de Assistência Humanitária ativa, alimenta também o
    Diário Operacional daquela operação (mesmo padrão de vínculo
    transversal já usado no restante do módulo)."""
    __tablename__ = "abrigo_rotina_execucao"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rotina_item_id = Column(UUID(as_uuid=True), ForeignKey("abrigo_rotina_item.id"), nullable=False)
    data_referencia = Column(DateTime(timezone=False), nullable=False)  # DATE no banco
    status = Column(Enum(StatusExecucaoRotina, name="status_execucao_rotina"),
                     default=StatusExecucaoRotina.PENDENTE, nullable=False)
    usuario_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=True)
    data_hora_confirmacao = Column(DateTime(timezone=True), nullable=True)
    observacao = Column(Text, nullable=True)
    operacao_id = Column(UUID(as_uuid=True), ForeignKey("operacao_assistencia_humanitaria.id"), nullable=True)

    rotina_item = relationship("AbrigoRotinaItem", back_populates="execucoes")


class AbrigoRegraConvivencia(Base):
    __tablename__ = "abrigo_regra_convivencia"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    abrigo_id = Column(UUID(as_uuid=True), ForeignKey("abrigos.id"), nullable=False)
    texto_regra = Column(Text, nullable=False)
    ordem = Column(Integer, default=0, nullable=False)
    ativo = Column(Boolean, default=True, nullable=False)


class CatalogoRegraConvivenciaPadrao(Base):
    __tablename__ = "catalogo_regra_convivencia_padrao"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    texto_regra = Column(Text, nullable=False)
    ordem_padrao = Column(Integer, default=0, nullable=False)
