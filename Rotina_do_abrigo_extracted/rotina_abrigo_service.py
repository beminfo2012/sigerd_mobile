"""
RotinaAbrigoService

Responsabilidades:
1. Aplicar o modelo padrão de rotina (catálogo doutrinário) a um abrigo,
   como ponto de partida editável.
2. CRUD dos itens de rotina específicos de cada abrigo.
3. Confirmação diária de execução de cada item — evidência para
   auditoria e, quando houver operação ativa, também para o Diário
   Operacional daquela operação (mesmo padrão de vínculo transversal já
   usado no restante do módulo de Assistência Humanitária).
4. Geração do "Mural da Rotina" (PDF) — rotina + regras de convivência,
   pronto para impressão e afixação em local visível do abrigo, conforme
   exigido pela doutrina.
"""
from __future__ import annotations

import io
from datetime import date, datetime
from typing import List, Optional
from uuid import UUID

from fastapi import HTTPException, status
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from sqlalchemy.orm import Session

from app.models.abrigo import Abrigo
from app.models.rotina_abrigo import (
    AbrigoRotinaItem, AbrigoRotinaExecucao, AbrigoRegraConvivencia,
    CatalogoRotinaPadraoAbrigo, CatalogoRegraConvivenciaPadrao,
    StatusExecucaoRotina,
)
from app.services.operacao_context import get_operacao_id_ativo_sync  # variante não-Depends, ver nota

DIAS_SEMANA_PT = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"]


# ---------------------------------------------------------------------
# Modelo padrão -> rotina do abrigo
# ---------------------------------------------------------------------
def aplicar_modelo_padrao(
    db: Session, abrigo_id: UUID, codigos: Optional[List[str]] = None
) -> List[AbrigoRotinaItem]:
    """Copia o catálogo doutrinário (ou um subconjunto, por código) para
    a rotina do abrigo, como ponto de partida. Não sobrescreve itens já
    existentes — apenas adiciona os que ainda não foram criados."""
    query = db.query(CatalogoRotinaPadraoAbrigo)
    if codigos:
        query = query.filter(CatalogoRotinaPadraoAbrigo.codigo.in_(codigos))
    modelos = query.order_by(CatalogoRotinaPadraoAbrigo.ordem_padrao).all()

    ja_existentes = {
        i.atividade for i in db.query(AbrigoRotinaItem).filter(AbrigoRotinaItem.abrigo_id == abrigo_id)
    }

    criados = []
    for m in modelos:
        if m.atividade in ja_existentes:
            continue
        item = AbrigoRotinaItem(
            abrigo_id=abrigo_id,
            atividade=m.atividade,
            categoria=m.categoria,
            horario_inicio=m.horario_sugerido_inicio,
            horario_fim=m.horario_sugerido_fim,
            padrao_recorrencia=m.padrao_recorrencia,
            intervalo_horas=m.intervalo_horas,
            observacao=m.descricao,
            ordem=m.ordem_padrao,
        )
        db.add(item)
        criados.append(item)

    db.commit()
    for i in criados:
        db.refresh(i)
    return criados


def listar_rotina(db: Session, abrigo_id: UUID) -> List[AbrigoRotinaItem]:
    return (
        db.query(AbrigoRotinaItem)
        .filter(AbrigoRotinaItem.abrigo_id == abrigo_id, AbrigoRotinaItem.ativo.is_(True))
        .order_by(AbrigoRotinaItem.horario_inicio)
        .all()
    )


def criar_item_rotina(db: Session, abrigo_id: UUID, dados: dict) -> AbrigoRotinaItem:
    abrigo = db.query(Abrigo).get(abrigo_id)
    if abrigo is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Abrigo não encontrado.")
    item = AbrigoRotinaItem(abrigo_id=abrigo_id, **dados)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def atualizar_item_rotina(db: Session, item_id: UUID, dados: dict) -> AbrigoRotinaItem:
    item = db.query(AbrigoRotinaItem).get(item_id)
    if item is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Item de rotina não encontrado.")
    for campo, valor in dados.items():
        setattr(item, campo, valor)
    db.commit()
    db.refresh(item)
    return item


def remover_item_rotina(db: Session, item_id: UUID) -> None:
    item = db.query(AbrigoRotinaItem).get(item_id)
    if item is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Item de rotina não encontrado.")
    item.ativo = False  # soft delete — preserva histórico de execuções já registradas
    db.commit()


# ---------------------------------------------------------------------
# Execução diária
# ---------------------------------------------------------------------
def obter_execucao_do_dia(
    db: Session, rotina_item_id: UUID, data_referencia: date
) -> Optional[AbrigoRotinaExecucao]:
    return (
        db.query(AbrigoRotinaExecucao)
        .filter(
            AbrigoRotinaExecucao.rotina_item_id == rotina_item_id,
            AbrigoRotinaExecucao.data_referencia == data_referencia,
        )
        .first()
    )


