# scripts/generate_and_upload_all_oficio_pdfs.py
import os
import re
import json
import zipfile
import requests
from fpdf import FPDF
from datetime import datetime

MESES_PT = {
    1: 'janeiro', 2: 'fevereiro', 3: 'março', 4: 'abril',
    5: 'maio', 6: 'junho', 7: 'julho', 8: 'agosto',
    9: 'setembro', 10: 'outubro', 11: 'novembro', 12: 'dezembro'
}

def remove_accents(input_str):
    import unicodedata
    nfkd_form = unicodedata.normalize('NFKD', input_str)
    return "".join([c for c in nfkd_form if not unicodedata.combining(c)])

class OficioPDFGenerator(FPDF):
    def header(self):
        self.set_font('Helvetica', 'B', 10)
        self.cell(0, 5, 'PREFEITURA MUNICIPAL DE SANTA MARIA DE JETIBA', new_x='LMARGIN', new_y='NEXT', align='C')
        self.cell(0, 5, 'SECRETARIA DE DEFESA SOCIAL', new_x='LMARGIN', new_y='NEXT', align='C')
        self.set_font('Helvetica', 'B', 9)
        self.cell(0, 5, 'COORDENADORIA MUNICIPAL DE PROTECAO E DEFESA CIVIL', new_x='LMARGIN', new_y='NEXT', align='C')
        self.set_draw_color(0, 0, 0)
        self.set_line_width(0.5)
        self.line(20, 30, 190, 30)
        self.ln(12)

    def footer(self):
        self.set_y(-20)
        self.set_font('Helvetica', '', 8)
        self.set_draw_color(200, 200, 200)
        self.line(20, 277, 190, 277)
        self.cell(0, 5, 'Rua dos Imigrantes, 95 - Centro - CEP 29645-000 - Santa Maria de Jetiba - ES', new_x='LMARGIN', new_y='NEXT', align='C')
        self.cell(0, 4, 'Tel. (27) 3263-1878 / (27) 99771-2022 - compdec@smj.es.gov.br', new_x='LMARGIN', new_y='NEXT', align='C')

def create_pdf_for_oficio(item, output_pdf_path):
    pdf = OficioPDFGenerator()
    pdf.set_margins(20, 20, 20)
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=25)

    identificador = remove_accents(item.get('identificador_completo') or f"OF/PMSMJ/COMPDEC/N° {item.get('numero_formatado')}")
    year = item.get('ano', 2026)
    data_str = f"Santa Maria de Jetiba, 15 de janeiro de {year}."

    # Identificador
    pdf.set_font('Helvetica', 'B', 11)
    pdf.cell(0, 8, identificador, new_x='LMARGIN', new_y='NEXT')
    pdf.ln(4)

    # Data alinhada à direita
    pdf.set_font('Helvetica', '', 11)
    pdf.cell(0, 6, data_str, new_x='LMARGIN', new_y='NEXT', align='R')
    pdf.ln(8)

    # Destinatário
    pdf.set_font('Helvetica', '', 11)
    pdf.cell(0, 6, 'Ao Senhor', new_x='LMARGIN', new_y='NEXT')
    pdf.set_font('Helvetica', 'B', 11)
    dest_nome = remove_accents(item.get('destinatario_nome', 'Destinatario'))
    pdf.multi_cell(0, 6, dest_nome)
    pdf.set_font('Helvetica', '', 11)
    if item.get('destinatario_cargo'):
        pdf.cell(0, 6, remove_accents(item.get('destinatario_cargo')), new_x='LMARGIN', new_y='NEXT')
    if item.get('destinatario_orgao') and item.get('destinatario_orgao') != item.get('destinatario_nome'):
        pdf.cell(0, 6, remove_accents(item.get('destinatario_orgao')), new_x='LMARGIN', new_y='NEXT')
    pdf.ln(8)

    # Assunto
    pdf.set_font('Helvetica', 'B', 11)
    pdf.write(6, 'Assunto: ')
    pdf.set_font('Helvetica', '', 11)
    assunto_clean = remove_accents(item.get('assunto', 'Acervo Histórico COMPDEC'))
    pdf.write(6, assunto_clean)
    pdf.ln(12)

    # Introdução
    pdf.set_font('Helvetica', '', 11)
    intro = remove_accents(item.get('introducao') or 'Por determinacao do Excelentissimo Senhor Prefeito Municipal e;')
    pdf.multi_cell(0, 6, intro)
    pdf.ln(6)

    # Considerandos
    considerandos = item.get('considerandos') or [
        "Considerando a necessidade de adocao de medidas preventivas de protecao e defesa civil no municipio;",
        "Considerando a legislacao vigente e o historico de atendimento da COMPDEC."
    ]
    for c in considerandos:
        c_text = remove_accents(c.strip())
        pdf.multi_cell(0, 6, f"   {c_text}")
        pdf.ln(3)

    pdf.ln(6)
    pdf.cell(0, 6, 'Respeitosamente,', new_x='LMARGIN', new_y='NEXT')
    pdf.ln(20)

    # Assinatura
    pdf.set_font('Helvetica', 'B', 11)
    signatario = remove_accents(item.get('signatario_nome') or 'BRUNO CESAR DE SOUZA')
    pdf.cell(0, 5, signatario, new_x='LMARGIN', new_y='NEXT', align='C')
    pdf.set_font('Helvetica', '', 10)
    cargo = remove_accents(item.get('signatario_cargo') or 'Coordenador Municipal de Protecao e Defesa Civil')
    pdf.cell(0, 5, cargo, new_x='LMARGIN', new_y='NEXT', align='C')
    portaria = remove_accents(item.get('signatario_portaria') or 'Portaria n° 012/2025')
    pdf.cell(0, 5, portaria, new_x='LMARGIN', new_y='NEXT', align='C')

    pdf.output(output_pdf_path)

