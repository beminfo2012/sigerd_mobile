import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
    X, Check, Undo, RotateCcw, MousePointer2, 
    ArrowUpRight, Square, Circle, PenTool,
    Type, Trash2, Palette, Minus
} from 'lucide-react';
import { Button } from './ui/Button';

const COLORS = [
    '#EF4444', // Red
    '#F59E0B', // Amber
    '#10B981', // Emerald
    '#3B82F6', // Blue
    '#8B5CF6', // Violet
    '#EC4899', // Pink
    '#FFFFFF', // White
    '#000000', // Black
];

const THICKNESSES = [2, 4, 8, 12];

const ImageEditor = ({ imageUrl, onSave, onCancel }) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [mode, setMode] = useState('arrow'); // 'arrow', 'rect', 'circle', 'pen'
    const [color, setColor] = useState('#EF4444');
    const [thickness, setThickness] = useState(4);
    const [history, setHistory] = useState([]);
    
    // Internal state for drawing
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPoint, setStartPoint] = useState(null);
    const [tempImageData, setTempImageData] = useState(null);
    const [originalImage, setOriginalImage] = useState(null);

    // Initial load
    useEffect(() => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = imageUrl;
        img.onload = () => {
            setOriginalImage(img);
            initCanvas(img);
        };
    }, [imageUrl]);

    const initCanvas = (img) => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        // Calculate dimensions to fit viewport while maintaining aspect ratio
        const container = containerRef.current;
        const maxWidth = container.clientWidth - 40;
        const maxHeight = container.clientHeight - 180;
        
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
        }
        if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx.drawImage(img, 0, 0, width, height);
        saveToHistory();
    };

    const saveToHistory = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        setHistory(prev => [...prev, imageData]);
    };

    const handleUndo = () => {
        if (history.length <= 1) return;
        const newHistory = [...history];
        newHistory.pop(); // Remove current
        const lastState = newHistory[newHistory.length - 1];
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.putImageData(lastState, 0, 0);
        setHistory(newHistory);
    };

    const handleReset = () => {
        if (originalImage) {
            initCanvas(originalImage);
            setHistory([]);
            saveToHistory();
        }
    };

    const getCoord = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        
        let clientX, clientY;
        if (e.touches && e.touches[0]) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const startDrawing = (e) => {
        setIsDrawing(true);
        const point = getCoord(e);
        setStartPoint(point);
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        setTempImageData(ctx.getImageData(0, 0, canvas.width, canvas.height));
    };

    const draw = (e) => {
        if (!isDrawing) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const currentPoint = getCoord(e);
        
        // Restore canvas from state before this shape started
        ctx.putImageData(tempImageData, 0, 0);
        
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = thickness;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        if (mode === 'pen') {
            // Pencil mode is slightly different - it actually modifies the temp image as it goes 
            // but for simplicity in this implementation, we redraw everything or use a more complex logic.
            // Let's stick to shapes for now as requested.
            drawLine(ctx, startPoint, currentPoint);
        } else if (mode === 'arrow') {
            drawArrow(ctx, startPoint, currentPoint);
        } else if (mode === 'rect') {
            drawRect(ctx, startPoint, currentPoint);
        } else if (mode === 'circle') {
            drawCircle(ctx, startPoint, currentPoint);
        }
    };

    const endDrawing = () => {
        if (!isDrawing) return;
        setIsDrawing(false);
        saveToHistory();
    };

    const drawLine = (ctx, start, end) => {
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
    };

    const drawArrow = (ctx, start, end) => {
        const headlen = thickness * 4;
        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(end.x - headlen * Math.cos(angle - Math.PI / 6), end.y - headlen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(end.x - headlen * Math.cos(angle + Math.PI / 6), end.y - headlen * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
    };

    const drawRect = (ctx, start, end) => {
        ctx.beginPath();
        ctx.rect(start.x, start.y, end.x - start.x, end.y - start.y);
        ctx.stroke();
    };

    const drawCircle = (ctx, start, end) => {
        const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
        ctx.beginPath();
        ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
    };

    const handleSaveImage = () => {
        const canvas = canvasRef.current;
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        onSave(dataUrl);
    };

    return (
        <div 
            ref={containerRef}
            className="fixed inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-between p-4 overflow-hidden"
        >
            {/* Toolbar Top */}
            <div className="w-full max-w-xl flex items-center justify-between bg-white/10 backdrop-blur-md rounded-2xl p-2 border border-white/10">
                <button 
                    onClick={onCancel}
                    className="p-3 text-white/60 hover:text-white"
                >
                    <X size={24} />
                </button>
                <div className="flex gap-1">
                    <button 
                        onClick={() => setMode('arrow')}
                        className={`p-3 rounded-xl transition-all ${mode === 'arrow' ? 'bg-red-600 text-white' : 'text-white/60 hover:bg-white/5'}`}
                    >
                        <ArrowUpRight size={20} />
                    </button>
                    <button 
                        onClick={() => setMode('rect')}
                        className={`p-3 rounded-xl transition-all ${mode === 'rect' ? 'bg-red-600 text-white' : 'text-white/60 hover:bg-white/5'}`}
                    >
                        <Square size={20} />
                    </button>
                    <button 
                        onClick={() => setMode('circle')}
                        className={`p-3 rounded-xl transition-all ${mode === 'circle' ? 'bg-red-600 text-white' : 'text-white/60 hover:bg-white/5'}`}
                    >
                        <Circle size={20} />
                    </button>
                    <button 
                        onClick={() => setMode('pen')}
                        className={`p-3 rounded-xl transition-all ${mode === 'pen' ? 'bg-red-600 text-white' : 'text-white/60 hover:bg-white/5'}`}
                    >
                        <PenTool size={20} />
                    </button>
                </div>
                <button 
                    onClick={handleSaveImage}
                    className="p-3 bg-white text-slate-900 rounded-xl font-bold flex items-center gap-2"
                >
                    <Check size={20} />
                    <span>SALVAR</span>
                </button>
            </div>

            {/* Canvas Area */}
            <div className="flex-1 flex items-center justify-center w-full touch-none select-none">
                <canvas 
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={endDrawing}
                    onMouseLeave={endDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={endDrawing}
                    className="shadow-2xl rounded-sm cursor-crosshair bg-slate-800"
                />
            </div>

            {/* Toolbar Bottom */}
            <div className="w-full max-w-xl space-y-4 pb-4">
                {/* Colors & Thickness */}
                <div className="bg-white/10 backdrop-blur-md rounded-3xl p-4 border border-white/10 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                            {COLORS.map(c => (
                                <button
                                    key={c}
                                    onClick={() => setColor(c)}
                                    className={`w-8 h-8 rounded-full border-2 transition-all ${color === c ? 'scale-125 border-white shadow-lg' : 'border-transparent opacity-60'}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                        <div className="flex gap-2 bg-black/20 p-1 rounded-full">
                            {THICKNESSES.map(t => (
                                <button
                                    key={t}
                                    onClick={() => setThickness(t)}
                                    className={`w-8 h-8 rounded-full text-[10px] font-bold flex items-center justify-center transition-all ${thickness === t ? 'bg-white text-slate-900' : 'text-white/40'}`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Undo / Reset */}
                <div className="flex justify-center gap-4">
                    <button 
                        onClick={handleUndo}
                        disabled={history.length <= 1}
                        className="flex items-center gap-2 px-6 py-3 bg-white/5 text-white rounded-2xl disabled:opacity-20 transition-all active:scale-95"
                    >
                        <Undo size={18} />
                        <span className="text-xs font-bold uppercase">Desfazer</span>
                    </button>
                    <button 
                        onClick={handleReset}
                        className="flex items-center gap-2 px-6 py-3 bg-white/5 text-white/60 rounded-2xl transition-all active:scale-95"
                    >
                        <RotateCcw size={18} />
                        <span className="text-xs font-bold uppercase">Limpar</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImageEditor;
