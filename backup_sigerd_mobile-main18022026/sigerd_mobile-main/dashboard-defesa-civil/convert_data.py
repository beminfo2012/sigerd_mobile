import csv
import json
import os

# Paths
base_dir = r"C:/Users/admin/Downloads/ibge_coord_end_es_censo_2022_epsg_31984"
main_csv_path = os.path.join(base_dir, "Tabela_Moradias_Risco_Geologico_Hidrológico.csv")
geo_csv_path = os.path.join(base_dir, "pontos_dentro_risco_geologico.csv")
hydro_csv_path = os.path.join(base_dir, "Pontos_IBGE_Risco_Inundacao_CPRM.csv")
exatos_csv_path = os.path.join(base_dir, "pontos_risco_exatos.csv")

dest_path = r"C:/Users/admin/Downloads/dashboard-defesa-civil/data.js"

print("Starting data conversion...")

# Sector Mapping (Mocked/Hardcoded)
SECTOR_DETAILS = {
    'ES_SM_SR_01_CPRM': {
        'DATA_SETOR': '01/01/2012',
        'NUM_SETOR': 'ES_SM_SR_01_CPRM',
        'TIPOLOGIA': 'Escorregamento Planar',
        'SITUACAO': '',
        'DESCRICAO': 'Deslizamento planar, em razão da execução de taludes cortes muito altos e verticalizados, que atingem horizontes de solos geotecnicamente problemáticos em solos argilosos muito pouco permeáveis.',
        'GRAU_RISCO': 'Muito Alto',
        'SUG_INTERV': 'Preservação da mata natural/Obras de contenção e retaludamento/Não permitir o adensamento urbano do local/Palestras ambientais/Formação de líderes comunitários/Em caso de chuva intensa, é recomendável a saída dos moradores da área',
        'ORGAO_EXEC': 'CPRM',
        'PROJETO': 'Ação Emergencial Para Reconhecimento De Áreas De Alto E Muito Alto Risco A Movimentos De Massas E Enchentes'
    }
}

# 1. Load Coordinate & Detail Lookups
coord_lookup = {}
detail_lookup = {} # For Geologic details

def load_coords(path, is_geo=False):
    count = 0
    try:
        with open(path, 'r', encoding='utf-8-sig', errors='replace') as f:
            reader = csv.DictReader(f, delimiter=';')
            for row in reader:
                id_val = row.get('id', '').strip()
                if not id_val: continue
                
                # Coords
                lat = row.get('lat')
                lon = row.get('lon')
                
                # Check exclusion for Geo file
                localidade = row.get('localidade', 'Desconhecido')
                # Title Case Normalization
                if localidade: 
                    localidade = localidade.title().strip()
                    # Fix Typos
                    if "Meil" in localidade: localidade = localidade.replace("Meil", "Meio")

                # Exclusion Logic check
                if is_geo:
                    if 'Saida De Smj' in localidade or 'Sao Sebastiao De Cima' in localidade or 'São Sebastião De Cima' in localidade:
                        continue
                
                if lat and lon:
                    coord_lookup[id_val] = {'lat': float(lat), 'lng': float(lon)}
                    count += 1
                
                # Store Geo Details if applicable
                if is_geo:
                    detail_lookup[id_val] = {
                        'localidade': localidade,
                        'setor': row.get('setor_risco', ''),
                        'grau': row.get('grau_risco', 'Media'),
                        'area_nome': row.get('area_risco', '')
                    }
    except Exception as e:
        print(f"Warning reading {os.path.basename(path)}: {e}")
    return count

print(f"Loading Geo Coords...")
c1 = load_coords(geo_csv_path, is_geo=True)
print(f"Loading Hydro Coords...")
c2 = load_coords(hydro_csv_path)
print(f"Loading Exact Coords...")
c3 = load_coords(exatos_csv_path)

print(f"Total Coordinates Loaded: {len(coord_lookup)} (Geo: {c1}, Hydro: {c2}, Exatos: {c3})")

