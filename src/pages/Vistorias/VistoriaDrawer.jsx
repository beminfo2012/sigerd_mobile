import React, { useState, useEffect } from 'react';
import { X, Edit2, Printer } from 'lucide-react';
import VistoriaPrint from './VistoriaPrint';
import { getVistoriaFull } from '../../services/db';
import { supabase } from '../../services/supabase';

const VistoriaDrawer = ({ vistoria, onClose, onEdit }) => {
    const [fullData, setFullData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!vistoria) return;
        
        const loadFullData = async () => {
            setLoading(true);
            try {
                let data = await getVistoriaFull(vistoria.id);
                if (!data && (vistoria.supabase_id || vistoria.id)) {
                    const targetId = vistoria.supabase_id || vistoria.id;
                    const { data: remoteData } = await supabase.from('vistorias').select('*').eq('id', targetId).single();
                    if (remoteData) data = remoteData;
                }
                setFullData(data || vistoria);
            } catch (e) {
                console.error(e);
                setFullData(vistoria);
            } finally {
                setLoading(false);
            }
        };

        loadFullData();
    }, [vistoria]);

    if (!vistoria) return null;

    const handlePrint = () => {
        window.dispatchEvent(new Event('trigger-map-print-resize'));
        setTimeout(() => window.print(), 600);
    };

    const handleEdit = () => {
        if (onEdit) onEdit(vistoria);
        onClose();
    };

    return (
        <div className="fixed top-0 md:top-10 right-0 h-full md:h-[calc(100vh-40px)] z-[4000] flex flex-col bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-700 w-full md:w-[55%] lg:w-[58%] xl:w-[60%] min-w-[320px] max-w-[1000px] transition-all">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shrink-0 shadow-sm print:hidden">
                <div className="flex items-center gap-3">
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500">
                        <X size={20} />
                    </button>
                    <div>
                        <h3 className="font-black text-slate-800 dark:text-slate-100 text-sm">Visualização do Relatório</h3>
                        <p className="text-xs text-slate-500">#{vistoria.vistoria_id || '---'} • {vistoria.solicitante || 'Sem nome'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleEdit} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-xs font-bold transition-colors shadow-sm">
                        <Edit2 size={14} />
                        <span>Editar</span>
                    </button>
                    <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-bold transition-colors">
                        <Printer size={14} />
                        <span>Imprimir</span>
                    </button>
                </div>
            </div>

            {/* Report content (scrollable) */}
            <div className="flex-1 overflow-y-auto overflow-x-auto">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    fullData && <VistoriaPrint initialData={fullData} isDrawerMode={true} />
                )}
            </div>
        </div>
    );
};

export default VistoriaDrawer;