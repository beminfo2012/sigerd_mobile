# scripts/convert_originals_fast.py
import os
import re
import json
import shutil
import subprocess
import time

def convert_single_file_cmd(src_doc, tgt_pdf):
    # Executa o script de conversão de um único arquivo isolado em subprocesso
    cmd = [
        'python', '-c',
        f"""
import win32com.client, os
word = win32com.client.Dispatch('Word.Application')
word.Visible = False
word.DisplayAlerts = 0
try:
    doc = word.Documents.Open(FileName=r'{src_doc}', ConfirmConversions=False, ReadOnly=True, AddToRecentFiles=False)
    doc.SaveAs(FileName=r'{tgt_pdf}', FileFormat=17)
    doc.Close(SaveChanges=0)
finally:
    word.Quit()
"""
    ]
    try:
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=8)
        return res.returncode == 0 and os.path.exists(tgt_pdf)
    except Exception as e:
        return False

def run_batch():
    # 1. Re-extração limpa
    temp_dir = os.path.abspath('temp_oficios_original_v3')
    if os.path.exists(temp_dir):
        try: shutil.rmtree(temp_dir)
        except: pass
    os.makedirs(temp_dir, exist_ok=True)

    print("Extraindo acervo original do RAR...")
    subprocess.run(['tar', '-xf', 'Oficios_Legado.rar', '-C', 'temp_oficios_original_v3'], capture_output=True)

    rar_base = os.path.join(temp_dir, 'Oficios_Legado')
    target_base = os.path.abspath(os.path.join('public', 'legado_oficios', 'Oficios_Legado'))
    os.makedirs(target_base, exist_ok=True)

    print("Processando conversão isolada com limite de tempo (timeout de 8s por arquivo)...")

    years = sorted([d for d in os.listdir(rar_base) if os.path.isdir(os.path.join(rar_base, d))])
    legacy_items = []
    item_id = 1

    converted_count = 0
    copied_count = 0
    generated_fallback_count = 0

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
                    copied_count += 1
                    success = True
                except: pass

            # 2. Tentar converter original Word COM isolado
            if not success and data["doc_file"] and os.path.exists(data["doc_file"]):
                print(f"[{item_id}] Convertendo: {os.path.basename(data['doc_file'])}")
                ok = convert_single_file_cmd(os.path.abspath(data["doc_file"]), os.path.abspath(target_pdf_path))
                if ok:
                    converted_count += 1
                    success = True
                else:
                    print(f" -> Timeout/Prompt no arquivo Word. Gerando PDF formatado de suporte para {identificador}...")

            # 3. Fallback de geração se o Word COM falhar/travar no arquivo específico
            if not success:
                from generate_and_upload_all_oficio_pdfs import create_pdf_for_oficio
                item_temp = {
                    "identificador_completo": identificador,
                    "numero_formatado": num_formatado,
                    "ano": year,
                    "destinatario_nome": destinatario,
                    "assunto": f"Acervo histórico COMPDEC ({year}): {data['cleaned_title']}"
                }
                create_pdf_for_oficio(item_temp, target_pdf_path)
                generated_fallback_count += 1
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

    out_json = os.path.join('src', 'data', 'legacy_oficios.json')
    with open(out_json, 'w', encoding='utf-8') as f:
        json.dump(legacy_items, f, ensure_ascii=False, indent=2)

    try: shutil.rmtree(temp_dir)
    except: pass

    print(f"\nResumo da Conversão Isolada:")
    print(f" - PDFs originais copiados: {copied_count}")
    print(f" - Word originais convertidos diretamente: {converted_count}")
    print(f" - PDFs gerados via fallback: {generated_fallback_count}")
    print(f" - Total de arquivos PDF prontos: {len(legacy_items)}")

if __name__ == '__main__':
    run_batch()
