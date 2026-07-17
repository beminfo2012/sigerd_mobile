import React, { useState } from 'react';
import { BookOpen, ExternalLink, GripVertical, Trash2, Edit2, AlertCircle, Check } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

// Helper to determine category based on type
const getCategory = (tipo) => {
  const t = (tipo || '').toLowerCase();
  if (t.includes('lei') || t.includes('decreto')) return 'Legislação';
  if (t.includes('nbr') || t.includes('norma técnica')) return 'Normas Técnicas';
  if (t.includes('nota técnica')) return 'Notas Técnicas';
  if (t.includes('acórdão') || t.includes('jurisprudência')) return 'Jurisprudência';
  if (t.includes('manual')) return 'Manuais';
  if (t.includes('parecer') || t.includes('relatório')) return 'Pareceres e Casos Similares';
  return 'Outros Documentos';
};

export default function DocumentReferencesManager({ referencias = [], onChange }) {
  const [editingId, setEditingId] = useState(null);
  const [editDesc, setEditDesc] = useState('');

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(referencias);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    onChange(items);
  };

  const removeReference = (id) => {
    onChange(referencias.filter(ref => ref.id !== id));
  };

  const startEdit = (ref) => {
    setEditingId(ref.id);
    setEditDesc(ref.descricao_uso || ref.ementa || '');
  };

  const saveEdit = (id) => {
    onChange(referencias.map(ref => 
      ref.id === id ? { ...ref, descricao_uso: editDesc } : ref
    ));
    setEditingId(null);
  };

  if (referencias.length === 0) {
    return (
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 text-center">
        <BookOpen size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
        <p className="text-sm font-bold text-slate-600 dark:text-slate-400">Nenhuma referência técnica ou jurídica adicionada.</p>
        <p className="text-xs text-slate-500 mt-1">Utilize o botão NORTIS acima para pesquisar e anexar fundamentações a este documento.</p>
      </div>
    );
  }

  // Group references for display
  const grouped = referencias.reduce((acc, ref) => {
    const cat = ref.categoria || getCategory(ref.tipo);
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(ref);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([categoria, refs], catIndex) => (
        <div key={categoria} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
          <div className="bg-slate-100 dark:bg-slate-700/50 px-4 py-2 border-b border-slate-200 dark:border-slate-700">
            <h4 className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest text-xs">
              {categoria}
            </h4>
          </div>
          
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId={`droppable-${catIndex}`}>
              {(provided) => (
                <div 
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="divide-y divide-slate-100 dark:divide-slate-700/50"
                >
                  {refs.map((ref, index) => (
                    <Draggable key={ref.id} draggableId={ref.id.toString()} index={referencias.findIndex(r => r.id === ref.id)}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`p-4 flex items-start gap-3 transition-colors ${snapshot.isDragging ? 'bg-indigo-50/80 dark:bg-indigo-900/20' : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750'}`}
                        >
                          <div {...provided.dragHandleProps} className="mt-1 text-slate-400 hover:text-slate-600 cursor-grab">
                            <GripVertical size={16} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="font-black text-slate-800 dark:text-slate-100 text-sm">
                                {ref.tipo?.toUpperCase()} Nº {ref.numero}{ref.ano ? `/${ref.ano}` : ''}
                              </span>
                              {ref.ambito && (
                                <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase">
                                  {ref.ambito}
                                </span>
                              )}
                            </div>
                            
                            {editingId === ref.id ? (
                              <div className="mt-2 flex gap-2">
                                <textarea
                                  value={editDesc}
                                  onChange={(e) => setEditDesc(e.target.value)}
                                  className="flex-1 text-sm p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
                                  rows={3}
                                  placeholder="Descreva como esta norma foi utilizada..."
                                />
                                <button onClick={() => saveEdit(ref.id)} className="p-2 bg-green-100 text-green-700 rounded hover:bg-green-200 h-fit">
                                  <Check size={16} />
                                </button>
                              </div>
                            ) : (
                              <p className="text-sm text-slate-600 dark:text-slate-400 italic">
                                {ref.descricao_uso || ref.ementa}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-col gap-2 shrink-0">
                            <div className="flex gap-1">
                              <button
                                onClick={() => startEdit(ref)}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded transition-colors"
                                title="Editar descrição"
                              >
                                <Edit2 size={14} />
                              </button>
                              {ref.url_fonte_oficial && (
                                <a
                                  href={ref.url_fonte_oficial}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                                  title="Ver na fonte oficial"
                                >
                                  <ExternalLink size={14} />
                                </a>
                              )}
                              <button
                                onClick={() => removeReference(ref.id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                                title="Remover referência"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      ))}
    </div>
  );
}
