import { useState, useEffect } from 'react';
import { Gift, Package, TrendingUp, Calendar, MapPin, User, Download, Printer, Trash2 } from 'lucide-react';
import { Card } from '../../components/Shelter/ui/Card';
import { Button } from '../../components/Shelter/ui/Button';
import { getDonations, getDistributions, getShelters, clearReports } from '../../services/shelterDb';

export function Reports() {
    const [donations, setDonations] = useState([]);
    const [distributions, setDistributions] = useState([]);
    const [shelters, setShelters] = useState([]);

    const loadData = async () => {
        const d = await getDonations();
        const dist = await getDistributions();
        const s = await getShelters();
        // Reverse for chronological order (newest first)
        setDonations(d ? d.reverse() : []);
        setDistributions(dist ? dist.reverse() : []);
        setShelters(s || []);
    };

    const handleClearReports = async () => {
        if (window.confirm('Deseja apagar TODO o histórico de doações e distribuições? Esta ação não pode ser desfeita.')) {
            try {
                await clearReports();
                await loadData();
                alert('Histórico limpo com sucesso.');
            } catch (error) {
                console.error(error);
                alert('Erro ao limpar histórico.');
            }
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const getShelterName = (id) => {
        const s = shelters.find(s => s.id === parseInt(id));
        return s ? s.name : 'Abrigo Desconhecido';
    };

    const exportToCSV = (data, filename, type) => {
        let headers = [];
        let rows = [];

        if (type === 'donations') {
            headers = ['Data', 'Item', 'Quantidade', 'Unidade', 'Tipo', 'Abrigo', 'Doador'];
            rows = data.map(d => [
                new Date(d.donation_date).toLocaleDateString('pt-BR'),
                d.item_description,
                d.quantity,
                d.unit,
                d.donation_type,
                getShelterName(d.shelter_id),
                d.donor_name || 'Anônimo'
            ]);
        } else {
            headers = ['Data', 'Item', 'Quantidade', 'Unidade', 'Abrigo', 'Destinatário', 'Grupo'];
            rows = data.map(d => [
                new Date(d.distribution_date).toLocaleDateString('pt-BR'),
                d.item_name,
                d.quantity,
                d.unit,
                getShelterName(d.shelter_id),
                d.recipient_name || 'N/A',
                d.family_group || 'N/A'
            ]);
        }

        const csvContent = [
            headers.join(','),
            ...rows.map(r => r.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-12">
            <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
                {/* Header */}
                <div className="flex flex-col gap-4">
                    <button
                        onClick={() => navigate('/abrigos')}
                        className="flex items-center gap-2 text-[#2a5299] font-semibold hover:text-blue-800 transition-colors w-fit"
                    >
                        <ArrowLeft size={20} />
                        Voltar ao Menu
                    </button>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-black text-slate-800 mb-1">Relatórios e Registros</h1>
                            <p className="text-sm text-slate-500">Histórico de doações e movimentações de estoque</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="secondary"
                                onClick={handleClearReports}
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 border-red-100 print:hidden"
                            >
                                <Trash2 size={18} />
                                <span className="whitespace-nowrap">Limpar Histórico</span>
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => window.print()}
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 print:hidden"
                            >
                                <Printer size={18} />
                                <span className="whitespace-nowrap">Imprimir PDF</span>
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Donations Section */}
                    <section className="space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                                    <Gift className="w-4 h-4 text-amber-600" />
                                </div>
                                <h2 className="text-lg font-bold text-slate-800 uppercase tracking-tight">Doações Recebidas</h2>
                            </div>
                            <button
                                onClick={() => exportToCSV(donations, 'relatorio_doacoes', 'donations')}
                                className="p-2 text-[#2a5299] hover:bg-blue-50 rounded-lg transition-colors print:hidden"
                                title="Exportar CSV"
                            >
                                <Download size={18} />
                            </button>
                        </div>

                        {donations.length === 0 ? (
                            <Card className="p-8 text-center text-slate-400 italic">Nenhuma doação registrada.</Card>
                        ) : (
                            <div className="space-y-3">
                                {donations.map((donation) => (
                                    <Card key={donation.id} className="p-4 border-l-4 border-l-amber-500">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h3 className="font-bold text-slate-800 capitalize">{donation.item_description}</h3>
                                                <div className="text-xs text-slate-500 flex items-center gap-1">
                                                    <Calendar size={12} />
                                                    {new Date(donation.donation_date).toLocaleDateString('pt-BR')}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-black text-amber-600 uppercase">
                                                    {donation.quantity} {donation.unit}
                                                </div>
                                                <div className="text-[10px] text-slate-400 font-bold uppercase">
                                                    {donation.donation_type}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 pt-3 border-t border-slate-50">
                                            <div className="text-xs text-slate-600 flex items-center gap-1">
                                                <MapPin size={12} className="text-[#2a5299]" />
                                                {getShelterName(donation.shelter_id)}
                                            </div>
                                            <div className="text-xs text-slate-600 flex items-center gap-1">
                                                <User size={12} className="text-[#2a5299]" />
                                                {donation.donor_name || 'Doador Anônimo'}
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Distributions Section */}
                    <section className="space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                                    <TrendingUp className="w-4 h-4 text-blue-600" />
                                </div>
                                <h2 className="text-lg font-bold text-slate-800 uppercase tracking-tight">Distribuições Realizadas</h2>
                            </div>
                            <button
                                onClick={() => exportToCSV(distributions, 'relatorio_distribuicoes', 'distributions')}
                                className="p-2 text-[#2a5299] hover:bg-blue-50 rounded-lg transition-colors print:hidden"
                                title="Exportar CSV"
                            >
                                <Download size={18} />
                            </button>
                        </div>

                        {distributions.length === 0 ? (
                            <Card className="p-8 text-center text-slate-400 italic">Nenhuma distribuição registrada.</Card>
                        ) : (
                            <div className="space-y-3">
                                {distributions.map((dist) => (
                                    <Card key={dist.id} className="p-4 border-l-4 border-l-blue-500">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h3 className="font-bold text-slate-800">{dist.item_name}</h3>
                                                <div className="text-xs text-slate-500 flex items-center gap-1">
                                                    <Calendar size={12} />
                                                    {new Date(dist.distribution_date).toLocaleDateString('pt-BR')}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-black text-blue-600 uppercase">
                                                    -{dist.quantity} {dist.unit}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 pt-3 border-t border-slate-50">
                                            <div className="text-xs text-slate-600 flex items-center gap-1">
                                                <MapPin size={12} className="text-[#2a5299]" />
                                                {getShelterName(dist.shelter_id)}
                                            </div>
                                            <div className="text-xs text-slate-600 flex items-center gap-1">
                                                <User size={12} className="text-[#2a5299]" />
                                                {dist.recipient_name || 'Destinatário não informado'} {dist.family_group ? `(${dist.family_group})` : ''}
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}

export default Reports;