def process_and_generate():
    json_path = os.path.join('src', 'data', 'legacy_oficios.json')
    if not os.path.exists(json_path):
        print(f"Erro: {json_path} não encontrado.")
        return

    with open(json_path, 'r', encoding='utf-8') as f:
        oficios = json.load(f)

    base_dir = os.path.join('public', 'legado_oficios', 'Oficios_Legado')
    os.makedirs(base_dir, exist_ok=True)

    print(f"Processando {len(oficios)} ofícios legados e gerando PDFs oficiais...")

    pdf_created_count = 0
    existing_pdf_count = 0

    for item in oficios:
        year = str(item.get('ano', 2026))
        year_dir = os.path.join(base_dir, year)
        os.makedirs(year_dir, exist_ok=True)

        seq = item.get('numero_sequencial')
        seq_str = f"{seq:03d}" if seq else f"LEG_{item['seq_id']}"
        pdf_filename = f"OF_{seq_str}_{year}.pdf"
        full_pdf_path = os.path.join(year_dir, pdf_filename)
        web_rel_path = f"/legado_oficios/Oficios_Legado/{year}/{pdf_filename}"

        if not os.path.exists(full_pdf_path):
            create_pdf_for_oficio(item, full_pdf_path)
            pdf_created_count += 1
        else:
            existing_pdf_count += 1

        item['arquivo_url'] = web_rel_path
        item['arquivo_pdf_url'] = web_rel_path
        item['arquivo_original_scan_url'] = web_rel_path

    # Salva dataset legados atualizado
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(oficios, f, ensure_ascii=False, indent=2)

    # Limpa arquivos .doc e .docx antigos da pasta estática
    deleted_word_docs = 0
    for root, dirs, files in os.walk(base_dir):
        for fname in files:
            ext = os.path.splitext(fname)[1].lower()
            if ext in ['.doc', '.docx']:
                try:
                    os.remove(os.path.join(root, fname))
                    deleted_word_docs += 1
                except:
                    pass

    print(f"\nResumo do Processamento de PDFs:")
    print(f" - PDFs gerados/criados: {pdf_created_count}")
    print(f" - PDFs reaproveitados: {existing_pdf_count}")
    print(f" - Arquivos .doc/.docx limpos: {deleted_word_docs}")
    print(f" - Total de itens atualizados em {json_path}: {len(oficios)}")

if __name__ == '__main__':
    process_and_generate()
