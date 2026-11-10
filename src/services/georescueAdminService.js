import * as XLSX from 'xlsx';
import { initDB, clearInstallationsCache, getInstallationsCount } from './db';

/**
 * Mapeia e padroniza uma linha de planilha (ou objeto JSON) para a estrutura canônica de UC do GeoRescue.
 */
export function normalizeUcRecord(raw) {
    if (!raw) return null;

    // 1. Código da UC
    const fullUC = String(
        raw['Código Unidade Consumidora'] || 
        raw['CODIGO UNIDADE CONSUMIDORA'] || 
        raw['UC'] || 
        raw['uc'] || 
        ''
    ).trim();

    // 2. Número da Instalação
    const rawInst = raw['Instalação'] || raw['INSTALACAO'] || raw['NUMERO'] || raw['numero'] || raw['installation_number'] || '';
    const installationNumber = String(rawInst).trim();
    const cleanInstallation = installationNumber.replace(/^0+/, '');

    // 3. Logradouro
    const rawLogr = raw['NOME_LOGRADOURO'] || raw['LOGRADOURO'] || raw['logradouro'] || raw['address'] || raw['endereco'] || '';
    const porta = raw['NUMERO_PORTA'] ? ` ${String(raw['NUMERO_PORTA']).trim()}` : '';
    const compl = raw['COMPLEMENTO_1'] ? ` ${String(raw['COMPLEMENTO_1']).trim()}` : '';
    const logradouro = `${String(rawLogr).trim()}${porta}${compl}`.trim();

    // 4. Bairro
    const bairro = String(raw['NOME_BAIRRO'] || raw['BAIRRO'] || raw['bairro'] || '').trim().toUpperCase();

    // 5. Coordenadas Latitude e Longitude (podem ser nulas em novos registros cadastrais)
    const rawLat = raw['COORDENADA_Y_LATLONG'] ?? raw['LATITUDE'] ?? raw['Latitude'] ?? raw['lat'];
    const rawLng = raw['COORDENADA_X_LATLONG'] ?? raw['LONGITUDE'] ?? raw['Longitude'] ?? raw['lng'];

    const parsedLat = parseFloat(rawLat);
    const parsedLng = parseFloat(rawLng);

    const hasValidCoords = !isNaN(parsedLat) && !isNaN(parsedLng) && parsedLat !== 0 && parsedLng !== 0;
    const lat = hasValidCoords ? parsedLat : null;
    const lng = hasValidCoords ? parsedLng : null;

    // 6. UC Core (para busca por partes)
    let ucCore = '';
    if (fullUC) {
        const parts = fullUC.split('.');
        if (parts.length >= 4) {
            ucCore = parts[2] + parts[3];
        }
    }
    const cleanFullUC = fullUC.replace(/\D/g, '');

    const id = cleanInstallation || fullUC || Math.random().toString(36).substr(2, 9);

    return {
        id,
        installation_number: installationNumber,
        clean_installation: cleanInstallation,
        full_uc: fullUC,
        clean_full_uc: cleanFullUC,
        uc_core: ucCore,
        name: raw['NOME'] || bairro || 'Unidade Consumidora',
        address: logradouro,
        bairro,
        status: raw['Status da UC'] || raw['status'] || 'Ativo',
        lat,
        lng,
        has_coords: hasValidCoords,
        municipio: raw['NOME_MUNICIPIO'] || 'SANTA MARIA DE JETIBA',
        cep: raw['CEP'] || ''
    };
}

/**
 * Lê e analisa um arquivo de planilha (.xlsx, .xls) ou arquivo JSON
 */
export async function parseGeoRescueFile(file, onProgress) {
    if (!file) throw new Error('Nenhum arquivo fornecido');

    const extension = file.name.split('.').pop().toLowerCase();

    if (extension === 'json') {
        if (onProgress) onProgress('Lendo arquivo JSON...');
        const text = await file.text();
        const json = JSON.parse(text);
        if (!Array.isArray(json)) throw new Error('O arquivo JSON deve conter uma lista (array) de unidades.');
        return json.map(normalizeUcRecord).filter(Boolean);
    }

    if (['xlsx', 'xls', 'csv'].includes(extension)) {
        if (onProgress) onProgress('Carregando planilha...');
        const arrayBuffer = await file.arrayBuffer();

        if (onProgress) onProgress('Interpretando linhas da planilha...');
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const rawRows = XLSX.utils.sheet_to_json(worksheet);

        if (onProgress) onProgress(`Normalizando ${rawRows.length} registros...`);
        const normalized = [];
        for (let i = 0; i < rawRows.length; i++) {
            const item = normalizeUcRecord(rawRows[i]);
            if (item && (item.full_uc || item.clean_installation)) {
                normalized.push(item);
            }
        }
        return normalized;
    }

    throw new Error(`Extensão não suportada: .${extension}. Utilize .xlsx, .xls ou .json`);
}

