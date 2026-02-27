import requests
import io
from pypdf import PdfReader
from bs4 import BeautifulSoup

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
}

# 1. Obter o link do ultimo PDF
url = "https://alerta.es.gov.br/boletim-extraordinario-de-defesa-civil"
response = requests.get(url, headers=HEADERS)
soup = BeautifulSoup(response.text, 'html.parser')
pdf_url = None
for tag_a in soup.find_all('a', href=True):
    link = tag_a['href']
    if '.pdf' in link.lower():
        if not link.startswith('http'):
            link = 'https://alerta.es.gov.br' + link
        pdf_url = link
        break

print(f"Baixando PDF: {pdf_url}")

# 2. Ler PDF
pdf_response = requests.get(pdf_url, headers=HEADERS)
pdf_file = io.BytesIO(pdf_response.content)
reader = PdfReader(pdf_file)

cidades_serrana = [
    "domingos martins", "marechal floriano", "santa maria de jetibá", 
    "santa teresa", "venda nova do imigrante", "afonso cláudio", "castelo", 
    "vargem alta", "conceição do castelo", "brejetuba", "laranja da terra",
    "itaguaçu", "itarana", "santa leopoldina", "ibitirama", "divino de são lourenço", "dores do rio preto"
]

for i, page in enumerate(reader.pages):
    texto = page.extract_text()
    if texto:
        for linha in texto.split('\n'):
            linha_lower = linha.lower().strip()
            if any(cid in linha_lower for cid in cidades_serrana):
                print(f"[Página {i+1}] {linha.strip()}")
                
print("\n--- FIM ---")
