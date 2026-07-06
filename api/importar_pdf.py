from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
import pdfplumber
import re

app = FastAPI()

def extrair_campo(texto, label_inicio, label_fim=None):
    padrao = re.escape(label_inicio) + r"(.*?)(?=" + (re.escape(label_fim) if label_fim else r"\n|$)")
    match = re.search(padrao, texto, re.IGNORECASE | re.DOTALL)
    return match.group(1).strip() if match else None

@app.post("/api/importar-pdf")
async def importar_pdf(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        return JSONResponse(status_code=400, content={"error": "invalid_format", "message": "Arquivo deve ser um PDF."})

    text = ""
    try:
        with pdfplumber.open(file.file) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        return JSONResponse(status_code=400, content={"error": "pdf_corrompido", "message": "Erro ao ler o PDF."})

    if not text.strip():
        return JSONResponse(status_code=400, content={"error": "pdf_sem_texto_nativo", "message": "O documento parece ser uma imagem escaneada. Não foi possível extrair o texto."})

    tipo = None
    if "REGISTRO DA DENÚNCIA" in text or "e-COPS" in text:
        tipo = "e-COPS"
    elif "CIODES" in text:
        tipo = "CIODES"
    else:
        return JSONResponse(status_code=400, content={"error": "tipo_nao_reconhecido", "message": "PDF não foi reconhecido como CIODES ou e-COPS."})

    campos = {}
    envolvidos = []

    if tipo == "e-COPS":
        # Extração de campos do e-COPS usando regex ou split por quebra de linha
        # Número
        match_numero = re.search(r"Nº\.:?\s*(\d+)", text, re.IGNORECASE)
        campos["numero_referencia"] = match_numero.group(1).strip() if match_numero else None
        
        # Incidente
        match_incidente = re.search(r"Incidente\n(.*?)\n", text, re.IGNORECASE)
        campos["natureza"] = match_incidente.group(1).strip() if match_incidente else None
        
        # Quando
        match_quando = re.search(r"Quando\n(.*?)\n", text, re.IGNORECASE)
        campos["data_aproximada"] = match_quando.group(1).strip() if match_quando else None

        # Município, Bairro, Rua
        match_municipio = re.search(r"Município\n(.*?)\n", text, re.IGNORECASE)
        match_bairro = re.search(r"Bairro\n(.*?)\n", text, re.IGNORECASE)
        match_rua = re.search(r"Rua\n(.*?)\n", text, re.IGNORECASE)
        
        campos["municipio"] = match_municipio.group(1).strip() if match_municipio else None
        campos["bairro"] = match_bairro.group(1).strip() if match_bairro else None
        campos["rua"] = match_rua.group(1).strip() if match_rua else None
        
        # Referência
        match_ref = re.search(r"Referência\n(.*?)\n", text, re.IGNORECASE)
        campos["referencia"] = match_ref.group(1).strip() if match_ref else None

        # Características do Endereço
        match_caracteristicas = re.search(r"Características do Endereço\n(.*?)\n", text, re.IGNORECASE)
        campos["observacoes_local"] = match_caracteristicas.group(1).strip() if match_caracteristicas else None

        # Descrição da Denúncia
        match_desc = re.search(r"Descrição da Denúncia\n(.*?)(?=\nOs militares e os servidores|\Z)", text, re.IGNORECASE | re.DOTALL)
        campos["descricao"] = match_desc.group(1).strip() if match_desc else None

        # Extração Básica de Envolvidos
        blocos_envolvidos = text.split("Dados dos Envolvidos")
        if len(blocos_envolvidos) > 1:
            texto_envolvidos = blocos_envolvidos[1]
            envolvidos_parts = re.split(r"Nome\n", texto_envolvidos)
            for part in envolvidos_parts[1:]:
                linhas = part.split("\n")
                nome = linhas[0].strip() if linhas else "Desconhecido"
                if "Os militares e os servidores" in nome:
                    break
                envolvidos.append({
                    "id": str(len(envolvidos) + 1),
                    "nome": nome,
                    "idade": None,
                    "tipo_envolvimento": None
                })
                
    return JSONResponse(status_code=200, content={
        "tipo": tipo,
        "campos": campos,
        "envolvidos": envolvidos
    })
