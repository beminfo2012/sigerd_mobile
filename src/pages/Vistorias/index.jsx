import React, { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import VistoriaForm from './VistoriaForm'
import VistoriaList from './VistoriaList'

import { supabase } from '../../services/supabase'
import { getVistoriaFull } from '../../services/db'

// Componente para lidar com o carregamento da Vistoria para edição
const EditVistoriaLoader = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [selectedVistoria, setSelectedVistoria] = useState(null);

    useEffect(() => {
        const fetchVistoria = async () => {
            try {
                let targetId = id;
                if (!isNaN(targetId) && !targetId.includes('-')) {
                    targetId = parseInt(targetId, 10);
                }
                
                let fullData = await getVistoriaFull(targetId);

                // Só pesquisa no Supabase se for um UUID (string com '-')
                if (!fullData && typeof targetId === 'string' && targetId.includes('-')) {
                    const { data, error } = await supabase
                        .from('vistorias')
                        .select('*')
                        .eq('id', targetId)
                        .single();

                    if (data) fullData = data;
                }

                if (!fullData) {
                    alert("Vistoria não encontrada.");
                    navigate('/vistorias', { replace: true });
                    return;
                }

                const mappedData = {
                    ...fullData,
                    tipoInfo: fullData.tipo_info || fullData.tipoInfo,
                    vistoriaId: fullData.vistoria_id || fullData.vistoriaId,
                    dataHora: fullData.data_hora || fullData.dataHora || new Date().toISOString(),
                    categoriaRisco: fullData.categoria_risco || fullData.categoriaRisco,
                    subtiposRisco: fullData.subtipos_risco || fullData.subtiposRisco || [],
                    nivelRisco: fullData.nivel_risco || fullData.nivelRisco,
                    situacaoObservada: fullData.situacao_observada || fullData.situacaoObservada,
                    populacaoEstimada: fullData.populacao_estimada || fullData.populacaoEstimada,
                    gruposVulneraveis: fullData.grupos_vulneraveis || fullData.gruposVulneraveis || [],
                    checklistRespostas: fullData.checklist_respostas || fullData.checklistRespostas || {},
                    fotos: fullData.fotos || [],
                    documentos: fullData.documentos || [],
                    assinaturaAgente: fullData.assinatura_agente || fullData.assinaturaAgente,
                    apoioTecnico: fullData.apoio_tecnico || fullData.apoioTecnico
                };

                setSelectedVistoria(mappedData);
            } catch (e) {
                console.error("Edit load failed:", e);
                alert("Erro ao carregar detalhes da vistoria.");
                navigate('/vistorias', { replace: true });
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchVistoria();
        }
    }, [id, navigate]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 gap-3">
                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Carregando Vistoria...</p>
            </div>
        );
    }

    return <VistoriaForm onBack={() => navigate('/vistorias')} initialData={selectedVistoria} />;
};

const Vistorias = () => {
    const [showBlockModal, setShowBlockModal] = useState(false)
    const navigate = useNavigate()

    const handleNew = () => {
        // Enforce Equipment Check Protocol
        const today = new Date().toDateString()
        const checkKey = `equipment_check_v3_${today}`
        const hasCheck = localStorage.getItem(checkKey)

        if (!hasCheck) {
            console.warn('[Protocol Check] Failed - Blocking access')
            setShowBlockModal(true)
            return
        }

        navigate('/vistorias/nova')
    }

    const handleEdit = (vistoriaPartial) => {
        navigate(`/vistorias/editar/${vistoriaPartial.supabase_id || vistoriaPartial.id}`)
    }

    return (
        <div>
            <Routes>
                <Route index element={<VistoriaList onNew={handleNew} onEdit={handleEdit} />} />
                <Route path="nova" element={<VistoriaForm onBack={() => navigate('/vistorias')} initialData={null} />} />
                <Route path="editar/:id" element={<EditVistoriaLoader />} />
            </Routes>

            {/* Protocol Enforcement Modal */}
            {showBlockModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-5 z-[60]" onClick={() => setShowBlockModal(false)}>
                    <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                        <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle size={32} className="text-amber-600" strokeWidth={2.5} />
                        </div>
                        <h3 className="text-xl font-black text-center text-slate-800 mb-2">Prontidão Não Confirmada</h3>
                        <p className="text-sm text-center text-slate-500 mb-6 leading-relaxed">
                            Para garantir a segurança da operação, é obrigatório confirmar a verificação de equipamentos do dia antes de iniciar.
                        </p>
                        <button
                            onClick={() => navigate('/checklist-saida')}
                            className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-blue-700 active:scale-[0.98] transition-all"
                        >
                            Ir para Iniciar Vistoria
                        </button>
                        <button
                            onClick={() => setShowBlockModal(false)}
                            className="w-full mt-3 py-3 rounded-xl font-bold text-sm text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Vistorias
