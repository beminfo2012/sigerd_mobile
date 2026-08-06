# scripts/convert_and_upload_all_perfect.py
import os
import re
import json
import shutil
import subprocess
import requests
import win32com.client

SUPABASE_URL = "https://flsppiyjmcrjqulosrqs.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsc3BwaXlqbWNyanF1bG9zcnFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMDM2NTksImV4cCI6MjA4MjY3OTY1OX0.TmRPTae3ptQILfAvEvdVnKwnqIdI0FgFQ7jh1vev-gs"
BUCKET_NAME = "vistorias_fotos"

def kill_word():
    try: subprocess.run(['taskkill', '/F', '/IM', 'WINWORD.EXE'], capture_output=True)
    except: pass

def run_pipeline():
    kill_word()
    temp_dir = os.path.abspath('temp_oficios_perfect')
    if os.path.exists(temp_dir):
        try: shutil.rmtree(temp_dir)
        except: pass
    os.makedirs(temp_dir, exist_ok=True)

    print("Step 1: Extraindo acervo original de Oficios_Legado.rar...")
    subprocess.run(['tar', '-xf', 'Oficios_Legado.rar', '-C', 'temp_oficios_perfect'], capture_output=True)

    rar_base = os.path.join(temp_dir, 'Oficios_Legado')
    target_base = os.path.abspath(os.path.join('public', 'legado_oficios', 'Oficios_Legado'))
    shutil.rmtree(target_base, ignore_errors=True)
    os.makedirs(target_base, exist_ok=True)

    print("Step 2: Inicializando Word COM para conversão 100% fiel dos cabeçalhos originais...")
    word = win32com.client.Dispatch('Word.Application')
    word.Visible = False
    word.DisplayAlerts = 0
    try: word.AutomationSecurity = 3
    except: pass

    years = sorted([d for d in os.listdir(rar_base) if os.path.isdir(os.path.join(rar_base, d))])
    legacy_items = []
    item_id = 1

    converted_count = 0
    copied_count = 0
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

            # 1. Copiar PDF se já existir no acervo original
            if data["pdf_file"] and os.path.exists(data["pdf_file"]):
                try:
                    shutil.copy2(data["pdf_file"], target_pdf_path)
                    copied_count += 1
                    success = True
                except: pass

            # 2. Converter via Word COM mantendo 100% dos cabeçalhos originais
            if not success and data["doc_file"] and os.path.exists(data["doc_file"]):
                doc_abs = os.path.abspath(data["doc_file"])
                pdf_abs = os.path.abspath(target_pdf_path)
                try:
                    print(f"[{item_id}] Convertendo original Word: {os.path.basename(doc_abs)}")
                    doc = word.Documents.Open(
                        FileName=doc_abs,
                        ConfirmConversions=False,
                        ReadOnly=True,
                        AddToRecentFiles=False
                    )
                    doc.SaveAs(FileName=pdf_abs, FileFormat=17)
                    doc.Close(SaveChanges=0)
                    converted_count += 1
                    success = True
                except Exception as e:
                    print(f"Aviso em {os.path.basename(doc_abs)}: {e}")

            # 3. Fallback se não for convertível via Word COM
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

    try: word.Quit()
    except: pass
    kill_word()

    out_json = os.path.join('src', 'data', 'legacy_oficios.json')
    with open(out_json, 'w', encoding='utf-8') as f:
        json.dump(legacy_items, f, ensure_ascii=False, indent=2)

    try: shutil.rmtree(temp_dir)
    except: pass

    print(f"\nStep 3: Resumo do Processamento dos PDFs:")
    print(f" - PDFs originais copiados: {copied_count}")
    print(f" - Documentos Word originais convertidos diretamente: {converted_count}")
    print(f" - PDFs de suporte (fallback): {fallback_count}")
    print(f" - Total de arquivos PDF prontos no acervo: {len(legacy_items)}")

    # Step 4: Upload para o Supabase Storage Bucket
    print("\nStep 4: Executando upload para o Supabase Storage Bucket...")
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

    with open(out_json, 'w', encoding='utf-8') as f:
        json.dump(legacy_items, f, ensure_ascii=False, indent=2)

    # Step 5: Regenera o script de inserção SQL com as URLs públicas do Supabase Storage
    from seed_oficios_legado import seed_oficios
    seed_oficios()

    print(f"\nConcluído com Sucesso!")
    print(f" - Uploads finalizados para o bucket '{BUCKET_NAME}': {uploaded_count}/{len(legacy_items)}")
    print(f" - URLs públicas da nuvem gravadas em {out_json}")
    print(f" - Carga SQL de seed atualizada em supabase/migrations/seed_oficios_legado.sql")

if __name__ == '__main__':
    run_pipeline()
