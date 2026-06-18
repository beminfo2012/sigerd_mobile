import React, { useState, useRef } from 'react';
import { X, User, Phone, MapPin, Briefcase, Calendar, CheckSquare, Edit2, Trash2, FileText, UploadCloud, File, ExternalLink, Loader2 } from 'lucide-react';
import { uploadDocumentoTermo } from '../../services/voluntariosService';
import { useToast } from '../../components/ToastNotification';

const VoluntarioViewModal = ({ voluntario, onClose, onEdit, onDelete, onUpdate }) => {
    const [uploadingTermo, setUploadingTermo] = useState(false);
    const fileInputRef = useRef(null);
    const { toast } = useToast();

    if (!voluntario) return null;

    const handleFileUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Basic validation: PDF or Image
        if (!file.type.includes('pdf') && !file.type.includes('image')) {
            toast.error('Formato inválido. Por favor, envie um PDF ou imagem (JPG, PNG).');
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            toast.error('Arquivo muito grande. O tamanho máximo é 5MB.');
            return;
        }

        setUploadingTermo(true);
        try {
            const fileUrl = await uploadDocumentoTermo(voluntario.id, file);
            toast.success('Termo anexado com sucesso!');
            if (onUpdate) {
                onUpdate({ ...voluntario, documento_termo_url: fileUrl });
            }
        } catch (error) {
            toast.error('Erro ao anexar o termo.');
        } finally {
            setUploadingTermo(false);
        }
    };

    const renderField = (label, value) => (
        <div className="mb-4">
            <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-1">{label}</p>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{value || '---'}</p>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/30">
                            {voluntario.nome_completo?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-800 dark:text-white leading-tight">{voluntario.nome_completo}</h2>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5">{voluntario.vinculo}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onEdit}
                            className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-100 transition-colors"
                            title="Editar Voluntário"
                        >
                            <Edit2 size={18} />
                        </button>
                        <button
                            onClick={onDelete}
                            className="p-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 transition-colors"
                            title="Excluir Voluntário"
                        >
                            <Trash2 size={18} />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-200 transition-colors ml-2"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Dados Pessoais */}
                    <section>
                        <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
                            <User size={16} className="text-blue-500" /> Dados Pessoais
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {renderField('CPF', voluntario.cpf)}
                            {renderField('RG', voluntario.rg)}
                            {renderField('Data de Nascimento', voluntario.data_nascimento ? new Date(voluntario.data_nascimento).toLocaleDateString('pt-BR') : '')}
                        </div>
                    </section>

                    {/* Contato e Endereço */}
                    <section>
                        <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
                            <Phone size={16} className="text-emerald-500" /> Contato e Endereço
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {renderField('Telefone / WhatsApp', voluntario.telefone)}
                            {renderField('E-mail', voluntario.email)}
                            {renderField('Contato de Emergência', voluntario.contato_emergencia)}
                            <div className="md:col-span-2">
                                {renderField('Endereço', voluntario.endereco)}
                            </div>
                            {renderField('Bairro', voluntario.bairro)}
                        </div>
                    </section>

                    {/* Áreas de Atuação */}
                    <section>
                        <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
                            <Briefcase size={16} className="text-purple-500" /> Áreas de Atuação
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {voluntario.voluntario_area?.length > 0 ? (
                                voluntario.voluntario_area.map((va, idx) => (
                                    <span key={idx} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                                        {va.areas_atuacao.nome} - {va.nivel_experiencia}
                                    </span>
                                ))
                            ) : (
                                <p className="text-sm font-bold text-slate-400">Nenhuma área cadastrada</p>
                            )}
                        </div>
                    </section>

                    {/* Disponibilidade */}
                    <section>
                        <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
                            <Calendar size={16} className="text-amber-500" /> Disponibilidade
                        </h3>
                        {voluntario.disponibilidade?.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {renderField('Período', voluntario.disponibilidade[0].periodo)}
                                {renderField('Raio de Atuação', voluntario.disponibilidade[0].raio_atuacao)}
                                {renderField('Dias', voluntario.disponibilidade[0].dias_semana?.join(', '))}
                            </div>
                        ) : (
                            <p className="text-sm font-bold text-slate-400">Nenhuma disponibilidade informada</p>
                        )}
                    </section>

                    {/* Informações Complementares */}
                    <section>
                        <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
                            <CheckSquare size={16} className="text-slate-500" /> Complementares
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {renderField('Veículo Próprio', voluntario.veiculo_proprio)}
                            {renderField('Equipamentos', voluntario.equipamentos_proprios)}
                            <div className="md:col-span-2">
                                {renderField('Restrições', voluntario.restricoes)}
                            </div>
                        </div>
                    </section>

                    {/* Termo de Voluntariado */}
                    <section className="mb-4">
                        <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
                            <FileText size={16} className="text-blue-500" /> Termo Assinado
                        </h3>
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${voluntario.documento_termo_url ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                                    <File size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                        {voluntario.documento_termo_url ? 'Termo Anexado' : 'Nenhum termo anexado'}
                                    </p>
                                    <p className="text-xs font-medium text-slate-500">
                                        {voluntario.documento_termo_url ? 'Documento digitalizado salvo no sistema' : 'Faça o upload do termo impresso e assinado'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                {voluntario.documento_termo_url && (
                                    <a
                                        href={voluntario.documento_termo_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 sm:flex-none px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <ExternalLink size={16} /> Ver Arquivo
                                    </a>
                                )}
                                <input
                                    type="file"
                                    accept="image/jpeg, image/png, application/pdf"
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploadingTermo}
                                    className="flex-1 sm:flex-none px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50 rounded-lg text-sm font-bold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {uploadingTermo ? (
                                        <><Loader2 size={16} className="animate-spin" /> Enviando...</>
                                    ) : (
                                        <><UploadCloud size={16} /> {voluntario.documento_termo_url ? 'Substituir' : 'Anexar Documento'}</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default VoluntarioViewModal;
