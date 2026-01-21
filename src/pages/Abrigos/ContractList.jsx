import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ArrowLeft, Plus, FileText, AlertCircle, CheckCircle, RefreshCw, Pencil } from 'lucide-react';
import { getContracts, triggerSync } from '../../services/db';
import { shelterSyncService } from '../../services/shelterSyncService';

const ContractList = () => {
    const navigate = useNavigate();
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);

    useEffect(() => {
        loadContracts();
    }, []);

    const handleManualSync = async () => {
        setSyncing(true);
        try {
            await triggerSync(); // Push local changes
            await shelterSyncService.pullData(); // Pull remote changes
        } catch (e) {
            console.error("Sync failed:", e);
        }
        await loadContracts();
        setTimeout(() => setSyncing(false), 1000);
    };

    const loadContracts = async () => {
        try {
            const data = await getContracts();
            setContracts(data);
        } catch (error) {
            console.error('Error loading contracts:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (endDate) => {
        const end = new Date(endDate);
        const now = new Date();
        const threeMonths = new Date();
        threeMonths.setMonth(now.getMonth() + 3);

        if (end < now) return 'text-red-500 bg-red-50'; // Expired
        if (end < threeMonths) return 'text-amber-500 bg-amber-50'; // Expiring soon
        return 'text-green-500 bg-green-50'; // Active
    };

    const getStatusBadge = (contract) => {
        const end = new Date(contract.end_date);
        const now = new Date();
        const threeMonths = new Date();
        threeMonths.setMonth(now.getMonth() + 3);

        if (end < now) {
            return (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-bold rounded-full border border-red-100 uppercase">
                    <AlertCircle size={10} /> Expirado
                </span>
            );
        }
        if (end < threeMonths) {
            return (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-full border border-amber-100 uppercase">
                    <AlertCircle size={10} /> Vencendo
                </span>
            );
        }
        return (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-bold rounded-full border border-green-100 uppercase">
                <CheckCircle size={10} /> Ativo
            </span>
        );
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-slate-200 px-4 h-16 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/abrigos')} className="hover:bg-slate-100 rounded-full">
                        <ArrowLeft className="w-6 h-6 text-slate-700" />
                    </Button>
                    <h1 className="text-xl font-bold text-slate-800">Contratos de Emergência</h1>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleManualSync}
                        className={`rounded-full hover:bg-slate-100 ${syncing ? 'animate-spin text-blue-600' : 'text-slate-600'}`}
                    >
                        <RefreshCw className="w-5 h-5" />
                    </Button>
                    <Button
                        onClick={() => navigate('/abrigos/contratos/novo')}
                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-md rounded-full px-4"
                    >
                        <Plus className="w-5 h-5 mr-1" />
                        <span className="hidden md:inline">Novo Contrato</span>
                    </Button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-6">
                {loading ? (
                    <div className="flex justify-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : contracts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                        <FileText className="w-12 h-12 text-slate-300 mb-3" />
                        <h3 className="text-lg font-medium text-slate-900">Nenhum contrato registrado</h3>
                        <p className="text-slate-500 text-sm mb-4">Clique em "Novo Contrato" para adicionar.</p>
                        <p className="text-xs text-slate-300 mt-2">Versão local: {contracts.length} registros</p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {contracts.map(contract => (
                            <Card key={contract.id} className="hover:shadow-md transition-shadow duration-200 border-l-4 border-l-blue-500">
                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded uppercase tracking-wide">
                                                    {contract.contract_number}
                                                </span>
                                                {getStatusBadge(contract)}
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-900">{contract.object_description}</h3>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-slate-400 hover:text-blue-600"
                                            onClick={() => navigate(`/abrigos/contratos/editar/${contract.contract_id || contract.id}`)}
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </Button>
                                    </div>

                                    <div className="space-y-2 text-sm text-slate-600">
                                        <div className="flex justify-between border-b border-slate-100 pb-1">
                                            <span>Vigência:</span>
                                            <span className="font-medium">
                                                {new Date(contract.start_date).toLocaleDateString()} - {new Date(contract.end_date).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between pt-1">
                                            <span>Valor Total:</span>
                                            <span className="font-bold text-slate-800 text-base">{formatCurrency(contract.total_value)}</span>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default ContractList;
