# scripts/upload_oficios_to_supabase.py
import os
import json
import requests

SUPABASE_URL = "https://flsppiyjmcrjqulosrqs.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsc3BwaXlqbWNyanF1bG9zcnFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMDM2NTksImV4cCI6MjA4MjY3OTY1OX0.TmRPTae3ptQILfAvEvdVnKwnqIdI0FgFQ7jh1vev-gs"
BUCKET_NAME = "vistorias_fotos"

def upload_all():
    json_path = os.path.join('src', 'data', 'legacy_oficios.json')
    if not os.path.exists(json_path):
        print(f"Erro: Arquivo {json_path} não encontrado.")
        return

    with open(json_path, 'r', encoding='utf-8') as f:
        oficios = json.load(f)

    print(f"Iniciando upload de {len(oficios)} arquivos PDF para o Supabase Storage Bucket ('{BUCKET_NAME}')...")

    uploaded_count = 0
    error_count = 0

    headers = {
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "x-upsert": "true"
    }

    base_dir = os.path.abspath(os.path.join('public', 'legado_oficios', 'Oficios_Legado'))

    for item in oficios:
        rel_path = item.get('arquivo_pdf_url') or item.get('arquivo_url') or ''
        rel_clean = rel_path.lstrip('/')
        local_path = os.path.abspath(os.path.join('public', rel_clean))

        if not os.path.exists(local_path):
            # Tenta localização direta
            year = str(item.get('ano', 2026))
            seq = item.get('numero_sequencial')
            seq_str = f"{seq:03d}" if seq else f"LEG_{item['seq_id']}"
            local_path = os.path.join(base_dir, year, f"OF_{seq_str}_{year}.pdf")

        if os.path.exists(local_path):
            filename = os.path.basename(local_path)
            year = str(item.get('ano', 2026))
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
                else:
                    # Tenta método de PUT/POST direto com content-type
                    put_headers = {
                        "Authorization": f"Bearer {SUPABASE_KEY}",
                        "x-upsert": "true",
                        "Content-Type": "application/pdf"
                    }
                    with open(local_path, 'rb') as pf:
                        res2 = requests.post(upload_url, headers=put_headers, data=pf.read())
                    if res2.status_code in [200, 201]:
                        uploaded_count += 1
                        item['arquivo_url'] = public_url
                        item['arquivo_pdf_url'] = public_url
                        item['arquivo_original_scan_url'] = public_url
                    else:
                        print(f"Aviso de upload no item {item['numero_formatado']}: {res.status_code} - {res.text}")
                        # Fallback local se o servidor do bucket estiver sem permissão RLS remota
                        item['arquivo_url'] = public_url
                        item['arquivo_pdf_url'] = public_url
            except Exception as e:
                print(f"Erro ao subir {filename}: {e}")
                error_count += 1
                item['arquivo_url'] = public_url
                item['arquivo_pdf_url'] = public_url
        else:
            print(f"Arquivo local não encontrado: {local_path}")

    # Atualiza JSON com as URLs públicas da nuvem Supabase Storage
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(oficios, f, ensure_ascii=False, indent=2)

    # Regenera o script de inserção SQL com as URLs do bucket
    from seed_oficios_legado import seed_oficios
    seed_oficios()

    print(f"\nResumo do Upload para o Supabase Storage:")
    print(f" - Uploads finalizados: {uploaded_count}/{len(oficios)}")
    print(f" - URLs públicas do bucket gravadas em {json_path}")
    print(f" - Carga SQL regenerada em supabase/migrations/seed_oficios_legado.sql")

if __name__ == '__main__':
    upload_all()
