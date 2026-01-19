import React, { useState, useEffect } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import { Package, Users, Activity } from 'lucide-react';
import { getGlobalInventory, getShelters } from '../../../services/shelterDb.js';
import { Card } from '../ui/Card.jsx';

const COLORS = ['#2a5299', '#ffc107', '#28a745', '#dc3545', '#6f42c1'];

export const HumanitarianDashboard = () => {
    const [data, setData] = useState({ inventory: [], occupancy: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const inventory = await getGlobalInventory();
            const shelters = await getShelters();

            // Aggregating inventory by name/category
            const aggInventory = inventory.reduce((acc, item) => {
                const existing = acc.find(i => i.name === item.item_name);
                if (existing) {
                    existing.quantity += parseFloat(item.quantity);
                } else {
                    acc.push({ name: item.item_name, quantity: parseFloat(item.quantity) });
                }
                return acc;
            }, []).slice(0, 5); // Top 5 for mobile clarity

            // Occupancy data
            const occupancy = shelters.map(s => ({
                name: s.name.substring(0, 10) + '...',
                current: s.current_occupancy || 0,
                capacity: s.capacity || 0
            })).slice(0, 4);

            setData({ inventory: aggInventory, occupancy });
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="animate-pulse space-y-4">
            <div className="h-48 bg-slate-200 rounded-xl w-full"></div>
            <div className="h-48 bg-slate-200 rounded-xl w-full"></div>
        </div>
    );

    return (
        <div className="space-y-4">
            {/* Inventory Chart */}
            <Card className="p-4 border-none shadow-sm bg-white overflow-hidden">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                        <Package size={18} className="text-[#2a5299]" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-800">Itens Críticos (Total)</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Estoque Municipal Consolidado</p>
                    </div>
                </div>

                <div className="h-48 w-full mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.inventory} layout="vertical" margin={{ left: -20, right: 20 }}>
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="name"
                                type="category"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                                width={80}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '10px' }}
                                cursor={{ fill: '#f8fafc' }}
                            />
                            <Bar dataKey="quantity" fill="#2a5299" radius={[0, 4, 4, 0]} barSize={20}>
                                {data.inventory.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* Occupancy Chart */}
            <Card className="p-4 border-none shadow-sm bg-white overflow-hidden">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                        <Users size={18} className="text-amber-600" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-800">Ocupação de Abrigos</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Status de Capacidade Atual</p>
                    </div>
                </div>

                <div className="h-48 w-full mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.occupancy} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 9, fontWeight: 700 }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '10px' }}
                            />
                            <Bar dataKey="current" fill="#1e3c72" radius={[4, 4, 0, 0]} barSize={30} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>
        </div>
    );
};
