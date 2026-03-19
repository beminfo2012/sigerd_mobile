import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { ChevronDown, Search, Plus, Bell, Settings, HelpCircle, ShieldAlert, Map as MapIcon, Users, Truck, MessageSquare, CheckSquare, Clock, AlertTriangle, X, Activity, Trash2, Edit2 } from 'lucide-react';
import './index.css';

// --- DATA TYPES ---
type Status = 'Disponível' | 'Em campo' | 'Crítico';

interface Personnel {
  id: string;
  name: string;
  role: string;
  status: Status;
  avatar: string;
  hoursActive: number; 
}

interface Resource {
  id: string;
  name: string;
  type: string;
  status: Status;
}

interface Task {
  id: string;
  text: string;
  done: boolean;
}

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  time: string;
}

interface OrgNode {
  id: string;
  title: string;
  colorClass: string;
  assigneeId: string | null;
  resources: string[];
  tasks: Task[];
  messages: ChatMessage[];
  children: OrgNode[];
}

interface LogEntry {
  id: string;
  time: string;
  text: string;
}

// --- INITIAL DATA ---
const INITIAL_PERSONNEL: Personnel[] = [
  { id: 'p1', name: 'João Silva', role: 'Comando', status: 'Disponível', avatar: 'https://i.pravatar.cc/150?u=p1', hoursActive: 8 },
  { id: 'p2', name: 'Maria Souza', role: 'Operações', status: 'Em campo', avatar: 'https://i.pravatar.cc/150?u=p2', hoursActive: 13 },
  { id: 'p3', name: 'Fernanda Borges', role: 'Logística', status: 'Disponível', avatar: 'https://i.pravatar.cc/150?u=p3', hoursActive: 4 },
  { id: 'p4', name: 'Joana Almeida', role: 'Defesa Civil', status: 'Disponível', avatar: 'https://i.pravatar.cc/150?u=p4', hoursActive: 2 },
  { id: 'p5', name: 'Rafael Oliveira', role: 'Obras', status: 'Em campo', avatar: 'https://i.pravatar.cc/150?u=p5', hoursActive: 10 },
  { id: 'p6', name: 'Carla Ferreira', role: 'Assistência Social', status: 'Em campo', avatar: 'https://i.pravatar.cc/150?u=p6', hoursActive: 14 },
  { id: 'p7', name: 'Ana Souza', role: 'Defesa Civil', status: 'Disponível', avatar: 'https://i.pravatar.cc/150?u=p7', hoursActive: 0 },
  { id: 'p8', name: 'José Martins', role: 'Saúde', status: 'Disponível', avatar: 'https://i.pravatar.cc/150?u=p8', hoursActive: 5 },
  { id: 'p9', name: 'Bruno Lima', role: 'Planejamento', status: 'Disponível', avatar: 'https://i.pravatar.cc/150?u=p9', hoursActive: 7 },
  { id: 'p10', name: 'Marcelo Dias', role: 'Finanças', status: 'Disponível', avatar: 'https://i.pravatar.cc/150?u=p10', hoursActive: 3 },
];

const INITIAL_RESOURCES: Resource[] = [
  { id: 'r1', name: 'Ambulância UTI 01', type: 'Veículo', status: 'Disponível' },
  { id: 'r2', name: 'Caminhão-Pipa XYZ', type: 'Veículo', status: 'Em campo' },
  { id: 'r3', name: 'Retroescavadeira 4', type: 'Equipamento', status: 'Disponível' },
  { id: 'r4', name: 'Kits (100)', type: 'Suprimento', status: 'Disponível' },
  { id: 'r5', name: 'Helicóptero', type: 'Veículo', status: 'Disponível' },
];

