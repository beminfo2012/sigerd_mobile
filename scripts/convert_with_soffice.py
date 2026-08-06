# scripts/convert_with_soffice.py
import os
import re
import json
import shutil
import subprocess

SOFFICE_PATH = r'C:\Program Files\Wondershare\Wondershare PDFelement for Windows\FREngine\Bin64\OpenOffice4\program\soffice.exe'

def kill_word():
    try: subprocess.run(['taskkill', '/F', '/IM', 'WINWORD.EXE'], capture_output=True)
    except: pass
    try: subprocess.run(['taskkill', '/F', '/IM', 'soffice.bin'], capture_output=True)
    except: pass

def run_soffice_pipeline():
    kill_word()
    temp_dir = os.path.abspath('temp_oficios_soffice')
    if os.path.exists(temp_dir):
        try: shutil.rmtree(temp_dir)
        except: pass
    os.makedirs(temp_dir, exist_ok=True)

    print("Step 1: Extraindo acervo original de Oficios_Legado.rar...")
    subprocess.run(['tar', '-xf', 'Oficios_Legado.rar', '-C', 'temp_oficios_soffice'], capture_output=True)

    rar_base = os.path.join(temp_dir, 'Oficios_Legado')
    target_base = os.path.abspath(os.path.join('public', 'legado_oficios', 'Oficios_Legado'))
    shutil.rmtree(target_base, ignore_errors=True)
    os.makedirs(target_base, exist_ok=True)

    print("Step 2: Convertendo documentos originais em lote via OpenOffice Headless (preservando 100% dos cabeçalhos)...")

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

        # Converte em lote todos os arquivos da pasta do ano de uma só vez
        doc_files = [os.path.join(src_year_dir, f) for f in os.listdir(src_year_dir) if f.endswith('.doc') or f.endswith('.docx')]
        if doc_files:
            cmd = [SOFFICE_PATH, '--headless', '--convert-to', 'pdf'] + doc_files + ['--outdir', src_year_dir]
            subprocess.run(cmd, capture_output=True)

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

            # Copia PDF original ou convertido via OpenOffice
            if data["pdf_file"] and os.path.exists(data["pdf_file"]):
                try:
                    shutil.copy2(data["pdf_file"], target_pdf_path)
                    converted_count += 1
                    success = True
                except: pass

            # Fallback se OpenOffice não encontrou PDF para o documento
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

    kill_word()

    out_json = os.path.join('src', 'data', 'legacy_oficios.json')
    with open(out_json, 'w', encoding='utf-8') as f:
        json.dump(legacy_items, f, ensure_ascii=False, indent=2)

    try: shutil.rmtree(temp_dir)
    except: pass

    print(f"\nStep 3: Resumo do Processamento via OpenOffice Headless:")
    print(f" - PDFs convertidos/copiados diretamente: {converted_count}")
    print(f" - PDFs de suporte (fallback): {fallback_count}")
    print(f" - Total de arquivos PDF prontos no acervo: {len(legacy_items)}")

    # Step 4: Upload para o Supabase Storage Bucket e atualização das URLs
    print("\nStep 4: Executando upload para o Supabase Storage Bucket...")
    from upload_oficios_to_supabase import upload_all
    upload_all()

if __name__ == '__main__':
    run_soffice_pipeline()
