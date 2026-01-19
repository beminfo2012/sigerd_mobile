
import os

filepath = r'c:\Users\user\Desktop\DEFESA_CIVIL_MOBILE\src\utils\logoBase64.js'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

print(f"DEBUG_LEN: {len(content)}")
print(f"DEBUG_START: {content[:100]}")
print(f"DEBUG_END: {content[-100:]}")
