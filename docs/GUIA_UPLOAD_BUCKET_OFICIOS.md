# Guia Completo: Bucket Dedicado `oficios_legados` & Carga de Dados (SIGERD / COMPDEC)

Este documento fornece as instruções para gerenciar, criar e realizar o upload em lote de todos os 353 arquivos PDF do acervo legado para o bucket dedicado **`oficios_legados`** no Supabase Storage.

---

## 1. Estrutura do Bucket Dedicado

- **Nome do Bucket no Supabase Storage**: `oficios_legados`
- **Visibilidade**: Público (`public = true`)
- **Padrão de URL Pública**:
  `https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/{ANO}/OF_{NUMERO}_{ANO}.pdf`
  *Exemplo:* `https://flsppiyjmcrjqulosrqs.supabase.co/storage/v1/object/public/oficios_legados/2026/OF_015_2026.pdf`

---

## 2. Passo 1 — Aplicar Migração SQL de Criação do Bucket e Permissões RLS

Abra o **SQL Editor** do Supabase Dashboard (`https://supabase.com/dashboard/project/flsppiyjmcrjqulosrqs/sql`) e execute o conteúdo do arquivo [20260805_oficios_storage_rls.sql](file:///c:/Users/wilia/OneDrive/Área%20de%20Trabalho/Programação/Defesa%20civil/sigerd_mobile/supabase/migrations/20260805_oficios_storage_rls.sql):

```sql
-- Criação do Bucket Dedicado 'oficios_legados' e Permissões RLS
INSERT INTO storage.buckets (id, name, public) 
SELECT 'oficios_legados', 'oficios_legados', true
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'oficios_legados'
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Permissões RLS públicas
DROP POLICY IF EXISTS "Oficios Legados Insert Public" ON storage.objects;
CREATE POLICY "Oficios Legados Insert Public" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'oficios_legados');

DROP POLICY IF EXISTS "Oficios Legados Select Public" ON storage.objects;
CREATE POLICY "Oficios Legados Select Public" ON storage.objects FOR SELECT TO public USING (bucket_id = 'oficios_legados');

DROP POLICY IF EXISTS "Oficios Legados Update Public" ON storage.objects;
CREATE POLICY "Oficios Legados Update Public" ON storage.objects FOR UPDATE TO public USING (bucket_id = 'oficios_legados') WITH CHECK (bucket_id = 'oficios_legados');
```

---

## 3. Passo 2 — Upload Automatizado dos Arquivos PDF via Script Python

Os 353 arquivos PDF já formatados e extraídos estão armazenados localmente em `public/legado_oficios/Oficios_Legado/{ANO}/`.

Para realizar o upload automático em lote de todos os arquivos para a nuvem Supabase, basta executar no terminal:

```bash
python scripts/upload_oficios_fast.py
```

### O que este script faz automaticamente:
1. Conecta-se à API de Storage do Supabase usando a chave do projeto.
2. Faz o upload em paralelo (10 threads simultâneas) dos 353 PDFs divididos pelas pastas de cada ano (`2014` a `2026`).
3. Atualiza o arquivo [legacy_oficios.json](file:///c:/Users/wilia/OneDrive/Área%20de%20Trabalho/Programação/Defesa%20civil/sigerd_mobile/src/data/legacy_oficios.json) gravando as URLs públicas oficiais da nuvem.
4. Regenera o script de inserção de banco de dados [seed_oficios_legado.sql](file:///c:/Users/wilia/OneDrive/Área%20de%20Trabalho/Programação/Defesa%20civil/sigerd_mobile/supabase/migrations/seed_oficios_legado.sql).

---

## 4. Passo 3 — Alternativa: Upload Manual via Supabase Dashboard (Drag & Drop)

Se preferir realizar a carga manualmente pela interface web do Supabase:

1. Acesse o **Supabase Dashboard** -> **Storage** -> **Buckets**.
2. Clique no bucket **`oficios_legados`** (se não existir, clique em *New Bucket*, defina o nome `oficios_legados` e marque *Public bucket*).
3. Dentro do bucket, crie as pastas por ano (`2014`, `2015`, `2017`, `2018`, `2019`, `2020`, `2021`, `2022`, `2023`, `2024`, `2025`, `2026`).
4. Arraste os arquivos PDF correspondentes de cada ano da pasta local `public/legado_oficios/Oficios_Legado/{ANO}/` para a respectiva pasta do bucket no Supabase.

---

## 5. Passo 4 — Carga de Dados no Banco de Dados (`oficios_compdec`)

Para popular a tabela `oficios_compdec` com todos os 353 registros apontando para o bucket `oficios_legados`:

1. Abra o **SQL Editor** do Supabase Dashboard.
2. Execute o arquivo [seed_oficios_legado.sql](file:///c:/Users/wilia/OneDrive/Área%20de%20Trabalho/Programação/Defesa%20civil/sigerd_mobile/supabase/migrations/seed_oficios_legado.sql).
3. Todos os 353 registros estarão sincronizados no banco de dados com suas respectivas URLs do bucket `oficios_legados`.
