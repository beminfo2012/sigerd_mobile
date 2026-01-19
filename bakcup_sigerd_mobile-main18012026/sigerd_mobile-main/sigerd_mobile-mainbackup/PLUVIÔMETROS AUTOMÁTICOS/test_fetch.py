
import requests
import re

url = "https://resources.cemaden.gov.br/graficos/interativo/grafico_CEMADEN.php?idpcd=6195&uf=ES"

try:
    response = requests.get(url)
    response.raise_for_status()
    content = response.text
    
    print("Status Code:", response.status_code)
    print("Content Length:", len(content))
    
    # Try to find JSON or data array in the script
    # Look for 'data' or specific values
    matches = re.findall(r'data\s*:\s*\[(.*?)\]', content, re.DOTALL)
    if matches:
        print("Found data arrays:", len(matches))
        print("Sample data:", matches[0][:200])
    else:
        print("No 'data: [...]' pattern found.")
        
    print("\nFirst 500 chars:\n", content[:500])

except Exception as e:
    print("Error:", e)
