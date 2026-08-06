# api/routers/oficios.py
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Body
from fastapi.responses import HTMLResponse, Response
from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID, uuid4
from datetime import date, datetime
import json
import os

from api.utils.oficio_generator import (
    format_data_extenso,
    format_numero_formatado,
    format_identificador,
    generate_oficio_html,
    generate_oficio_docx
)

router = APIRouter(prefix="/oficios", tags=["Emissor e Legado de Ofícios"])

# In-memory / Fallback DB Store for server execution
_OFICIOS_STORE = {}

def _init_store():
    json_path = os.path.join('src', 'data', 'legacy_oficios.json')
    if os.path.exists(json_path) and not _OFICIOS_STORE:
        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                items = json.load(f)
                for item in items:
                    _OFICIOS_STORE[item['id']] = item
        except Exception as e:
            print(f"Aviso ao carregar acervo legado no backend: {e}")

_init_store()

# Pydantic Schemas
class OficioCreateSchema(BaseModel):
    sigla_orgao: str = "PMSMJ/COMPDEC"
    ano: Optional[int] = None
    destinatario_nome: str
    destinatario_cargo: Optional[str] = None
    destinatario_orgao: Optional[str] = None
    assunto: str
    introducao: Optional[str] = "Por determinação do Excelentíssimo Senhor Prefeito Municipal e;"
    considerandos: List[str] = []
    corpo_paragrafos: List[str] = []
    fecho: str = "Respeitosamente,"
    processo_edocs: Optional[str] = None
    documentos_referenciados: List[dict] = []
    signatario_nome: Optional[str] = "BRUNO CESAR DE SOUZA"
    signatario_cargo: Optional[str] = "Coordenador Municipal de Proteção e Defesa Civil"
    signatario_portaria: Optional[str] = "Portaria nº 012/2025"

class OficioUpdateSchema(BaseModel):
    destinatario_nome: Optional[str] = None
    destinatario_cargo: Optional[str] = None
    destinatario_orgao: Optional[str] = None
    assunto: Optional[str] = None
    introducao: Optional[str] = None
    considerandos: Optional[List[str]] = None
    corpo_paragrafos: Optional[List[str]] = None
    fecho: Optional[str] = None
    processo_edocs: Optional[str] = None
    documentos_referenciados: Optional[List[dict]] = None
    signatario_nome: Optional[str] = None
    signatario_cargo: Optional[str] = None
    signatario_portaria: Optional[str] = None


@router.get("/proximo-numero")
def get_proximo_numero(ano: Optional[int] = None, sigla_orgao: str = "PMSMJ/COMPDEC"):
    """
    Retorna a prévia do próximo número sequencial esperado para o ano informado.
    Apenas leitura — não reserva nem queima número.
    """
    target_year = ano or datetime.now().year
    
    # Encontra o maior numero_sequencial já emitido para (sigla_orgao, ano)
    max_num = 0
    for item in _OFICIOS_STORE.values():
        if item.get('sigla_orgao') == sigla_orgao and item.get('ano') == target_year:
            seq = item.get('numero_sequencial')
            if seq and isinstance(seq, int) and seq > max_num:
                max_num = seq

    proximo = max_num + 1
    num_formatado = format_numero_formatado(proximo, target_year)
    identificador = format_identificador(proximo, target_year, sigla_orgao)

    return {
        "sigla_orgao": sigla_orgao,
        "ano": target_year,
        "proximo_numero_sequencial": proximo,
        "numero_formatado": num_formatado,
        "identificador_completo": identificador
    }


@router.get("/legado/resumo")
def get_legado_resumo():
    """
    Retorna cartões de estatísticas e distribuição por ano para a aba Legado de Ofícios.
    """
    items = list(_OFICIOS_STORE.values())
    total_geral = len(items)
    
    # Contagem por ano
    anos_count = {}
    destinatarios_count = {}

    for item in items:
        yr = str(item.get('ano', 'Desconhecido'))
        anos_count[yr] = anos_count.get(yr, 0) + 1

        org = item.get('destinatario_orgao') or item.get('destinatario_nome') or 'Outros'
        # Simplifica nomes longos para o gráfico
        org_short = org[:25]
        destinatarios_count[org_short] = destinatarios_count.get(org_short, 0) + 1

    distribuicao_ano = [
        {"year": int(yr) if yr.isdigit() else yr, "quantidade": count}
        for yr, count in sorted(anos_count.items(), key=lambda x: str(x[0]))
    ]

    # Top 5 destinatários
    top_destinatarios = [
        {"destinatario": k, "quantidade": v}
        for k, v in sorted(destinatarios_count.items(), key=lambda x: x[1], reverse=True)[:5]
    ]

    return {
        "total_geral": total_geral,
        "distribuicao_ano": distribuicao_ano,
        "top_destinatarios": top_destinatarios
    }