/**
 * Compara a nova lista de UCs com os dados atualmente carregados no IndexedDB do navegador.
 */
export async function compareWithLocalInstallations(newItems, onProgress) {
    if (onProgress) onProgress('Buscando dados locais do IndexedDB...');
    const db = await initDB();
    const currentList = await db.getAll('installations');

    if (onProgress) onProgress('Indexando dados atuais para cruzamento...');
    const currentByUC = new Map();
    const currentByInst = new Map();

    currentList.forEach(item => {
        const uc = String(item.full_uc || item['Código Unidade Consumidora'] || '').trim();
        const inst = String(item.clean_installation || item.installation_number || item['Instalação'] || '').trim().replace(/^0+/, '');
        if (uc) currentByUC.set(uc, item);
        if (inst) currentByInst.set(inst, item);
    });

    if (onProgress) onProgress('Comparando registros...');
    let novas = 0;
    let alteradas = 0;
    let identicas = 0;
    let comCoordenadas = 0;
    let semCoordenadas = 0;

    const amostraNovos = [];
    const amostraAlterados = [];

    const statsAlteracoes = {
        coordenadas: 0,
        bairro: 0,
        logradouro: 0
    };

    const newUcsSet = new Set();
    const newInstSet = new Set();

    for (let i = 0; i < newItems.length; i++) {
        const item = newItems[i];
        if (item.full_uc) newUcsSet.add(item.full_uc);
        if (item.clean_installation) newInstSet.add(item.clean_installation);

        if (item.has_coords) comCoordenadas++;
        else semCoordenadas++;

        const existing = (item.full_uc && currentByUC.get(item.full_uc)) || 
                         (item.clean_installation && currentByInst.get(item.clean_installation));

        if (!existing) {
            novas++;
            if (amostraNovos.length < 5) {
                amostraNovos.push(item);
            }
        } else {
            const oldLat = parseFloat(existing.lat || existing.LATITUDE || 0);
            const oldLng = parseFloat(existing.lng || existing.LONGITUDE || 0);

            const mudouCoords = item.has_coords && (Math.abs(item.lat - oldLat) > 0.00002 || Math.abs(item.lng - oldLng) > 0.00002);

            const bairroNew = String(item.bairro || '').trim().toUpperCase();
            const bairroOld = String(existing.bairro || existing.NOME_BAIRRO || '').trim().toUpperCase();

            const logrNew = String(item.address || '').trim().toUpperCase();
            const logrOld = String(existing.address || existing.NOME_LOGRADOURO || '').trim().toUpperCase();

            const mudouBairro = bairroNew !== bairroOld;
            const mudouLogr = logrNew !== logrOld;

            if (mudouCoords || mudouBairro || mudouLogr) {
                alteradas++;
                if (mudouCoords) statsAlteracoes.coordenadas++;
                if (mudouBairro) statsAlteracoes.bairro++;
                if (mudouLogr) statsAlteracoes.logradouro++;

                if (amostraAlterados.length < 5) {
                    amostraAlterados.push({
                        uc: item.full_uc || item.installation_number,
                        novo: { lat: item.lat, lng: item.lng, bairro: item.bairro, address: item.address, has_coords: item.has_coords },
                        antigo: {
                            lat: oldLat,
                            lng: oldLng,
                            bairro: existing.bairro || existing.NOME_BAIRRO || '',
                            address: existing.address || existing.NOME_LOGRADOURO || ''
                        },
                        motivos: {
                            coordenadas: mudouCoords,
                            bairro: mudouBairro,
                            logradouro: mudouLogr
                        }
                    });
                }
            } else {
                identicas++;
            }
        }
    }

    // Calcula UCs obsoletas que existiam na base antiga mas NÃO constam na nova planilha
    let removidas = 0;
    const amostraRemovidas = [];
    currentList.forEach(existing => {
        const uc = String(existing.full_uc || existing['Código Unidade Consumidora'] || '').trim();
        const inst = String(existing.clean_installation || existing.installation_number || existing['Instalação'] || '').trim().replace(/^0+/, '');
        const existsInNew = (uc && newUcsSet.has(uc)) || (inst && newInstSet.has(inst));
        if (!existsInNew) {
            removidas++;
            if (amostraRemovidas.length < 5) {
                amostraRemovidas.push({
                    uc: uc || inst,
                    bairro: existing.bairro || existing.NOME_BAIRRO || '',
                    address: existing.address || existing.NOME_LOGRADOURO || ''
                });
            }
        }
    });

    return {
        totalNovo: newItems.length,
        totalLocalAtual: currentList.length,
        novas,
        alteradas,
        identicas,
        removidas,
        comCoordenadas,
        semCoordenadas,
        statsAlteracoes,
        amostraNovos,
        amostraAlterados,
        amostraRemovidas
    };
}

