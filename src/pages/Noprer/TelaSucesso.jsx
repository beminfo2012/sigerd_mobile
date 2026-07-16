import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowLeft, Printer, Calendar } from 'lucide-react';
import { supabase } from '../../services/supabase';
import toast from 'react-hot-toast';

const TelaSucesso = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const numero = searchParams.get('numero') || 'NOPRER';
    const id = searchParams.get('id');
    const [noprerData, setNoprerData] = useState(null);

    useEffect(() => {
        if (id) {
            supabase.from('noprer').select('*, vistoria:vistoria_id(vistoria_id)').eq('id', id).single()
                .then(({ data }) => setNoprerData(data))
                .catch(err => console.error(err));
        }
    }, [id]);

    const handleGeneratePDF = () => {
        if (!noprerData) {
            toast.error('Dados da NOPRER não carregados.');
            return;
        }
        window.open(`/noprer/imprimir/${id}`, '_blank');
    };

    return (
        <div className="min-h-screen bg-[#F1F5F9] dark:bg-slate-900 flex flex-col items-center justify-center p-6 font-[Inter,sans-serif]">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-[#E2E8F0] dark:border-slate-700 max-w-md w-full text-center flex flex-col items-center animate-in zoom-in-95 duration-500">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle className="text-green-600 dark:text-green-400" size={40} />
                </div>
                
                <h1 className="text-2xl font-black text-[#1F3B5C] dark:text-slate-100 mb-2">NOPRER Emitida com Sucesso!</h1>
                
                <div className="bg-[#EBF1F8] dark:bg-blue-900/30 border border-[#2E5C8A]/30 px-6 py-3 rounded-lg my-4">
                    <p className="text-xs text-[#64748B] dark:text-slate-400 uppercase font-bold tracking-widest mb-1">Nº do Documento</p>
                    <p className="font-mono text-xl font-black text-[#1F3B5C] dark:text-slate-100">{numero ? numero.replace(/NOPRER-(\d{4})\.(\d+)/, 'NOPRER - $2/$1') : '---'}</p>
                </div>

                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 text-left w-full my-4 flex gap-3">
                    <Calendar className="text-amber-600 shrink-0 mt-0.5" size={20} />
                    <p className="text-xs text-amber-800 leading-relaxed">
                        A contagem do prazo estipulado já foi iniciada. O sistema gerará um alerta para a equipe na data de revistoria.
                    </p>
                </div>

                <div className="flex flex-col gap-3 w-full mt-4">
                    <button 
                        onClick={handleGeneratePDF}
                        disabled={!noprerData}
                        className="w-full bg-[#1F3B5C] hover:bg-[#2E5C8A] disabled:opacity-50 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                        <Printer size={18} />
                        Imprimir NOPRER Oficial
                    </button>
                    <button 
                        onClick={() => navigate('/noprer')}
                        className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                        <ArrowLeft size={18} />
                        Voltar para a Lista
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TelaSucesso;
