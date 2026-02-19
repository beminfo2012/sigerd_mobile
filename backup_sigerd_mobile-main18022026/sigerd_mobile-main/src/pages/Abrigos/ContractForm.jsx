import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ArrowLeft, Save } from 'lucide-react';
import { addContract, getContract, updateContract } from '../../services/db';
import toast from 'react-hot-toast';

const ContractForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        contract_number: '',
        object_description: '',
        start_date: '',
        end_date: '',
        total_value: '',
        status: 'active'
    });

    useEffect(() => {
        if (id) {
            loadData();
        }
    }, [id]);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await getContract(id);
            if (data) {
                setFormData({
                    contract_number: data.contract_number,
                    object_description: data.object_description,
                    start_date: data.start_date,
                    end_date: data.end_date,
                    total_value: data.total_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
                    status: data.status
                });
            } else {
                toast.error('Contrato não encontrado');
                navigate('/abrigos/contratos');
            }
        } catch (error) {
            console.error(error);
            toast.error('Erro ao carregar dados');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const formatCurrencyInput = (value) => {
        // Simple currency formatting logic could go here
        // For now, we trust the input type="number" or manual entry
        return value;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Basic validation
        if (!formData.contract_number || !formData.object_description || !formData.total_value) {
            toast.error('Preencha os campos obrigatórios');
            setLoading(false);
            return;
        }

        try {
            // Convert "18.250,00" -> 18250.00
            const cleanValue = parseFloat(formData.total_value.replace(/\./g, '').replace(',', '.'));

            const payload = {
                ...formData,
                total_value: cleanValue
            };

            if (id) {
                await updateContract(id, payload);
                toast.success('Contrato atualizado!');
            } else {
                await addContract(payload);
                toast.success('Contrato salvo!');
            }
            navigate('/abrigos/contratos');
        } catch (error) {
            console.error('Error saving contract:', error);
            toast.error('Erro ao salvar contrato.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-slate-200 px-4 h-16 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/abrigos/contratos')} className="hover:bg-slate-100 rounded-full">
                        <ArrowLeft className="w-6 h-6 text-slate-700" />
                    </Button>
                    <h1 className="text-xl font-bold text-slate-800">
                        {id ? 'Editar Contrato' : 'Novo Contrato'}
                    </h1>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4 py-6">
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Número do Contrato *</label>
                        <input
                            type="text"
                            name="contract_number"
                            value={formData.contract_number}
                            onChange={handleChange}
                            placeholder="Ex: 2025-1V6400"
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Objeto *</label>
                        <input
                            type="text"
                            name="object_description"
                            value={formData.object_description}
                            onChange={handleChange}
                            placeholder="Ex: Cestas Básicas"
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Início da Vigência *</label>
                            <input
                                type="date"
                                name="start_date"
                                value={formData.start_date}
                                onChange={handleChange}
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Término da Vigência *</label>
                            <input
                                type="date"
                                name="end_date"
                                value={formData.end_date}
                                onChange={handleChange}
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Valor Total (R$) *</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">R$</span>
                            <input
                                type="text"
                                name="total_value"
                                value={formData.total_value}
                                onChange={(e) => {
                                    const raw = e.target.value.replace(/\D/g, '');
                                    const val = (Number(raw) / 100).toLocaleString('pt-BR', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    });
                                    setFormData(prev => ({ ...prev, total_value: val }));
                                }}
                                placeholder="0,00"
                                className="w-full pl-12 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-bold text-slate-800"
                                required
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-xl shadow-lg shadow-blue-500/30 flex items-center gap-2"
                        >
                            {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <Save className="w-5 h-5" />}
                            Salvar Contrato
                        </Button>
                    </div>
                </form>
            </main>
        </div>
    );
};

export default ContractForm;
