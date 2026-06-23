import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserContext } from '../../App';
import { supabase } from '../../services/supabase';
import { 
    ArrowLeft, ShieldAlert, Save, MapPin, Camera, User, 
    FileText, Calendar, AlertTriangle, CheckCircle, ChevronDown
} from 'lucide-react';
import SignaturePad from '../../components/SignaturePad';
import ConfirmModal from '../../components/ConfirmModal';

const getSourceData = async (origem, origemId) => {
    try {
        if (origem === 'vistoria') {
            // First check if getVistoriaFull works locally
            let vistoria = null;
            try {
                const { getVistoriaFull } = await import('../../services/db');
                vistoria = await getVistoriaFull(origemId);
            } catch (err) { }
            
            if (vistoria) return vistoria;

            // Otherwise, fetch direct from Supabase
            const { data } = await supabase.from('vistorias').select('*').or(`id.eq.${origemId},vistoria_id.eq.${origemId}`).single();
            return data;
        } else {
            // Fetch ocorrencia from Supabase
            const { data } = await supabase.from('ocorrencias_operacionais').select('*').or(`id.eq.${origemId},ocorrencia_id.eq.${origemId},ocorrencia_id_format.eq.${origemId}`).single();
            return data;
        }
    } catch (e) {
        console.error('Erro ao buscar dados da origem:', e);
        return null;
    }
};

const RISK_TYPES = [
    'Geológico', 'Hidrológico', 'Estrutural', 'Incêndio', 
    'Tecnológico', 'Ambiental', 'Saúde Pública', 'Outro'
];

const INTELLIGENT_CHECKLIST = {
    'Geológico': [
        'Executar drenagem superficial e captação de águas pluviais',
        'Implantar contenção de talude/encosta',
        'Contratar avaliação geotécnica complementar especializada',
        'Monitoramento diário de trincas e infiltrações'
    ],
    'Hidrológico': [
        'Desobstrução do sistema de drenagem local',
        'Elevação de móveis e eletrodomésticos preventivamente',
        'Evacuação em caso de alerta de chuvas intensas emitido pela COMPDEC',
        'Limpeza de calhas e telhados'
    ],
    'Estrutural': [
        'Contratar laudo estrutural de profissional habilitado (ART/RRT)',
        'Executar escoramento emergencial',
        'Isolamento parcial da área afetada',
        'Reparo em rachaduras com indício de evolução'
    ],
    'Incêndio': [
        'Revisão do sistema elétrico',
        'Desobstrução de rotas de fuga',
        'Isolamento de materiais inflamáveis'
    ]
};

