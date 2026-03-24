import React, { useRef, useState, useEffect, useCallback } from 'react';
import * as fabric from 'fabric';
import { 
    X, Check, Undo, RotateCcw, MousePointer2, 
    ArrowUpRight, Square, Circle as CircleIcon, PenTool,
    Trash2, Palette, Minus, Type
} from 'lucide-react';

const COLORS = [
    '#EF4444', // Red
    '#F59E0B', // Amber
    '#10B981', // Emerald
    '#3B82F6', // Blue
    '#FFFFFF', // White
    '#000000', // Black
];

const THICKNESSES = [2, 4, 8];

const ImageEditor = ({ imageUrl, onSave, onCancel }) => {
    const canvasRef = useRef(null);
    const fabricRef = useRef(null);
    const containerRef = useRef(null);
    const isUndoing = useRef(false);
    
    const [mode, setMode] = useState('arrow'); // 'select', 'arrow', 'rect', 'circle', 'pen'
    const [color, setColor] = useState('#EF4444');
    const [thickness, setThickness] = useState(4);
    const [selectedObject, setSelectedObject] = useState(null);
    const [history, setHistory] = useState([]);

    const modeRef = useRef(mode);
    const colorRef = useRef(color);
    const thicknessRef = useRef(thickness);

    useEffect(() => { modeRef.current = mode; }, [mode]);
    useEffect(() => { colorRef.current = color; }, [color]);
    useEffect(() => { thicknessRef.current = thickness; }, [thickness]);

    // Initialize Canvas
    useEffect(() => {
        if (!canvasRef.current || !containerRef.current) return;

        const canvas = new fabric.Canvas(canvasRef.current, {
            width: containerRef.current.clientWidth,
            height: containerRef.current.clientHeight - 80,
            backgroundColor: '#0f172a',
            preserveObjectStacking: true,
            selection: true
        });
        
        fabricRef.current = canvas;

        const saveHistory = () => {
            if (isUndoing.current) return;
            const json = canvas.toJSON(['selectable', 'evented']);
            setHistory(prev => [...prev.slice(-20), JSON.stringify(json)]);
        };

        // Load Background Image
        fabric.FabricImage.fromURL(imageUrl, { crossOrigin: 'anonymous' }).then((img) => {
            const container = containerRef.current;
            const maxWidth = container.clientWidth - 20;
            const maxHeight = container.clientHeight - 160;
            
            let scale = Math.min(maxWidth / img.width, maxHeight / img.height);
            
            img.set({
                scaleX: scale,
                scaleY: scale,
                selectable: false,
                evented: false,
                originX: 'center',
                originY: 'center',
            });

            canvas.setDimensions({
                width: img.width * scale,
                height: img.height * scale
            });

            canvas.add(img);
            canvas.centerObject(img);
            saveHistory();
            canvas.requestRenderAll();
        });

        // Selection Handling
        canvas.on('selection:created', (e) => setSelectedObject(e.selected[0]));
        canvas.on('selection:updated', (e) => setSelectedObject(e.selected[0]));
        canvas.on('selection:cleared', () => setSelectedObject(null));
        
        canvas.on('object:modified', saveHistory);
        canvas.on('object:added', (e) => {
            if (!isUndoing.current && e.target.get('type') !== 'image') saveHistory();
        });

        // Drawing Logic
        let isDrawing = false;
        let currentShape = null;
        let startPoint = null;

        const handleMouseDown = (options) => {
            const currentMode = modeRef.current;
            if (currentMode === 'select' || currentMode === 'pen') return;
            
            const pointer = canvas.getScenePoint(options.e);
            isDrawing = true;
            startPoint = pointer;

            const commonProps = {
                left: pointer.x,
                top: pointer.y,
                fill: 'transparent',
                stroke: colorRef.current,
                strokeWidth: thicknessRef.current,
                strokeUniform: true,
                selectable: false,
                evented: false
            };

            if (currentMode === 'rect') {
                currentShape = new fabric.Rect({ ...commonProps, width: 0, height: 0, rx: 4, ry: 4 });
            } else if (currentMode === 'circle') {
                currentShape = new fabric.Circle({ ...commonProps, radius: 0 });
            } else if (currentMode === 'arrow') {
                const head = new fabric.Triangle({
                    width: thicknessRef.current * 4,
                    height: thicknessRef.current * 4,
                    fill: colorRef.current,
                    originX: 'center',
                    originY: 'center',
                    selectable: false,
                    evented: false,
                    angle: 0,
                    left: pointer.x,
                    top: pointer.y
                });
                const line = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], {
                    stroke: colorRef.current,
                    strokeWidth: thicknessRef.current,
                    strokeCap: 'round',
                    selectable: false,
                    evented: false
                });
                currentShape = { line, head, type: 'arrow-temp' };
                canvas.add(line, head);
            }

            if (currentShape && currentMode !== 'arrow') {
                canvas.add(currentShape);
            }
        };

        const handleMouseMove = (options) => {
            if (!isDrawing || !currentShape) return;
            const pointer = canvas.getScenePoint(options.e);
            const currentMode = modeRef.current;

            if (currentMode === 'rect' || currentMode === 'circle') {
                if (currentMode === 'rect') {
                    currentShape.set({
                        width: Math.abs(pointer.x - startPoint.x),
                        height: Math.abs(pointer.y - startPoint.y),
                        left: Math.min(pointer.x, startPoint.x),
                        top: Math.min(pointer.y, startPoint.y)
                    });
                } else {
                    const radius = Math.sqrt(Math.pow(pointer.x - startPoint.x, 2) + Math.pow(pointer.y - startPoint.y, 2)) / 2;
                    currentShape.set({
                        radius: radius,
                        left: Math.min(pointer.x, startPoint.x),
                        top: Math.min(pointer.y, startPoint.y)
                    });
                }
            } else if (currentMode === 'arrow' && currentShape.type === 'arrow-temp') {
                const { line, head } = currentShape;
                line.set({ x2: pointer.x, y2: pointer.y });
                const angle = Math.atan2(pointer.y - startPoint.y, pointer.x - startPoint.x) * (180 / Math.PI);
                head.set({ left: pointer.x, top: pointer.y, angle: angle + 90 });
            }
            canvas.requestRenderAll();
        };

        const handleMouseUp = () => {
            if (isDrawing && currentShape) {
                isDrawing = false;
                
                if (currentShape.type === 'arrow-temp') {
                    const { line, head } = currentShape;
                    canvas.remove(line, head);
                    const arrowGroup = new fabric.Group([line, head], {
                        selectable: true,
                        evented: true,
                        strokeUniform: true
                    });
                    canvas.add(arrowGroup);
                    canvas.setActiveObject(arrowGroup);
                } else {
                    currentShape.set({ selectable: true, evented: true });
                    canvas.setActiveObject(currentShape);
                }
                
                currentShape = null;
                canvas.requestRenderAll();
            }
        };

        canvas.on('mouse:down', handleMouseDown);
        canvas.on('mouse:move', handleMouseMove);
        canvas.on('mouse:up', handleMouseUp);

        return () => canvas.dispose();
    }, [imageUrl]);

    // Pen Mode and Select Styling
    useEffect(() => {
        const canvas = fabricRef.current;
        if (!canvas) return;

        canvas.isDrawingMode = mode === 'pen';
        if (canvas.isDrawingMode) {
            canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
            canvas.freeDrawingBrush.color = color;
            canvas.freeDrawingBrush.width = thickness;
        }

        canvas.selection = mode === 'select';
        canvas.forEachObject(obj => {
            if (obj.get('type') !== 'image') {
                obj.set({
                    selectable: mode === 'select',
                    evented: mode === 'select'
                });
            }
        });
        canvas.requestRenderAll();
    }, [mode, color, thickness]);

    // Update properties of selected object when color/thickness changes
    useEffect(() => {
        const canvas = fabricRef.current;
        if (!canvas || !selectedObject) return;

        if (selectedObject.get('type') === 'group') {
            // Arrow special case
            const objects = selectedObject.getObjects();
            if (objects[0]) objects[0].set({ stroke: color, strokeWidth: thickness });
            if (objects[1]) objects[1].set({ fill: color });
        } else {
            selectedObject.set({
                stroke: color,
                strokeWidth: thickness
            });
        }
        canvas.requestRenderAll();
    }, [color, thickness, selectedObject]);

    const handleUndo = () => {
        const canvas = fabricRef.current;
        if (!canvas || history.length <= 1) return;

        isUndoing.current = true;
        const newHistory = [...history];
        newHistory.pop();
        const prevState = newHistory[newHistory.length - 1];
        
        canvas.loadFromJSON(prevState).then(() => {
            canvas.requestRenderAll();
            setHistory(newHistory);
            isUndoing.current = false;
        });
    };

    const handleDelete = () => {
        const canvas = fabricRef.current;
        if (canvas && selectedObject) {
            canvas.remove(selectedObject);
            canvas.discardActiveObject();
            canvas.requestRenderAll();
        }
    };

    const handleClear = () => {
        const canvas = fabricRef.current;
        if (canvas) {
            canvas.getObjects().forEach(obj => {
                if (obj.get('type') !== 'image') canvas.remove(obj);
            });
            canvas.requestRenderAll();
        }
    };

    const handleSave = () => {
        const canvas = fabricRef.current;
        if (!canvas) return;
        canvas.discardActiveObject();
        canvas.requestRenderAll();
        const dataUrl = canvas.toDataURL({ format: 'jpeg', quality: 0.9, multiplier: 2 });
        onSave(dataUrl);
    };

    return (
        <div 
            ref={containerRef}
            className="fixed inset-0 z-[120] bg-slate-950 flex flex-col items-center overflow-hidden"
        >
            {/* Slim Header Toolbar */}
            <div className="w-full bg-slate-900/90 backdrop-blur-md border-b border-white/5 px-2 py-2 flex items-center justify-between">
                <button onClick={onCancel} className="p-2 text-white/50 hover:text-white"><X size={20} /></button>
                
                <div className="flex bg-white/5 p-0.5 rounded-xl border border-white/10">
                    {[
                        { id: 'select', icon: MousePointer2 },
                        { id: 'arrow', icon: ArrowUpRight },
                        { id: 'rect', icon: Square },
                        { id: 'circle', icon: CircleIcon },
                        { id: 'pen', icon: PenTool }
                    ].map(t => (
                        <button 
                            key={t.id}
                            onClick={() => setMode(t.id)}
                            className={`p-2 rounded-lg transition-all ${mode === t.id ? 'bg-indigo-600 text-white shadow-md' : 'text-white/30 hover:text-white'}`}
                        >
                            <t.icon size={18} />
                        </button>
                    ))}
                </div>

                <div className="flex gap-2">
                    <button onClick={handleUndo} disabled={history.length <= 1} className={`p-2 rounded-lg ${history.length <= 1 ? 'text-white/5' : 'text-white/40'}`}>
                        <Undo size={18} />
                    </button>
                    <button onClick={handleSave} className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg font-bold text-xs shadow-lg active:scale-95">
                        OK
                    </button>
                </div>
            </div>

            {/* Canvas Area - Expanding */}
            <div className="flex-1 w-full flex items-center justify-center relative bg-slate-950 scroll-none">
                <canvas ref={canvasRef} />
                
                {selectedObject && (
                    <button 
                        onClick={handleDelete}
                        className="absolute bottom-4 right-4 p-3 bg-red-600 text-white rounded-full shadow-2xl animate-in zoom-in duration-200"
                    >
                        <Trash2 size={20} />
                    </button>
                )}
            </div>

            {/* Compact Control Panel */}
            <div className="w-full bg-slate-900/95 backdrop-blur-xl border-t border-white/5 p-4 pb-8">
                <div className="max-w-xl mx-auto flex flex-col gap-4">
                    {/* Colors and Thickness in one row */}
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex gap-2">
                            {COLORS.map(c => (
                                <button
                                    key={c}
                                    onClick={() => setColor(c)}
                                    className={`w-7 h-7 rounded-full border-2 transition-all ${color === c ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-50'}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                        <div className="h-6 w-px bg-white/10" />
                        <div className="flex gap-1.5">
                            {THICKNESSES.map(t => (
                                <button
                                    key={t}
                                    onClick={() => setThickness(t)}
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black transition-all ${thickness === t ? 'bg-white text-slate-900 shadow-md' : 'bg-white/5 text-white/40'}`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">
                            {mode === 'select' ? 'Mover/Editar' : 'Desenhar'} • {color} • {thickness}px
                        </span>
                        <button 
                            onClick={handleClear}
                            className="flex items-center gap-1.5 px-3 py-1 bg-white/5 text-white/30 rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-red-900/20 hover:text-red-400 transition-all"
                        >
                            <RotateCcw size={12} />
                            Limpar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageEditor;