# 2. Process Main Data
try:
    data = []
    with open(main_csv_path, 'r', encoding='utf-8-sig', errors='replace') as f:
        reader = csv.DictReader(f, delimiter=';')
        
        for row in reader:
            moradia_id = row.get('Numero_Moradia', '0')
            raw_desc = row.get('Nome_Area_Risco', '')
            is_geo = row.get('Area_Risco_Geologico', '').lower() == 'sim'
            is_hydro = row.get('Area_Suscetivel_Alagamento', '').lower() == 'sim'
            
            # Exclusion Check
            if 'SAIDA DE SMJ' in raw_desc or 'SAO SEBASTIÃO DE CIMA' in raw_desc:
                continue

            # Base Logic
            risk_type = 'Desconhecido'
            if is_geo and is_hydro:
                risk_type = 'Geológico + Hidrológico'
            elif is_geo:
                risk_type = 'Geológico'
            elif is_hydro:
                risk_type = 'Hidrológico'
            
            # Locality & Severity Logic
            locality = 'Área Urbana' 
            severity = 'Média'
            details = None

            # Enrich from Geological CSV
            if is_geo and moradia_id in detail_lookup:
                geo_info = detail_lookup[moradia_id]
                locality = geo_info['localidade']
                
                # Normalize Severity
                g_risk = geo_info['grau'].lower()
                if 'alto' in g_risk or 'alta' in g_risk:
                    severity = 'Alta'
                elif 'muito alto' in g_risk:
                    severity = 'Muito Alta'
                
                # Detailed Sector Mapping
                sector_code = geo_info['setor']
                if sector_code in SECTOR_DETAILS:
                    details = SECTOR_DETAILS[sector_code]
                else:
                    details = {
                        'NUM_SETOR': sector_code,
                        'GRAU_RISCO': geo_info['grau'],
                        'DESCRICAO': 'Verificar estudo detalhado para este setor.'
                    }

            # Hydrological Logic
            if risk_type == 'Hidrológico' or (risk_type == 'Geológico + Hidrológico' and not details):
                if locality == 'Área Urbana' or locality == 'Desconhecido':
                    if 'Rio Possmoser' in raw_desc:
                        locality = 'Alto Rio Possmoser'
                    elif 'Vila Roos' in raw_desc:
                        locality = 'Bairro Vila Roos'
                    elif 'São Luis' in raw_desc or 'São Luís' in raw_desc:
                        locality = 'Bairro São Luis' 
                    elif 'Vila Jetibá' in raw_desc:
                        locality = 'Bairro Vila Jetibá'
                    elif 'Centro' in raw_desc:
                        locality = 'Centro'
                
                if not details:
                    details = {
                        'DESCRICAO': 'Suscetibilidade Alta a Inundação - CPRM',
                        'ORGAO_EXEC': 'CPRM'
                    }
                else:
                    details['DESCRICAO'] += ' | Suscetibilidade Alta a Inundação - CPRM'

            # Coordinate Merge
            lat, lng = None, None
            if moradia_id in coord_lookup:
                lat = coord_lookup[moradia_id]['lat']
                lng = coord_lookup[moradia_id]['lng']

            data.append({
                'id': moradia_id,
                'resident': f"Morador {moradia_id[-4:]}",
                'locality': locality,
                'riskType': risk_type,
                'severity': severity,
                'fullDesc': raw_desc,
                'details': details,
                'lat': lat,
                'lng': lng
            })

    print(f"Processed {len(data)} records. Found coords for {len([d for d in data if d['lat']])} records.")

    unique_localities = sorted(list(set(d['locality'] for d in data)))
    
    js_content = f"window.appData = {json.dumps(data, indent=2, ensure_ascii=False)};\n"
    js_content += f"""
window.appConstants = {{
    LOCALITIES: {json.dumps(unique_localities, ensure_ascii=False)},
    RISKS: {{
        GEOLOGICAL: 'Geológico',
        HYDROLOGICAL: 'Hidrológico',
        BOTH: 'Geológico + Hidrológico'
    }}
}};
"""
    
    with open(dest_path, 'w', encoding='utf-8') as f:
        f.write(js_content)
    
    print(f"Successfully wrote to {dest_path}")

except Exception as e:
    print(f"Error: {e}")
