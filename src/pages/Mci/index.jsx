import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Search, Plus, Filter, Edit3, Trash2, CheckCircle2, XCircle, 
    AlertTriangle, Users, MapPin, Truck, Wrench, Package, 
    ShieldAlert, FileText, ClipboardList, RefreshCw, Send, Check, Upload, ArrowLeft, Printer
} from 'lucide-react';
import { UserContext } from '../../App';
import { supabase } from '../../services/supabase';
import { 
    getMciRecursos, createMciRecurso, updateMciRecurso, deleteMciRecurso,
    confirmarValidadeRecurso, criarMciRequisicao, getMciRequisicoes, 
    atualizarMciRequisicaoStatus, getMciLogs
} from '../../services/mciService';
import { getActiveEvents } from '../../services/redapService';
import { REDAP_SECTORS } from '../../services/redapService';
import { useToast } from '../../components/ToastNotification';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import CategoryTabs from './components/CategoryTabs';
import ResourceCardFactory from './components/ResourceCardFactory';

// Fix leaflet icon assets
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

// Custom markers for MCI Installations
const greenIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const redIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Simple CSV parser supporting quotes, commas, and semicolons
const parseCSV = (text) => {
    if (!text || !text.trim()) return [];
    
    // Split first line to detect separator
    const firstLine = text.split('\n')[0];
    const separator = firstLine.includes(';') ? ';' : ',';
    
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(separator).map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase());
    const results = [];
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        let values = [];
        let currentVal = '';
        let insideQuotes = false;
        
        for (let charIndex = 0; charIndex < line.length; charIndex++) {
            const char = line[charIndex];
            if (char === '"' || char === "'") {
                insideQuotes = !insideQuotes;
            } else if (char === separator && !insideQuotes) {
                values.push(currentVal.trim().replace(/^["']|["']$/g, ''));
                currentVal = '';
            } else {
                currentVal += char;
            }
        }
        values.push(currentVal.trim().replace(/^["']|["']$/g, ''));
        
        if (values.length >= headers.length) {
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index] || '';
            });
            results.push(row);
        }
    }
    return results;
};

// Map flat CSV row to structured resource object
const mapCsvRowToRecurso = (row, defaultSecretaria) => {
    const nome = row.nome || row.name || 'Recurso Sem Nome';
    
    // Normalize Categoria
    let categoria = (row.categoria || row.category || 'VEICULO').toUpperCase().trim();
    if (categoria.includes('VEI')) categoria = 'VEICULO';
    else if (categoria.includes('EQU') || categoria.includes('FER')) categoria = 'EQUIPAMENTO';
    else if (categoria.includes('EST') || categoria.includes('ALM')) categoria = 'ESTOQUE';
    else if (categoria.includes('PRO') || categoria.includes('MAO') || categoria.includes('MÃO')) categoria = 'PROFISSIONAL';
    else if (categoria.includes('INS') || categoria.includes('ABR')) categoria = 'INSTALACAO';
    else categoria = 'VEICULO';
    
    // Normalize Status
    let status = (row.status || 'DISPONIVEL').toUpperCase().trim();
    if (status.includes('DISP')) status = 'DISPONIVEL';
    else if (status.includes('MAN')) status = 'EM_MANUTENCAO';
    else if (status.includes('USO')) status = 'EM_USO';
    else if (status.includes('OCU')) status = 'OCUPADO';
    else if (status.includes('REF')) status = 'EM_REFORMA';
    else status = 'DISPONIVEL';
    
    // Secretaria
    const secretaria_id = row.secretaria || row.secretaria_id || defaultSecretaria;
    
    // Details construction
    let detalhes = {};
    if (categoria === 'VEICULO') {
        detalhes = {
            tipo: row.tipo || row.veiculo_tipo || 'Caminhonete 4x4',
            placa: row.placa || '',
            identificacao_patrimonial: row.patrimonio || row.identificacao_patrimonial || '',
            capacidade: row.capacidade || '',
            observacoes_operacionais: row.obs || row.observacoes || ''
        };
    } else if (categoria === 'EQUIPAMENTO') {
        detalhes = {
            estado_conservacao: row.estado || row.estado_conservacao || 'bom',
            localizacao_guarda: row.guarda || row.localizacao_guarda || '',
            especificacoes: row.descricao || row.especificacoes || '',
            quantidade: parseInt(row.quantidade || row.qtd || '1', 10) || 1
        };
    } else if (categoria === 'ESTOQUE') {
        detalhes = {
            item: row.item || row.nome || '',
            unidade_medida: row.unidade || row.unidade_medida || 'Unidades',
            quantidade_estoque: parseInt(row.quantidade || row.qtd || '0', 10) || 0,
            validade: row.validade || null,
            local_armazenamento: row.local || row.local_armazenamento || ''
        };
    } else if (categoria === 'PROFISSIONAL') {
        detalhes = {
            funcao: row.funcao || row.especialidade || '',
            profissionais_disponiveis: parseInt(row.quantidade || row.qtd || '1', 10) || 1,
            turno_disponibilidade: row.turno || row.turno_disponibilidade || '24h',
            contato_responsavel: row.contato || row.contato_responsavel || ''
        };
    } else if (categoria === 'INSTALACAO') {
        let lat = parseFloat(row.lat || row.latitude || '-20.0285');
        let lng = parseFloat(row.lng || row.longitude || '-40.7441');
        detalhes = {
            tipo: row.tipo || row.instalacao_tipo || 'Escola',
            capacidade_abrigo: parseInt(row.capacidade || row.capacidade_abrigo || '100', 10) || 100,
            coordenadas: { lat: isNaN(lat) ? -20.0285 : lat, lng: isNaN(lng) ? -40.7441 : lng },
            endereco: row.endereco || '',
            infraestrutura: {
                agua_potavel: String(row.agua || row.agua_potavel || 'true').toLowerCase() === 'true',
                energia_eletrica: String(row.energia || row.energia_eletrica || 'true').toLowerCase() === 'true',
                sanitarios: String(row.sanitarios || row.sanitarios_eletrica || 'true').toLowerCase() === 'true',
                cozinha: String(row.cozinha || 'true').toLowerCase() === 'true',
                chuveiros: String(row.chuveiros || 'false').toLowerCase() === 'true'
            }
        };
    }
    
    return {
        nome,
        categoria,
        status,
        secretaria_id,
        detalhes
    };
};

const getMciSecretariaName = (redapSector) => {
    const map = {
        'Defesa Civil': 'Coordenadoria Municipal de Proteção e Defesa Civil',
        'Administração': 'Secretaria de Administração',
        'Agropecuária': 'Secretaria de Agropecuária',
        'Cultura': 'Secretaria de Cultura e Turismo',
        'Defesa Social': 'Secretaria de Defesa Social',
        'Educação': 'Secretaria de Educação',
        'Esporte e Turismo': 'Secretaria de Esportes e Lazer',
        'Interior': 'Secretaria de Interior',
        'Meio Ambiente': 'Secretaria de Meio Ambiente',
        'Obras': 'Secretaria de Obras e Infraestrutura',
        'Saúde': 'Secretaria de Saúde',
        'Serviços Urbanos': 'Secretaria de Serviços Urbanos',
        'Assistência Social': 'Secretaria de Trabalho, Desenvolvimento e Assistência Social',
        'Transportes': 'Secretaria de Transportes'
    };
    return map[redapSector] || redapSector;
};

export default function MciDashboard() {
    const user = useContext(UserContext);
    const { toast: addToast } = useToast();
    const navigate = useNavigate();

    // User Roles & Department Mapping
    const isCOMPDEC = ['Admin', 'Administrador', 'administrador', 'Coordenador', 'Coordenador de Proteção e Defesa Civil', 'Agente de Defesa Civil'].includes(user?.role);
    const userSecretaria = REDAP_SECTORS[user?.role] || 'Outros';
    const mciSecretariaName = getMciSecretariaName(userSecretaria);

    // State Variables
    const [recursos, setRecursos] = useState([]);
    const [requisicoes, setRequisicoes] = useState([]);
    const [activeEvents, setActiveEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('inventory'); // 'inventory', 'map', 'requests'
    
    // Filters
    const [filterCategory, setFilterCategory] = useState('TODAS');
    const [filterStatus, setFilterStatus] = useState('TODOS');
    const [filterSecretaria, setFilterSecretaria] = useState('TODAS');
    const [onlyAvailable, setOnlyAvailable] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal Control
    const [showFormModal, setShowFormModal] = useState(false);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [showLogModal, setShowLogModal] = useState(false);
    const [editingRecurso, setEditingRecurso] = useState(null);
    const [logs, setLogs] = useState([]);
    const [selectedRecursoForRequest, setSelectedRecursoForRequest] = useState(null);

    // Import CSV States
    const [showImportModal, setShowImportModal] = useState(false);
    const [csvFile, setCsvFile] = useState(null);
    const [csvPreview, setCsvPreview] = useState([]);
    const [importing, setImporting] = useState(false);
    const [importError, setImportError] = useState('');

    // Form States
    const [formName, setFormName] = useState('');
    const [formCategory, setFormCategory] = useState('VEICULO');
    const [formStatus, setFormStatus] = useState('DISPONIVEL');
    const [formSecretaria, setFormSecretaria] = useState(isCOMPDEC ? 'Coordenadoria Municipal de Proteção e Defesa Civil' : mciSecretariaName);
    
    // Category specific details state
    const [veiculoTipo, setVeiculoTipo] = useState('Caminhonete 4x4');
    const [veiculoPlaca, setVeiculoPlaca] = useState('');
    const [veiculoPatrimonio, setVeiculoPatrimonio] = useState('');
    const [veiculoCapacidade, setVeiculoCapacidade] = useState('');
    const [veiculoObs, setVeiculoObs] = useState('');

    const [equipDesc, setEquipDesc] = useState('');
    const [equipQtd, setEquipQtd] = useState(1);
    const [equipEstado, setEquipEstado] = useState('bom');
    const [equipGuarda, setEquipGuarda] = useState('');

    const [estoqueItem, setEstoqueItem] = useState('Colchão');
    const [estoqueMedida, setEstoqueMedida] = useState('Unidades');
    const [estoqueQtd, setEstoqueQtd] = useState(0);
    const [estoqueValidade, setEstoqueValidade] = useState('');
    const [estoqueLocal, setEstoqueLocal] = useState('');

    const [mObraFuncao, setMObraFuncao] = useState('Operador de Máquinas');
    const [mObraQtd, setMObraQtd] = useState(1);
    const [mObraTurno, setMObraTurno] = useState('24h');
    const [mObraContato, setMObraContato] = useState('');

    const [instNome, setInstNome] = useState('');
    const [instEnd, setInstEnd] = useState('');
    const [instLat, setInstLat] = useState(-20.0285);
    const [instLng, setInstLng] = useState(-40.7441);
    const [instTipo, setInstTipo] = useState('Escola');
    const [instCapacidade, setInstCapacidade] = useState(100);
    const [instStatus, setInstStatus] = useState('disponivel');
    const [infraAgua, setInfraAgua] = useState(true);
    const [infraEnergia, setInfraEnergia] = useState(true);
    const [infraSanitarios, setInfraSanitarios] = useState(true);
    const [infraCozinha, setInfraCozinha] = useState(true);
    const [infraChuveiros, setInfraChuveiros] = useState(false);

    // Request Form State
    const [requestJustification, setRequestJustification] = useState('');
    const [requestEventId, setRequestEventId] = useState('');
    const [requestQuantidade, setRequestQuantidade] = useState(1);

    // Fetch initial data
    const loadData = async () => {
        setLoading(true);
        try {
            // Apply RBAC filters: Secretarias can only load their own records
            const filters = {};
            if (!isCOMPDEC) {
                filters.secretaria_id = mciSecretariaName;
            }
            const dataRec = await getMciRecursos(filters);
            setRecursos(dataRec);

            const dataReq = await getMciRequisicoes();
            // Filter requests for secretarias
            if (!isCOMPDEC) {
                setRequisicoes(dataReq.filter(r => r.recurso?.secretaria_id === mciSecretariaName));
            } else {
                setRequisicoes(dataReq);
            }

            const events = await getActiveEvents();
            const activeOnly = events.filter(e => e.status_evento !== 'FECHADO' && e.status_evento !== 'Finalizado');
            setActiveEvents(activeOnly);
            if (activeOnly.length > 0) {
                setSelectedEvent(activeOnly[0]);
            }
        } catch (err) {
            console.error('[MCI] Erro ao carregar dados:', err);
            addToast('Erro ao carregar os recursos do MCI.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [user]);

    // Handle form submit
    const handleSubmitForm = async (e) => {
        e.preventDefault();
        
        let detalhes = {};
        if (formCategory === 'VEICULO') {
            detalhes = {
                tipo: veiculoTipo,
                placa: veiculoPlaca,
                identificacao_patrimonial: veiculoPatrimonio,
                capacidade: veiculoCapacidade,
                observacoes_operacionais: veiculoObs
            };
        } else if (formCategory === 'EQUIPAMENTO') {
            detalhes = {
                estado_conservacao: equipEstado,
                localizacao_guarda: equipGuarda,
                especificacoes: equipDesc,
                quantidade: equipQtd
            };
        } else if (formCategory === 'ESTOQUE') {
            detalhes = {
                item: estoqueItem,
                unidade_medida: estoqueMedida,
                quantidade_estoque: estoqueQtd,
                validade: estoqueValidade || null,
                local_armazenamento: estoqueLocal
            };
        } else if (formCategory === 'PROFISSIONAL') {
            detalhes = {
                funcao: mObraFuncao,
                profissionais_disponiveis: mObraQtd,
                turno_disponibilidade: mObraTurno,
                contato_responsavel: mObraContato
            };
        } else if (formCategory === 'INSTALACAO') {
            detalhes = {
                tipo: instTipo,
                capacidade_abrigo: instCapacidade,
                coordenadas: { lat: parseFloat(instLat), lng: parseFloat(instLng) },
                endereco: instEnd,
                infraestrutura: {
                    agua_potavel: infraAgua,
                    energia_eletrica: infraEnergia,
                    sanitarios: infraSanitarios,
                    cozinha: infraCozinha,
                    chuveiros: infraChuveiros
                }
            };
        }

        const payload = {
            nome: formName,
            categoria: formCategory,
            status: formStatus,
            secretaria_id: formSecretaria,
            detalhes
        };

        try {
            if (editingRecurso) {
                await updateMciRecurso(editingRecurso.id, payload, user?.id);
                addToast('Recurso atualizado com sucesso!', 'success');
            } else {
                await createMciRecurso(payload, user?.id);
                addToast('Recurso cadastrado com sucesso!', 'success');
            }
            setShowFormModal(false);
            resetForm();
            loadData();
        } catch (err) {
            console.error('[MCI] Erro ao salvar recurso:', err);
            addToast('Erro ao salvar o recurso. Verifique as permissões.', 'error');
        }
    };

    // Open Form Modal for Create
    const handleAddRecurso = () => {
        setEditingRecurso(null);
        resetForm();
        setShowFormModal(true);
    };

    // Open Form Modal for Edit
    const handleEditRecurso = (recurso) => {
        setEditingRecurso(recurso);
        setFormName(recurso.nome);
        setFormCategory(recurso.categoria);
        setFormStatus(recurso.status);
        setFormSecretaria(recurso.secretaria_id);

        const d = recurso.detalhes || {};
        if (recurso.categoria === 'VEICULO') {
            setVeiculoTipo(d.tipo || 'Caminhonete 4x4');
            setVeiculoPlaca(d.placa || '');
            setVeiculoPatrimonio(d.identificacao_patrimonial || '');
            setVeiculoCapacidade(d.capacidade || '');
            setVeiculoObs(d.observacoes_operacionais || '');
        } else if (recurso.categoria === 'EQUIPAMENTO') {
            setEquipEstado(d.estado_conservacao || 'bom');
            setEquipGuarda(d.localizacao_guarda || '');
            setEquipDesc(d.especificacoes || '');
            setEquipQtd(d.quantidade || 1);
        } else if (recurso.categoria === 'ESTOQUE') {
            setEstoqueItem(d.item || '');
            setEstoqueMedida(d.unidade_medida || 'Unidades');
            setEstoqueQtd(d.quantidade_estoque || 0);
            setEstoqueValidade(d.validade || '');
            setEstoqueLocal(d.local_armazenamento || '');
        } else if (recurso.categoria === 'PROFISSIONAL') {
            setMObraFuncao(d.funcao || '');
            setMObraQtd(d.profissionais_disponiveis || 1);
            setMObraTurno(d.turno_disponibilidade || '24h');
            setMObraContato(d.contato_responsavel || '');
        } else if (recurso.categoria === 'INSTALACAO') {
            setInstTipo(d.tipo || 'Escola');
            setInstCapacidade(d.capacidade_abrigo || 100);
            setInstLat(d.coordenadas?.lat || -20.0285);
            setInstLng(d.coordenadas?.lng || -40.7441);
            setInstEnd(d.endereco || '');
            setInfraAgua(d.infraestrutura?.agua_potavel ?? true);
            setInfraEnergia(d.infraestrutura?.energia_eletrica ?? true);
            setInfraSanitarios(d.infraestrutura?.sanitarios ?? true);
            setInfraCozinha(d.infraestrutura?.cozinha ?? true);
            setInfraChuveiros(d.infraestrutura?.chuveiros ?? false);
        }

        setShowFormModal(true);
    };

    // Reset form values
    const resetForm = () => {
        setFormName('');
        setFormCategory('VEICULO');
        setFormStatus('DISPONIVEL');
        setFormSecretaria(isCOMPDEC ? 'Coordenadoria Municipal de Proteção e Defesa Civil' : mciSecretariaName);
        
        setVeiculoTipo('Caminhonete 4x4');
        setVeiculoPlaca('');
        setVeiculoPatrimonio('');
        setVeiculoCapacidade('');
        setVeiculoObs('');

        setEquipDesc('');
        setEquipQtd(1);
        setEquipEstado('bom');
        setEquipGuarda('');

        setEstoqueItem('Colchão');
        setEstoqueMedida('Unidades');
        setEstoqueQtd(0);
        setEstoqueValidade('');
        setEstoqueLocal('');

        setMObraFuncao('Operador de Máquinas');
        setMObraQtd(1);
        setMObraTurno('24h');
        setMObraContato('');

        setInstNome('');
        setInstEnd('');
        setInstLat(-20.0285);
        setInstLng(-40.7441);
        setInstTipo('Escola');
        setInstCapacidade(100);
        setInfraAgua(true);
        setInfraEnergia(true);
        setInfraSanitarios(true);
        setInfraCozinha(true);
        setInfraChuveiros(false);
    };

    // Delete resource
    const handleDelete = async (id) => {
        if (window.confirm('Tem certeza que deseja remover este recurso do MCI?')) {
            try {
                await deleteMciRecurso(id);
                addToast('Recurso removido com sucesso!', 'success');
                loadData();
            } catch (err) {
                console.error('[MCI] Erro ao deletar:', err);
                addToast('Erro ao remover recurso.', 'error');
            }
        }
    };

    // Renew resource verification (updates to now)
    const handleRenewValidade = async (id) => {
        try {
            await confirmarValidadeRecurso(id, user?.id);
            addToast('Validação do recurso registrada com sucesso!', 'success');
            loadData();
        } catch (err) {
            console.error('[MCI] Erro ao renovar:', err);
            addToast('Erro ao revalidar recurso.', 'error');
        }
    };

    // Request resource
    const handleOpenRequest = (recurso) => {
        setSelectedRecursoForRequest(recurso);
        setRequestJustification('');
        setRequestQuantidade(1);
        if (activeEvents.length > 0) {
            setRequestEventId(activeEvents[0].id);
        }
        setShowRequestModal(true);
    };

    const getMaxQuantity = (recurso) => {
        if (!recurso) return 1;
        let total = 1;
        if (recurso.categoria === 'ESTOQUE') total = recurso.detalhes?.quantidade_estoque || 0;
        else if (recurso.categoria === 'EQUIPAMENTO') total = recurso.detalhes?.quantidade || 1;
        else if (recurso.categoria === 'PROFISSIONAL') total = recurso.detalhes?.profissionais_disponiveis || 1;
        
        // Subtract already requested and approved
        const solicitados = requisicoes
            .filter(r => r.recurso_id === recurso.id && r.status === 'APROVADO')
            .reduce((acc, curr) => acc + (curr.quantidade_solicitada || 1), 0);
            
        return Math.max(0, total - solicitados);
    };

    const handleSubmitRequest = async (e) => {
        e.preventDefault();
        if (!requestEventId) {
            addToast('Selecione um evento ativo para vincular a requisição.', 'warning');
            return;
        }
        
        const maxQtd = getMaxQuantity(selectedRecursoForRequest);
        if (requestQuantidade > maxQtd) {
            addToast(`Quantidade solicitada excede o saldo disponível (${maxQtd}).`, 'warning');
            return;
        }

        try {
            await criarMciRequisicao({
                recurso_id: selectedRecursoForRequest.id,
                evento_id: requestEventId,
                justificativa: requestJustification,
                quantidade_solicitada: requestQuantidade
            }, user?.id);

            addToast('Solicitação de recurso enviada à secretaria responsável!', 'success');
            setShowRequestModal(false);
            loadData();
        } catch (err) {
            console.error('[MCI] Erro ao criar requisição:', err);
            addToast('Erro ao enviar requisição.', 'error');
        }
    };

    // Request approve/reject/finish
    const handleUpdateRequestStatus = async (req, newStatus) => {
        try {
            await atualizarMciRequisicaoStatus(req.id, newStatus, req.recurso_id, user?.id);
            addToast(`Solicitação marcada como ${newStatus.toLowerCase()}!`, 'success');
            loadData();
        } catch (err) {
            console.error('[MCI] Erro ao atualizar status da requisição:', err);
            addToast('Erro ao atualizar status da requisição.', 'error');
        }
    };

    // View Audit Logs
    const handleViewLogs = async (recurso) => {
        try {
            const dataLogs = await getMciLogs(recurso.id);
            setLogs(dataLogs);
            setEditingRecurso(recurso);
            setShowLogModal(true);
        } catch (err) {
            console.error('[MCI] Erro ao buscar logs:', err);
            addToast('Erro ao carregar histórico de auditoria.', 'error');
        }
    };

    // CSV Import Handlers
    const handleCsvUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        setCsvFile(file);
        setImportError('');
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const text = event.target.result;
                const rows = parseCSV(text);
                if (rows.length === 0) {
                    setImportError('O arquivo CSV está vazio ou possui formato inválido.');
                    setCsvPreview([]);
                    return;
                }
                
                // Map rows using mapped helper
                const defaultSec = isCOMPDEC ? 'Coordenadoria Municipal de Proteção e Defesa Civil' : mciSecretariaName;
                const mapped = rows.map((row, idx) => {
                    try {
                        return mapCsvRowToRecurso(row, defaultSec);
                    } catch (err) {
                        console.error('Erro na linha ', idx + 2, err);
                        return null;
                    }
                }).filter(Boolean);
                
                setCsvPreview(mapped);
            } catch (err) {
                console.error(err);
                setImportError('Erro ao processar o arquivo CSV.');
            }
        };
        reader.readAsText(file, 'UTF-8');
    };

    const handleConfirmImport = async () => {
        if (csvPreview.length === 0) return;
        
        setImporting(true);
        let successCount = 0;
        let failCount = 0;
        
        for (const recursoData of csvPreview) {
            try {
                // If not COMPDEC, force their own secretaria
                const targetRecurso = {
                    ...recursoData,
                    secretaria_id: isCOMPDEC ? recursoData.secretaria_id : mciSecretariaName
                };
                await createMciRecurso(targetRecurso, user?.id);
                successCount++;
            } catch (err) {
                console.error('Erro ao importar recurso:', recursoData, err);
                failCount++;
            }
        }
        
        setImporting(false);
        setShowImportModal(false);
        setCsvFile(null);
        setCsvPreview([]);
        
        if (successCount > 0) {
            addToast(`${successCount} recursos importados com sucesso!`, 'success');
            loadData();
        }
        if (failCount > 0) {
            addToast(`${failCount} recursos falharam na importação. Verifique as restrições de permissão ou formato.`, 'error');
        }
    };

    // Smart recommendations logic
    const getRecursoRelevancia = (recurso) => {
        if (!selectedEvent) return false;
        const cobradeLabel = selectedEvent.cobrade_tipo?.toLowerCase() || '';
        
        if (cobradeLabel.includes('deslizamento') || cobradeLabel.includes('massa')) {
            if (recurso.categoria === 'VEICULO' && (recurso.detalhes?.tipo?.toLowerCase()?.includes('retroescavadeira') || recurso.detalhes?.tipo?.toLowerCase()?.includes('caminhão'))) return true;
            if (recurso.categoria === 'PROFISSIONAL' && recurso.detalhes?.funcao?.toLowerCase()?.includes('engenheiro')) return true;
        }
        if (cobradeLabel.includes('inundação') || cobradeLabel.includes('enxurrada') || cobradeLabel.includes('alagamento')) {
            if (recurso.categoria === 'INSTALACAO' && (recurso.detalhes?.capacidade_abrigo > 0)) return true;
            if (recurso.categoria === 'ESTOQUE' && (recurso.detalhes?.item?.toLowerCase()?.includes('colchão') || recurso.detalhes?.item?.toLowerCase()?.includes('cesta'))) return true;
        }
        if (cobradeLabel.includes('incêndio')) {
            if (recurso.categoria === 'VEICULO' && recurso.detalhes?.tipo?.toLowerCase()?.includes('tanque')) return true;
            if (recurso.categoria === 'PROFISSIONAL' && recurso.detalhes?.funcao?.toLowerCase()?.includes('brigadista')) return true;
        }
        if (cobradeLabel.includes('chuvas intensas') || cobradeLabel.includes('tempestade') || cobradeLabel.includes('vendaval') || cobradeLabel.includes('granizo')) {
            if (recurso.categoria === 'INSTALACAO' && (recurso.detalhes?.capacidade_abrigo > 0)) return true;
            if (recurso.categoria === 'ESTOQUE' && (
                recurso.detalhes?.item?.toLowerCase()?.includes('lona') || 
                recurso.detalhes?.item?.toLowerCase()?.includes('telha') || 
                recurso.detalhes?.item?.toLowerCase()?.includes('colchão') || 
                recurso.detalhes?.item?.toLowerCase()?.includes('cesta') ||
                recurso.detalhes?.item?.toLowerCase()?.includes('kit') ||
                recurso.detalhes?.item?.toLowerCase()?.includes('higiene')
            )) return true;
            if (recurso.categoria === 'EQUIPAMENTO' && (
                recurso.detalhes?.especificacoes?.toLowerCase()?.includes('motosserra') || 
                recurso.detalhes?.especificacoes?.toLowerCase()?.includes('gerador') ||
                recurso.detalhes?.especificacoes?.toLowerCase()?.includes('bomba') ||
                recurso.detalhes?.especificacoes?.toLowerCase()?.includes('torre')
            )) return true;
            if (recurso.categoria === 'VEICULO' && (
                recurso.detalhes?.tipo?.toLowerCase()?.includes('caminhão') || 
                recurso.detalhes?.tipo?.toLowerCase()?.includes('munck') ||
                recurso.detalhes?.tipo?.toLowerCase()?.includes('cesto') ||
                recurso.detalhes?.tipo?.toLowerCase()?.includes('retroescavadeira')
            )) return true;
            if (recurso.categoria === 'PROFISSIONAL' && (
                recurso.detalhes?.funcao?.toLowerCase()?.includes('operador') ||
                recurso.detalhes?.funcao?.toLowerCase()?.includes('motorista')
            )) return true;
        }
        return false;
    };

    // Filter resources
    const filteredRecursos = recursos.filter(r => {
        if (filterCategory !== 'TODAS' && r.categoria !== filterCategory) return false;
        if (filterStatus !== 'TODOS' && r.status !== filterStatus) return false;
        if (filterSecretaria !== 'TODAS' && r.secretaria_id !== filterSecretaria) return false;
        if (onlyAvailable) {
            if (r.status !== 'DISPONIVEL') return false;
            if (r.categoria === 'ESTOQUE') {
                if (r.detalhes?.quantidade_estoque === 0) return false;
                if (r.detalhes?.validade && new Date(r.detalhes.validade) < new Date()) return false;
            }
            if (r.categoria === 'EQUIPAMENTO' && r.detalhes?.estado_conservacao === 'inoperante') return false;
            if (r.categoria === 'INSTALACAO' && (r.status === 'OCUPADO' || r.status === 'EM_REFORMA' || r.status === 'INDISPONIVEL')) return false;
        }
        
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            const matchesName = r.nome.toLowerCase().includes(term);
            const matchesSec = r.secretaria_id.toLowerCase().includes(term);
            const matchesCategory = r.categoria.toLowerCase().includes(term);
            return matchesName || matchesSec || matchesCategory;
        }
        return true;
    });

    // Count statistics
    const stats = {
        veiculos: recursos.filter(r => r.categoria === 'VEICULO').length,
        equipamentos: recursos.filter(r => r.categoria === 'EQUIPAMENTO').length,
        profissionais: recursos.filter(r => r.categoria === 'PROFISSIONAL').length,
        instalacoes: recursos.filter(r => r.categoria === 'INSTALACAO').length,
        estoques: recursos.filter(r => r.categoria === 'ESTOQUE').length
    };

    // List of unique secretarias for filter
    const secretarias = [...new Set(recursos.map(r => r.secretaria_id))];

    // Helper: Check if resource is outdated (90+ days)
    const isOutdated = (updatedAtStr) => {
        const days = (Date.now() - new Date(updatedAtStr).getTime()) / (1000 * 60 * 60 * 24);
        return days > 90;
    };

    const categoriasList = [
        { categoria: 'VEICULO', label: 'Veículos', icone: Truck, total: stats.veiculos },
        { categoria: 'EQUIPAMENTO', label: 'Equipamentos', icone: Wrench, total: stats.equipamentos },
        { categoria: 'ESTOQUE', label: 'Estoques', icone: Package, total: stats.estoques },
        { categoria: 'PROFISSIONAL', label: 'Profissionais', icone: Users, total: stats.profissionais },
        { categoria: 'INSTALACAO', label: 'Instalações', icone: MapPin, total: stats.instalacoes }
    ];

    return (
        <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 min-h-screen transition-colors duration-300">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
                <div className="flex items-start gap-4">
                    <button 
                        onClick={() => navigate('/dashboard')}
                        className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 transition-colors mt-1 print:hidden"
                        title="Voltar ao Dashboard"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-blue-500">Logística de Emergência</span>
                        <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase mt-1">MCI - CAPACIDADE INSTALADA</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {isCOMPDEC 
                            ? 'Painel Geral COMPDEC: Gerencie e mobilize os recursos municipais em tempo real.'
                            : `Secretaria: ${mciSecretariaName}. Gerencie os recursos de sua pasta.`
                        }
                    </p>
                </div>
                </div>
                <div className="flex gap-2 print:hidden flex-wrap">
                    <button 
                        onClick={() => {
                            sessionStorage.setItem('mciReportData', JSON.stringify({
                                recursos: filteredRecursos,
                                stats,
                                filters: {
                                    categoria: filterCategory,
                                    status: filterStatus,
                                    secretaria: filterSecretaria,
                                    onlyAvailable
                                },
                                isCOMPDEC,
                                userSecretaria: mciSecretariaName
                            }));
                            window.open('/mci/imprimir', '_blank');
                        }}
                        className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs uppercase tracking-wider rounded-lg flex items-center gap-2 shadow-sm transition-all border border-slate-200 dark:border-slate-700"
                    >
                        <Printer size={16} /> Relatório
                    </button>
                    <button 
                        onClick={() => {
                            setCsvFile(null);
                            setCsvPreview([]);
                            setImportError('');
                            setShowImportModal(true);
                        }}
                        className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs uppercase tracking-wider rounded-lg flex items-center gap-2 border border-slate-200 dark:border-slate-700 shadow-sm transition-all"
                    >
                        <Upload size={16} /> Importar CSV
                    </button>
                    <button 
                        onClick={handleAddRecurso}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg flex items-center gap-2 shadow-lg transition-all"
                    >
                        <Plus size={16} /> Cadastrar Recurso
                    </button>
                </div>
            </div>

            {/* KPI Counters */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                    { label: 'Veículos', value: stats.veiculos, icon: Truck, color: 'text-blue-500' },
                    { label: 'Equipamentos', value: stats.equipamentos, icon: Wrench, color: 'text-emerald-500' },
                    { label: 'Estoques', value: stats.estoques, icon: Package, color: 'text-amber-500' },
                    { label: 'Profissionais', value: stats.profissionais, icon: Users, color: 'text-purple-500' },
                    { label: 'Instalações', value: stats.instalacoes, icon: MapPin, color: 'text-red-500' }
                ].map((item, i) => (
                    <div key={i} className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 flex items-center justify-between shadow-sm backdrop-blur-sm">
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{item.label}</span>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{item.value}</h3>
                        </div>
                        <item.icon className={`h-8 w-8 ${item.color} opacity-70`} />
                    </div>
                ))}
            </div>

            {/* Recomendações de Evento Ativo (COMPDEC) */}
            {isCOMPDEC && selectedEvent && (
                <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-start gap-3">
                        <ShieldAlert className="text-blue-600 dark:text-blue-500 h-6 w-6 mt-1 flex-shrink-0" />
                        <div>
                            <h4 className="text-sm font-black uppercase text-slate-900 dark:text-white tracking-tight">Evento Ativo: {selectedEvent.nome_evento}</h4>
                            <p className="text-xs text-slate-650 dark:text-slate-300 mt-1">
                                O sistema está cruzando recursos recomendados para desastres do tipo <strong className="text-blue-600 dark:text-blue-400">{selectedEvent.cobrade_tipo}</strong>.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <select 
                            value={selectedEvent.id} 
                            onChange={(e) => setSelectedEvent(activeEvents.find(ev => ev.id === e.target.value))}
                            className="bg-white dark:bg-slate-800 text-xs border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-semibold focus:outline-none w-full md:w-auto"
                        >
                            {activeEvents.map(ev => (
                                <option key={ev.id} value={ev.id}>{ev.nome_evento}</option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            {/* Tab Navigation */}
            <div className="flex border-b border-slate-200 dark:border-slate-800">
                <button 
                    onClick={() => setActiveTab('inventory')}
                    className={`px-6 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${activeTab === 'inventory' ? 'border-blue-500 text-blue-500' : 'border-transparent text-slate-550 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                    <div className="flex items-center gap-2"><ClipboardList size={16} /> Inventário</div>
                </button>
                <button 
                    onClick={() => setActiveTab('map')}
                    className={`px-6 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${activeTab === 'map' ? 'border-blue-500 text-blue-500' : 'border-transparent text-slate-550 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                    <div className="flex items-center gap-2"><MapPin size={16} /> Mapa de Abrigos</div>
                </button>
                <button 
                    onClick={() => setActiveTab('requests')}
                    className={`px-6 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${activeTab === 'requests' ? 'border-blue-500 text-blue-500' : 'border-transparent text-slate-550 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                    <div className="flex items-center gap-2">
                        <Send size={16} /> Requisições
                        {requisicoes.filter(r => r.status === 'SOLICITADO').length > 0 && (
                            <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-1">
                                {requisicoes.filter(r => r.status === 'SOLICITADO').length}
                            </span>
                        )}
                    </div>
                </button>
            </div>

            {/* TAB: INVENTORY */}
            {activeTab === 'inventory' && (
                <div className="space-y-4">
                    {/* Category Tabs */}
                    <CategoryTabs 
                        categorias={categoriasList}
                        categoriaAtiva={filterCategory}
                        onChange={(cat) => setFilterCategory(cat)}
                    />

                    {/* Search & Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3 bg-white dark:bg-slate-800/30 p-4 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <input 
                                type="text"
                                placeholder="Buscar recursos..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-750 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-all"
                            />
                        </div>
                        <div>
                            <select 
                                value={filterCategory} 
                                onChange={(e) => setFilterCategory(e.target.value)}
                                className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-750 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none"
                            >
                                <option value="TODAS">Categorias: Todas</option>
                                <option value="VEICULO">Veículos</option>
                                <option value="EQUIPAMENTO">Equipamentos</option>
                                <option value="ESTOQUE">Estoques</option>
                                <option value="PROFISSIONAL">Profissionais</option>
                                <option value="INSTALACAO">Instalações</option>
                            </select>
                        </div>
                        <div>
                            <select 
                                value={filterStatus} 
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-750 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none"
                            >
                                <option value="TODOS">Status: Todos</option>
                                <option value="DISPONIVEL">Disponível</option>
                                <option value="EM_MANUTENCAO">Em Manutenção</option>
                                <option value="EM_USO">Em Uso</option>
                                <option value="OCUPADO">Ocupado</option>
                                <option value="EM_REFORMA">Em Reforma</option>
                            </select>
                        </div>
                        {isCOMPDEC && (
                            <div>
                                <select 
                                    value={filterSecretaria} 
                                    onChange={(e) => setFilterSecretaria(e.target.value)}
                                    className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-750 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none"
                                >
                                    <option value="TODAS">Secretaria: Todas</option>
                                    {secretarias.map((s, idx) => (
                                        <option key={idx} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div className="flex items-center justify-end">
                            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                                <input 
                                    type="checkbox" 
                                    checked={onlyAvailable}
                                    onChange={(e) => setOnlyAvailable(e.target.checked)}
                                    className="rounded border-slate-300 dark:border-slate-700 text-blue-600 bg-white dark:bg-slate-950 focus:ring-0 focus:ring-offset-0" 
                                />
                                Apenas Disponíveis
                            </label>
                        </div>
                    </div>

                    {/* Resources List */}
                    {loading ? (
                        <div className="text-center py-20 text-xs text-slate-400 uppercase tracking-widest font-bold">
                            Carregando recursos do MCI...
                        </div>
                    ) : filteredRecursos.length === 0 ? (
                        <div className="text-center py-20 text-xs text-slate-400 bg-slate-800/20 border border-dashed border-slate-850 rounded-xl">
                            Nenhum recurso cadastrado ou correspondente aos filtros.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredRecursos.map((rec) => {
                                const outdated = isOutdated(rec.ultima_atualizacao);
                                const isRecommended = getRecursoRelevancia(rec);
                                return (
                                    <ResourceCardFactory 
                                        key={rec.id}
                                        recurso={rec}
                                        outdated={outdated}
                                        isRecommended={isRecommended}
                                        isCOMPDEC={isCOMPDEC}
                                        onRenewValidade={handleRenewValidade}
                                        onOpenRequest={handleOpenRequest}
                                        onViewLogs={handleViewLogs}
                                        onEditRecurso={handleEditRecurso}
                                        onDelete={handleDelete}
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* TAB: MAP */}
            {activeTab === 'map' && (
                <div className="bg-white dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
                    <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white tracking-tight mb-4">Mapa de Instalações Físicas do MCI</h3>
                    <div className="h-[550px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-850">
                        <MapContainer center={[-20.0285, -40.7441]} zoom={13} className="h-full w-full">
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; OpenStreetMap contributors'
                            />
                            {recursos.filter(r => r.categoria === 'INSTALACAO' && r.detalhes?.coordenadas?.lat).map((inst) => {
                                const lat = inst.detalhes.coordenadas.lat;
                                const lng = inst.detalhes.coordenadas.lng;
                                const isDisp = inst.status === 'DISPONIVEL';

                                return (
                                    <Marker 
                                        key={inst.id} 
                                        position={[lat, lng]} 
                                        icon={isDisp ? greenIcon : redIcon}
                                    >
                                        <Popup>
                                            <div className="p-1 text-slate-900 font-sans">
                                                <h4 className="font-bold text-sm uppercase text-slate-950">{inst.nome}</h4>
                                                <p className="text-xs text-slate-700 mt-1">Status: <strong className={isDisp ? "text-emerald-700" : "text-red-700"}>{inst.status}</strong></p>
                                                <p className="text-xs text-slate-700">Capacidade: {inst.detalhes?.capacidade_abrigo} pessoas</p>
                                                <p className="text-xs text-slate-700">Endereço: {inst.detalhes?.endereco}</p>
                                                <div className="mt-2 pt-2 border-t border-slate-200">
                                                    <span className="text-[10px] font-bold text-slate-500 block uppercase">Infraestrutura:</span>
                                                    <ul className="text-[10px] text-slate-700 list-disc pl-4 space-y-0.5 mt-1">
                                                        {inst.detalhes?.infraestrutura?.agua_potavel && <li>Água Potável</li>}
                                                        {inst.detalhes?.infraestrutura?.energia_eletrica && <li>Energia</li>}
                                                        {inst.detalhes?.infraestrutura?.sanitarios && <li>Sanitários</li>}
                                                        {inst.detalhes?.infraestrutura?.cozinha && <li>Cozinha</li>}
                                                    </ul>
                                                </div>
                                            </div>
                                        </Popup>
                                    </Marker>
                                );
                            })}
                        </MapContainer>
                    </div>
                </div>
            )}

            {/* TAB: REQUESTS */}
            {activeTab === 'requests' && (
                <div className="space-y-4">
                    {loading ? (
                        <div className="text-center py-20 text-xs text-slate-400 font-bold uppercase tracking-widest animate-pulse">
                            Buscando requisições...
                        </div>
                    ) : requisicoes.length === 0 ? (
                        <div className="text-center py-20 text-xs text-slate-400 bg-white dark:bg-slate-800/20 border border-dashed border-slate-200 dark:border-slate-850 rounded-xl shadow-sm">
                            Nenhuma requisição de recurso registrada.
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold uppercase border-b border-slate-200 dark:border-slate-800">
                                        <th className="p-4">Recurso</th>
                                        <th className="p-4">Secretaria</th>
                                        <th className="p-4">Justificativa</th>
                                        <th className="p-4 text-center">Status</th>
                                        <th className="p-4 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
                                    {requisicoes.map((req) => (
                                        <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 text-slate-850 dark:text-slate-300 transition-colors">
                                            <td className="p-4">
                                                <div className="font-bold text-slate-900 dark:text-white">{req.recurso?.nome}</div>
                                                <span className="text-[10px] text-slate-550 dark:text-slate-500">{req.recurso?.categoria} {req.quantidade_solicitada ? `(${req.quantidade_solicitada} unid.)` : ''}</span>
                                        </td>
                                            <td className="p-4">{req.recurso?.secretaria_id}</td>
                                            <td className="p-4 italic max-w-xs truncate" title={req.justificativa}>
                                                "{req.justificativa}"
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                                    req.status === 'SOLICITADO' 
                                                        ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30' 
                                                        : req.status === 'APROVADO' 
                                                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' 
                                                            : req.status === 'REJEITADO'
                                                                ? 'bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30'
                                                                : 'bg-slate-500/20 text-slate-600 dark:text-slate-400 border border-slate-500/30'
                                                }`}>
                                                    {req.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex gap-2 justify-end">
                                                    {/* Secretaria actions (Approve/Reject) */}
                                                    {req.status === 'SOLICITADO' && (
                                                        <>
                                                            <button 
                                                                onClick={() => handleUpdateRequestStatus(req, 'APROVADO')}
                                                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[9px] uppercase tracking-wider flex items-center gap-1 shadow-sm transition-colors"
                                                            >
                                                                <Check size={10} /> Aceitar
                                                            </button>
                                                            <button 
                                                                onClick={() => handleUpdateRequestStatus(req, 'REJEITADO')}
                                                                className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded text-[9px] uppercase tracking-wider flex items-center gap-1 shadow-sm transition-colors"
                                                            >
                                                                <XCircle size={10} /> Recusar
                                                            </button>
                                                        </>
                                                    )}
                                                    {/* COMPDEC action (Finalize request once event ends) */}
                                                    {isCOMPDEC && req.status === 'APROVADO' && (
                                                        <button 
                                                            onClick={() => handleUpdateRequestStatus(req, 'FINALIZADO')}
                                                            className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold rounded text-[9px] uppercase tracking-wider transition-colors"
                                                        >
                                                            Finalizar
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* FORM MODAL (ADD / EDIT RECURSO) */}
            {showFormModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="bg-slate-100 dark:bg-slate-950 p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                                {editingRecurso ? 'Editar Recurso MCI' : 'Cadastrar Recurso MCI'}
                            </h3>
                            <button onClick={() => setShowFormModal(false)} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white text-lg font-bold">&times;</button>
                        </div>
                        <form onSubmit={handleSubmitForm} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs text-slate-700 dark:text-slate-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-slate-600 dark:text-slate-400 font-bold uppercase mb-1">Nome do Recurso</label>
                                    <input 
                                        type="text" 
                                        value={formName}
                                        onChange={(e) => setFormName(e.target.value)}
                                        required
                                        placeholder="Ex: Retroescavadeira JCB"
                                        className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-350 dark:border-slate-850 rounded text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-600 dark:text-slate-400 font-bold uppercase mb-1">Categoria</label>
                                    <select 
                                        value={formCategory} 
                                        onChange={(e) => setFormCategory(e.target.value)}
                                        className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-350 dark:border-slate-850 rounded text-slate-900 dark:text-white focus:outline-none"
                                    >
                                        <option value="VEICULO">Veículos</option>
                                        <option value="EQUIPAMENTO">Equipamentos e Ferramentas</option>
                                        <option value="ESTOQUE">Estoque Estratégico</option>
                                        <option value="PROFISSIONAL">Mão de Obra Especializada</option>
                                        <option value="INSTALACAO">Instalação Física</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-slate-600 dark:text-slate-400 font-bold uppercase mb-1">Status Operacional</label>
                                    <select 
                                        value={formStatus} 
                                        onChange={(e) => setFormStatus(e.target.value)}
                                        className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-350 dark:border-slate-850 rounded text-slate-900 dark:text-white focus:outline-none"
                                    >
                                        <option value="DISPONIVEL">Disponível</option>
                                        {(formCategory === 'VEICULO' || formCategory === 'EQUIPAMENTO') && (
                                            <option value="EM_MANUTENCAO">Em Manutenção</option>
                                        )}
                                        {(formCategory === 'VEICULO' || formCategory === 'EQUIPAMENTO' || formCategory === 'PROFISSIONAL') && (
                                            <option value="EM_USO">Em Uso</option>
                                        )}
                                        {formCategory === 'INSTALACAO' && (
                                            <>
                                                <option value="OCUPADO">Ocupado</option>
                                                <option value="EM_REFORMA">Em Reforma</option>
                                            </>
                                        )}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-slate-600 dark:text-slate-400 font-bold uppercase mb-1">Secretaria Responsável</label>
                                    <select 
                                        value={formSecretaria} 
                                        onChange={(e) => setFormSecretaria(e.target.value)}
                                        disabled={!isCOMPDEC}
                                        className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-350 dark:border-slate-850 rounded text-slate-900 dark:text-white focus:outline-none disabled:opacity-60"
                                    >
                                        <option value="Coordenadoria Municipal de Proteção e Defesa Civil">Coordenadoria Municipal de Proteção e Defesa Civil</option>
                                        <option value="Controladoria Geral Interna">Controladoria Geral Interna</option>
                                        <option value="Secretaria de Administração">Secretaria de Administração</option>
                                        <option value="Secretaria de Agropecuária">Secretaria de Agropecuária</option>
                                        <option value="Secretaria de Cultura e Turismo">Secretaria de Cultura e Turismo</option>
                                        <option value="Secretaria de Defesa Social">Secretaria de Defesa Social</option>
                                        <option value="Secretaria de Educação">Secretaria de Educação</option>
                                        <option value="Secretaria de Esportes e Lazer">Secretaria de Esportes e Lazer</option>
                                        <option value="Secretaria de Fazenda">Secretaria de Fazenda</option>
                                        <option value="Secretaria de Gabinete">Secretaria de Gabinete</option>
                                        <option value="Secretaria de Interior">Secretaria de Interior</option>
                                        <option value="Secretaria Jurídica">Secretaria Jurídica</option>
                                        <option value="Secretaria de Meio Ambiente">Secretaria de Meio Ambiente</option>
                                        <option value="Secretaria de Obras e Infraestrutura">Secretaria de Obras e Infraestrutura</option>
                                        <option value="Secretaria de Planejamento e Projetos">Secretaria de Planejamento e Projetos</option>
                                        <option value="Secretaria de Saúde">Secretaria de Saúde</option>
                                        <option value="Secretaria de Serviços Urbanos">Secretaria de Serviços Urbanos</option>
                                        <option value="Secretaria de Trabalho, Desenvolvimento e Assistência Social">Secretaria de Trabalho, Desenvolvimento e Assistência Social</option>
                                        <option value="Secretaria de Transportes">Secretaria de Transportes</option>
                                    </select>
                                </div>
                            </div>

                            {/* CATEGORY SPECIFIC FIELDS */}
                            <div className="border-t border-slate-200 dark:border-slate-850 pt-4 mt-2">
                                <h4 className="text-[10px] font-black uppercase text-blue-500 tracking-wider mb-3">Dados Específicos</h4>
                                
                                {formCategory === 'VEICULO' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-slate-600 dark:text-slate-400 font-bold uppercase mb-1">Tipo de Veículo</label>
                                            <input type="text" value={veiculoTipo} onChange={(e) => setVeiculoTipo(e.target.value)} placeholder="Ex: Caminhão-pipa, Retroescavadeira" className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-850 rounded text-slate-900 dark:text-white focus:outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-slate-600 dark:text-slate-400 font-bold uppercase mb-1">Placa</label>
                                            <input type="text" value={veiculoPlaca} onChange={(e) => setVeiculoPlaca(e.target.value)} placeholder="ABC-1234" className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-350 dark:border-slate-850 rounded text-slate-900 dark:text-white focus:outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-slate-600 dark:text-slate-400 font-bold uppercase mb-1">Identificação Patrimonial</label>
                                            <input type="text" value={veiculoPatrimonio} onChange={(e) => setVeiculoPatrimonio(e.target.value)} placeholder="PAT-12345" className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-350 dark:border-slate-850 rounded text-slate-900 dark:text-white focus:outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-slate-600 dark:text-slate-400 font-bold uppercase mb-1">Capacidade</label>
                                            <input type="text" value={veiculoCapacidade} onChange={(e) => setVeiculoCapacidade(e.target.value)} placeholder="Ex: 5000 kg ou 15 passageiros" className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-350 dark:border-slate-850 rounded text-slate-900 dark:text-white focus:outline-none" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-slate-600 dark:text-slate-400 font-bold uppercase mb-1">Observações Operacionais</label>
                                            <textarea value={veiculoObs} onChange={(e) => setVeiculoObs(e.target.value)} placeholder="Ex: Apenas operador experiente, guincho integrado" className="w-full p-2 bg-slate-50 dark:bg-slate-955 border border-slate-350 dark:border-slate-850 rounded text-slate-900 dark:text-white focus:outline-none h-16 resize-none" />
                                        </div>
                                    </div>
                                )}

                                {formCategory === 'EQUIPAMENTO' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="block text-slate-600 dark:text-slate-400 font-bold uppercase mb-1">Descrição / Especificações</label>
                                            <input type="text" value={equipDesc} onChange={(e) => setEquipDesc(e.target.value)} placeholder="Ex: Motosserra Stihl 250" className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-850 rounded text-slate-900 dark:text-white focus:outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-slate-600 dark:text-slate-400 font-bold uppercase mb-1">Quantidade</label>
                                            <input type="number" value={equipQtd} onChange={(e) => setEquipQtd(parseInt(e.target.value))} className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-850 rounded text-slate-900 dark:text-white focus:outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-slate-600 dark:text-slate-400 font-bold uppercase mb-1">Estado de Conservação</label>
                                            <select value={equipEstado} onChange={(e) => setEquipEstado(e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-955 border border-slate-300 dark:border-slate-850 rounded text-slate-900 dark:text-white focus:outline-none">
                                                <option value="ótimo">Ótimo</option>
                                                <option value="bom">Bom</option>
                                                <option value="regular">Regular</option>
                                                <option value="inoperante">Inoperante</option>
                                            </select>
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-slate-600 dark:text-slate-400 font-bold uppercase mb-1">Localização de Guarda</label>
                                            <input type="text" value={equipGuarda} onChange={(e) => setEquipGuarda(e.target.value)} placeholder="Almoxarifado da Secretaria" className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-850 rounded text-slate-900 dark:text-white focus:outline-none" />
                                        </div>
                                    </div>
                                )}

                                {formCategory === 'ESTOQUE' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-slate-600 dark:text-slate-400 font-bold uppercase mb-1">Item</label>
                                            <input type="text" value={estoqueItem} onChange={(e) => setEstoqueItem(e.target.value)} placeholder="Ex: Telha de fibrocimento, Cesta básica" className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-850 rounded text-slate-900 dark:text-white focus:outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-slate-600 dark:text-slate-400 font-bold uppercase mb-1">Unidade de Medida</label>
                                            <input type="text" value={estoqueMedida} onChange={(e) => setEstoqueMedida(e.target.value)} placeholder="Ex: Unidades, Rolos, Metros" className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-850 rounded text-slate-900 dark:text-white focus:outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-slate-600 dark:text-slate-400 font-bold uppercase mb-1">Quantidade em Estoque</label>
                                            <input type="number" value={estoqueQtd} onChange={(e) => setEstoqueQtd(parseInt(e.target.value))} className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-850 rounded text-slate-900 dark:text-white focus:outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-slate-600 dark:text-slate-400 font-bold uppercase mb-1">Validade (se aplicável)</label>
                                            <input type="date" value={estoqueValidade} onChange={(e) => setEstoqueValidade(e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-850 rounded text-slate-900 dark:text-white focus:outline-none" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-slate-600 dark:text-slate-400 font-bold uppercase mb-1">Local de Armazenamento</label>
                                            <input type="text" value={estoqueLocal} onChange={(e) => setEstoqueLocal(e.target.value)} placeholder="Barracão da Assistência Social" className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-850 rounded text-slate-900 dark:text-white focus:outline-none" />
                                        </div>
                                    </div>
                                )}

                                {formCategory === 'PROFISSIONAL' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-slate-600 dark:text-slate-400 font-bold uppercase mb-1">Função / Especialidade</label>
                                            <input type="text" value={mObraFuncao} onChange={(e) => setMObraFuncao(e.target.value)} placeholder="Ex: Operador de escavadeira" className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-850 rounded text-slate-900 dark:text-white focus:outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-slate-600 dark:text-slate-400 font-bold uppercase mb-1">Nº de Profissionais Disponíveis</label>
                                            <input type="number" value={mObraQtd} onChange={(e) => setMObraQtd(parseInt(e.target.value))} className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-850 rounded text-slate-900 dark:text-white focus:outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-slate-600 dark:text-slate-400 font-bold uppercase mb-1">Turno / Disponibilidade</label>
                                            <input type="text" value={mObraTurno} onChange={(e) => setMObraTurno(e.target.value)} placeholder="Ex: Diurno Comercial, 24h em plantão" className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-850 rounded text-slate-900 dark:text-white focus:outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-slate-600 dark:text-slate-400 font-bold uppercase mb-1">Contato do Responsável</label>
                                            <input type="text" value={mObraContato} onChange={(e) => setMObraContato(e.target.value)} placeholder="(27) 99999-8888" className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-850 rounded text-slate-900 dark:text-white focus:outline-none" />
                                        </div>
                                    </div>
                                )}

                                {formCategory === 'INSTALACAO' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-slate-600 dark:text-slate-400 font-bold uppercase mb-1">Tipo de Instalação</label>
                                            <input type="text" value={instTipo} onChange={(e) => setInstTipo(e.target.value)} placeholder="Ex: Escola, Ginásio, Igreja" className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-850 rounded text-slate-900 dark:text-white focus:outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-slate-600 dark:text-slate-400 font-bold uppercase mb-1">Capacidade de Alojados (Pessoas)</label>
                                            <input type="number" value={instCapacidade} onChange={(e) => setInstCapacidade(parseInt(e.target.value))} className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-850 rounded text-slate-900 dark:text-white focus:outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-slate-600 dark:text-slate-400 font-bold uppercase mb-1">Coordenada Latitude</label>
                                            <input type="number" step="any" value={instLat} onChange={(e) => setInstLat(e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-850 rounded text-slate-900 dark:text-white focus:outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-slate-600 dark:text-slate-400 font-bold uppercase mb-1">Coordenada Longitude</label>
                                            <input type="number" step="any" value={instLng} onChange={(e) => setInstLng(e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-850 rounded text-slate-900 dark:text-white focus:outline-none" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-slate-600 dark:text-slate-400 font-bold uppercase mb-1">Endereço Completo</label>
                                            <input type="text" value={instEnd} onChange={(e) => setInstEnd(e.target.value)} placeholder="Rua/Bairro, Distrito" className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-850 rounded text-slate-900 dark:text-white focus:outline-none" />
                                        </div>
                                        <div className="md:col-span-2 space-y-2 mt-2">
                                            <span className="block text-slate-600 dark:text-slate-400 font-bold uppercase">Infraestrutura Disponível</span>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                                                    <input type="checkbox" checked={infraAgua} onChange={(e) => setInfraAgua(e.target.checked)} className="rounded text-blue-600 bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 focus:ring-0" />
                                                    Água Potável
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                                                    <input type="checkbox" checked={infraEnergia} onChange={(e) => setInfraEnergia(e.target.checked)} className="rounded text-blue-600 bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 focus:ring-0" />
                                                    Energia Elétrica
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                                                    <input type="checkbox" checked={infraSanitarios} onChange={(e) => setInfraSanitarios(e.target.checked)} className="rounded text-blue-600 bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 focus:ring-0" />
                                                    Sanitários
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                                                    <input type="checkbox" checked={infraCozinha} onChange={(e) => setInfraCozinha(e.target.checked)} className="rounded text-blue-600 bg-white dark:bg-slate-955 border-slate-300 dark:border-slate-800 focus:ring-0" />
                                                    Cozinha
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                                                    <input type="checkbox" checked={infraChuveiros} onChange={(e) => setInfraChuveiros(e.target.checked)} className="rounded text-blue-600 bg-white dark:bg-slate-955 border-slate-300 dark:border-slate-800 focus:ring-0" />
                                                    Chuveiros
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Submit & Cancel */}
                            <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-850">
                                <button type="button" onClick={() => setShowFormModal(false)} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold rounded-lg uppercase tracking-wider transition-colors">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg uppercase tracking-wider transition-colors">Salvar Recurso</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* REQUEST MODAL (COMPDEC) */}
            {showRequestModal && selectedRecursoForRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
                        <div className="bg-slate-100 dark:bg-slate-955 p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center text-slate-900 dark:text-white">
                            <h3 className="text-sm font-black uppercase tracking-wider">Requisitar Recurso Operacional</h3>
                            <button onClick={() => setShowRequestModal(false)} className="text-slate-550 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white text-lg font-bold">&times;</button>
                        </div>
                        <form onSubmit={handleSubmitRequest} className="p-6 space-y-4 text-xs text-slate-700 dark:text-slate-300">
                            <div>
                                <label className="block text-slate-650 dark:text-slate-400 font-bold uppercase mb-1">Recurso</label>
                                <div className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850 rounded font-bold text-slate-900 dark:text-white uppercase">
                                    {selectedRecursoForRequest.nome} ({selectedRecursoForRequest.secretaria_id})
                                </div>
                            </div>

                            {(selectedRecursoForRequest.categoria === 'ESTOQUE' || selectedRecursoForRequest.categoria === 'EQUIPAMENTO' || selectedRecursoForRequest.categoria === 'PROFISSIONAL') && (
                                <div>
                                    <label className="block text-slate-650 dark:text-slate-400 font-bold uppercase mb-1">Quantidade Solicitada</label>
                                    <input 
                                        type="number" 
                                        min="1" 
                                        max={getMaxQuantity(selectedRecursoForRequest)}
                                        value={requestQuantidade}
                                        onChange={(e) => setRequestQuantidade(parseInt(e.target.value) || 1)}
                                        className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded text-slate-900 dark:text-white focus:outline-none"
                                    />
                                    <p className="text-[10px] text-slate-500 mt-1">Saldo Disponível (já descontado aprovações): {getMaxQuantity(selectedRecursoForRequest)}</p>
                                </div>
                            )}

                            <div>
                                                  <select 
                                    value={requestEventId} 
                                    onChange={(e) => setRequestEventId(e.target.value)}
                                    required
                                    className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded text-slate-900 dark:text-white focus:outline-none"
                                >
                                    <option value="">Selecione um evento...</option>
                                    {activeEvents.map(ev => (
                                        <option key={ev.id} value={ev.id}>{ev.nome_evento}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-slate-650 dark:text-slate-400 font-bold uppercase mb-1">Justificativa da Requisição</label>
                                <textarea 
                                    value={requestJustification} 
                                    onChange={(e) => setRequestJustification(e.target.value)}
                                    required
                                    placeholder="Ex: Necessário para evacuação preventiva de moradores do bairro Pomar."
                                    className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded text-slate-900 dark:text-white focus:outline-none h-24 resize-none"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-850">
                                <button type="button" onClick={() => setShowRequestModal(false)} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold rounded-lg uppercase tracking-wider transition-colors">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg uppercase tracking-wider transition-colors">Enviar Solicitação</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* AUDIT LOG MODAL */}
            {showLogModal && editingRecurso && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
                        <div className="bg-slate-100 dark:bg-slate-955 p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center text-slate-900 dark:text-white">
                            <h3 className="text-sm font-black uppercase tracking-wider">Histórico de Alterações</h3>
                            <button onClick={() => setShowLogModal(false)} className="text-slate-550 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white text-lg font-bold">&times;</button>
                        </div>
                        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs text-slate-750 dark:text-slate-300">
                            <div className="pb-3 border-b border-slate-200 dark:border-slate-800">
                                <h4 className="font-bold text-slate-900 dark:text-white uppercase text-sm">{editingRecurso.nome}</h4>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">Categoria: {editingRecurso.categoria} | Secretaria: {editingRecurso.secretaria_id}</span>
                            </div>
                            {logs.length === 0 ? (
                                <p className="text-slate-500 dark:text-slate-450 py-6 text-center italic">Nenhum log de alteração registrado.</p>
                            ) : (
                                <div className="space-y-4 relative border-l-2 border-slate-200 dark:border-slate-800 pl-4 ml-2">
                                    {logs.map((log) => (
                                        <div key={log.id} className="relative">
                                            <div className="absolute -left-[23px] top-0.5 bg-white dark:bg-slate-900 p-0.5 border border-slate-200 dark:border-slate-800 rounded-full">
                                                <div className="w-2.5 h-2.5 bg-blue-550 rounded-full"></div>
                                            </div>
                                            <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850 rounded-lg p-3">
                                                <div className="flex justify-between font-bold text-slate-650 dark:text-slate-350">
                                                    <span className="uppercase text-[10px] tracking-wider text-blue-600 dark:text-blue-400">{log.acao}</span>
                                                    <span>{new Date(log.criado_em).toLocaleString()}</span>
                                                </div>
                                                {log.dados_novos?.status && (
                                                    <p className="mt-2 text-slate-700 dark:text-slate-300">
                                                        Status alterado para: <strong className="text-slate-900 dark:text-white uppercase">{log.dados_novos.status}</strong>
                                                    </p>
                                                )}
                                                {log.dados_novos?.nome && log.dados_anteriores?.nome && log.dados_novos.nome !== log.dados_anteriores.nome && (
                                                    <p className="mt-1 text-slate-700 dark:text-slate-300">
                                                        Nome editado de "{log.dados_anteriores.nome}" para "{log.dados_novos.nome}"
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="p-4 bg-slate-100 dark:bg-slate-955 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                            <button onClick={() => setShowLogModal(false)} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-850 dark:text-white font-bold rounded-lg uppercase tracking-wider text-[10px]">Fechar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* CSV IMPORT MODAL */}
            {showImportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="bg-slate-100 dark:bg-slate-955 p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center text-slate-900 dark:text-white">
                            <h3 className="text-sm font-black uppercase tracking-wider">Importar Recursos via CSV</h3>
                            <button onClick={() => setShowImportModal(false)} className="text-slate-550 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white text-lg font-bold">&times;</button>
                        </div>
                        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs text-slate-750 dark:text-slate-300">
                            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 rounded-lg space-y-2">
                                <h4 className="font-bold text-blue-800 dark:text-blue-400 uppercase">Instruções para Importação</h4>
                                <p className="leading-relaxed">
                                    O arquivo CSV deve conter um cabeçalho e utilizar vírgula (,) ou ponto e vírgula (;) como separador. 
                                    Se você não for da COMPDEC, os recursos serão vinculados automaticamente à sua secretaria.
                                </p>
                                <p className="font-bold text-slate-800 dark:text-slate-250">Campos suportados:</p>
                                <ul className="list-disc pl-4 space-y-1">
                                    <li><strong>nome</strong> (obrigatório)</li>
                                    <li><strong>categoria</strong> (opcional: VEICULO, EQUIPAMENTO, ESTOQUE, PROFISSIONAL, INSTALACAO)</li>
                                    <li><strong>status</strong> (opcional: DISPONIVEL, EM_MANUTENCAO, EM_USO, OCUPADO)</li>
                                    <li><strong>secretaria</strong> (opcional: Nome da secretaria)</li>
                                    <li><strong>tipo, placa, patrimonio, capacidade, estado, guarda, item, unidade, quantidade, validade, local, funcao, turno, contato, lat, lng, endereco</strong> (detalhes específicos de cada categoria)</li>
                                </ul>
                            </div>

                            <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-xl p-8 bg-slate-50 dark:bg-slate-950/40 transition-colors">
                                <Upload className="h-10 w-10 text-slate-450 dark:text-slate-500 mb-3" />
                                <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg uppercase tracking-wider text-[10px] shadow transition-colors">
                                    Selecionar Arquivo CSV
                                    <input type="file" accept=".csv" onChange={handleCsvUpload} className="hidden" />
                                </label>
                                {csvFile && (
                                    <span className="mt-2 text-slate-800 dark:text-slate-200 font-semibold">{csvFile.name}</span>
                                )}
                            </div>

                            {importError && (
                                <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 rounded-lg text-red-700 dark:text-red-400 font-semibold text-center">
                                    {importError}
                                </div>
                            )}

                            {csvPreview.length > 0 && (
                                <div className="space-y-3">
                                    <h4 className="font-bold text-slate-900 dark:text-white uppercase">Pré-visualização dos Dados ({csvPreview.length} registros)</h4>
                                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-slate-100 dark:bg-slate-955 text-slate-700 dark:text-slate-300 font-bold uppercase border-b border-slate-200 dark:border-slate-800 text-[10px]">
                                                    <th className="p-3">Nome</th>
                                                    <th className="p-3">Categoria</th>
                                                    <th className="p-3">Secretaria</th>
                                                    <th className="p-3">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                                                {csvPreview.map((item, idx) => (
                                                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 text-slate-800 dark:text-slate-350">
                                                        <td className="p-3 font-semibold text-slate-900 dark:text-white">{item.nome}</td>
                                                        <td className="p-3 uppercase text-blue-600 dark:text-blue-400">{item.categoria}</td>
                                                        <td className="p-3">{item.secretaria_id}</td>
                                                        <td className="p-3 uppercase">{item.status}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="p-4 bg-slate-100 dark:bg-slate-955 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                            <button onClick={() => setShowImportModal(false)} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold rounded-lg uppercase tracking-wider text-[10px] transition-colors">Cancelar</button>
                            <button 
                                onClick={handleConfirmImport} 
                                disabled={csvPreview.length === 0 || importing}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-lg uppercase tracking-wider text-[10px] flex items-center gap-2 shadow transition-all"
                            >
                                {importing ? 'Importando...' : 'Confirmar Importação'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
