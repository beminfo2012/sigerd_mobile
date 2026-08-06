# scripts/batch_convert_word.py
import os
import sys
import win32com.client

def batch_convert():
    base_dir = os.path.abspath(os.path.join('public', 'legado_oficios', 'Oficios_Legado'))
    print(f"Buscando arquivos em: {base_dir}")

    # Coleta todos os arquivos .doc e .docx
    targets = []
    for root, dirs, files in os.walk(base_dir):
        for f in files:
            if f.startswith('~$') or f.startswith('.'):
                continue
            ext = os.path.splitext(f)[1].lower()
            if ext in ['.doc', '.docx']:
                src = os.path.join(root, f)
                pdf = os.path.splitext(src)[0] + '.pdf'
                targets.append((src, pdf, f))

    print(f"Total de arquivos Word a processar: {len(targets)}")

    word = win32com.client.Dispatch('Word.Application')
    word.Visible = False
    word.DisplayAlerts = 0

    converted = 0
    skipped = 0
    errors = 0
    to_delete = []

    for src, pdf, filename in targets:
        if os.path.exists(pdf):
            skipped += 1
            to_delete.append(src)
            continue

        try:
            print(f"[{converted+1}] Convertendo: {filename}")
            # Open(FileName, ConfirmConversions, ReadOnly)
            doc = word.Documents.Open(FileName=src, ConfirmConversions=False, ReadOnly=True)
            doc.SaveAs(FileName=pdf, FileFormat=17) # 17 = wdFormatPDF
            doc.Close(SaveChanges=0)
            converted += 1
            to_delete.append(src)
        except Exception as e:
            print(f" - Erro ao converter {filename}: {e}")
            errors += 1

    try:
        word.Quit()
    except:
        pass

    print(f"\nFinalizado! Convertidos: {converted}, Já existiam: {skipped}, Erros: {errors}")

    print(f"Removendo {len(to_delete)} arquivos Word (.doc/.docx)...")
    for src in to_delete:
        try:
            os.remove(src)
        except Exception as e:
            pass

    # Verifica total final de PDFs
    total_pdfs = sum(1 for root, d, files in os.walk(base_dir) for f in files if f.lower().endswith('.pdf'))
    print(f"Total final de arquivos PDF na pasta public/legado_oficios: {total_pdfs}")

if __name__ == '__main__':
    batch_convert()
