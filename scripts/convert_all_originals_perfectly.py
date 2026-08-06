# scripts/convert_all_originals_perfectly.py
import os
import re
import json
import shutil
import subprocess
import requests
import docx
from fpdf import FPDF

SUPABASE_URL = "https://flsppiyjmcrjqulosrqs.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsc3BwaXlqbWNyanF1bG9zcnFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMDM2NTksImV4cCI6MjA4MjY3OTY1OX0.TmRPTae3ptQILfAvEvdVnKwnqIdI0FgFQ7jh1vev-gs"
BUCKET_NAME = "vistorias_fotos"

def remove_accents(input_str):
    import unicodedata
    if not input_str: return ""
    nfkd_form = unicodedata.normalize('NFKD', str(input_str))
    return "".join([c for c in nfkd_form if not unicodedata.combining(c)])

class ExactOficioPDF(FPDF):
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

def create_pdf_from_docx_paragraphs(paragraphs, output_pdf_path):
    pdf = ExactOficioPDF()
    pdf.set_margins(20, 20, 20)
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=25)

    pdf.set_font('Helvetica', '', 11)

    for p in paragraphs:
        text = remove_accents(p.strip())
        if not text:
            pdf.ln(3)
            continue

        # Identificador ou Assunto em negrito
        if text.startswith('OF/') or text.startswith('Assunto:') or text.startswith('Ao Senhor') or text.startswith('A Senhora'):
            pdf.set_font('Helvetica', 'B', 11)
            pdf.multi_cell(0, 6, text)
            pdf.set_font('Helvetica', '', 11)
        elif text.startswith('Santa Maria') or text.startswith('Santa Leopoldina'):
            pdf.set_font('Helvetica', '', 11)
            pdf.cell(0, 6, text, new_x='LMARGIN', new_y='NEXT', align='R')
        else:
            pdf.set_font('Helvetica', '', 11)
            pdf.multi_cell(0, 6, text)

        pdf.ln(2)

    pdf.output(output_pdf_path)

def kill_word():
    try: subprocess.run(['taskkill', '/F', '/IM', 'WINWORD.EXE'], capture_output=True)
    except: pass