def confirmar_execucao(
    db: Session,
    rotina_item_id: UUID,
    novo_status: StatusExecucaoRotina,
    usuario_id: UUID,
    observacao: Optional[str] = None,
    data_referencia: Optional[date] = None,
) -> AbrigoRotinaExecucao:
    item = db.query(AbrigoRotinaItem).get(rotina_item_id)
    if item is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Item de rotina não encontrado.")

    data_referencia = data_referencia or date.today()
    execucao = obter_execucao_do_dia(db, rotina_item_id, data_referencia)

    # Se o abrigo estiver vinculado a uma operação ativa, a confirmação
    # também herda automaticamente o operacao_id — mesma automação já
    # usada em todo o módulo de Assistência Humanitária, sem seleção
    # manual do operador.
    operacao_id = get_operacao_id_ativo_sync(db, item.abrigo_id)

    if execucao is None:
        execucao = AbrigoRotinaExecucao(
            rotina_item_id=rotina_item_id,
            data_referencia=data_referencia,
            operacao_id=operacao_id,
        )
        db.add(execucao)

    execucao.status = novo_status
    execucao.usuario_id = usuario_id
    execucao.data_hora_confirmacao = datetime.utcnow()
    execucao.observacao = observacao

    db.commit()
    db.refresh(execucao)

    if operacao_id:
        from app.services.operacao_service import registrar_diario
        from app.models.operacao import OrigemDiario
        rotulo = "cumprida" if novo_status == StatusExecucaoRotina.REALIZADA else "não cumprida"
        registrar_diario(
            db, operacao_id,
            f"Rotina '{item.atividade}' marcada como {rotulo} ({item.abrigo.nome}).",
            OrigemDiario.AUTOMATICO,
            entidade_referencia="rotina_execucao",
            entidade_referencia_id=execucao.id,
        )

    return execucao


# ---------------------------------------------------------------------
# Regras de convivência
# ---------------------------------------------------------------------
def listar_regras(db: Session, abrigo_id: UUID) -> List[AbrigoRegraConvivencia]:
    return (
        db.query(AbrigoRegraConvivencia)
        .filter(AbrigoRegraConvivencia.abrigo_id == abrigo_id, AbrigoRegraConvivencia.ativo.is_(True))
        .order_by(AbrigoRegraConvivencia.ordem)
        .all()
    )


def aplicar_regras_padrao(db: Session, abrigo_id: UUID) -> List[AbrigoRegraConvivencia]:
    modelos = db.query(CatalogoRegraConvivenciaPadrao).order_by(
        CatalogoRegraConvivenciaPadrao.ordem_padrao
    ).all()
    criadas = []
    for m in modelos:
        regra = AbrigoRegraConvivencia(abrigo_id=abrigo_id, texto_regra=m.texto_regra, ordem=m.ordem_padrao)
        db.add(regra)
        criadas.append(regra)
    db.commit()
    for r in criadas:
        db.refresh(r)
    return criadas


def adicionar_regra(db: Session, abrigo_id: UUID, texto: str, ordem: int) -> AbrigoRegraConvivencia:
    regra = AbrigoRegraConvivencia(abrigo_id=abrigo_id, texto_regra=texto, ordem=ordem)
    db.add(regra)
    db.commit()
    db.refresh(regra)
    return regra


def remover_regra(db: Session, regra_id: UUID) -> None:
    regra = db.query(AbrigoRegraConvivencia).get(regra_id)
    if regra is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Regra não encontrada.")
    regra.ativo = False
    db.commit()


# ---------------------------------------------------------------------
# Mural para impressão (rotina + regras) — para afixar em local visível,
# conforme exigido pela doutrina.
# ---------------------------------------------------------------------
def _formatar_dias(dias_semana: Optional[List[int]]) -> str:
    if not dias_semana:
        return "Todos os dias"
    return ", ".join(DIAS_SEMANA_PT[d] for d in sorted(dias_semana))


def gerar_mural_pdf(db: Session, abrigo_id: UUID) -> bytes:
    abrigo = db.query(Abrigo).get(abrigo_id)
    if abrigo is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Abrigo não encontrado.")

    rotina = listar_rotina(db, abrigo_id)
    regras = listar_regras(db, abrigo_id)

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        leftMargin=2 * cm, rightMargin=2 * cm, topMargin=2 * cm, bottomMargin=2 * cm,
    )
    styles = getSampleStyleSheet()
    story = [
        Paragraph("Rotina de Funcionamento do Abrigo", ParagraphStyle("Titulo", parent=styles["Title"], fontSize=16)),
        Paragraph(abrigo.nome, ParagraphStyle("Nome", parent=styles["Heading2"])),
        Paragraph(abrigo.endereco or "", ParagraphStyle("Sub", parent=styles["Normal"], textColor=colors.grey)),
        Spacer(1, 0.7 * cm),
    ]

    dados_rotina = [["Horário", "Atividade", "Frequência", "Observação"]]
    for item in rotina:
        horario = item.horario_inicio.strftime("%H:%M")
        if item.horario_fim:
            horario += f" – {item.horario_fim.strftime('%H:%M')}"
        if item.padrao_recorrencia == "intervalo_horas" and item.intervalo_horas:
            horario += f" (a cada {item.intervalo_horas}h)"
        dados_rotina.append([
            horario,
            item.atividade,
            _formatar_dias(item.dias_semana),
            Paragraph(item.observacao or "", styles["Normal"]),
        ])

    tabela_rotina = Table(dados_rotina, colWidths=[3 * cm, 4.5 * cm, 3 * cm, 6.5 * cm], repeatRows=1)
    tabela_rotina.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2563EB")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
    ]))
    story.append(tabela_rotina)

    if regras:
        story.append(Spacer(1, 1 * cm))
        story.append(Paragraph("Regras de Convivência", ParagraphStyle("SubTitulo", parent=styles["Heading2"])))
        for regra in regras:
            story.append(Paragraph(f"• {regra.texto_regra}", styles["Normal"]))
            story.append(Spacer(1, 0.15 * cm))

    doc.build(story)
    return buffer.getvalue()