/**
 * Aplica a sincronização completa dos itens no IndexedDB 'installations' em chunks.
 * Remove UCs obsoletas que não constam mais no arquivo, garantindo a paridade exata.
 */
export async function applyUpsertToIndexedDB(items, onProgress) {
    clearInstallationsCache();
    const db = await initDB();

    // 1. Limpa a base antiga para remover UCs descontinuadas e evitar duplicatas por tipagem de chave (string vs number)
    if (onProgress) onProgress(0, items.length, 'Limpando base antiga para remoção de registros obsoletos...');
    {
        const txClear = db.transaction('installations', 'readwrite');
        await txClear.objectStore('installations').clear();
        await txClear.done;
    }

    const CHUNK_SIZE = 1000;
    const total = items.length;
    let processed = 0;

    for (let i = 0; i < total; i += CHUNK_SIZE) {
        const chunk = items.slice(i, i + CHUNK_SIZE);
        const tx = db.transaction('installations', 'readwrite');
        const store = tx.objectStore('installations');

        for (const item of chunk) {
            const doc = {
                id: item.id || item.clean_installation || item.installation_number || Math.random().toString(36).substr(2, 9),
                installation_number: item.installation_number,
                clean_installation: item.clean_installation,
                full_uc: item.full_uc,
                clean_full_uc: item.clean_full_uc,
                uc_core: item.uc_core,
                name: item.name || item.bairro || 'Unidade Consumidora',
                address: item.address,
                bairro: item.bairro,
                status: item.status || 'Ativo',
                lat: item.lat,
                lng: item.lng,
                has_coords: item.has_coords,
                municipio: item.municipio || 'SANTA MARIA DE JETIBA',
                cep: item.cep || ''
            };
            store.put(doc);
        }

        await tx.done;
        processed += chunk.length;
        if (onProgress) {
            onProgress(Math.min(processed, total), total);
        }
        await new Promise(r => setTimeout(r, 10)); // cede à thread do navegador
    }

    clearInstallationsCache();
    localStorage.setItem('geo_db_version', 'v2');
    localStorage.setItem('geo_db_last_update', new Date().toISOString());

    return {
        success: true,
        count: total
    };
}

/**
 * Converte os itens para o formato otimizado do arquivo uc_db_v2.json e dispara o download.
 */
export function generateAndDownloadV2Json(items, filename = 'uc_db_v2.json') {
    const exportData = items.map(item => ({
        'Instalação': parseInt(item.clean_installation || item.installation_number) || item.installation_number,
        'Código Unidade Consumidora': item.full_uc || '',
        'Status da UC': item.status || 'Ativo',
        'NOME_BAIRRO': item.bairro || '',
        'NOME_LOGRADOURO': item.address || '',
        'LATITUDE': item.lat ? Number(item.lat.toFixed(8)) : null,
        'LONGITUDE': item.lng ? Number(item.lng.toFixed(8)) : null,
        'NOME': item.name || ''
    }));

    const jsonString = JSON.stringify(exportData);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Alias para compatibilidade
export const generateAndDownloadV5Json = generateAndDownloadV2Json;
