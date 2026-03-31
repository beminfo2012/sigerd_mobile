
import base64
import os

img_path = r'c:\Users\user\Desktop\DEFESA_CIVIL_MOBILE\public\logo_relatorio.png'
out_path = r'c:\Users\user\Desktop\DEFESA_CIVIL_MOBILE\src\utils\logoBase64.js'

with open(img_path, 'rb') as img_file:
    b64_string = base64.b64encode(img_file.read()).decode('utf-8')

with open(out_path, 'w', encoding='utf-8') as out_file:
    out_file.write(f"export const LOGO_BASE64 = 'data:image/png;base64,{b64_string}';\n")

print("Logo file rewritten successfully.")
