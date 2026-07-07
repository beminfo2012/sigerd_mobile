import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowLeft, Download, Calendar } from 'lucide-react';

const TelaSucesso = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const numero = searchParams.get('numero') || 'NOPRER';
    const id = searchParams.get('id');

    return (
        <div className="min-h-screen bg-[#F1F5F9] flex flex-col items-center justify-center p-6 font-[Inter,sans-serif]">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-[#E2E8F0] max-w-md w-full text-center flex flex-col items-center animate-in zoom-in-95 duration-500">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle className="text-green-600" size={40} />
                </div>
                
                <h1 className="text-2xl font-black text-[#1F3B5C] mb-2">NOPRER Emitida com Sucesso!</h1>
                
                <div className="bg-[#EBF1F8] border border-[#2E5C8A]/30 px-6 py-3 rounded-lg my-4">
                    <p className="text-xs text-[#64748B] uppercase font-bold tracking-widest mb-1">Nº do Documento</p>
                    <p className="font-mono text-xl font-black text-[#1F3B5C]">{numero}</p>
                </div>

                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 text-left w-full my-4 flex gap-3">
                    <Calendar className="text-amber-600 shrink-0 mt-0.5" size={20} />
                    <p className="text-xs text-amber-800 leading-relaxed">
                        A contagem do prazo estipulado já foi iniciada. O sistema gerará um alerta para a equipe na data de revistoria.
                    </p>
                </div>

                <div className="flex flex-col gap-3 w-full mt-4">
                    <button 
                        onClick={() => alert('Endpoint DOCX será acionado!')}
                        className="w-full bg-[#1F3B5C] hover:bg-[#2E5C8A] text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                        <Download size={18} />
                        Exportar NOPRER (.docx)
                    </button>
                    <button 
                        onClick={() => navigate('/noprer')}
                        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
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
