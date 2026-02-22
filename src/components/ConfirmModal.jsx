import React, { useState } from 'react';
import { AlertCircle, ShieldAlert, X } from 'lucide-react';

const ConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Tem certeza?",
    message = "Esta ação não pode ser desfeita.",
    confirmText = "Excluir",
    cancelText = "Cancelar",
    type = "danger",
    requireTypedConfirmation = false,
    typedConfirmationWord = "CONFIRMAR"
}) => {
    const [typedValue, setTypedValue] = useState('');

    if (!isOpen) return null;

    const canConfirm = requireTypedConfirmation
        ? typedValue.trim().toUpperCase() === typedConfirmationWord.toUpperCase()
        : true;

    const handleConfirm = () => {
        if (!canConfirm) return;
        setTypedValue('');
        onConfirm();
        onClose();
    };

    const handleClose = () => {
        setTypedValue('');
        onClose();
    };

    const Icon = requireTypedConfirmation ? ShieldAlert : AlertCircle;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 z-[100] animate-in fade-in duration-300" onClick={handleClose}>
            <div
                className="bg-white dark:bg-slate-900 rounded-[32px] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 border border-white/20 dark:border-slate-800"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-center mb-6">
                    <div className={`p-5 rounded-3xl ${type === 'danger' ? 'bg-red-50 dark:bg-red-500/10' : 'bg-blue-50 dark:bg-blue-500/10'} ring-8 ${type === 'danger' ? 'ring-red-50/50 dark:ring-red-500/5' : 'ring-blue-50/50 dark:ring-blue-500/5'}`}>
                        <Icon className={type === 'danger' ? 'text-red-600 dark:text-red-500' : 'text-blue-600 dark:text-blue-500'} size={32} />
                    </div>
                </div>

                <div className="text-center space-y-3 mb-8">
                    <h3 className="text-2xl font-black text-slate-800 dark:text-white leading-tight tracking-tight">
                        {title}
                    </h3>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed px-2">
                        {message}
                    </p>
                </div>

                {requireTypedConfirmation && (
                    <div className="mb-8">
                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 text-center">
                            Digite <span className="text-red-600 dark:text-red-400">{typedConfirmationWord}</span> para confirmar
                        </label>
                        <input
                            type="text"
                            value={typedValue}
                            onChange={e => setTypedValue(e.target.value)}
                            placeholder={typedConfirmationWord}
                            autoFocus
                            className="w-full px-4 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white font-mono text-center text-lg tracking-[0.2em] focus:outline-none focus:border-red-400 dark:focus:border-red-500/50 transition-all placeholder:opacity-30"
                        />
                    </div>
                )}

                <div className="flex flex-col gap-3">
                    <button
                        onClick={handleConfirm}
                        disabled={!canConfirm}
                        className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg
                            ${canConfirm
                                ? (type === 'danger'
                                    ? 'bg-red-600 hover:bg-red-700 shadow-red-500/30 active:scale-[0.98]'
                                    : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30 active:scale-[0.98]')
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none'}`}
                    >
                        {confirmText}
                    </button>
                    <button
                        onClick={handleClose}
                        className="w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all hover:text-slate-600 dark:hover:text-slate-300"
                    >
                        {cancelText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
