import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, ShieldCheck, MapPin, Calendar, User, FileText } from 'lucide-react';
import { supabase } from '../../services/supabase';

const ReportVerification = () => {
    const { reportId } = useParams();
    const [loading, setLoading] = useState(true);
    const [report, setReport] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchReport = async () => {
            try {
                // Fetch only public/safe fields
                const { data, error } = await supabase
                    .from('vistorias')
                    .select('created_at, status, city, bairro, logradouro, numero, agent_id')
                    .eq('id', reportId)
                    .single();

                if (error) throw error;
                setReport(data);
            } catch (err) {
                console.error('Error fetching report:', err);
                setError('Relatório não encontrado ou link inválido.');
            } finally {
                setLoading(false);
            }
        };

        if (reportId) {
            fetchReport();
        }
    }, [reportId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
                <p className="text-gray-600 font-medium">Verificando autenticidade...</p>
            </div>
        );
    }

    if (error || !report) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center border-l-4 border-red-500">
                    <XCircle className="text-red-500 mx-auto mb-4" size={64} />
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Validação Falhou</h1>
                    <p className="text-gray-600 mb-6">{error || 'Não foi possível validar este documento.'}</p>
                    <div className="p-4 bg-red-50 rounded-lg text-xs text-red-600 text-left">
                        <strong>Motivos possíveis:</strong>
                        <ul className="list-disc ml-4 mt-1 space-y-1">
                            <li>O código escaneado é inválido.</li>
                            <li>O relatório foi excluído do sistema.</li>
                            <li>Erro de conexão.</li>
                        </ul>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center p-4 font-sans">
            <div className="bg-white p-6 md:p-10 rounded-3xl shadow-xl max-w-lg w-full relative overflow-hidden">
                {/* Decorative header background */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-500 to-emerald-400"></div>

                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4 animate-in zoom-in duration-300">
                        <ShieldCheck className="text-green-600" size={40} />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Documento Autêntico</h1>
                    <p className="text-green-600 font-medium bg-green-50 inline-block px-4 py-1 rounded-full text-sm border border-green-100">
                        Validado Oficialmente
                    </p>
                </div>

                <div className="space-y-6">
                    <div className="grid grid-cols-[24px_1fr] gap-4 items-start p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <FileText className="text-blue-500 mt-0.5" size={20} />
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Tipo de Documento</p>
                            <p className="font-semibold text-gray-800">Relatório de Vistoria Técnica</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-[24px_1fr] gap-4 items-start p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <Calendar className="text-blue-500 mt-0.5" size={20} />
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Data de Emissão</p>
                            <p className="font-semibold text-gray-800">
                                {new Date(report.created_at).toLocaleDateString('pt-BR', {
                                    day: '2-digit', month: 'long', year: 'numeric',
                                    hour: '2-digit', minute: '2-digit'
                                })}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-[24px_1fr] gap-4 items-start p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <MapPin className="text-blue-500 mt-0.5" size={20} />
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Localização</p>
                            <p className="font-semibold text-gray-800">{report.logradouro}, {report.numero}</p>
                            <p className="text-sm text-gray-500">{report.bairro} - {report.city}</p>
                        </div>
                    </div>

                    {/* Status do Processo - Opcional */}
                    <div className="grid grid-cols-[24px_1fr] gap-4 items-start p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <CheckCircle2 className="text-blue-500 mt-0.5" size={20} />
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Status Atual</p>
                            <p className="font-semibold text-gray-800 capitalize">{report.status || 'Finalizado'}</p>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                    <p className="text-xs text-gray-400">
                        Sistema Integrado de Gestão de Riscos e Desastres<br />
                        Defesa Civil Municipal
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ReportVerification;
