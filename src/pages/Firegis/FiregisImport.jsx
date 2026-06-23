import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { ArrowLeft, UploadCloud, FileText, CheckCircle, AlertCircle, Play } from 'lucide-react';
import Papa from 'papaparse';
import { toast } from '../../components/ToastNotification';

const FiregisImport = () => {
    const navigate = useNavigate();
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState([]);
    const [processing, setProcessing] = useState(false);

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected) {
            setFile(selected);
            Papa.parse(selected, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    setPreview(results.data.slice(0, 5)); // Show first 5
                }
            });
        }
    };

    const handleImport = async () => {
        if (!file) return;
        setProcessing(true);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                try {
                    const records = results.data.map(row => ({
                        codigo_ocorrencia: row.codigo || row.CODIGO || '',
                        data_ocorrencia: row.data || row.DATA || null,
                        tipo_incendio: row.tipo || row.TIPO || 'Outros',
                        status: row.status || row.STATUS || 'EXTINTO',
                        bairro: row.bairro || row.BAIRRO || '',
                        endereco: row.endereco || row.ENDERECO || '',
                        area_queimada_ha: row.area ? parseFloat(row.area) : null,
                        coordenadas: {
                            lat: row.lat || row.LAT || '',
                            lng: row.lng || row.LNG || row.lon || row.LON || ''
                        }
                    }));

                    const { error } = await supabase.from('firegis').insert(records);
                    if (error) throw error;
                    
                    toast.success('Sucesso', `${records.length} registros importados com sucesso!`);
                    navigate('/firegis');
                } catch (error) {
                    console.error('Erro na importacao:', error);
                    toast.error('Falha na Importação', error.message || 'Verifique o formato do CSV e se a tabela existe.');
                } finally {
                    setProcessing(false);
                }
            }
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-32">
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 sticky top-0 z-20 shadow-sm">
                <div className="max-w-4xl mx-auto flex items-center gap-4">
                    <button onClick={() => navigate('/firegis')} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                        <ArrowLeft size={24} className="text-slate-600 dark:text-slate-300" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                            <UploadCloud className="text-blue-500" /> Importação de Dados CSV
                        </h1>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-4 sm:p-6 mt-4 space-y-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded-r-2xl text-sm text-blue-800 dark:text-blue-300">
                    <p className="font-bold mb-1">Como usar a importação em lote:</p>
                    <p>O seu arquivo CSV deve conter os seguintes cabeçalhos (primeira linha): <strong>codigo, data, tipo, status, bairro, endereco, area, lat, lng</strong>.</p>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-100 dark:border-slate-700 shadow-sm text-center border-dashed border-2">
                    <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" id="csv-upload" />
                    <label htmlFor="csv-upload" className="cursor-pointer flex flex-col items-center justify-center">
                        <div className="w-20 h-20 bg-blue-50 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <FileText size={32} className="text-blue-500" />
                        </div>
                        <h3 className="text-lg font-black text-slate-800 dark:text-white mb-1">
                            {file ? file.name : 'Selecione o arquivo CSV'}
                        </h3>
                        <p className="text-sm text-slate-500">
                            {file ? 'Clique para trocar o arquivo' : 'Formato suportado: .csv'}
                        </p>
                    </label>
                </div>

                {preview.length > 0 && (
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden space-y-4">
                        <h3 className="bg-[#1e3a5f] text-white p-3 font-bold uppercase text-xs tracking-widest flex items-center gap-2 -mx-6 -mt-6 mb-6">
                            Pré-visualização ({preview.length} de X registros)
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 uppercase">
                                        <th className="p-2 font-bold">Código</th>
                                        <th className="p-2 font-bold">Tipo</th>
                                        <th className="p-2 font-bold">Bairro</th>
                                        <th className="p-2 font-bold">Lat/Lng</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {preview.map((row, i) => (
                                        <tr key={i} className="border-b border-slate-100 dark:border-slate-700">
                                            <td className="p-2">{row.codigo || row.CODIGO}</td>
                                            <td className="p-2">{row.tipo || row.TIPO}</td>
                                            <td className="p-2">{row.bairro || row.BAIRRO}</td>
                                            <td className="p-2">{row.lat || row.LAT}, {row.lng || row.LNG}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button 
                                onClick={handleImport} 
                                disabled={processing}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs flex items-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-50 transition-all"
                            >
                                {processing ? <RefreshCcw className="animate-spin" size={16} /> : <Play size={16} />}
                                Iniciar Importação
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FiregisImport;