const INITIAL_TREE: OrgNode = {
  id: 'node-comando',
  title: 'Comando',
  colorClass: 'node-bg-yellow',
  assigneeId: 'p1', 
  resources: [],
  tasks: [{ id: 't1', text: 'Declarar Situação de Emergência', done: true }],
  messages: [{ id: 'm1', sender: 'Sistema', text: 'Operação iniciada.', time: '08:00' }],
  children: [
    {
      id: 'node-operacoes',
      title: 'Operações',
      colorClass: 'node-bg-orange',
      assigneeId: 'p2', 
      resources: ['r5'],
      tasks: [{ id: 't2', text: 'Evacuar área ribeirinha', done: false }, { id: 't3', text: 'Resgate na encosta', done: false }],
      messages: [{ id: 'm2', sender: 'João Silva', text: 'Foco na encosta sul!', time: '09:15' }],
      children: [
        { id: 'node-op-1', title: 'Equipe 1', colorClass: '', assigneeId: null, resources: [], tasks: [], messages: [], children: [] },
        { id: 'node-op-2', title: 'Equipe 2', colorClass: '', assigneeId: 'p6', resources: ['r2'], tasks: [], messages: [], children: [] }, 
      ],
    },
    {
      id: 'node-planejamento',
      title: 'Planejamento',
      colorClass: 'node-bg-blue',
      assigneeId: 'p9',
      resources: [],
      tasks: [{ id: 't4', text: 'Mapear novas áreas', done: false }],
      messages: [],
      children: [
        { id: 'node-plan-1', title: 'Assessores', colorClass: '', assigneeId: null, resources: [], tasks: [], messages: [], children: [] },
      ],
    },
    {
      id: 'node-logistica',
      title: 'Logística',
      colorClass: 'node-bg-green',
      assigneeId: 'p3',
      resources: ['r4'],
      tasks: [{ id: 't5', text: 'Montar ginásio como abrigo', done: true }],
      messages: [],
      children: [
        { id: 'node-log-1', title: 'Transporte', colorClass: '', assigneeId: null, resources: [], tasks: [], messages: [], children: [] },
        { id: 'node-log-2', title: 'Abrigos', colorClass: '', assigneeId: null, resources: [], tasks: [], messages: [], children: [] },
      ],
    },
    {
      id: 'node-financas',
      title: 'Finanças',
      colorClass: 'node-bg-teal',
      assigneeId: 'p10',
      resources: [],
      tasks: [],
      messages: [],
      children: [],
    },
  ],
};

const getPerson = (id: string | null, personnelList: Personnel[]) => 
  id ? personnelList.find(p => p.id === id) : null;
const getResource = (id: string, resourceList: Resource[]) => 
  resourceList.find(r => r.id === id);

const findNodeRecursively = (node: OrgNode, id: string): OrgNode | null => {
  if (node.id === id) return node;
  for (const child of node.children) {
    const found = findNodeRecursively(child, id);
    if (found) return found;
  }
  return null;
};

const deleteNodeRecursively = (node: OrgNode, idToDelete: string): boolean => {
  const index = node.children.findIndex(c => c.id === idToDelete);
  if (index >= 0) {
    node.children.splice(index, 1);
    return true;
  }
  for (const child of node.children) {
    if (deleteNodeRecursively(child, idToDelete)) return true;
  }
  return false;
};

const getAllAssigneesAndResources = (node: OrgNode): { personnelIds: string[], resourceIds: string[] } => {
  let personnelIds: string[] = [];
  let resourceIds: string[] = [];
  
  if (node.assigneeId) personnelIds.push(node.assigneeId);
  if (node.resources) resourceIds.push(...node.resources);
  
  node.children.forEach(c => {
    const childRes = getAllAssigneesAndResources(c);
    personnelIds.push(...childRes.personnelIds);
    resourceIds.push(...childRes.resourceIds);
  });
  return { personnelIds, resourceIds };
};

