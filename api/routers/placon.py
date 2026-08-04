# api/routers/placon.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional

# Dependências condicionais para ambientes com SQLAlchemy configurado
try:
    from app.database import get_db
    from app.auth import get_current_user, require_tenant
    from app.models import placon as models
    from app.schemas import placon as schemas
except ImportError:
    # Mocks de fallback para pré-compilação em repositórios desacoplados
    def get_db(): pass
    def get_current_user(): pass
    models = None
    schemas = None

router = APIRouter(prefix="/placon", tags=["Plano de Contingência"])


@router.get("/meu-orgao")
def get_meu_orgao(db: Session = Depends(get_db), user=Depends(get_current_user)):
    """
    Retorna o órgão (ou lista de órgãos) ao qual o usuário autenticado
    está vinculado dentro do plano. Cada usuário só vê seu próprio painel.
    """
    vinculos = db.query(models.PlaconUsuarioOrgao)\
                 .filter_by(usuario_id=user.id, tenant_id=user.tenant_id)\
                 .all()
    if not vinculos:
        raise HTTPException(404, "Usuário sem vínculo a órgão no PLACON")
    return [v.orgao for v in vinculos]


@router.get("/orgaos/{orgao_id}")
def get_orgao(orgao_id: UUID, db: Session = Depends(get_db),
              user=Depends(get_current_user)):
    """
    Retorna os dados completos de um órgão: descrição, atribuições por fase,
    contatos e recursos (com disponibilidade lida em tempo real do MCI).
    Acesso restrito ao próprio órgão, salvo papel coordenador_compdec.
    """
    # Verificar se o usuário tem acesso a este órgão
    is_coord = db.query(models.PlaconUsuarioOrgao).filter_by(
        usuario_id=user.id, tenant_id=user.tenant_id,
        papel="coordenador_compdec"
    ).first()
    if not is_coord:
        vinculo = db.query(models.PlaconUsuarioOrgao).filter_by(
            usuario_id=user.id, orgao_id=orgao_id, tenant_id=user.tenant_id
        ).first()
        if not vinculo:
            raise HTTPException(403, "Acesso restrito ao seu próprio órgão")

    orgao = db.query(models.PlaconOrgao).filter_by(
        id=orgao_id, tenant_id=user.tenant_id
    ).first()
    if not orgao:
        raise HTTPException(404, "Órgão não encontrado")

    # Buscar atribuições, contatos e recursos com disponibilidade do MCI
    atribuicoes = db.query(models.PlaconAtribuicao)\
                    .filter_by(orgao_id=orgao_id, tenant_id=user.tenant_id)\
                    .order_by(models.PlaconAtribuicao.fase, models.PlaconAtribuicao.ordem)\
                    .all()

    contatos = db.query(models.PlaconContato)\
                 .filter_by(orgao_id=orgao_id, tenant_id=user.tenant_id)\
                 .all()

    recursos = db.query(models.PlaconRecurso)\
                 .filter_by(orgao_id=orgao_id, tenant_id=user.tenant_id)\
                 .all()

    # Para cada recurso, buscar disponibilidade em tempo real no MCI
    recursos_com_mci = []
    for r in recursos:
        disponivel = db.query(models.MciRecurso.quantidade_disponivel)\
                       .filter_by(id=r.mci_recurso_id)\
                       .scalar() if r.mci_recurso_id else None
        recursos_com_mci.append({
            "id": r.id,
            "mci_recurso_id": r.mci_recurso_id,
            "categoria": r.categoria,
            "nome_recurso": r.nome_recurso,
            "alocado_plano": r.alocado_plano,
            "disponivel_mci": disponivel,
        })

    return {
        "orgao": orgao,
        "atribuicoes": {
            "prevencao":  [a for a in atribuicoes if a.fase == "prevencao"],
            "preparacao": [a for a in atribuicoes if a.fase == "preparacao"],
            "resposta":   [a for a in atribuicoes if a.fase == "resposta"],
        },
        "contatos": contatos,
        "recursos": recursos_com_mci,
    }


@router.patch("/recursos/{recurso_id}/alocar")
def alocar_recurso(recurso_id: UUID, body: schemas.AlocarRecursoBody if schemas else None,
                   db: Session = Depends(get_db), user=Depends(get_current_user)):
    """
    Atualiza a quantidade alocada de um recurso no plano.
    Grava log de auditoria obrigatório.
    """
    recurso = db.query(models.PlaconRecurso).filter_by(
        id=recurso_id, tenant_id=user.tenant_id
    ).first()
    if not recurso:
        raise HTTPException(404, "Recurso não encontrado")

    # Verificar disponibilidade no MCI antes de aceitar
    if recurso.mci_recurso_id:
        disponivel = db.query(models.MciRecurso.quantidade_disponivel)\
                       .filter_by(id=recurso.mci_recurso_id).scalar()
        if body.alocado > disponivel:
            raise HTTPException(422, f"MCI indica apenas {disponivel} unidades disponíveis")

    # Log de auditoria
    db.add(models.PlaconRecursoLog(
        tenant_id=user.tenant_id,
        recurso_id=recurso_id,
        usuario_id=user.id,
        alocado_antes=recurso.alocado_plano,
        alocado_depois=body.alocado,
    ))

    recurso.alocado_plano = body.alocado
    db.commit()
    return {"ok": True, "alocado_plano": recurso.alocado_plano}


@router.get("/publico")
def get_plano_publico(tenant_id: UUID, db: Session = Depends(get_db)):
    """
    Visão de leitura pública/institucional — todos os órgãos e fases,
    sem dados operacionais sensíveis do MCI. Usada na audiência pública
    anual (prazo: 30/junho, conforme §6º Lei 12.608/2012).
    """
    orgaos = db.query(models.PlaconOrgao)\
               .filter_by(tenant_id=tenant_id, ativo=True)\
               .order_by(models.PlaconOrgao.ordem).all()

    resultado = []
    for orgao in orgaos:
        atribuicoes = db.query(models.PlaconAtribuicao)\
                        .filter_by(orgao_id=orgao.id, tenant_id=tenant_id)\
                        .order_by(models.PlaconAtribuicao.fase,
                                  models.PlaconAtribuicao.ordem).all()
        contatos = db.query(models.PlaconContato)\
                     .filter_by(orgao_id=orgao.id, tenant_id=tenant_id).all()
        resultado.append({
            "orgao": orgao,
            "atribuicoes": atribuicoes,
            "contatos": contatos,
            # Sem recursos nesta visão (dado operacional)
        })

    versao = db.query(models.PlaconVersao)\
               .filter_by(tenant_id=tenant_id)\
               .order_by(models.PlaconVersao.created_at.desc()).first()

    return {"versao": versao, "orgaos": resultado}
