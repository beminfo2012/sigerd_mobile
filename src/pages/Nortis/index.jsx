import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Book, Search, Plus, Filter, FileText, ArrowLeft } from 'lucide-react';
import NortisSearch from './NortisSearch';
import NortisForm from './NortisForm';
import NortisView from './NortisView';

const NortisMenu = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/')}
            className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-600 dark:text-slate-400 shrink-0"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white leading-tight">
              NORTIS
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Central de Legislação e Apoio Técnico-Jurídico
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/nortis/busca')}
            className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600 transition-all gap-3"
          >
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-full text-indigo-600 dark:text-indigo-400">
              <Search size={32} />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-slate-800 dark:text-white text-lg">Consulta Normativa</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Buscar leis, decretos, NBRs e pareceres</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/nortis/novo')}
            className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:teal-300 dark:hover:border-teal-600 transition-all gap-3"
          >
            <div className="p-3 bg-teal-50 dark:bg-teal-900/30 rounded-full text-teal-600 dark:text-teal-400">
              <Plus size={32} />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-slate-800 dark:text-white text-lg">Cadastrar Documento</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Adicionar nova legislação ou norma ao acervo</p>
            </div>
          </button>
        </div>
      </main>
    </div>
  );
};

export default function NortisModule() {
  return (
    <Routes>
      <Route path="/" element={<NortisMenu />} />
      <Route path="/busca" element={<NortisSearch />} />
      <Route path="/novo" element={<NortisForm />} />
      <Route path="/editar/:id" element={<NortisForm />} />
      <Route path="/visualizar/:id" element={<NortisView />} />
    </Routes>
  );
}