const NoprerForm = () => {
    const { origem, origemId, id } = useParams();
    const navigate = useNavigate();
    const { userProfile } = useContext(UserContext);
    
    const [loading, setLoading] = useState(true);
    const [sourceData, setSourceData] = useState(null);
    const [existingNoprer, setExistingNoprer] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        tipo_risco: '',
        descricao: '',
        medidas_mitigatorias: [],
        prazo_dias: 30,
        observacoes_assinatura: ''
    });

    // Signature State
    const [signatureMode, setSignatureMode] = useState(null); // 'digital', 'recusa', null
    const [signatureData, setSignatureData] = useState(null);
    const [testemunhas, setTestemunhas] = useState({ t1: '', doc1: '', t2: '', doc2: '' });
    
    useEffect(() => {
        const loadData = async () => {
            if (id) {
                // Modo Edição
                const { data, error } = await supabase.from('noprer').select('*').eq('id', id).single();
                if (data) {
                    setExistingNoprer(data);
                    setFormData({
                        tipo_risco: data.tipo_risco || '',
                        descricao: data.descricao || '',
                        medidas_mitigatorias: data.medidas_mitigatorias || [],
                        prazo_dias: data.prazo_dias || 30
                    });
                    setSourceData({ 
                        endereco: data.endereco, 
                        solicitante: data.solicitante, 
                        nivel_risco: data.risco, 
                        vistoria_id: data.origem_id 
                    });
                    if (data.recusou_assinatura) {
                        setSignatureMode('recusa');
                        setTestemunhas(data.testemunhas || { t1: '', doc1: '', t2: '', doc2: '' });
                    } else if (data.assinatura) {
                        setSignatureMode('digital');
                        setSignatureData(data.assinatura);
                    }
                }
            } else {
                // Modo Criação
                const data = await getSourceData(origem, decodeURIComponent(origemId));
                if (data) {
                    setSourceData(data);
                    
                    const nivel = origem === 'vistoria' ? (data.nivelRisco || data.nivel_risco) : data.nivel_risco;
                    let presumedType = '';
                    if (data.categoriaRisco?.toLowerCase().includes('chuva') || data.categoria_risco?.toLowerCase().includes('chuva')) presumedType = 'Hidrológico';
                    else if (data.categoriaRisco?.toLowerCase().includes('deslizamento') || data.categoria_risco?.toLowerCase().includes('deslizamento')) presumedType = 'Geológico';
                    
                    setFormData(prev => ({
                        ...prev,
                        tipo_risco: presumedType || '',
                        descricao: `Risco ${nivel} identificado durante ${origem}. É necessário monitoramento e ações preventivas.`
                    }));
                }
            }
            setLoading(false);
        };
        loadData();
    }, [origem, origemId, id]);

    const handleChecklistToggle = (item) => {
        setFormData(prev => ({
            ...prev,
            medidas_mitigatorias: prev.medidas_mitigatorias.includes(item)
                ? prev.medidas_mitigatorias.filter(i => i !== item)
                : [...prev.medidas_mitigatorias, item]
        }));
    };

    const generateNextNumber = async () => {
        const year = new Date().getFullYear();
        const { data } = await supabase
            .from('noprer')
            .select('numero_noprer')
            .like('numero_noprer', `%/${year}`)
            .order('numero_noprer', { ascending: false })
            .limit(1);
            
        if (data && data.length > 0 && data[0].numero_noprer) {
            const parts = data[0].numero_noprer.split('/');
            if (parts.length > 1) {
                const lastNum = parseInt(parts[0], 10);
                if (!isNaN(lastNum)) {
                    return `${(lastNum + 1).toString().padStart(4, '0')}/${year}`;
                }
            }
        }
        return `0001/${year}`;
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const data_limite = new Date();
            data_limite.setDate(data_limite.getDate() + formData.prazo_dias);

            if (id && existingNoprer) {
                // Update
                const noprerObj = {
                    tipo_risco: formData.tipo_risco,
                    descricao: formData.descricao,
                    medidas_mitigatorias: formData.medidas_mitigatorias,
                    prazo_dias: formData.prazo_dias,
                    data_limite: data_limite.toISOString(),
                    status: signatureMode ? (signatureMode === 'recusa' ? 'EMITIDA' : 'NOTIFICADO') : existingNoprer.status,
                    assinatura: signatureData,
                    testemunhas: signatureMode === 'recusa' ? testemunhas : null,
                    recusou_assinatura: signatureMode === 'recusa'
                };
                const { error } = await supabase.from('noprer').update(noprerObj).eq('id', id);
                if (error) {
                    console.error("Supabase Update Error:", error);
                    alert(`Falha ao atualizar a NOPRER: ${error.message}`);
                    throw error;
                }
            } else {
                // Insert
                const data_emissao = new Date().toISOString();
                const numeroNoprer = await generateNextNumber();
                
                const noprerObj = {
                    numero_noprer: numeroNoprer,
                    origem_tipo: origem,
                    origem_id: sourceData.vistoria_id || sourceData.ocorrencia_id_format || sourceData.ocorrencia_id || origemId,
                    data_emissao: data_emissao,
                    risco: origem === 'vistoria' ? (sourceData.nivelRisco || sourceData.nivel_risco) : sourceData.nivel_risco,
                    tipo_risco: formData.tipo_risco,
                    descricao: formData.descricao,
                    medidas_mitigatorias: formData.medidas_mitigatorias,
                    prazo_dias: formData.prazo_dias,
                    data_limite: data_limite.toISOString(),
                    status: signatureMode === 'recusa' ? 'EMITIDA' : 'NOTIFICADO',
                    endereco: sourceData.endereco,
                    solicitante: sourceData.solicitante || sourceData.solicitante_nome,
                    coordenadas: sourceData.coordenadas || (sourceData.latitude ? { lat: sourceData.latitude, lng: sourceData.longitude } : null),
                    criado_por: userProfile?.full_name || 'Agente',
                    assinatura: signatureData,
                    testemunhas: signatureMode === 'recusa' ? testemunhas : null,
                    recusou_assinatura: signatureMode === 'recusa'
                };

                const { error } = await supabase.from('noprer').insert([noprerObj]);
                if (error) {
                    console.error("Supabase Insert Error:", error);
                    alert(`Falha ao inserir a NOPRER: ${error.message}`);
                    throw error;
                }
            }

            navigate('/noprer');
        } catch (e) {
            console.error('Erro global ao salvar NOPRER:', e);
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center">Carregando dados...</div>;
    }

    if (!sourceData && !id) {
        return <div className="p-8 text-center text-red-500">Erro: Registro de origem não encontrado.</div>;
    }

    return (
        <div className="bg-[#f0f4f8] dark:bg-slate-900 min-h-screen pb-32">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 sticky top-0 z-20 shadow-sm">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                            <ArrowLeft size={24} className="text-slate-600 dark:text-slate-300" />
                        </button>
                        <div>
                            <h1 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                                <ShieldAlert className="text-blue-600" /> 
                                {id ? 'Editar NOPRER' : 'Emitir NOPRER'}
                            </h1>
                            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">
                                {id ? `NOPRER ${existingNoprer?.numero_noprer}` : `Origem: ${origem?.toUpperCase() || ''} #${sourceData.vistoria_id || sourceData.ocorrencia_id || origemId || ''}`}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={handleSave}
                        disabled={isSaving || !formData.tipo_risco}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-sm font-bold flex items-center gap-2 shadow-sm shadow-blue-600/20 disabled:opacity-50 transition-all"
                    >
                        <Save size={18} />
                        {isSaving ? 'Emitindo...' : 'Finalizar Emissão'}
                    </button>
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
                
                {/* Info Card */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-sm p-5 flex flex-col md:flex-row gap-4 justify-between items-start">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Responsável Notificado</p>
                        <p className="font-bold text-slate-800 dark:text-slate-200">{sourceData.solicitante || 'Não identificado'}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Localização</p>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                             {sourceData.endereco || 'Sem endereço'}
                        </p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Risco Avaliado</p>
                        <p className="font-black text-orange-600">{origem === 'vistoria' ? sourceData.nivelRisco : sourceData.nivel_risco}</p>
                    </div>
                </div>

                {/* Form Sections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-6">
                        
                        {/* Tipo de Risco */}
                        <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden p-0">
                            <h3 className="bg-[#1e3a5f] text-white p-2 font-bold uppercase text-xs mb-4">
                                
                                1. Classificação do Risco
                            </h3>
                            
                            <div className="grid grid-cols-2 gap-2 mb-4">
                                {RISK_TYPES.map(rt => (
                                    <button
                                        key={rt}
                                        onClick={() => setFormData(p => ({ ...p, tipo_risco: rt }))}
                                        className={`p-2.5 rounded-sm border text-xs font-bold transition-all ${
                                            formData.tipo_risco === rt 
                                            ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' 
                                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-900/50 dark:border-slate-700 dark:text-slate-400'
                                        }`}
                                    >
                                        {rt}
                                    </button>
                                ))}
                            </div>

                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 block">Descrição Técnica (O que foi constatado?)</label>
                            <textarea
                                value={formData.descricao}
                                onChange={(e) => setFormData(p => ({ ...p, descricao: e.target.value }))}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                                rows={4}
                            />
                        </div>

                        {/* Prazos */}
                        <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden p-0">
                            <h3 className="bg-[#1e3a5f] text-white p-2 font-bold uppercase text-xs mb-4">
                                
                                3. Prazos e Monitoramento
                            </h3>
                            
                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 block">Prazo (Dias)</label>
                                    <input
                                        type="number"
                                        value={formData.prazo_dias}
                                        onChange={(e) => setFormData(p => ({ ...p, prazo_dias: parseInt(e.target.value) || 0 }))}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm p-3 text-lg font-black focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                                    />
                                </div>
                                <div className="flex-[2] bg-blue-50 dark:bg-blue-900/20 rounded-sm p-3 border border-blue-100 dark:border-blue-800">
                                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-wider">Aviso de Revistoria</p>
                                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                                        Uma Ordem de Serviço para Revistoria será agendada automaticamente para +3 dias após o vencimento.
                                    </p>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        
                        {/* Checklist Inteligente */}
                        <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden p-0">
                            <h3 className="bg-[#1e3a5f] text-white p-2 font-bold uppercase text-xs mb-4">
                                
                                2. Medidas Mitigatórias
                            </h3>
                            
                            {!formData.tipo_risco ? (
                                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 text-orange-600 text-sm font-medium rounded-sm border border-orange-100 dark:border-orange-800 text-center">
                                    Selecione um Tipo de Risco primeiro para ver as sugestões.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                                        Sugestões para risco {formData.tipo_risco}:
                                    </p>
                                    {(INTELLIGENT_CHECKLIST[formData.tipo_risco] || []).map((medida, idx) => {
                                        const isChecked = formData.medidas_mitigatorias.includes(medida);
                                        return (
                                            <div 
                                                key={idx}
                                                onClick={() => handleChecklistToggle(medida)}
                                                className={`p-3 rounded-sm border flex items-start gap-3 cursor-pointer transition-all ${
                                                    isChecked 
                                                    ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800/50' 
                                                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100 dark:bg-slate-900/50 dark:border-slate-700'
                                                }`}
                                            >
                                                <div className={`mt-0.5 shrink-0 w-5 h-5 rounded flex items-center justify-center border ${isChecked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                                                    {isChecked && <span>✓</span>}
                                                </div>
                                                <span className={`text-sm font-medium ${isChecked ? 'text-emerald-900 dark:text-emerald-300' : 'text-slate-600 dark:text-slate-300'}`}>
                                                    {medida}
                                                </span>
                                            </div>
                                        )
                                    })}

                                    {/* Custom option could go here */}
                                </div>
                            )}
                        </div>

                        {/* Assinatura */}
                        <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden p-0">
                            <h3 className="bg-[#1e3a5f] text-white p-2 font-bold uppercase text-xs mb-4">
                                
                                4. Ciência e Assinatura
                            </h3>

                            {!signatureMode ? (
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setSignatureMode('digital')}
                                        className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 p-3 rounded-sm text-sm font-bold border border-indigo-200 transition-colors"
                                    >
                                        Assinatura em Tela
                                    </button>
                                    <button 
                                        onClick={() => setSignatureMode('recusa')}
                                        className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 p-3 rounded-sm text-sm font-bold border border-red-200 transition-colors"
                                    >
                                        Recusou Assinar
                                    </button>
                                </div>
                            ) : signatureMode === 'digital' ? (
                                <div className="space-y-4 animate-in fade-in">
                                    <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded-sm border border-slate-200 dark:border-slate-700">
                                        <SignaturePad onSave={(sig) => setSignatureData(sig)} />
                                    </div>
                                    <button 
                                        onClick={() => { setSignatureMode(null); setSignatureData(null); }}
                                        className="text-xs text-red-500 font-bold uppercase hover:underline"
                                    >
                                        Cancelar / Alterar Método
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4 animate-in fade-in bg-red-50 dark:bg-red-900/10 p-4 rounded-sm border border-red-100 dark:border-red-900/50">
                                    <p className="text-sm font-bold text-red-700 dark:text-red-400">Notificado recusou assinar.</p>
                                    <p className="text-xs text-red-600 dark:text-red-300">Necessário qualificação de duas testemunhas.</p>
                                    
                                    <div className="grid grid-cols-2 gap-3 mt-4">
                                        <div>
                                            <input type="text" placeholder="Nome Testemunha 1" value={testemunhas.t1} onChange={e => setTestemunhas(p => ({...p, t1: e.target.value}))} className="w-full text-xs p-2 rounded border outline-none" />
                                            <input type="text" placeholder="CPF/RG" value={testemunhas.doc1} onChange={e => setTestemunhas(p => ({...p, doc1: e.target.value}))} className="w-full text-xs p-2 rounded border outline-none mt-1" />
                                        </div>
                                        <div>
                                            <input type="text" placeholder="Nome Testemunha 2" value={testemunhas.t2} onChange={e => setTestemunhas(p => ({...p, t2: e.target.value}))} className="w-full text-xs p-2 rounded border outline-none" />
                                            <input type="text" placeholder="CPF/RG" value={testemunhas.doc2} onChange={e => setTestemunhas(p => ({...p, doc2: e.target.value}))} className="w-full text-xs p-2 rounded border outline-none mt-1" />
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => { setSignatureMode(null); setTestemunhas({t1:'', doc1:'', t2:'', doc2:''}); }}
                                        className="text-xs text-slate-500 font-bold uppercase hover:underline mt-2 block"
                                    >
                                        Cancelar Recusa
                                    </button>
                                </div>
                            )}
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
};

export default NoprerForm;
