# scripts/seed_oficios_legado.py
import os
import json

def seed_oficios():
    json_path = os.path.join('src', 'data', 'legacy_oficios.json')
    if not os.path.exists(json_path):
        print(f"Erro: Arquivo {json_path} não encontrado.")
        return

    with open(json_path, 'r', encoding='utf-8') as f:
        oficios = json.load(f)

    print(f"Gerando seed SQL para {len(oficios)} registros legados com URLs de PDF...")

    sql_statements = []
    for item in oficios:
        seq = item['numero_sequencial'] if item['numero_sequencial'] is not None else 'NULL'
        pdf_url = item.get('arquivo_pdf_url') or item.get('arquivo_url') or ''
        
        sql = f"""
        INSERT INTO oficios_compdec (
            tenant_id, sigla_orgao, ano, numero_sequencial, numero_formatado, identificador_completo,
            fonte, status, data_emissao, destinatario_nome, destinatario_orgao, assunto,
            arquivo_pdf_url, arquivo_original_scan_url, created_at, updated_at
        ) VALUES (
            '{item["tenant_id"]}', '{item["sigla_orgao"]}', {item["ano"]}, {seq}, '{item["numero_formatado"]}', '{item["identificador_completo"]}',
            '{item["fonte"]}', '{item["status"]}', '{item["data_emissao"]}', '{item["destinatario_nome"].replace("'", "''")}',
            '{item["destinatario_orgao"].replace("'", "''")}', '{item["assunto"].replace("'", "''")}',
            '{pdf_url}', '{pdf_url}', NOW(), NOW()
        ) ON CONFLICT (tenant_id, sigla_orgao, ano, numero_sequencial) DO UPDATE SET
            arquivo_pdf_url = EXCLUDED.arquivo_pdf_url,
            arquivo_original_scan_url = EXCLUDED.arquivo_original_scan_url;
        """
        sql_statements.append(sql.strip())

    out_sql = os.path.join('supabase', 'migrations', 'seed_oficios_legado.sql')
    with open(out_sql, 'w', encoding='utf-8') as f:
        f.write('\n'.join(sql_statements))

    print(f"Script de inserção gerado com sucesso em {out_sql} ({len(sql_statements)} comandos SQL).")

if __name__ == '__main__':
    seed_oficios()
