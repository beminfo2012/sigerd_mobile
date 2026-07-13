"""
Adendo ao arquivo já entregue: solucao-operacoes-ah/backend/services/operacao_context.py

O serviço de rotina do abrigo (rotina_abrigo_service.py) precisa resolver a
operação ativa de um município a partir de código de serviço puro (fora do
ciclo de vida de uma request/Depends do FastAPI). Adicione esta função aos
imports já existentes de operacao_context.py — ela reaproveita a mesma
`get_operacao_ativa` já implementada, apenas sem o wrapper de Dependency:
"""

from uuid import UUID
from typing import Optional
from sqlalchemy.orm import Session

from app.models.abrigo import Abrigo
from app.services.operacao_context import get_operacao_ativa  # já existente


def get_operacao_id_ativo_sync(db: Session, abrigo_id: UUID) -> Optional[UUID]:
    """Versão 'de serviço' (sem Depends) de get_operacao_id_ativo, para uso
    dentro de outros serviços que já têm o abrigo em mãos e precisam apenas
    do operacao_id do município ao qual ele pertence."""
    abrigo = db.query(Abrigo).get(abrigo_id)
    if abrigo is None:
        return None
    operacao = get_operacao_ativa(db, abrigo.municipio_id)
    return operacao.id if operacao else None
