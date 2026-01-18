import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Package, Truck, Gift, FileText, ArrowLeft, ChevronRight, BarChart3 } from 'lucide-react';
import { Card } from '../../components/Shelter/ui/Card';
import { UserContext } from '../../App';
import { HumanitarianDashboard } from '../../components/Shelter/HumanitarianDashboard';

export default function ShelterMenu() {
    const navigate = useNavigate();
    const userProfile = useContext(UserContext);
    const userRole = userProfile?.role || '';
    console.log('--- SIGERD DEBUG ---');
    console.log('User Role:', userRole);
    const AGENT_ROLES = ['Agente de Defesa Civil', 'Técnico em Edificações', 'admin', 'agente', 'tecnico'];

    const menuItems = [
        {
            title: 'Gestão de Abrigos',
            description: 'Gerencie ocupantes, capacidade e operações de cada abrigo.',
            icon: Building2,
            path: '/abrigos/lista',
            color: 'bg-blue-50 text-[#2a5299]',
            allowedRoles: ['Agente de Defesa Civil', 'Técnico em Edificações', 'admin', 'Assistente Social']
        },
        {
            title: 'Estoque Municipal',
            description: 'Visualize e gerencie o estoque centralizado da prefeitura.',
            icon: Package,
            path: '/abrigos/estoque',
            color: 'bg-emerald-50 text-emerald-600',
            allowedRoles: ['Agente de Defesa Civil', 'Técnico em Edificações', 'admin', 'Assistente Social', 'Voluntário']
        },
        {
            title: 'Receber Doações',
            description: 'Registre a entrada de doações para o estoque ou abrigos.',
            icon: Gift,
            path: '/abrigos/doacoes-central',
            color: 'bg-amber-50 text-amber-600',
            allowedRoles: ['Agente de Defesa Civil', 'Técnico em Edificações', 'admin', 'Assistente Social', 'Voluntário']
        },
        {
            title: 'Logística & Distribuição',
            description: 'Transfira itens do estoque municipal para os abrigos.',
            icon: Truck,
            path: '/abrigos/logistica',
            color: 'bg-purple-50 text-purple-600',
            allowedRoles: ['Agente de Defesa Civil', 'Técnico em Edificações', 'admin', 'Assistente Social', 'Voluntário']
        },
        {
            title: 'Relatórios Gerais',
            description: 'Consolidado de ocupação, doações e movimentações.',
            icon: FileText,
            path: '/abrigos/relatorios',
            color: 'bg-slate-50 text-slate-600',
            allowedRoles: ['Agente de Defesa Civil', 'Técnico em Edificações', 'admin', 'Assistente Social']
        }
    ];

    const filteredItems = menuItems.filter(item => item.allowedRoles.includes(userRole));
    const isAgent = ['Agente de Defesa Civil', 'Técnico em Edificações', 'admin'].includes(userRole);

    return (
        <div className="min-h-screen bg-slate-50 pb-12">
            <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">

                {/* Header */}
                <div className="flex flex-col gap-4">
                    {isAgent && (
                        <button
                            onClick={() => navigate('/')}
                            className="self-start flex items-center gap-2 text-[#2a5299] font-semibold hover:text-blue-800 transition-colors"
                        >
                            <ArrowLeft size={20} />
                            Voltar ao Início
                        </button>
                    )}
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-3xl font-black text-slate-800">Assistência Humanitária</h1>
                            <p className="text-slate-500 mt-2">
                                Selecione uma opção abaixo para gerenciar doações, estoque e abrigos.
                            </p>
                        </div>
                        <span className="text-[8px] font-bold text-slate-300 bg-white border border-slate-100 px-1.5 py-0.5 rounded uppercase tracking-tighter mt-2 shadow-sm">v1.2.1-deploy-sync</span>
                    </div>
                </div>

                {/* Tactical Dashboard Section */}
                {AGENT_ROLES.includes(userRole) && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="flex items-center gap-2 px-1">
                            <BarChart3 size={18} className="text-[#2a5299]" />
                            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">Painel de Indicadores (Agente)</h2>
                        </div>
                        <HumanitarianDashboard />
                    </div>
                )}

                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredItems.map((item, index) => (
                        <Card
                            key={index}
                            onClick={() => navigate(item.path)}
                            className="p-6 cursor-pointer hover:shadow-lg transition-all active:scale-[0.99] group border border-transparent hover:border-slate-200"
                        >
                            <div className="flex items-start gap-4">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${item.color} shadow-sm group-hover:scale-110 transition-transform`}>
                                    <item.icon size={28} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-lg text-slate-800 mb-1 group-hover:text-[#2a5299] transition-colors">{item.title}</h3>
                                    <p className="text-sm text-slate-500 leading-relaxed">
                                        {item.description}
                                    </p>
                                </div>
                                <ChevronRight className="text-slate-300 group-hover:text-[#2a5299] transition-colors self-center" />
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Footer Info */}
                <div className="text-center pt-8 border-t border-slate-200">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        SIGERD - Sistema Integrado de Gestão
                    </p>
                </div>

            </div>
        </div>
    );
}
