# scripts/convert_all_to_pdf.py
import os
import win32com.client

def convert_all_legacy_to_pdf():
    base_dir = os.path.abspath(os.path.join('public', 'legado_oficios', 'Oficios_Legado'))
    if not os.path.exists(base_dir):
        print(f"Erro: Pasta {base_dir} não encontrada.")
        return

    print("Iniciando conversão automatizada em lote de todos os arquivos .doc e .docx para .pdf...")
    
    word = win32com.client.Dispatch('Word.Application')
    word.Visible = False
    word.DisplayAlerts = 0 # 0 = wdAlertsNone, desativa popups e diálogos

    converted_count = 0
    skipped_count = 0
    error_count = 0
    to_delete = []

    for root, dirs, files in os.walk(base_dir):
        for f in files:
            if f.startswith('.'):
                continue
            ext = os.path.splitext(f)[1].lower()
            if ext not in ['.doc', '.docx']:
                continue

            full_src_path = os.path.join(root, f)
            pdf_fname = os.path.splitext(f)[0] + '.pdf'
            full_pdf_path = os.path.join(root, pdf_fname)

            # Se o PDF já existe, pula conversão e agenda remoção do original
            if os.path.exists(full_pdf_path):
                skipped_count += 1
                to_delete.append(full_src_path)
                continue

            try:
                print(f"Convertendo [{ext} -> .pdf]: {f}")
                # Open(FileName, ConfirmConversions, ReadOnly)
                doc = word.Documents.Open(full_src_path, False, True)
                # FileFormat=17 é wdFormatPDF
                doc.SaveAs(full_pdf_path, FileFormat=17)
                doc.Close(False) # False = wdDoNotSaveChanges
                converted_count += 1
                to_delete.append(full_src_path)
            except Exception as e:
                print(f"Erro ao converter {f}: {e}")
                error_count += 1

    try:
        word.Quit()
    except:
        pass

    print(f"\nResumo da Conversão:")
    print(f" - Convertidos com sucesso para PDF: {converted_count}")
    print(f" - PDFs já existentes: {skipped_count}")
    print(f" - Erros: {error_count}")

    # Remove arquivos .doc e .docx deixando estritamente PDFs
    print(f"\nLimpando arquivos .doc e .docx ({len(to_delete)} arquivos)...")
    for src in to_delete:
        try:
            os.remove(src)
        except Exception as e:
            print(f"Aviso ao remover {src}: {e}")

    pdf_total = 0
    for root, dirs, files in os.walk(base_dir):
        for f in files:
            if f.lower().endswith('.pdf'):
                pdf_total += 1

    print(f"\nConcluído! Total de arquivos PDF no acervo oficial: {pdf_total}")

if __name__ == '__main__':
    convert_all_legacy_to_pdf()