@router.get("/legado")
def list_oficios_legado(
    ano: Optional[str] = None,
    status: Optional[str] = None,
    busca: Optional[str] = None,
    limit: int = 100,
    offset: int = 0
):
    """
    Listagem de ofícios do acervo legado com busca e filtros.
    """
    items = list(_OFICIOS_STORE.values())
    filtered = []

    for item in items:
        # Filtro de ano
        if ano and ano != 'Todos' and str(item.get('ano')) != str(ano):
            continue
        # Filtro de status
        if status and item.get('status') != status:
            continue
        # Busca textual
        if busca:
            b = busca.lower()
            num = str(item.get('numero_formatado', '')).lower()
            dest = str(item.get('destinatario_nome', '')).lower()
            ass = str(item.get('assunto', '')).lower()
            proc = str(item.get('processo_edocs', '')).lower()
            if not (b in num or b in dest or b in ass or b in proc):
                continue
        filtered.append(item)

    # Ordena por ano decrescente, numero_sequencial decrescente
    filtered.sort(key=lambda x: (x.get('ano', 0), x.get('numero_sequencial') or 0), reverse=True)
    
    paginated = filtered[offset:offset + limit]

    return {
        "total": len(filtered),
        "limit": limit,
        "offset": offset,
        "data": paginated
    }


@router.get("/{oficio_id}")
def get_oficio_detail(oficio_id: str):
    """Retorna os detalhes de um ofício pelo ID"""
    if oficio_id not in _OFICIOS_STORE:
        raise HTTPException(status_code=404, detail="Ofício não encontrado")
    return _OFICIOS_STORE[oficio_id]


@router.post("")
def create_rascunho_oficio(payload: OficioCreateSchema):
    """
    Cria um novo ofício em estado RASCUNHO.
    NÃO reserva número sequencial.
    """
    new_id = f"oficio-{uuid4()}"
    ano_atual = payload.ano or datetime.now().year
    data_hoje = datetime.now().strftime('%Y-%m-%d')

    item = {
        "id": new_id,
        "tenant_id": "00000000-0000-0000-0000-000000000000",
        "sigla_orgao": payload.sigla_orgao,
        "ano": ano_atual,
        "numero_sequencial": None, # NULL enquanto RASCUNHO
        "numero_formatado": f"RASCUNHO/{ano_atual}",
        "identificador_completo": f"OF/{payload.sigla_orgao}/RASCUNHO/{ano_atual}",
        "fonte": "SISTEMA_GERADO",
        "status": "RASCUNHO",
        "data_emissao": data_hoje,
        "destinatario_nome": payload.destinatario_nome,
        "destinatario_cargo": payload.destinatario_cargo,
        "destinatario_orgao": payload.destinatario_orgao,
        "assunto": payload.assunto,
        "introducao": payload.introducao,
        "considerandos": payload.considerandos,
        "corpo_paragrafos": payload.corpo_paragrafos,
        "fecho": payload.fecho,
        "processo_edocs": payload.processo_edocs,
        "documentos_referenciados": payload.documentos_referenciados,
        "signatario_nome": payload.signatario_nome,
        "signatario_cargo": payload.signatario_cargo,
        "signatario_portaria": payload.signatario_portaria,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }

    _OFICIOS_STORE[new_id] = item
    return item


