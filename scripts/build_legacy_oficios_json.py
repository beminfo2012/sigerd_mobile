# scripts/build_legacy_oficios_json.py
import os
import re
import json
import urllib.parse

def build_legacy_json():
    base_dir = os.path.join('public', 'legado_oficios', 'Oficios_Legado')
    if not os.path.exists(base_dir):
        print(f"Erro: Pasta {base_dir} não encontrada.")
        return

    years = sorted([d for d in os.listdir(base_dir) if os.path.isdir(os.path.join(base_dir, d))])
    legacy_items = []
    item_id = 1

    for year_str in years:
        if not year_str.isdigit():
            continue
        year = int(year_str)
        year_path = os.path.join(base_dir, year_str)
        files = os.listdir(year_path)

        # Mapeamento para agrupar PDF, DOCX, DOC por número de ofício
        oficios_map = {}

        for fname in files:
            if fname.startswith('.'):
                continue
            ext = os.path.splitext(fname)[1].lower()
            if ext not in ['.pdf', '.docx', '.doc']:
                continue

            fname_no_ext = os.path.splitext(fname)[0]
            num_match = re.search(r'(?:of|oficio|ofício)[\.\s_-]*(\d+)', fname_no_ext, re.IGNORECASE)
            seq_num = int(num_match.group(1)) if num_match else None

            # Chave de agrupamento por número sequencial ou nome limpo
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
                oficios_map[group_key]["pdf_file"] = fname
            else:
                oficios_map[group_key]["doc_file"] = fname

        # Ordenar os ofícios do ano por número sequencial CRESCENTE
        sorted_keys = sorted(
            oficios_map.keys(),
            key=lambda k: (oficios_map[k]["seq_num"] if oficios_map[k]["seq_num"] is not None else 9999)
        )

        for key in sorted_keys:
            data = oficios_map[key]
            seq_num = data["seq_num"]
            num_formatado = f"{seq_num:03d}/{year}" if seq_num is not None else f"LEG/{year}"
            identificador = f"OF/PMSMJ/COMPDEC/N° {num_formatado}"
            destinatario = data["cleaned_title"] or f"Ofício COMPDEC {num_formatado}"

            chosen_file = data["pdf_file"] or data["doc_file"]
            rel_file_path = f"/legado_oficios/Oficios_Legado/{year_str}/{chosen_file}" if chosen_file else None

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
                "arquivo_url": rel_file_path,
                "arquivo_pdf_url": rel_file_path if (chosen_file and chosen_file.lower().endswith('.pdf')) else None,
                "arquivo_original_scan_url": rel_file_path,
                "validado_por": None,
                "validado_em": None
            }
            legacy_items.append(item)
            item_id += 1

    print(f"Total de registros de ofícios legados mapeados: {len(legacy_items)}")

    out_path = os.path.join('src', 'data', 'legacy_oficios.json')
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(legacy_items, f, ensure_ascii=False, indent=2)
    print(f"Arquivo {out_path} atualizado com sucesso!")

if __name__ == '__main__':
    build_legacy_json()
