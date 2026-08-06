# scripts/fast_convert_docx2pdf.py
import os
import subprocess
import win32com.client

def fast_convert():
    base_dir = os.path.abspath(os.path.join('public', 'legado_oficios', 'Oficios_Legado'))
    print(f"Iniciando conversão acelerada em: {base_dir}")

    word = win32com.client.Dispatch('Word.Application')
    word.Visible = False
    word.DisplayAlerts = 0

    converted = 0
    errors = 0
    to_delete = []

    for root, dirs, files in os.walk(base_dir):
        for f in files:
            if f.startswith('~$') or f.startswith('.'):
                continue
            ext = os.path.splitext(f)[1].lower()
            if ext in ['.doc', '.docx']:
                src_path = os.path.join(root, f)
                pdf_path = os.path.splitext(src_path)[0] + '.pdf'

                if os.path.exists(pdf_path):
                    to_delete.append(src_path)
                    continue

                try:
                    # Open(FileName, ConfirmConversions, ReadOnly)
                    doc = word.Documents.Open(src_path, False, True)
                    doc.SaveAs(pdf_path, FileFormat=17)
                    doc.Close(False)
                    converted += 1
                    to_delete.append(src_path)
                    if converted % 10 == 0:
                        print(f"Progresso: {converted} arquivos convertidos para PDF...")
                except Exception as e:
                    print(f"Erro em {f}: {e}")
                    errors += 1

    try:
        word.Quit()
    except:
        pass

    print(f"Conversão concluída! {converted} convertidos, {errors} erros.")

    print(f"Removendo {len(to_delete)} arquivos .doc/.docx...")
    for src in to_delete:
        try:
            os.remove(src)
        except Exception as e:
            pass

    pdfs = sum(1 for root, d, files in os.walk(base_dir) for f in files if f.lower().endswith('.pdf'))
    print(f"Total de arquivos PDF na pasta: {pdfs}")

if __name__ == '__main__':
    fast_convert()