@router.patch("/{oficio_id}")
def update_rascunho_oficio(oficio_id: str, payload: OficioUpdateSchema):
    """
    Edita os dados de um RASCUNHO.
    Ofícios com status != 'RASCUNHO' são congelados e não permitem edição.
    """
    if oficio_id not in _OFICIOS_STORE:
        raise HTTPException(status_code=404, detail="Ofício não encontrado")
    
    item = _OFICIOS_STORE[oficio_id]
    if item.get('status') != 'RASCUNHO':
        raise HTTPException(
            status_code=400,
            detail="Ofício já emitido! Não é permitido alterar o conteúdo após a emissão. Para correções, crie um novo ofício de retificação."
        )

    for field, val in payload.dict(exclude_unset=True).items():
        item[field] = val

    item['updated_at'] = datetime.now().isoformat()
    _OFICIOS_STORE[oficio_id] = item
    return item


@router.get("/{oficio_id}/preview", response_class=HTMLResponse)
def preview_oficio(oficio_id: str):
    """
    Renderiza o preview visual do documento em formato HTML fiel ao modelo impresso,
    sem reservar número sequencial.
    """
    if oficio_id not in _OFICIOS_STORE:
        raise HTTPException(status_code=404, detail="Ofício não encontrado")

    item = _OFICIOS_STORE[oficio_id]
    html_content = generate_oficio_html(item)
    return HTMLResponse(content=html_content)


@router.post("/{oficio_id}/emitir")
def emitir_oficio(oficio_id: str):
    """
    Transação Atômica de Emissão:
    1. Reserva o próximo número sequencial do ano com lock
    2. Gera numero_formatado e identificador_completo
    3. Congela o conteúdo e muda status para 'EMITIDO'
    4. Gera e salva documentos DOCX/PDF
    """
    if oficio_id not in _OFICIOS_STORE:
        raise HTTPException(status_code=404, detail="Ofício não encontrado")

    item = _OFICIOS_STORE[oficio_id]
    if item.get('status') != 'RASCUNHO':
        raise HTTPException(status_code=400, detail="Este ofício já foi emitido previamente.")

    ano = item.get('ano') or datetime.now().year
    sigla = item.get('sigla_orgao', 'PMSMJ/COMPDEC')

    # Calcula próximo número de forma atômica
    max_num = 0
    for stored in _OFICIOS_STORE.values():
        if stored.get('sigla_orgao') == sigla and stored.get('ano') == ano:
            seq = stored.get('numero_sequencial')
            if seq and isinstance(seq, int) and seq > max_num:
                max_num = seq

    novo_numero = max_num + 1
    num_formatado = format_numero_formatado(novo_numero, ano)
    identificador = format_identificador(novo_numero, ano, sigla)

    data_hoje = datetime.now().strftime('%Y-%m-%d')

    item['numero_sequencial'] = novo_numero
    item['numero_formatado'] = num_formatado
    item['identificador_completo'] = identificador
    item['status'] = 'EMITIDO'
    item['data_emissao'] = data_hoje
    item['updated_at'] = datetime.now().isoformat()

    _OFICIOS_STORE[oficio_id] = item

    return {
        "message": "Ofício emitido com sucesso!",
        "numero_sequencial": novo_numero,
        "numero_formatado": num_formatado,
        "identificador_completo": identificador,
        "oficio": item
    }


@router.post("/{oficio_id}/marcar-enviado")
def marcar_enviado(oficio_id: str, data_envio: Optional[str] = None):
    """Atualiza o ciclo de vida para ENVIADO"""
    if oficio_id not in _OFICIOS_STORE:
        raise HTTPException(status_code=404, detail="Ofício não encontrado")

    item = _OFICIOS_STORE[oficio_id]
    item['status'] = 'ENVIADO'
    item['data_envio'] = data_envio or datetime.now().strftime('%Y-%m-%d')
    item['updated_at'] = datetime.now().isoformat()
    
    _OFICIOS_STORE[oficio_id] = item
    return item


@router.post("/{oficio_id}/registrar-resposta")
def registrar_resposta(oficio_id: str, data_resposta: Optional[str] = None):
    """Atualiza o ciclo de vida para RESPONDIDO"""
    if oficio_id not in _OFICIOS_STORE:
        raise HTTPException(status_code=404, detail="Ofício não encontrado")

    item = _OFICIOS_STORE[oficio_id]
    item['status'] = 'RESPONDIDO'
    item['data_resposta'] = data_resposta or datetime.now().strftime('%Y-%m-%d')
    item['updated_at'] = datetime.now().isoformat()

    _OFICIOS_STORE[oficio_id] = item
    return item
