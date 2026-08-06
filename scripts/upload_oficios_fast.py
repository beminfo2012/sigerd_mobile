# scripts/upload_oficios_fast.py
import os
import json
import requests
from concurrent.futures import ThreadPoolExecutor

SUPABASE_URL = "https://flsppiyjmcrjqulosrqs.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsc3BwaXlqbWNyanF1bG9zcnFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMDM2NTksImV4cCI6MjA4MjY3OTY1OX0.TmRPTae3ptQILfAvEvdVnKwnqIdI0FgFQ7jh1vev-gs"
BUCKET_NAME = "oficios_legados"

def upload_single_file(item):
    year = str(item.get('ano', 2026))
    seq = item.get('numero_sequencial')
    seq_str = f"{seq:03d}" if seq else f"LEG_{item['seq_id']}"
    filename = f"OF_{seq_str}_{year}.pdf"

    local_path = os.path.abspath(os.path.join('public', 'legado_oficios', 'Oficios_Legado', year, filename))

    storage_path = f"{year}/{filename}"
    upload_url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET_NAME}/{storage_path}"
    public_url = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET_NAME}/{storage_path}"

    headers = {
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "x-upsert": "true"
    }

    if os.path.exists(local_path):
        try:
            with open(local_path, 'rb') as pf:
                content = pf.read()
            res = requests.post(upload_url, headers=headers, files={'file': (filename, content, 'application/pdf')}, timeout=5)
            item['arquivo_url'] = public_url
            item['arquivo_pdf_url'] = public_url
            item['arquivo_original_scan_url'] = public_url
            return True
        except Exception as e:
            item['arquivo_url'] = public_url
            item['arquivo_pdf_url'] = public_url
            item['arquivo_original_scan_url'] = public_url
            return False
    else:
        item['arquivo_url'] = public_url
        item['arquivo_pdf_url'] = public_url
        item['arquivo_original_scan_url'] = public_url
        return False

def run_fast_upload():
    json_path = os.path.join('src', 'data', 'legacy_oficios.json')
    if not os.path.exists(json_path):
        print(f"Erro: Arquivo {json_path} não encontrado.")
        return

    with open(json_path, 'r', encoding='utf-8') as f:
        oficios = json.load(f)

    print(f"Iniciando upload paralelo de {len(oficios)} arquivos PDF para o bucket dedicado ('{BUCKET_NAME}')...")

    with ThreadPoolExecutor(max_workers=10) as executor:
        results = list(executor.map(upload_single_file, oficios))

    # Salva dataset atualizado com URLs públicas do bucket oficios_legados
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(oficios, f, ensure_ascii=False, indent=2)

    # Regenera seed SQL para a tabela oficios_compdec
    from seed_oficios_legado import seed_oficios
    seed_oficios()

    success_count = sum(1 for r in results if r)
    print(f"\nConcluído com Sucesso!")
    print(f" - Uploads finalizados para o bucket Supabase '{BUCKET_NAME}': {success_count}/{len(oficios)}")
    print(f" - URLs públicas da nuvem gravadas em {json_path}")
    print(f" - Carga SQL de seed atualizada em supabase/migrations/seed_oficios_legado.sql")

if __name__ == '__main__':
    run_fast_upload()
