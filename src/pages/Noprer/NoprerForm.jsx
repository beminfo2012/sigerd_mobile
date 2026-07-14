import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { UserContext } from '../../App';
import { supabase } from '../../services/supabase';
import { useNoprer } from './hooks/useNoprer';
import { usePrazo } from './hooks/usePrazo';
import { RISK_TYPES } from './data/riskTypes';
import { GRAUS } from './data/graus';
import SignaturePad from '../../components/SignaturePad';
import { 
    ChevronRight, ChevronLeft, MapPin, Search, 
    Camera, AlertTriangle, Info, Save, CheckCircle, X, Plus, Check, ShieldAlert
} from 'lucide-react';
import toast from 'react-hot-toast';

const STEPS = [
    { id: 1, label: 'Responsável' },
    { id: 2, label: 'Risco' },
    { id: 3, label: 'Evidências' },
    { id: 4, label: 'Prazo' },
    { id: 5, label: 'Assinatura' }
];

const NoprerForm = () => {
    const navigate = useNavigate();
    const userProfile = useContext(UserContext);
    const { fetchNoprerById, atualizarNoprer, criarNoprer, salvarNoprerRascunho, fetchRascunhoById, deletarRascunho } = useNoprer();
    const [salvando, setSalvando] = useState(false);
    const { calcularDatasFormulario } = usePrazo();

    const applyCpfCnpjMask = (value) => {
        let v = value.replace(/\D/g, "");
        if (v.length <= 11) {
            v = v.replace(/(\d{3})(\d)/, "$1.$2");
            v = v.replace(/(\d{3})(\d)/, "$1.$2");
            v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
        } else {
            v = v.replace(/^(\d{2})(\d)/, "$1.$2");
            v = v.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
            v = v.replace(/\.(\d{3})(\d)/, ".$1/$2");
            v = v.replace(/(\d{4})(\d)/, "$1-$2");
        }
        return v.substring(0, 18);
    };

    const applyPhoneMask = (value) => {
        let v = value.replace(/\D/g, "");
        v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
        v = v.replace(/(\d)(\d{4})$/, "$1-$2");
        return v.substring(0, 15);
    };

    const [searchParams] = useSearchParams();
    const draftId = searchParams.get('draftId');
    const { id } = useParams();

    const [step, setStep] = useState(1);
    
    // Busca de Origens (Vistorias/Ocorrências)
    const [modalVistoriaOpen, setModalVistoriaOpen] = useState(false);
    const [buscaOrigem, setBuscaOrigem] = useState('');
    const [origensEncontradas, setOrigensEncontradas] = useState([]);
    const [buscandoOrigens, setBuscandoOrigens] = useState(false);

    useEffect(() => {
        if (!modalVistoriaOpen) return;
        
        // Debounce para Live Search
        const timer = setTimeout(() => {
            handleBuscarOrigens();
        }, 500);
        
        return () => clearTimeout(timer);
    }, [buscaOrigem, modalVistoriaOpen]);
    
    // Modal de Assinatura
    const [sigModal, setSigModal] = useState(null); // null, 'notificado', 'agente', 'test1', 'test2'

    // Carregar Rascunho ou Documento Existente
    useEffect(() => {
        const carregarDB = async () => {
            if (id) {
                const doc = await fetchNoprerById(id);
                if (doc) {
                    setFormData(prev => ({ 
                        ...prev, 
                        ...doc, 
                        vistoria_numero: doc.vistoria?.numero || doc.vistoria?.vistoria_id || doc.vistoria_id || '',
                        termo_lido: true 
                    }));
                    setStep(1); // Pode iniciar no 1 ou no último, vamos colocar no 1
                }
            } else if (draftId) {
                const draft = await fetchRascunhoById(draftId);
                if (draft) {
                    setFormData(draft.form_data);
                    setStep(draft.step || 1);
                }
            }
        };
        carregarDB();
    }, [draftId, id, fetchNoprerById, fetchRascunhoById]);

    // Estado do Formulário
    const [formData, setFormData] = useState({
        vistoria_id: null,
        vistoria_numero: '',
        
        // Etapa 1
        nome_notificado: '',
        cpf_notificado: '',
        contato: '',
        condicao: '',
        endereco: '',
        inscricao_imob: '',
        coordenadas: '',
        
        // Etapa 2
        tipo_risco: '',
        sub_tipo: '',
        grau_risco: '',
        descricao_risco: '',
        
        // Etapa 3
        fotos: [],
        observacoes: '',
        
        // Etapa 4
        prazo_dias: 30,
        medidas: [],
        medida_customizada: '',
        nome_agente: userProfile?.full_name || '',
        matricula_agente: userProfile?.matricula || '',
        
        // Etapa 5
        termo_lido: false,
        modo_assinatura: 'digital',
        sign_notificado: null,
        sign_agente: null,
        test1_nome: '',
        test1_cpf: '',
        sign_test1: null,
        test2_nome: '',
        test2_cpf: '',
        sign_test2: null,
    });

    // Calcula datas do prazo dinamicamente
    const datas = calcularDatasFormulario(formData.prazo_dias);

    // Validações por etapa
    const isStepValid = () => {
        if (step === 1) return formData.nome_notificado && formData.cpf_notificado && formData.condicao && formData.endereco;
        if (step === 2) return formData.tipo_risco && formData.grau_risco && formData.descricao_risco.length >= 20;
        if (step === 3) return true; // Fotos não são estritamente obrigatórias no schema
        if (step === 4) return formData.medidas.length > 0;
        if (step === 5) {
            if (!formData.termo_lido || !formData.sign_agente) return false;
            if (formData.modo_assinatura === 'digital') return !!formData.sign_notificado;
            if (formData.modo_assinatura === 'recusa') {
                return formData.test1_nome && formData.test1_cpf && formData.sign_test1 && formData.test2_nome && formData.test2_cpf && formData.sign_test2;
            }
            if (formData.modo_assinatura === 'impresso') return true;
        }
        return true;
    };

    const handleBuscarOrigens = async () => {
        setBuscandoOrigens(true);
        let resultados = [];
        try {
            // Busca Vistorias
            let qVist = supabase.from('vistorias').select('id, vistoria_id, endereco, solicitante, nivel_risco, created_at, categoria_risco, subtipos_risco, informacoes_complementares, coordenadas, latitude, longitude');
            if (buscaOrigem && buscaOrigem.length >= 3) {
                qVist = qVist.or(`vistoria_id.ilike.%${buscaOrigem}%,endereco.ilike.%${buscaOrigem}%,solicitante.ilike.%${buscaOrigem}%`).limit(10);
            } else {
                qVist = qVist.order('created_at', { ascending: false }).limit(10);
            }
            const { data: vData } = await qVist;
            if (vData) {
                resultados = [...resultados, ...vData.map(v => ({...v, tipo: 'Vistoria', titulo_id: v.vistoria_id}))];
            }

            // Busca Ocorrências
            let qOcor = supabase.from('ocorrencias_operacionais').select('id, ocorrencia_id_format, ocorrencia_id, endereco, solicitante, nivel_risco, created_at');
            if (buscaOrigem && buscaOrigem.length >= 3) {
                qOcor = qOcor.or(`ocorrencia_id_format.ilike.%${buscaOrigem}%,endereco.ilike.%${buscaOrigem}%,solicitante.ilike.%${buscaOrigem}%`).limit(10);
            } else {
                qOcor = qOcor.order('created_at', { ascending: false }).limit(10);
            }
            const { data: oData } = await qOcor;
            if (oData) {
                resultados = [...resultados, ...oData.map(o => ({...o, tipo: 'Ocorrência', titulo_id: o.ocorrencia_id_format || o.ocorrencia_id}))];
            }

            // Ordena os resultados mistos por data
            resultados.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            setOrigensEncontradas(resultados);
        } catch (error) {
            console.error('Erro na busca de origens:', error);
        } finally {
            setBuscandoOrigens(false);
        }
    };

    const handleVincularVistoria = (v) => {
        let mappedGrau = formData.grau_risco;
        if (v.nivel_risco) {
            const nivel = v.nivel_risco.toLowerCase();
            if (nivel.includes('baixo')) mappedGrau = 'R1';
            else if (nivel.includes('médio') || nivel.includes('medio')) mappedGrau = 'R2';
            else if (nivel.includes('alto') && !nivel.includes('muito')) mappedGrau = 'R3';
            else if (nivel.includes('muito alto') || nivel.includes('iminente')) mappedGrau = 'R4';
        }

        let mappedCategoria = prev => prev.tipo_risco;
        if (v.categoria_risco) {
            if (v.categoria_risco.includes('Geológico')) mappedCategoria = 'Geológico';
            else if (v.categoria_risco.includes('Sanitário')) mappedCategoria = 'Saúde Pública';
            else mappedCategoria = v.categoria_risco;
        }

        let mappedCoordenadas = v.coordenadas;
        if (!mappedCoordenadas && v.latitude && v.longitude) {
            mappedCoordenadas = `${v.latitude}, ${v.longitude}`;
        }

        let firstSubtipo = '';
        if (v.subtipos_risco) {
            let arr = [];
            if (Array.isArray(v.subtipos_risco)) arr = v.subtipos_risco;
            else if (typeof v.subtipos_risco === 'string') {
                try {
                    const parsed = JSON.parse(v.subtipos_risco);
                    arr = Array.isArray(parsed) ? parsed : [v.subtipos_risco];
                } catch(e) {
                    arr = [v.subtipos_risco];
                }
            }
            if (arr.length > 0) firstSubtipo = arr[0];
        }

        setFormData(prev => ({
            ...prev,
            vistoria_id: v.id,
            vistoria_numero: v.titulo_id,
            endereco: v.endereco || prev.endereco,
            nome_notificado: v.solicitante || prev.nome_notificado,
            grau_risco: mappedGrau,
            tipo_risco: mappedCategoria === (p => p.tipo_risco) ? prev.tipo_risco : mappedCategoria,
            sub_tipo: firstSubtipo || prev.sub_tipo,
            descricao_risco: v.informacoes_complementares || prev.descricao_risco,
            coordenadas: mappedCoordenadas || prev.coordenadas
        }));
        setOrigensEncontradas([]);
        setBuscaOrigem('');
        setModalVistoriaOpen(false);
    };

    const captureLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(pos => {
                setFormData(p => ({ ...p, coordenadas: `${pos.coords.latitude}, ${pos.coords.longitude}` }));
            }, err => toast.error('Erro ao capturar GPS. Verifique as permissões.'));
        }
    };

    const toggleMedida = (medida) => {
        setFormData(p => ({
            ...p,
            medidas: p.medidas.includes(medida) 
                ? p.medidas.filter(m => m !== medida)
                : [...p.medidas, medida]
        }));
    };

    const addCustomMedida = () => {
        if (formData.medida_customizada) {
            setFormData(p => ({
                ...p,
                medidas: [...p.medidas, p.medida_customizada],
                medida_customizada: ''
            }));
        }
    };

    const salvarRascunho = async () => {
        try {
            const savedDraft = await salvarNoprerRascunho(draftId, formData, step, userProfile?.nome || 'Agente');
            toast.success('Rascunho salvo com sucesso no banco de dados!');
            if (!draftId && savedDraft) {
                navigate(`/noprer/novo?draftId=${savedDraft.id}`, { replace: true });
            }
        } catch (err) {
            toast.error('Erro ao salvar rascunho. Tente novamente.');
        }
    };

    const handleSubmit = async () => {
        try {
            setSalvando(true);
            // Ajusta formatação antes de enviar
            const payload = { 
                ...formData,
                data_limite: datas.dataLimite.toISOString().split('T')[0],
                data_revistoria: datas.dataRevistoria.toISOString().split('T')[0]
            };
            delete payload.vistoria_numero; // não vai pro banco NOPRER
            delete payload.medida_customizada; 
            delete payload.observacoes; // mock, schema não tem observacoes puras na NOPRER, seria na revistoria_inicial
            delete payload.prazo_dias; // virtual
            delete payload.termo_lido; // virtual
            
            // Remove campos virtuais e calculados trazidos no modo edição
            delete payload.vistoria;
            delete payload.historico;
            delete payload.statusCalculado;
            delete payload.progresso;
            delete payload.diasRestantes;
            delete payload.isVencida;
            delete payload.dataEmissaoStr;
            delete payload.dataLimiteStr;
            delete payload.dataRevistoriaStr;

            let noprerCriada;
            if (id) {
                noprerCriada = await atualizarNoprer(id, payload);
                toast.success('NOPRER atualizada com sucesso!');
                navigate(`/noprer/detalhes/${id}`);
                return;
            } else {
                noprerCriada = await criarNoprer(payload);
            }
            
            // Limpa o rascunho após emitir com sucesso
            if (draftId) {
                await deletarRascunho(draftId);
            }
            
            navigate(`/noprer/sucesso?id=${noprerCriada.id}&numero=${noprerCriada.numero}`);
        } catch (err) {
            toast.error('Erro ao salvar NOPRER. Verifique a conexão.');
        } finally {
            setSalvando(false);
        }
    };

    // Renderização Condicional das Etapas
    return (
        <div className="bg-[#F1F5F9] min-h-screen font-[Inter,sans-serif] pb-32">
            {/* Header / Banner Sticky */}
            <div className="sticky top-0 z-20 bg-[#1F3B5C] text-white shadow-md">
                <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate('/noprer')} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                            <ChevronLeft size={24} />
                        </button>
                        <div>
                            <h1 className="font-black text-lg">{id ? 'Editar NOPRER' : 'Emitir NOPRER'}</h1>
                            <p className="text-[10px] text-blue-200 uppercase tracking-widest">Etapa {step} de 5</p>
                        </div>
                    </div>
                    {!id && (
                        <button 
                            onClick={salvarRascunho}
                            disabled={salvando}
                            className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded text-xs font-bold transition-colors flex items-center gap-2 border border-white/20"
                        >
                            <Save size={14} /> Rascunho
                        </button>
                    )}
                </div>
                
                {/* Progress Bar */}
                <div className="flex items-center px-6 pb-4 max-w-5xl mx-auto w-full">
                    {STEPS.map((s, idx) => (
                        <React.Fragment key={s.id}>
                            <div className="flex flex-col items-center gap-1 z-10 relative">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                                    step > s.id ? 'bg-[#86EFAC] text-[#166534]' : step === s.id ? 'bg-[#60A5FA] text-white ring-4 ring-[#60A5FA]/30' : 'bg-[#2E5C8A] text-white/50'
                                }`}>
                                    {step > s.id ? <CheckCircle size={14} /> : s.id}
                                </div>
                                <span className="text-[9px] absolute -bottom-4 whitespace-nowrap opacity-80">{s.label}</span>
                            </div>
                            {idx < STEPS.length - 1 && (
                                <div className={`flex-1 h-1 mx-1 rounded-full transition-colors ${step > s.id ? 'bg-[#86EFAC]' : 'bg-[#2E5C8A]'}`} />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* Banner de Contexto (Aparece se houver dados preenchidos) */}
            {(formData.nome_notificado || formData.grau_risco) && (
                <div className="bg-white px-4 py-2 border-b text-xs flex gap-4 overflow-x-auto whitespace-nowrap shadow-sm">
                    {formData.nome_notificado && <span className="font-bold text-slate-700">Notificado: <span className="font-normal">{formData.nome_notificado}</span></span>}
                    {formData.tipo_risco && <span className="font-bold text-slate-700">Risco: <span className="font-normal">{formData.tipo_risco}</span></span>}
                    {formData.grau_risco && <span className="font-bold text-slate-700">Grau: <span className="font-black text-orange-600">{formData.grau_risco}</span></span>}
                </div>
            )}

            <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6 mt-4">
                
                {/* ETAPA 1 */}
                {step === 1 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                        {/* Vínculo Vistoria */}
                        <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-sm">
                            <h3 className="text-sm font-black text-[#1F3B5C] mb-3 flex items-center gap-2">
                                <Search size={16} className="text-blue-500"/> Origem (Opcional)
                            </h3>
                            
                            {formData.vistoria_numero ? (
                                <div className="bg-[#F0FDF4] border border-[#86EFAC] p-3 rounded-lg flex justify-between items-center">
                                    <div>
                                        <p className="text-[10px] text-[#166534] font-bold uppercase">Vistoria Vinculada</p>
                                        <p className="text-sm font-black text-[#166534]">{formData.vistoria_numero}</p>
                                    </div>
                                    <button onClick={() => setFormData(p => ({...p, vistoria_id: null, vistoria_numero: ''}))} className="text-red-500 p-1 hover:bg-red-50 rounded">
                                        <X size={16} />
                                    </button>
                                </div>
                            ) : (
                                <button 
                                    onClick={() => setModalVistoriaOpen(true)}
                                    className="w-full flex items-center justify-between p-3 border border-slate-300 rounded-lg text-sm bg-slate-50 hover:bg-slate-100 transition-colors text-slate-600"
                                >
                                    <span>Clique para buscar e vincular uma vistoria...</span>
                                    <Search size={16} className="text-blue-500" />
                                </button>
                            )}
                        </div>

                        <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-sm space-y-4">
                            <h3 className="text-sm font-black text-[#1F3B5C] border-b pb-2">Dados do Responsável / Imóvel</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Nome Completo *</label>
                                    <input type="text" value={formData.nome_notificado} onChange={e => setFormData(p => ({...p, nome_notificado: e.target.value}))} className="w-full p-3 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">CPF / CNPJ *</label>
                                    <input type="text" value={formData.cpf_notificado} onChange={e => setFormData(p => ({...p, cpf_notificado: applyCpfCnpjMask(e.target.value)}))} placeholder="000.000.000-00" className="w-full p-3 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Telefone</label>
                                    <input type="text" value={formData.contato} onChange={e => setFormData(p => ({...p, contato: applyPhoneMask(e.target.value)}))} placeholder="(27) 99999-9999" className="w-full p-3 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Condição *</label>
                                    <select value={formData.condicao} onChange={e => setFormData(p => ({...p, condicao: e.target.value}))} className="w-full p-3 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white">
                                        <option value="">Selecione...</option>
                                        <option value="Proprietário(a)">Proprietário(a)</option>
                                        <option value="Inquilino(a)">Inquilino(a)</option>
                                        <option value="Possuidor(a)">Possuidor(a)</option>
                                        <option value="Representante legal">Representante legal</option>
                                        <option value="Responsável ausente">Responsável (ausente no ato)</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Endereço Completo *</label>
                                    <input type="text" value={formData.endereco} onChange={e => setFormData(p => ({...p, endereco: e.target.value}))} className="w-full p-3 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Inscrição Imobiliária</label>
                                    <input type="text" value={formData.inscricao_imob} onChange={e => setFormData(p => ({...p, inscricao_imob: e.target.value}))} className="w-full p-3 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1 flex items-center justify-between">
                                        Coordenadas GPS
                                        <button onClick={captureLocation} className="text-blue-600 flex items-center gap-1 hover:underline"><MapPin size={12}/> Capturar</button>
                                    </label>
                                    <input type="text" value={formData.coordenadas} onChange={e => setFormData(p => ({...p, coordenadas: e.target.value}))} placeholder="-20.000, -40.000" className="w-full p-3 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ETAPA 2 */}
                {step === 2 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                        <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-sm">
                            <h3 className="text-sm font-black text-[#1F3B5C] mb-4">Tipo de Risco</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                                {RISK_TYPES.map(rt => (
                                    <button 
                                        key={rt.id} 
                                        onClick={() => setFormData(p => ({...p, tipo_risco: rt.label, sub_tipo: ''}))}
                                        className={`p-3 rounded-lg border text-xs font-bold flex flex-col items-center gap-2 transition-all ${
                                            formData.tipo_risco === rt.label ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                        }`}
                                    >
                                        <span className="text-xl">{rt.ico}</span>
                                        {rt.label}
                                    </button>
                                ))}
                            </div>

                            {/* Subtipos */}
                            {formData.tipo_risco && (
                                <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Subtipo Específico</p>
                                    <div className="flex flex-wrap gap-2">
                                        {RISK_TYPES.find(r => r.label === formData.tipo_risco)?.subs.map(sub => (
                                            <button 
                                                key={sub}
                                                onClick={() => setFormData(p => ({...p, sub_tipo: sub}))}
                                                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                                                    formData.sub_tipo === sub ? 'bg-[#1F3B5C] text-white border-[#1F3B5C]' : 'bg-white border-slate-300 text-slate-600 hover:border-slate-400'
                                                }`}
                                            >
                                                {sub}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-sm">
                            <h3 className="text-sm font-black text-[#1F3B5C] mb-4">Grau de Risco</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                                {GRAUS.map(g => (
                                    <div 
                                        key={g.id}
                                        onClick={() => setFormData(p => ({...p, grau_risco: g.id}))}
                                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                            formData.grau_risco === g.id ? `${g.bgColor} ${g.borderColor} shadow-sm` : 'bg-white border-slate-200 hover:border-slate-300'
                                        }`}
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <span className={`font-black text-sm ${formData.grau_risco === g.id ? g.textColor : 'text-slate-700'}`}>{g.label}</span>
                                        </div>
                                        <p className="text-xs text-slate-600 leading-snug">{g.descricao}</p>
                                    </div>
                                ))}
                            </div>
                            
                            {formData.grau_risco === 'R4' && (
                                <div className="bg-red-50 border border-red-200 p-4 rounded-lg flex items-start gap-3 mt-4">
                                    <AlertTriangle className="text-red-600 shrink-0 mt-0.5" size={18} />
                                    <div>
                                        <p className="font-bold text-red-800 text-sm">Alerta de Risco Iminente</p>
                                        <p className="text-xs text-red-600 mt-1">
                                            Atenção: A NOPRER não possui força de interdição. Para riscos do tipo R4, avalie se a emissão de um Termo de Interdição não é o instrumento jurídico mais adequado.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-sm">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Descrição Técnica do Risco *</label>
                            <textarea 
                                value={formData.descricao_risco}
                                onChange={e => setFormData(p => ({...p, descricao_risco: e.target.value}))}
                                placeholder="Descreva detalhadamente as anomalias, evolução e o cenário encontrado..."
                                className="w-full p-4 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 h-32"
                            />
                            <p className="text-xs text-slate-400 text-right mt-1 font-mono">{formData.descricao_risco.length} chars (mín: 20)</p>
                        </div>
                    </div>
                )}

                {/* ETAPA 3 - Omitindo Lógica Pesada de Upload, simulando UI */}
                {step === 3 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                        <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-sm">
                            <h3 className="text-sm font-black text-[#1F3B5C] mb-4 flex items-center gap-2">
                                <Camera size={18} className="text-blue-500" /> Registro Fotográfico
                            </h3>
                            
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex gap-3 items-start mb-6">
                                <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
                                <p className="text-xs text-blue-800">Recomendado: mínimo 3 fotos (visão geral da fachada, detalhe do risco principal, e entorno/vizinhança).</p>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {/* Simulador de Fotos */}
                                {formData.fotos.map((foto, idx) => (
                                    <div key={idx} className="relative aspect-square bg-slate-200 rounded-lg overflow-hidden group">
                                        <img src={foto} alt={`Evidência ${idx}`} className="w-full h-full object-cover" />
                                        <button className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                                
                                {formData.fotos.length < 5 && (
                                    <button 
                                        onClick={() => alert("Upload não implementado no protótipo")}
                                        className="aspect-square bg-slate-50 border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-lg flex flex-col items-center justify-center text-slate-500 transition-colors"
                                    >
                                        <Plus size={24} className="mb-2" />
                                        <span className="text-xs font-bold">Adicionar Foto</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ETAPA 4 */}
                {step === 4 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                        
                        <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-sm flex flex-col md:flex-row gap-6">
                            <div className="flex-1">
                                <h3 className="text-sm font-black text-[#1F3B5C] mb-4">Prazo Concedido</h3>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {[15, 30, 45, 60, 90].map(d => (
                                        <button 
                                            key={d}
                                            onClick={() => setFormData(p => ({...p, prazo_dias: d}))}
                                            className={`px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${
                                                formData.prazo_dias === d ? 'bg-[#1F3B5C] text-white border-[#1F3B5C]' : 'bg-slate-50 border-slate-300 text-slate-600'
                                            }`}
                                        >
                                            {d} dias
                                        </button>
                                    ))}
                                </div>
                                <div className="mt-2 flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-500">Outro prazo:</span>
                                    <div className="flex items-center bg-white border border-slate-300 rounded-lg overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                                        <input 
                                            type="number" 
                                            min="1"
                                            placeholder="Ex: 20"
                                            value={![15, 30, 45, 60, 90].includes(formData.prazo_dias) ? formData.prazo_dias : ''}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value);
                                                if (!isNaN(val) && val > 0) setFormData(p => ({...p, prazo_dias: val}));
                                            }}
                                            className="w-20 p-2 text-sm outline-none text-center font-bold"
                                        />
                                        <span className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-2.5 border-l border-slate-300">dias</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex-1 bg-[#FFFBEB] p-4 rounded-xl border border-[#FCD34D]">
                                <p className="text-[10px] font-black text-[#92400E] uppercase tracking-widest mb-3">Cronograma Calculado</p>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center border-b border-amber-200/50 pb-2">
                                        <span className="text-xs text-amber-800">Data Limite:</span>
                                        <span className="text-sm font-black text-amber-900">{datas.dataLimite.toLocaleDateString('pt-BR')}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-amber-800">Agendar Revistoria:</span>
                                        <span className="text-sm font-black text-amber-900">{datas.dataRevistoria.toLocaleDateString('pt-BR')}</span>
                                    </div>
                                </div>
                                <p className="text-[9px] text-amber-700 mt-3">* O sistema gerará a OS de revistoria automaticamente no encerramento do prazo.</p>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-sm">
                            <h3 className="text-sm font-black text-[#1F3B5C] mb-4">Medidas Mitigatórias Sugeridas</h3>
                            <p className="text-xs text-slate-500 mb-4">Selecione as ações que o responsável deve obrigatoriamente executar dentro do prazo.</p>
                            
                            <div className="space-y-2 mb-4">
                                {(RISK_TYPES.find(r => r.label === formData.tipo_risco)?.medidas || []).map((m, idx) => {
                                    const isSelected = formData.medidas.includes(m);
                                    return (
                                        <div 
                                            key={idx} 
                                            onClick={() => toggleMedida(m)}
                                            className={`p-3 rounded-lg border cursor-pointer flex gap-3 items-start transition-colors ${
                                                isSelected ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                                            }`}
                                        >
                                            <div className={`w-5 h-5 shrink-0 rounded border flex items-center justify-center mt-0.5 ${
                                                isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-400 bg-white'
                                            }`}>
                                                {isSelected && <Check size={14} />}
                                            </div>
                                            <span className={`text-sm ${isSelected ? 'text-blue-900 font-medium' : 'text-slate-600'}`}>{m}</span>
                                        </div>
                                    );
                                })}

                                {/* Renderiza as Medidas Customizadas que foram adicionadas */}
                                {formData.medidas.filter(m => !(RISK_TYPES.find(r => r.label === formData.tipo_risco)?.medidas || []).includes(m)).map((customM, idx) => (
                                    <div 
                                        key={`custom-${idx}`} 
                                        className="p-3 rounded-lg border cursor-pointer flex gap-3 items-start transition-colors bg-indigo-50 border-indigo-200"
                                        onClick={() => toggleMedida(customM)}
                                    >
                                        <div className="w-5 h-5 shrink-0 rounded border flex items-center justify-center mt-0.5 bg-indigo-600 border-indigo-600 text-white">
                                            <Check size={14} />
                                        </div>
                                        <span className="text-sm text-indigo-900 font-medium flex-1">{customM}</span>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); toggleMedida(customM); }}
                                            className="text-indigo-400 hover:text-red-500 transition-colors"
                                            title="Remover medida customizada"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-2 mt-4">
                                <input 
                                    type="text" 
                                    placeholder="Outra medida específica não listada..."
                                    value={formData.medida_customizada}
                                    onChange={e => setFormData(p => ({...p, medida_customizada: e.target.value}))}
                                    onKeyUp={e => e.key === 'Enter' && addCustomMedida()}
                                    className="flex-1 p-3 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500" 
                                />
                                <button onClick={addCustomMedida} className="bg-slate-800 text-white px-4 rounded-lg text-sm font-bold">Incluir</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ETAPA 5 */}
                {step === 5 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                        
                        <div className="bg-[#FFFBEB] p-5 rounded-xl border border-[#FCD34D]">
                            <h3 className="text-sm font-black text-[#92400E] mb-2 uppercase tracking-widest flex items-center gap-2">
                                <ShieldAlert size={16} /> Termo Legal
                            </h3>
                            <p className="text-xs text-[#92400E] text-justify leading-relaxed mb-4">
                                Fica o responsável NOTIFICADO sobre o risco identificado, devendo adotar as medidas estipuladas no prazo máximo de <strong>{formData.prazo_dias} dias</strong>. Esta NOPRER <strong>NÃO</strong> constitui auto de interdição. A omissão das obrigações poderá acarretar responsabilidade civil, nos termos da Lei nº 12.608/2012 e legislação municipal vigente.
                            </p>
                            <label className="flex items-center gap-3 bg-white/60 p-3 rounded-lg border border-amber-200 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={formData.termo_lido}
                                    onChange={e => setFormData(p => ({...p, termo_lido: e.target.checked}))}
                                    className="w-5 h-5 rounded border-amber-400 text-amber-600 focus:ring-amber-500" 
                                />
                                <span className="text-sm font-bold text-amber-900">Confirmo que o termo acima foi LIDO ao notificado(a) presente.</span>
                            </label>
                        </div>

                        <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-sm">
                            <h3 className="text-sm font-black text-[#1F3B5C] mb-4">Assinatura do Notificado</h3>
                            
                            <div className="flex gap-2 mb-4 bg-slate-100 p-1 rounded-lg">
                                <button onClick={() => setFormData(p => ({...p, modo_assinatura: 'digital'}))} className={`flex-1 p-2 text-sm font-bold rounded-md transition-all ${formData.modo_assinatura === 'digital' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>✍️ Em Tela</button>
                                <button onClick={() => setFormData(p => ({...p, modo_assinatura: 'impresso'}))} className={`flex-1 p-2 text-sm font-bold rounded-md transition-all ${formData.modo_assinatura === 'impresso' ? 'bg-white shadow text-emerald-600' : 'text-slate-500'}`}>📄 Impresso</button>
                                <button onClick={() => setFormData(p => ({...p, modo_assinatura: 'recusa'}))} className={`flex-1 p-2 text-sm font-bold rounded-md transition-all ${formData.modo_assinatura === 'recusa' ? 'bg-white shadow text-red-600' : 'text-slate-500'}`}>✋ Recusou</button>
                            </div>

                            {formData.modo_assinatura === 'impresso' && (
                                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
                                    <p className="text-sm text-emerald-800 font-medium">Você optou por assinar o documento impresso.</p>
                                    <p className="text-xs text-emerald-600 mt-1">Após a emissão, você poderá digitalizar ou fotografar a folha assinada e fazer o upload no card desta NOPRER.</p>
                                </div>
                            )}

                            {formData.modo_assinatura === 'digital' && (
                                <div className="border border-slate-300 rounded-xl p-4 bg-slate-50 flex flex-col items-center">
                                    {formData.sign_notificado ? (
                                        <div className="relative border border-green-200 bg-white rounded-lg p-2">
                                            <img src={formData.sign_notificado} alt="Assinatura Notificado" className="h-20 object-contain" />
                                            <button onClick={() => setFormData(p => ({...p, sign_notificado: null}))} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><X size={12}/></button>
                                        </div>
                                    ) : (
                                        <button onClick={() => setSigModal('notificado')} className="bg-[#1F3B5C] text-white px-6 py-2 rounded-lg font-bold text-sm shadow hover:bg-blue-800">Assinar na Tela</button>
                                    )}
                                </div>
                            )}

                            {formData.modo_assinatura === 'recusa' && (
                                <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                                    <p className="text-xs text-red-800 font-bold mb-4">Necessário testemunho de duas pessoas para validade jurídica da NOPRER.</p>
                                    
                                    <div className="space-y-4">
                                        <div className="bg-white p-4 rounded-lg border border-red-100 flex flex-col gap-2">
                                            <p className="text-xs font-bold text-slate-500 uppercase mb-2">Testemunha 1</p>
                                            <input type="text" placeholder="Nome" value={formData.test1_nome} onChange={e => setFormData(p => ({...p, test1_nome: e.target.value}))} className="w-full p-2 text-sm border rounded outline-none" />
                                            <input type="text" placeholder="CPF" value={formData.test1_cpf} onChange={e => setFormData(p => ({...p, test1_cpf: e.target.value}))} className="w-full p-2 text-sm border rounded outline-none" />
                                            
                                            <div className="mt-2 flex justify-center">
                                                {formData.sign_test1 ? (
                                                    <div className="relative border border-green-200 bg-white rounded-lg p-2">
                                                        <img src={formData.sign_test1} alt="Assinatura Testemunha 1" className="h-16 object-contain" />
                                                        <button onClick={() => setFormData(p => ({...p, sign_test1: null}))} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><X size={12}/></button>
                                                    </div>
                                                ) : (
                                                    <button onClick={() => setSigModal('test1')} className="bg-red-100 text-red-700 px-4 py-2 rounded-lg font-bold text-xs hover:bg-red-200 w-full">Assinar</button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="bg-white p-4 rounded-lg border border-red-100 flex flex-col gap-2">
                                            <p className="text-xs font-bold text-slate-500 uppercase mb-2">Testemunha 2</p>
                                            <input type="text" placeholder="Nome" value={formData.test2_nome} onChange={e => setFormData(p => ({...p, test2_nome: e.target.value}))} className="w-full p-2 text-sm border rounded outline-none" />
                                            <input type="text" placeholder="CPF" value={formData.test2_cpf} onChange={e => setFormData(p => ({...p, test2_cpf: e.target.value}))} className="w-full p-2 text-sm border rounded outline-none" />
                                            
                                            <div className="mt-2 flex justify-center">
                                                {formData.sign_test2 ? (
                                                    <div className="relative border border-green-200 bg-white rounded-lg p-2">
                                                        <img src={formData.sign_test2} alt="Assinatura Testemunha 2" className="h-16 object-contain" />
                                                        <button onClick={() => setFormData(p => ({...p, sign_test2: null}))} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><X size={12}/></button>
                                                    </div>
                                                ) : (
                                                    <button onClick={() => setSigModal('test2')} className="bg-red-100 text-red-700 px-4 py-2 rounded-lg font-bold text-xs hover:bg-red-200 w-full">Assinar</button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-sm font-black text-[#1F3B5C]">Assinatura do Agente *</h3>
                            </div>
                            
                            <div className="border border-slate-300 rounded-xl p-4 bg-slate-50 flex flex-col items-center">
                                {formData.sign_agente ? (
                                    <div className="relative border border-green-200 bg-white rounded-lg p-2 flex flex-col items-center">
                                        <img src={formData.sign_agente} alt="Assinatura Agente" className="h-20 object-contain" />
                                        <span className="text-[10px] font-bold text-slate-500 mt-2">{formData.nome_agente}</span>
                                        <button onClick={() => setFormData(p => ({...p, sign_agente: null, nome_agente: ''}))} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><X size={12}/></button>
                                    </div>
                                ) : (
                                    <div className="flex gap-3">
                                        <button onClick={() => setSigModal('agente')} className="bg-[#1F3B5C] text-white px-6 py-2 rounded-lg font-bold text-sm shadow hover:bg-blue-800">
                                            Assinar na Tela
                                        </button>
                                        {userProfile?.assinatura && (
                                            <button 
                                                onClick={() => setFormData(p => ({...p, sign_agente: userProfile.assinatura, nome_agente: userProfile.nome}))}
                                                className="bg-emerald-100 text-emerald-700 px-6 py-2 rounded-lg font-bold text-sm hover:bg-emerald-200"
                                            >
                                                Auto-assinar
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                )}
                
                {/* FOOTER NAVIGATION */}
                <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-30">
                    <div className="max-w-5xl mx-auto flex justify-between items-center gap-4">
                        <button 
                            onClick={() => step === 1 ? navigate(-1) : setStep(s => Math.max(1, s - 1))}
                            disabled={salvando}
                            className="px-6 py-3 rounded-lg font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 transition-colors"
                        >
                            Voltar
                        </button>
                        
                        <div className="flex gap-2 flex-1 md:flex-none justify-end">
                            {/* Botão de Avançar - sempre visível se não estiver na última etapa */}
                            {step < 5 && (
                                <button 
                                    onClick={() => setStep(s => Math.min(5, s + 1))}
                                    disabled={!isStepValid()}
                                    className="flex-1 md:flex-none px-6 py-3 rounded-lg font-black text-white bg-[#1F3B5C] hover:bg-[#2E5C8A] disabled:opacity-50 transition-colors flex justify-center items-center gap-2 shadow-lg shadow-[#1F3B5C]/20"
                                >
                                    Avançar <ChevronRight size={18} />
                                </button>
                            )}

                            {/* Botão Salvar - Em modo de edição, sempre visível. No modo de emissão, apenas na última etapa. */}
                            {(id || step === 5) && (
                                <button 
                                    onClick={handleSubmit}
                                    disabled={!isStepValid() || salvando}
                                    className="flex-1 md:flex-none px-6 py-3 rounded-lg font-black text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 transition-colors flex justify-center items-center gap-2 shadow-lg shadow-green-600/30"
                                >
                                    <Save size={18} />
                                    {salvando ? 'Processando...' : (id ? 'Salvar Alterações' : 'Finalizar Emissão')}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

            </div>

            {/* Modal de Busca de Vistoria */}
            {modalVistoriaOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[80vh]">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h2 className="font-black text-[#1F3B5C] flex items-center gap-2">
                                <Search size={18} className="text-blue-500"/> Buscar Origem
                            </h2>
                            <button onClick={() => setModalVistoriaOpen(false)} className="text-slate-400 hover:text-red-500">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-4 border-b bg-slate-50 flex gap-2">
                            <input 
                                type="text" 
                                value={buscaOrigem}
                                onChange={e => setBuscaOrigem(e.target.value)}
                                onKeyUp={e => e.key === 'Enter' && handleBuscarOrigens()}
                                placeholder="Buscar por Nome, Nº ou Endereço..."
                                className="flex-1 p-3 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                autoFocus
                            />
                            <button onClick={handleBuscarOrigens} disabled={buscandoOrigens} className="bg-blue-600 text-white px-5 rounded-lg text-sm font-bold shadow-md hover:bg-blue-700 disabled:opacity-50">Buscar</button>
                        </div>
                        <div className="p-4 overflow-y-auto flex-1 bg-white space-y-2">
                            {buscandoOrigens ? (
                                <div className="text-center text-slate-500 text-sm py-10">Buscando registros...</div>
                            ) : origensEncontradas.length === 0 ? (
                                <div className="text-center text-slate-500 text-sm py-10">
                                    {buscaOrigem.length > 0 ? 'Nenhuma vistoria ou ocorrência encontrada.' : 'Nenhum registro recente encontrado.'}
                                </div>
                            ) : (
                                origensEncontradas.map(v => (
                                    <div 
                                        key={v.id} 
                                        onClick={() => handleVincularVistoria(v)} 
                                        className="p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-colors"
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="flex gap-2 items-center">
                                                <span className={`font-black text-xs px-2 py-0.5 rounded-md ${v.tipo === 'Vistoria' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>{v.tipo}</span>
                                                <span className="font-black text-sm text-[#1F3B5C] bg-slate-100 px-2 py-0.5 rounded-md">#{v.titulo_id}</span>
                                            </div>
                                            {v.nivel_risco && (
                                                <span className="text-[10px] font-bold uppercase text-orange-600 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded">
                                                    {v.nivel_risco}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-700 font-bold mt-2">{v.solicitante || 'Sem solicitante'}</p>
                                        <p className="text-xs text-slate-500 mt-1 flex items-start gap-1">
                                            <MapPin size={12} className="mt-0.5 shrink-0" />
                                            <span className="line-clamp-2">{v.endereco}</span>
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
            {/* Modais de Assinatura Renderizados Unicamente */}
            {sigModal && (
                <SignaturePad 
                    title={`Assinatura - ${sigModal === 'notificado' ? 'Notificado' : sigModal === 'agente' ? 'Agente' : 'Testemunha'}`}
                    onSave={(sig) => {
                        setFormData(p => {
                            const updates = {};
                            if (sigModal === 'notificado') updates.sign_notificado = sig;
                            if (sigModal === 'agente') {
                                updates.sign_agente = sig;
                                updates.nome_agente = userProfile?.nome || 'Agente';
                            }
                            if (sigModal === 'test1') updates.sign_test1 = sig;
                            if (sigModal === 'test2') updates.sign_test2 = sig;
                            return { ...p, ...updates };
                        });
                        setSigModal(null);
                    }}
                    onCancel={() => setSigModal(null)}
                />
            )}
        </div>
    );
};

export default NoprerForm;
