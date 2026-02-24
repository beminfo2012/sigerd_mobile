import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import VistoriaForm from './VistoriaForm'
import VistoriaList from './VistoriaList'

import { supabase } from '../../services/supabase'
import { getVistoriaFull } from '../../services/db'

const Vistorias = () => {
    const [view, setView] = useState('list') // 'list' | 'form'
    const [selectedVistoria, setSelectedVistoria] = useState(null)
    const [loadingEdit, setLoadingEdit] = useState(false)

    const [showBlockModal, setShowBlockModal] = useState(false)
    const navigate = useNavigate()

    const handleNew = () => {
        // Enforce Equipment Check Protocol
        const today = new Date().toDateString()
        const checkKey = `equipment_check_v3_${today}`
        const hasCheck = localStorage.getItem(checkKey)

        console.log(`[Protocol Check] Key: ${checkKey}, Value: ${hasCheck}`)

        if (!hasCheck) {
            console.warn('[Protocol Check] Failed - Blocking access')
            setShowBlockModal(true)
            return
        }

        console.log('[Protocol Check] Passed')
        setSelectedVistoria(null)
        setView('form')
    }

    const handleEdit = async (vistoriaPartial) => {
        setLoadingEdit(true)
        try {
            console.log('[Edit] Fetching full details for:', vistoriaPartial.vistoria_id);

            // 1. Try Local/Cache first via DB helper
            let fullData = await getVistoriaFull(vistoriaPartial.id);

            // 2. If not found locally, try Cloud (specific fetch)
            if (!fullData) {
                // If it's a cloud item, 'id' is likely the UUID
                // If local item, 'supabase_id' would be the UUID
                const targetId = vistoriaPartial.supabase_id || vistoriaPartial.id;

                // Only try fetching if it looks like a UUID or we have a valid ID
                if (targetId) {
                    const { data, error } = await supabase
                        .from('vistorias')
                        .select('*')
                        .eq('id', targetId)
                        .single();

                    if (data) fullData = data;
                }
            }

            // Fallback to partial if absolutely nothing found
            const vistoria = fullData || vistoriaPartial;

            // Need to map DB fields to Form fields if they differ
            // For now passing raw, but the Form expects camelCase mostly.
            // Explicitly mapping critical fields to avoid missing sections (like Block 5)
            const mappedData = {
                ...vistoria,
                tipoInfo: vistoria.tipo_info || vistoria.tipoInfo,
                vistoriaId: vistoria.vistoria_id || vistoria.vistoriaId,
                dataHora: vistoria.data_hora || vistoria.dataHora || new Date().toISOString(),
                categoriaRisco: vistoria.categoria_risco || vistoria.categoriaRisco,
                subtiposRisco: vistoria.subtipos_risco || vistoria.subtiposRisco || [],
                nivelRisco: vistoria.nivel_risco || vistoria.nivelRisco,
                situacaoObservada: vistoria.situacao_observada || vistoria.situacaoObservada,
                populacaoEstimada: vistoria.populacao_estimada || vistoria.populacaoEstimada,
                gruposVulneraveis: vistoria.grupos_vulneraveis || vistoria.gruposVulneraveis || [],
                checklistRespostas: vistoria.checklist_respostas || vistoria.checklistRespostas || {},
                fotos: vistoria.fotos || [],
                documentos: vistoria.documentos || [],
                assinaturaAgente: vistoria.assinatura_agente || vistoria.assinaturaAgente,
                apoioTecnico: vistoria.apoio_tecnico || vistoria.apoioTecnico
            }

            setSelectedVistoria(mappedData)

            setView('form')
        } catch (e) {
            console.error("Edit load failed:", e)
            alert("Erro ao carregar detalhes da vistoria.")
        } finally {
            setLoadingEdit(false)
        }
    }

    const handleBack = () => {
        setView('list')
        setSelectedVistoria(null)
    }

    return (
        <div>
            {view === 'list' && (
                <VistoriaList onNew={handleNew} onEdit={handleEdit} />
            )}
            {view === 'form' && (
                <VistoriaForm onBack={handleBack} initialData={selectedVistoria} />
            )}

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
