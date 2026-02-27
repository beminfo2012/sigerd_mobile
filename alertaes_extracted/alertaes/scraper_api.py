import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import requests
from bs4 import BeautifulSoup
from typing import Optional
import io
try:
    from pypdf import PdfReader
except ImportError:
    pass

app = FastAPI(
    title="Alerta ES - API não oficial",
    description="API de web scraping para extrair informações dos sites de alerta e boletins da Defesa Civil do ES.",
    version="1.0.0"
)

# Adiciona CORS para permitir requisições de outras aplicações (como o seu frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Headers básicos para evitar bloqueios do servidor em raspagens simples
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
}

def extrair_boletins_pdf(url: str):
    """
    Função genérica para extrair links de PDFs de uma página.
    Normalmente, boletins são listados como links contendo '.pdf'.
    """
    try:
        response = requests.get(url, headers=HEADERS, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        boletins = []
        links_vistos = set()
        
        # Procura por todas as tags <a> que possuem href direcionando a um PDF
        for tag_a in soup.find_all('a', href=True):
            link = tag_a['href']
            
            if '.pdf' in link.lower():
                nome = tag_a.get_text(strip=True)
                
                # Trata links relativos
                if not link.startswith('http'):
                    link = 'https://alerta.es.gov.br' + link
                
                # Evita capturar botões genéricos de "Baixar" onde o nome principal já foi pego
                if nome.lower() == 'baixar' or not nome:
                    continue
                    
                # Evita duplicação do mesmo PDF
                if link not in links_vistos:
                    boletins.append({
                        "titulo": nome,
                        "url_pdf": link
                    })
                    links_vistos.add(link)
                    
        return boletins
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao extrair dados da página: {str(e)}")


@app.get("/")
def home():
    return {"mensagem": "API de Scraping do Alerta ES rodando com sucesso! Acesse /docs para ver a documentação."}

@app.get("/api/alertas")
def get_alertas(filtro_serrana: Optional[bool] = False, termo: Optional[str] = None):
    url = "https://alerta.es.gov.br/alertas"
    try:
        response = requests.get(url, headers=HEADERS, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Textos fixos de apresentação que não são alertas reais
        textos_ignorados = [
            "Para se cadastrar e começar a receber SMS",
            "O sistema de envio de SMS",
            "A iniciativa é fruto da parceria",
            "ALERTAS VIGENTES",
            "Produtos",
            "Avisos",
            "Alertas",
            "Boletim Extraordinário",
            "Boletim Geo-Hidrológico",
            "Boletim Meteorológico",
            "Desastres no Espírito Santo: Danos e Prejuízos",
            "Previsão Climática Sazonal",
            "Mapas de Risco",
            "Monitor de Secas",
            "Boletim Mensal do Alerta!",
            "Contato",
            "Defesa Civil Regional e Municipal",
            "Fale Conosco",
            "Governo do Estado do Espírito Santo"
        ]

        # Município alvo para filtro
        cidades_serrana = [
            "santa maria de jetibá"
        ]

        textos = []
        conteudo_principal = soup.find('main') or soup.find('div', class_='layout-content') or soup.find('article') or soup.body
        
        if conteudo_principal:
            # Pegamos parágrafos, listas e cabeçalhos menores
            elementos = conteudo_principal.find_all(['h3', 'h4', 'p', 'li', 'article'])
            for el in elementos:
                texto = el.get_text(strip=True)
                
                # Ignora textos muito curtos ou vazios (ex: menos de 30 caracteres para focar em alertas reais)
                if not texto or len(texto) < 30:
                    continue
                
                # Verifica se é um dos textos padrão para ignorar
                ignorar = any(texto_padrao.lower() in texto.lower() for texto_padrao in textos_ignorados)
                
                if not ignorar and texto not in textos:
                    # Aplica o filtro da região serrana se solicitado
                    passou_filtro = True
                    if filtro_serrana:
                        passou_filtro = any(cidade in texto.lower() for cidade in cidades_serrana)
                    
                    if passou_filtro and termo:
                        passou_filtro = termo.lower() in texto.lower()

                    if passou_filtro:
                        textos.append(texto)
                    
        return {
            "fonte": url,
            "total_encontrado": len(textos),
            "filtros_aplicados": {"serrana": filtro_serrana, "termo": termo},
            "dados_extraidos": textos
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao extrair dados da página: {str(e)}")

from typing import Optional

@app.get("/api/boletim-meteorologico")
def get_boletim_meteorologico(limite: Optional[int] = None, ano: Optional[str] = None):
    url = "https://alerta.es.gov.br/boletim-meteorologico"
    boletins = extrair_boletins_pdf(url)
    
    if ano:
        boletins = [b for b in boletins if ano in b["titulo"] or ano in b["url_pdf"]]
    if limite:
        boletins = boletins[:limite]
        
    return {
        "fonte": url,
        "total_encontrado": len(boletins),
        "boletins": boletins
    }

@app.get("/api/boletim-extraordinario")
def get_boletim_extraordinario(limite: Optional[int] = None, ano: Optional[str] = None):
    url = "https://alerta.es.gov.br/boletim-extraordinario-de-defesa-civil"
    boletins = extrair_boletins_pdf(url)
    
    if ano:
        boletins = [b for b in boletins if ano in b["titulo"] or ano in b["url_pdf"]]
    if limite:
        boletins = boletins[:limite]
        
    return {
        "fonte": url,
        "total_encontrado": len(boletins),
        "boletins": boletins
    }

@app.get("/api/boletim-serrana")
def get_ultimo_boletim_serrana():
    """Baixa o último boletim extraordinário e extrai dados sobre a Região Serrana"""
    try:
        # Pega a lista com o link do PDF mais recente do Boletim Extraordinário
        url = "https://alerta.es.gov.br/boletim-extraordinario-de-defesa-civil"
        boletins = extrair_boletins_pdf(url)
        if not boletins:
            raise HTTPException(status_code=404, detail="Nenhum boletim encontrado no site.")
            
        ultimo_bol = boletins[0]
        pdf_url = ultimo_bol['url_pdf']
        nome_bol = ultimo_bol['titulo']
        
        # Faz download seguro do PDF em memória (sem salvar arquivo temporário localmente)
        pdf_response = requests.get(pdf_url, headers=HEADERS, timeout=15)
        pdf_response.raise_for_status()
        
        # Fazer a leitura usando o pypdf
        pdf_file = io.BytesIO(pdf_response.content)
        reader = PdfReader(pdf_file)
        
        texto_completo = ""
        for page in reader.pages:
            texto = page.extract_text()
            if texto:
                texto_completo += texto + "\n"
        
        # Aqui, vamos buscar qualquer menção às cidades ou à classificação "Serrana"
        linhas = texto_completo.split('\n')
        linhas_relevantes = []
        chuvas = []
        
        cidades_serrana = [
            "santa maria de jetibá"
        ]
        
        import re
        
        for linha in linhas:
            linha_lower = linha.lower().strip()
            
            # Alguns boletins colocam informações em colunas meio coladas, limpamos excesso de espaços
            linha_lower_limpa = re.sub(r'\s+', ' ', linha_lower)
                
            # Verifica se alguma cidade da serra ou a palavra serrana é citada na linha
            passou_filtro = any((cidade in linha_lower_limpa) for cidade in cidades_serrana)
            
            if passou_filtro:
                # Tenta capturar padrão de tabela de chuva: Nome da Cidade + Número no final da linha (ex: IBITIRAMA 38.4)
                padrao_chuva = r"(" + "|".join(cidades_serrana) + r")\s+(\d+[\.,]?\d*)$"
                match = re.search(padrao_chuva, linha_lower_limpa)
                
                if match:
                    cidade_encontrada = match.group(1).title()
                    volume = match.group(2)
                    chuvas.append(f"{cidade_encontrada}: {volume} mm")
                elif len(linha.strip()) > 3:
                    # É um texto corrido normal
                    linhas_relevantes.append(linha.strip())
                
        # Limpa o resultado final
        if not linhas_relevantes and not chuvas:
            linhas_relevantes = ["O documento atual não possui informações específicas citadas ou a situação encontra-se normalizada."]
            
        return {
            "boletim_lido": nome_bol,
            "url_oficial": pdf_url,
            "status": "Sucesso",
            "chuvas_regiao_serrana": chuvas,
            "extratos_regiao_serrana": list(set(linhas_relevantes)) # Remove duplicatas exatas
        }

    except requests.exceptions.HTTPError as e:
        raise HTTPException(status_code=500, detail=f"Erro ao baixar o PDF. {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro no processamento do PDF: {str(e)}")

if __name__ == "__main__":
    print("Iniciando o servidor da API...")
    print("Documentação interativa disponível em: http://127.0.0.1:8000/docs")
    uvicorn.run(app, host="127.0.0.1", port=8000)