export default function App() {
  const [personnel] = useState<Personnel[]>(INITIAL_PERSONNEL);
  const [resources] = useState<Resource[]>(INITIAL_RESOURCES);
  const [tree, setTree] = useState<OrgNode>(INITIAL_TREE);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'pessoas' | 'recursos'>('pessoas');
  
  const [viewMode, setViewMode] = useState<'org' | 'map'>('org');
  const [selectedNode, setSelectedNode] = useState<OrgNode | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: 'l1', time: '08:00', text: 'Operação Calamidade Iniciada.' }
  ]);
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');

  const { personnelIds: assignedIds, resourceIds: assignedResIds } = getAllAssigneesAndResources(tree);
  const assignedSet = new Set(assignedIds);
  const assignedResSet = new Set(assignedResIds);

  const availablePersonnel = personnel.filter(
    (p) => !assignedSet.has(p.id) && p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const availableResources = resources.filter(
    (r) => !assignedResSet.has(r.id) && r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addLog = (text: string) => {
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    setLogs(prev => [{ id: Date.now().toString(), time, text }, ...prev]);
  };

  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId, type } = result;

    if (!destination) return; 

    if (destination.droppableId.startsWith('sidebar-list')) {
      if (!source.droppableId.startsWith('sidebar-list')) {
        setTree((oldTree) => {
          const newTree = JSON.parse(JSON.stringify(oldTree));
          const sourceNode = findNodeRecursively(newTree, source.droppableId);
          if (sourceNode) {
            if (type === 'person') {
              const person = getPerson(sourceNode.assigneeId, personnel);
              sourceNode.assigneeId = null;
              addLog(`${person?.name} recuado de ${sourceNode.title}.`);
            } else if (type === 'resource') {
               sourceNode.resources = sourceNode.resources.filter((r:string) => r !== draggableId);
               const res = getResource(draggableId, resources);
               addLog(`${res?.name} recolhido de ${sourceNode.title}.`);
            }
          }
          if (selectedNode?.id === sourceNode?.id) setSelectedNode(sourceNode);
          return newTree;
        });
      }
      return;
    }

    const targetNodeId = destination.droppableId;

    setTree((oldTree) => {
      const newTree = JSON.parse(JSON.stringify(oldTree));
      const destNode = findNodeRecursively(newTree, targetNodeId);

      if (!destNode) return oldTree;

      if (type === 'person') {
        let sourceNode = findNodeRecursively(newTree, source.droppableId);
        
        if (sourceNode) {
           if (destNode.assigneeId) {
             sourceNode.assigneeId = destNode.assigneeId;
           } else {
             sourceNode.assigneeId = null;
           }
        }
        destNode.assigneeId = draggableId;
        const person = getPerson(draggableId, personnel);
        addLog(`${person?.name} acionado em ${destNode.title}.`);
      } else if (type === 'resource') {
        let sourceNode = findNodeRecursively(newTree, source.droppableId);
        if (sourceNode) {
          sourceNode.resources = sourceNode.resources.filter((r:string) => r !== draggableId);
        }
        if (!destNode.resources) destNode.resources = [];
        if (!destNode.resources.includes(draggableId)) {
           destNode.resources.push(draggableId);
           const res = getResource(draggableId, resources);
           addLog(`Recurso ${res?.name} em ${destNode.title}.`);
        }
      }
      
      if (selectedNode && (selectedNode.id === destNode.id || selectedNode.id === source.droppableId)) {
        setTimeout(() => setSelectedNode(findNodeRecursively(newTree, selectedNode.id)), 0);
      }
      
      return newTree;
    });
  };

  const toggleTask = (nodeId: string, taskId: string) => {
    setTree(oldTree => {
      const newTree = JSON.parse(JSON.stringify(oldTree));
      const node = findNodeRecursively(newTree, nodeId);
      if (node) {
        const t = node.tasks.find((task: Task) => task.id === taskId);
        if (t) {
            t.done = !t.done;
            addLog(`Tarefa concluida: ${t.text}`);
        }
      }
      setTimeout(() => setSelectedNode(findNodeRecursively(newTree, selectedNode?.id || '')), 0);
      return newTree;
    });
  };

  const sendChatMessage = (nodeId: string) => {
    if (!chatInput.trim()) return;
    setTree(oldTree => {
      const newTree = JSON.parse(JSON.stringify(oldTree));
      const node = findNodeRecursively(newTree, nodeId);
      if (node) {
        const now = new Date();
        const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        node.messages.push({
          id: Date.now().toString(),
          sender: 'Comandante João',
          text: chatInput.trim(),
          time
        });
      }
      setTimeout(() => setSelectedNode(findNodeRecursively(newTree, selectedNode?.id || '')), 0);
      return newTree;
    });
    setChatInput('');
  };

  // --- Dynamic Node Management ---
  const addChildNode = (parentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const title = window.prompt("Digite o nome da nova equipe ou setor (Abaixo):");
    if (!title?.trim()) return;

    setTree(oldTree => {
      const newTree = JSON.parse(JSON.stringify(oldTree));
      const parent = findNodeRecursively(newTree, parentId);
      if (parent) {
         parent.children.push({
           id: `node-${Date.now()}`,
           title: title.trim(),
           colorClass: '',
           assigneeId: null,
           resources: [],
           tasks: [],
           messages: [],
           children: []
         });
         addLog(`Novo setor subordinado criado: ${title.trim()}`);
      }
      return newTree;
    });
  };

  const addSiblingNode = (targetNodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (targetNodeId === 'node-comando') return;
    const title = window.prompt("Digite o nome do novo setor lateral (Ao Lado):");
    if (!title?.trim()) return;

    setTree(oldTree => {
      const newTree = JSON.parse(JSON.stringify(oldTree));
      
      const insertAsSibling = (node: OrgNode, targetId: string): boolean => {
        const index = node.children.findIndex(c => c.id === targetId);
        if (index >= 0) {
          node.children.splice(index + 1, 0, {
            id: `node-${Date.now()}`,
            title: title.trim(),
            colorClass: '', 
            assigneeId: null,
            resources: [],
            tasks: [],
            messages: [],
            children: []
          });
          return true;
        }
        for (const child of node.children) {
          if (insertAsSibling(child, targetId)) return true;
        }
        return false;
      };
      
      const success = insertAsSibling(newTree, targetNodeId);
      if (success) addLog(`Novo setor lateral criado: ${title.trim()}`);
      
      return newTree;
    });
  };

  const removeNode = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (nodeId === 'node-comando') return; // Cannot delete root
    if (window.confirm("Deseja realmente remover permanentemente este setor e suas subdivisões?")) {
      setTree(oldTree => {
        const newTree = JSON.parse(JSON.stringify(oldTree));
        const removed = deleteNodeRecursively(newTree, nodeId);
        if (removed) addLog(`Setor removido do organograma.`);
        return newTree;
      });
    }
  };

  const renameNode = (nodeId: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newTitle = window.prompt("Renomear setor:", currentTitle);
    if (!newTitle?.trim() || newTitle === currentTitle) return;

    setTree(oldTree => {
      const newTree = JSON.parse(JSON.stringify(oldTree));
      const node = findNodeRecursively(newTree, nodeId);
      if (node) {
         node.title = newTitle.trim();
         addLog(`Setor renomeado para: ${newTitle.trim()}`);
      }
      return newTree;
    });
  };

  const getStatusColorClass = (status: Status) => {
    switch (status) {
      case 'Disponível': return 'status-dot-green';
      case 'Em campo': return 'status-dot-yellow';
      case 'Crítico': return 'status-dot-red';
      default: return 'status-dot-gray';
    }
  };

  const TopBar = () => (
    <div className="sco-topbar">
      <div className="topbar-left">
        <ShieldAlert className="icon-shield" />
        <span className="topbar-title">SCO Digital</span>
        <div className="badge badge-yellow">Plano Ativo</div>
        <div className="badge badge-red badge-flex"><AlertTriangle size={12}/> Nível Calamidade</div>
      </div>
      
      <div className="view-toggle">
         <button 
           onClick={() => setViewMode('org')} 
           className={`view-toggle-btn ${viewMode === 'org' ? 'active' : ''}`}
         >
           <Users size={16}/> Organograma
         </button>
         <button 
           onClick={() => setViewMode('map')} 
           className={`view-toggle-btn ${viewMode === 'map' ? 'active' : ''}`}
         >
           <MapIcon size={16}/> Painel Tático
         </button>
      </div>

      <div className="topbar-right">
        <div className="user-profile">
          <img src={personnel[0].avatar} alt="avatar" />
          Comandante: João Silva
        </div>
        <div className="topbar-icons">
          <Bell size={18} />
          <Settings size={18} />
        </div>
        <button className="btn-end-operation">
          Encerrar Operação
        </button>
      </div>
    </div>
  );

  const NodeDetailsModal = () => {
    if (!selectedNode) return null;
    const person = getPerson(selectedNode.assigneeId, personnel);

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className={`modal-header ${selectedNode.colorClass || 'node-bg-gray'}`}>
             <div className="modal-header-title">
                <span>{selectedNode.title}</span>
                {person && <span className="modal-subtitle">/ Resp: {person.name}</span>}
             </div>
             <button onClick={() => setSelectedNode(null)} className="btn-close"><X size={20}/></button>
          </div>
          
          <div className="modal-body">
             <div className="modal-tasks-col">
                <h3 className="modal-section-title">
                  <CheckSquare size={18} color="#3b82f6"/>
                  Quadro de Tarefas
                </h3>
                
                <div className="task-list">
                  {selectedNode.tasks?.length === 0 ? (
                    <p className="empty-hint">Nenhuma tarefa atribuída.</p>
                  ) : selectedNode.tasks?.map(task => (
                    <div key={task.id} className="task-item">
                       <input 
                         type="checkbox" 
                         checked={task.done} 
                         onChange={() => toggleTask(selectedNode.id, task.id)}
                         className="task-checkbox"
                       />
                       <span className={`task-text ${task.done ? 'done' : ''}`}>{task.text}</span>
                    </div>
                  ))}
                  <button className="btn-add-task">
                    <Plus size={14}/> Nova Tarefa
                  </button>
                </div>

                <h3 className="modal-section-title">
                  <Truck size={18} color="#22c55e"/>
                  Recursos Alocados ({selectedNode.resources?.length || 0})
                </h3>
                <div className="assigned-resources-grid">
                   {selectedNode.resources?.map(rId => {
                      const res = getResource(rId, resources);
                      return res ? (
                        <div key={rId} className="resource-tag">
                          <Truck size={12}/> {res.name}
                        </div>
                      ) : null;
                   })}
                   {(!selectedNode.resources || selectedNode.resources.length === 0) && (
                     <p className="empty-hint">Nenhum recurso alocado.</p>
                   )}
                </div>
             </div>

             <div className="modal-chat-col">
                <div className="chat-header">
                  <MessageSquare size={16} color="#a855f7"/>
                  Comunicação Direta
                </div>
                <div className="chat-messages">
                   {selectedNode.messages.length === 0 ? (
                     <p className="empty-hint chat-empty">Nenhuma mensagem neste canal.</p>
                   ) : selectedNode.messages.map(msg => (
                     <div key={msg.id} className={`chat-bubble-wrapper ${msg.sender === 'Comandante João' ? 'mine' : 'theirs'}`}>
                        <div className="chat-bubble-meta">
                          {msg.sender !== 'Comandante João' && <span>{msg.sender}</span>}
                          <span>{msg.time}</span>
                        </div>
                        <div className={`chat-bubble ${msg.sender === 'Comandante João' ? 'mine' : 'theirs'}`}>
                           {msg.text}
                        </div>
                     </div>
                   ))}
                </div>
                <div className="chat-input-area">
                   <input 
                     type="text" 
                     className="chat-input" 
                     placeholder="Mensagem..."
                     value={chatInput}
                     onChange={(e) => setChatInput(e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && sendChatMessage(selectedNode.id)}
                   />
                   <button onClick={() => sendChatMessage(selectedNode.id)} className="btn-chat-send">Enviar</button>
                </div>
             </div>
          </div>
        </div>
      </div>
    );
  };

  const NodeCard = ({ node, isLeaf }: { node: OrgNode, isLeaf?: boolean }) => {
    const person = getPerson(node.assigneeId, personnel);
    const nodeResources = node.resources || [];
    const pendingTasks = node.tasks?.filter(t => !t.done).length || 0;
    const isFatigued = person && person.hoursActive > 12;

    return (
      <div className="org-node-container relative group">
        <Droppable droppableId={node.id} type="person" isCombineEnabled={false}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`org-node-card ${snapshot.isDraggingOver ? 'dragging-over' : ''} ${isLeaf ? 'is-leaf' : ''}`}
              onClick={(e) => { e.stopPropagation(); setSelectedNode(node); }}
            >
              <div className={`org-node-header ${node.colorClass || 'node-bg-gray'}`}>
                {node.title}
                <div className="header-actions">
                  {pendingTasks > 0 && (
                    <span className="task-badge" title={`${pendingTasks} tarefas pendentes`}>
                      {pendingTasks}
                    </span>
                  )}
                  {/* Subtle Node editing actions */}
                  <div className="node-tools">
                    <button className="tool-btn" onClick={(e) => renameNode(node.id, node.title, e)} title="Renomear"><Edit2 size={12}/></button>
                    {node.id !== 'node-comando' && (
                       <button className="tool-btn hover:text-red-200" onClick={(e) => removeNode(node.id, e)} title="Excluir"><Trash2 size={12}/></button>
                    )}
                  </div>
                </div>
              </div>

              <div className={`org-node-content content-layered ${!person ? 'is-empty' : ''}`}>
                {person ? (
                  <Draggable draggableId={person.id} index={0}>
                    {(dragProvided, dragSnapshot) => (
                      <div
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        {...dragProvided.dragHandleProps}
                        className={`person-row ${dragSnapshot.isDragging ? 'is-dragging' : ''}`}
                        onClick={(e) => e.stopPropagation()} 
                      >
                        <div className="avatar-wrapper">
                          <img src={person.avatar} alt={person.name} />
                          <div className={`status-dot ${getStatusColorClass(person.status)}`} />
                          {isFatigued && (
                             <div className="fatigue-badge" title="Perigo: Fadiga">
                               <Clock size={12} />
                             </div>
                          )}
                        </div>
                        <div className="person-info person-info-dense">
                          <div className="person-name">{person.name}</div>
                          <div className="person-role-meta">
                            {isLeaf ? node.title : `Ch. ${node.title}`}
                            {isFatigued && <span className="fatigue-text">[{person.hoursActive}h]</span>}
                          </div>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ) : (
                  <div className="empty-slot small-empty-slot">
                    + Atribuir Agente
                  </div>
                )}
                {provided.placeholder}

                <Droppable droppableId={`res-${node.id}`} type="resource">
                  {(resProvided, resSnapshot) => (
                    <div 
                      ref={resProvided.innerRef} 
                      {...resProvided.droppableProps}
                      className={`resource-drop-zone ${resSnapshot.isDraggingOver ? 'active' : ''}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                       {nodeResources.length > 0 ? (
                         <div className="resource-mini-list">
                           {nodeResources.map((resId, index) => {
                             const res = getResource(resId, resources);
                             return res ? (
                               <Draggable key={resId} draggableId={resId} index={index}>
                                 {(dragProv) => (
                                   <div 
                                      ref={dragProv.innerRef} 
                                      {...dragProv.draggableProps} 
                                      {...dragProv.dragHandleProps}
                                      className="resource-mini-card"
                                      title={res.name}
                                   >
                                      <Truck size={10}/> {res.name.substring(0,6)}..
                                   </div>
                                 )}
                               </Draggable>
                             ) : null;
                           })}
                         </div>
                       ) : (
                         <div className="empty-resource-hint">
                           Nenhum recurso fixo
                         </div>
                       )}
                       {resProvided.placeholder}
                    </div>
                  )}
                </Droppable>

              </div>
              
              {/* Add Child Node Button (Floating) */}
              <button 
                 className="add-child-btn group-hover:opacity-100 opacity-0 transition-opacity" 
                 onClick={(e) =>addChildNode(node.id, e)}
                 title="Adicionar subordinado (Abaixo)"
              >
                 <Plus strokeWidth={3} size={14}/>
              </button>

              {/* Add Sibling Node Button (Floating) */}
              {node.id !== 'node-comando' && (
                <button 
                   className="add-sibling-btn group-hover:opacity-100 opacity-0 transition-opacity" 
                   onClick={(e) => addSiblingNode(node.id, e)}
                   title="Adicionar setor paralelo (Ao Lado)"
                >
                   <Plus strokeWidth={3} size={14}/>
                </button>
              )}
            </div>
          )}
        </Droppable>
      </div>
    );
  };

  const OrgTree = ({ node }: { node: OrgNode }) => {
    return (
      <div className="org-tree-wrapper">
        <div className="org-tree-node-container node-container-interactive">
          <NodeCard node={node} isLeaf={node.children.length === 0 && node.id !== 'node-comando'} />
        </div>

        {node.children.length > 0 && (
          <div className="org-tree-children">
            <div className="org-line-vertical-top"></div>
            <div className="org-line-horizontal"></div>
            {node.children.map((child) => (
              <div key={child.id} className="org-tree-child">
                <div className="org-line-vertical-bottom"></div>
                <OrgTree node={child} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const Sidebar = () => (
    <div className="sco-sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-title">
           <Activity size={16} style={{marginRight: '8px'}} /> Central de Controle
        </h2>
        <ChevronDown size={16} />
      </div>

      <div className="sidebar-tabs">
        <button 
          className={`sidebar-tab ${activeTab === 'pessoas' ? 'active tab-blue' : ''}`}
          onClick={() => setActiveTab('pessoas')}
        >
          Agentes
        </button>
        <button 
          className={`sidebar-tab ${activeTab === 'recursos' ? 'active tab-green' : ''}`}
          onClick={() => setActiveTab('recursos')}
        >
          Recursos
        </button>
      </div>

      <div className="sidebar-content">
        <div className="search-wrapper">
          <input 
            type="text" 
            placeholder={`Buscar ${activeTab === 'pessoas' ? 'agente' : 'recurso'}...`}
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search size={16} className="search-icon" />
        </div>

        {activeTab === 'pessoas' ? (
          <Droppable droppableId="sidebar-list-p" type="person">
            {(provided, snapshot) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className={`sidebar-list ${snapshot.isDraggingOver ? 'dragging-over-list' : ''}`}>
                {availablePersonnel.length === 0 && <div className="empty-message">Nenhum agente livre.</div>}
                
                {availablePersonnel.map((person, index) => (
                  <Draggable key={person.id} draggableId={person.id} index={index}>
                    {(dragProvided, dragSnapshot) => (
                      <div
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        {...dragProvided.dragHandleProps}
                        className={`sidebar-person-card ${dragSnapshot.isDragging ? 'is-dragging' : ''}`}
                      >
                         <div className="sidebar-avatar-wrapper">
                          <img src={person.avatar} alt={person.name} />
                          {person.hoursActive > 12 && (
                             <div className="fatigue-badge-sidebar"><Clock size={10}/></div>
                          )}
                        </div>
                        <div className="sidebar-person-info">
                          <div className="sidebar-person-name">{person.name}</div>
                          <div className="sidebar-person-role">{person.role} | {person.hoursActive}h ativos</div>
                        </div>
                        <div className={`sidebar-status-tag ${
                          person.status === 'Disponível' ? 'tag-green' : person.status === 'Em campo' ? 'tag-yellow' : 'tag-red'
                        }`}>
                          {person.status}
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        ) : (
          <Droppable droppableId="sidebar-list-r" type="resource">
            {(provided, snapshot) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className={`sidebar-list ${snapshot.isDraggingOver ? 'bg-green-soft' : ''}`}>
                {availableResources.length === 0 && <div className="empty-message">Nenhum recurso livre.</div>}
                
                {availableResources.map((res, index) => (
                  <Draggable key={res.id} draggableId={res.id} index={index}>
                    {(dragProvided, dragSnapshot) => (
                      <div
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        {...dragProvided.dragHandleProps}
                        className={`sidebar-person-card ${dragSnapshot.isDragging ? 'is-dragging ring-green' : ''}`}
                      >
                        <div className="resource-icon-wrapper">
                           {res.type === 'Veículo' ? <Truck size={14}/> : <Plus size={14}/>}
                        </div>
                        <div className="sidebar-person-info">
                          <div className="sidebar-person-name">{res.name}</div>
                          <div className="sidebar-person-role">{res.type}</div>
                        </div>
                        <div className={`sidebar-status-tag ${res.status === 'Disponível' ? 'tag-green' : 'tag-yellow'}`}>
                          {res.status}
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        )}
      </div>
    </div>
  );

  return (
    <div className="sco-app">
      <TopBar />
      
      <div className="sco-main-container">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="sco-workspace">
            {viewMode === 'map' ? (
              <div className="map-view-container">
                 <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=2000" className="map-view-img" alt="Map View" />
                 <div className="map-view-overlay"></div>
                 <div className="map-pin pin-red animate-bounce">
                    <MapIcon size={32} />
                    <span className="map-pin-label">Equipe de Resgate</span>
                 </div>
                 <div className="map-pin pin-green">
                    <MapIcon size={28} />
                    <span className="map-pin-label">Ambulância 01</span>
                 </div>
              </div>
            ) : (
              <div className="workspace-panel shadow-none">
                <div className="workspace-header border-bottom mx-4">
                  <h1 className="workspace-title">Organograma Dinâmico do SCO</h1>
                  <div className="workspace-header-actions">
                    <span className="mode-badge">
                      <div className="mode-dot"></div> Modo SCO Ativo
                    </span>
                    <button className="help-button text-gray" onClick={() => setIsLogOpen(!isLogOpen)}>
                       <Activity size={14} style={{marginRight: '4px'}}/> Diário de Bordo
                    </button>
                    <button className="help-button text-gray">
                       <Plus size={14} style={{marginRight: '4px'}}/> Relatório
                    </button>
                  </div>
                </div>

                <div className="workspace-canvas mx-4">
                   <div className="pattern-dots"></div>
                   <div className="canvas-content canvas-padded">
                      <OrgTree node={tree} />
                   </div>
                </div>
              </div>
            )}
            
            {isLogOpen && viewMode !== 'map' && (
              <div className="activity-drawer">
                 <div className="activity-drawer-header">
                    <h4><Clock size={16} /> Diário de Bordo Oficial</h4>
                    <button onClick={() => setIsLogOpen(false)} className="btn-close"><X size={16}/></button>
                 </div>
                 <div className="activity-drawer-body">
                    {logs.map(log => (
                      <div key={log.id} className="log-entry">
                         <span className="log-time">{log.time}</span>
                         <span className="log-text">{log.text}</span>
                      </div>
                    ))}
                 </div>
              </div>
            )}
          </div>

          <Sidebar />
        </DragDropContext>
        
        <NodeDetailsModal />
      </div>
    </div>
  );
}
