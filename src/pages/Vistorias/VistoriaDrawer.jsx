import React, { useState, useEffect } from 'react';
import { X, Edit2, Printer, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
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

    const [zoom, setZoom] = useState(1.0);

    const handleZoomIn = () => setZoom(prev => Math.min(1.5, prev + 0.1));
    const handleZoomOut = () => setZoom(prev => Math.max(0.5, prev - 0.1));
    const handleResetZoom = () => setZoom(1.0);

    const handlePrint = () => {
        if (vistoria?.id || vistoria?.vistoria_id) {
            const vid = encodeURIComponent(vistoria.id || vistoria.vistoria_id);
            window.open(`/vistorias/imprimir/${vid}`, '_blank');
        } else {
            window.dispatchEvent(new Event('trigger-map-print-resize'));
            setTimeout(() => window.print(), 600);
        }
    };

    const handleEdit = () => {
        if (onEdit) onEdit(vistoria);
        onClose();
    };

    return (
        <div className="fixed md:static inset-y-0 right-0 z-[4000] flex-1 min-w-[320px] flex flex-col bg-white dark:bg-slate-900 shadow-xl border-l border-slate-200 dark:border-slate-700 h-full md:h-[calc(100vh-40px)] transition-all overflow-hidden">
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
                
                {/* Controles centrais de Zoom */}
                <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-700/50 p-1 rounded-xl gap-1 border border-slate-200/60 dark:border-slate-600">
                    <button
                        onClick={handleZoomOut}
                        disabled={zoom <= 0.5}
                        className="w-7 h-7 rounded-lg hover:bg-white dark:hover:bg-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-200 disabled:opacity-30 transition-all"
                        title="Diminuir Zoom"
                    >
                        <ZoomOut size={15} />
                    </button>
                    <span className="text-[11px] font-black text-slate-600 dark:text-slate-200 px-2 min-w-[42px] text-center">
                        {Math.round(zoom * 100)}%
                    </span>
                    <button
                        onClick={handleZoomIn}
                        disabled={zoom >= 1.5}
                        className="w-7 h-7 rounded-lg hover:bg-white dark:hover:bg-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-200 disabled:opacity-30 transition-all"
                        title="Aumentar Zoom"
                    >
                        <ZoomIn size={15} />
                    </button>
                    <button
                        onClick={handleResetZoom}
                        disabled={zoom === 1.0}
                        className="w-7 h-7 rounded-lg hover:bg-white dark:hover:bg-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-200 disabled:opacity-30 transition-all ml-0.5 border-l border-slate-200 dark:border-slate-600 pl-1"
                        title="Restaurar Zoom 100%"
                    >
                        <RotateCcw size={14} />
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={handleEdit} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-xs font-bold transition-colors shadow-sm">
                        <Edit2 size={14} />
                        <span>Editar</span>
                    </button>
                    <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-white hover:bg-slate-900 rounded-lg text-xs font-bold transition-colors shadow-sm">
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
                    fullData && <VistoriaPrint initialData={fullData} isDrawerMode={true} externalZoom={zoom} />
                )}
            </div>
        </div>
    );
};

export default VistoriaDrawer;