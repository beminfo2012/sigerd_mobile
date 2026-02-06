import React from 'react';
import { AlertCircle, X } from 'lucide-react';

const ConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Tem certeza?",
    message = "Esta ação não pode ser desfeita.",
    confirmText = "Excluir",
    cancelText = "Cancelar",
    type = "danger"
}) => {
    if (!isOpen) return null;

    const baseColor = type === 'danger' ? 'red' : 'blue';

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-5 z-[100] animate-in fade-in duration-200" onClick={onClose}>
            <div
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-slate-800"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-2xl ${type === 'danger' ? 'bg-red-50 dark:bg-red-500/10' : 'bg-blue-50 dark:bg-blue-500/10'}`}>
                        <AlertCircle className={type === 'danger' ? 'text-red-600 dark:text-red-500' : 'text-blue-600 dark:text-blue-500'} size={28} />
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-2 mb-8">
                    <h3 className="text-xl font-black text-slate-800 dark:text-white leading-tight">
                        {title}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                        {message}
                    </p>
                </div>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg active:scale-[0.98] transition-all
                            ${type === 'danger'
                                ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20'
                                : 'bg-[#2a5299] hover:bg-[#1e3c72] shadow-blue-500/20'}`}
                    >
                        {confirmText}
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full py-4 rounded-2xl font-bold text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                        {cancelText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