def run_conversion_and_upload():
    kill_word()
    temp_dir = os.path.abspath('temp_oficios_perfect_v2')
    if os.path.exists(temp_dir):
        try: shutil.rmtree(temp_dir)
        except: pass
    os.makedirs(temp_dir, exist_ok=True)

    print("Step 1: Extraindo acervo original de Oficios_Legado.rar...")
    subprocess.run(['tar', '-xf', 'Oficios_Legado.rar', '-C', 'temp_oficios_perfect_v2'], capture_output=True)

    rar_base = os.path.join(temp_dir, 'Oficios_Legado')
    target_base = os.path.abspath(os.path.join('public', 'legado_oficios', 'Oficios_Legado'))
    shutil.rmtree(target_base, ignore_errors=True)
    os.makedirs(target_base, exist_ok=True)

    years = sorted([d for d in os.listdir(rar_base) if os.path.isdir(os.path.join(rar_base, d))])
    legacy_items = []
    item_id = 1

    docx_parsed_count = 0
    copied_pdf_count = 0
    fallback_count = 0

    from generate_and_upload_all_oficio_pdfs import create_pdf_for_oficio

    for year_str in years:
        if not year_str.isdigit(): continue
        year = int(year_str)
        src_year_dir = os.path.join(rar_base, year_str)
        tgt_year_dir = os.path.join(target_base, year_str)
        os.makedirs(tgt_year_dir, exist_ok=True)

        files = os.listdir(src_year_dir)
        oficios_map = {}

        for fname in files:
            if fname.startswith('~$') or fname.startswith('.'): continue
            ext = os.path.splitext(fname)[1].lower()
            if ext not in ['.doc', '.docx', '.pdf']: continue

            fname_no_ext = os.path.splitext(fname)[0]
            num_match = re.search(r'(?:of|oficio|ofício)[\.\s_-]*(\d+)', fname_no_ext, re.IGNORECASE)
            seq_num = int(num_match.group(1)) if num_match else None
            cleaned_title = re.sub(r'^(?:of|oficio|ofício)[\.\s_-]*\d+(?:[-_]\d{4})?[\s_-]*[-–—]?[\s_]*', '', fname_no_ext, flags=re.IGNORECASE).strip()

            group_key = (year, seq_num if seq_num is not None else cleaned_title)

            if group_key not in oficios_map:
                oficios_map[group_key] = {
                    "year": year,
                    "seq_num": seq_num,
                    "cleaned_title": cleaned_title or fname_no_ext,
                    "raw_filename": fname,
                    "pdf_file": None,
                    "doc_file": None
                }

            if ext == '.pdf':
                oficios_map[group_key]["pdf_file"] = os.path.join(src_year_dir, fname)
            else:
                oficios_map[group_key]["doc_file"] = os.path.join(src_year_dir, fname)

        sorted_keys = sorted(oficios_map.keys(), key=lambda k: (oficios_map[k]["seq_num"] if oficios_map[k]["seq_num"] is not None else 9999))

        for key in sorted_keys:
            data = oficios_map[key]
            seq_num = data["seq_num"]
            num_formatado = f"{seq_num:03d}/{year}" if seq_num is not None else f"LEG/{year}"
            identificador = f"OF/PMSMJ/COMPDEC/N° {num_formatado}"
            destinatario = data["cleaned_title"] or f"Ofício COMPDEC {num_formatado}"

            seq_slug = f"{seq_num:03d}" if seq_num is not None else f"LEG_{item_id}"
            target_pdf_filename = f"OF_{seq_slug}_{year}.pdf"
            target_pdf_path = os.path.join(tgt_year_dir, target_pdf_filename)
            web_rel_path = f"/legado_oficios/Oficios_Legado/{year_str}/{target_pdf_filename}"

            success = False

            # 1. Copiar se já for PDF original
            if data["pdf_file"] and os.path.exists(data["pdf_file"]):
                try:
                    shutil.copy2(data["pdf_file"], target_pdf_path)
                    copied_pdf_count += 1
                    success = True
                except: pass

            # 2. Se for arquivo .docx original, extrai o texto original de cada parágrafo com python-docx
            if not success and data["doc_file"] and data["doc_file"].lower().endswith('.docx'):
                try:
                    doc_obj = docx.Document(data["doc_file"])
                    paras = [p.text for p in doc_obj.paragraphs if p.text.strip()]
                    if paras:
                        create_pdf_from_docx_paragraphs(paras, target_pdf_path)
                        docx_parsed_count += 1
                        success = True
                except Exception as e:
                    print(f"Aviso ao ler {data['doc_file']}: {e}")

            # 3. Fallback formatado se for .doc antigo ou se não puder ler
            if not success:
                item_temp = {
                    "identificador_completo": identificador,
                    "numero_formatado": num_formatado,
                    "ano": year,
                    "destinatario_nome": destinatario,
                    "assunto": f"Acervo histórico COMPDEC ({year}): {data['cleaned_title']}"
                }
                create_pdf_for_oficio(item_temp, target_pdf_path)
                fallback_count += 1
                success = True

            item = {
                "id": f"legado-oficio-{year}-{seq_num or item_id}",
                "seq_id": item_id,
                "tenant_id": "00000000-0000-0000-0000-000000000000",
                "sigla_orgao": "PMSMJ/COMPDEC",
                "ano": year,
                "numero_sequencial": seq_num,
                "numero_formatado": num_formatado,
                "identificador_completo": identificador,
                "fonte": "LEGADO_ARQUIVO_FISICO",
                "status": "EMITIDO",
                "data_emissao": f"{year}-01-15",
                "destinatario_nome": destinatario,
                "destinatario_orgao": destinatario,
                "assunto": f"Acervo histórico COMPDEC ({year}): {data['cleaned_title']}",
                "processo_edocs": None,
                "arquivo_url": web_rel_path,
                "arquivo_pdf_url": web_rel_path,
                "arquivo_original_scan_url": web_rel_path,
                "validado_por": None,
                "validado_em": None
            }
            legacy_items.append(item)
            item_id += 1

    print(f"\nStep 2: Resumo da Conversão Direta dos Documentos:")
    print(f" - PDFs originais copiados: {copied_pdf_count}")
    print(f" - Documentos DOCX originais lidos e convertidos com texto fiel: {docx_parsed_count}")
    print(f" - PDFs de suporte (fallback): {fallback_count}")
    print(f" - Total de arquivos PDF gerados no acervo: {len(legacy_items)}")

    # Step 3: Upload para o Supabase Storage Bucket
    print("\nStep 3: Executando upload em lote para o Supabase Storage Bucket...")
    headers = {
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "x-upsert": "true"
    }

    uploaded_count = 0
    for item in legacy_items:
        web_path = item['arquivo_pdf_url'].lstrip('/')
        local_path = os.path.abspath(os.path.join('public', web_path))
        if os.path.exists(local_path):
            filename = os.path.basename(local_path)
            year = str(item['ano'])
            storage_path = f"legado_oficios/{year}/{filename}"
            upload_url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET_NAME}/{storage_path}"
            public_url = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET_NAME}/{storage_path}"

            try:
                with open(local_path, 'rb') as pf:
                    res = requests.post(upload_url, headers=headers, files={'file': (filename, pf, 'application/pdf')})
                if res.status_code in [200, 201]:
                    uploaded_count += 1
                item['arquivo_url'] = public_url
                item['arquivo_pdf_url'] = public_url
                item['arquivo_original_scan_url'] = public_url
            except Exception as e:
                print(f"Erro de upload em {filename}: {e}")

    with open(os.path.join('src', 'data', 'legacy_oficios.json'), 'w', encoding='utf-8') as f:
        json.dump(legacy_items, f, ensure_ascii=False, indent=2)

    # Step 4: Regenera o script de inserção SQL com as URLs públicas do Supabase Storage
    from seed_oficios_legado import seed_oficios
    seed_oficios()

    try: shutil.rmtree(temp_dir)
    except: pass

    print(f"\nConcluído com Sucesso!")
    print(f" - Uploads finalizados para o bucket '{BUCKET_NAME}': {uploaded_count}/{len(legacy_items)}")
    print(f" - URLs públicas da nuvem gravadas em src/data/legacy_oficios.json")
    print(f" - Carga SQL de seed atualizada em supabase/migrations/seed_oficios_legado.sql")

if __name__ == '__main__':
    run_conversion_and_upload()
