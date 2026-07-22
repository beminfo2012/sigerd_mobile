import React, { useState, useEffect, useRef } from 'react';
import { Camera, Maximize, Check, X, MousePointer2, RefreshCw } from 'lucide-react';

export default function FissurometroAnalyzer({ fotoUrl, onComplete, onCancel }) {
    const canvasRef = useRef(null);
    const imageRef = useRef(null);

    const [mode, setMode] = useState('idle'); // idle, calibrating, measuring
    const [scalePxPerMm, setScalePxPerMm] = useState(null);
    const [points, setPoints] = useState([]); // [{x, y}]
    const [measurements, setMeasurements] = useState([]); // [{p1, p2, mm}]
    const [cvLoaded, setCvLoaded] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);

    // Carregar OpenCV.js
    useEffect(() => {
        if (window.cv) {
            setCvLoaded(true);
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://docs.opencv.org/4.8.0/opencv.js';
        script.async = true;
        script.onload = () => {
            setTimeout(() => setCvLoaded(true), 1000);
        };
        document.body.appendChild(script);
        return () => { 
            // We can leave it in the DOM for future uses
        };
    }, []);

    // Desenhar imagem no canvas
    useEffect(() => {
        if (!fotoUrl) return;
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            imageRef.current = img;
            redrawCanvas();
        };
        img.src = fotoUrl;
    }, [fotoUrl]);

    // O redrawCanvas não depende de state no closure do useEffect, mas precisa ler o state atual
    // Então vamos chamar sempre que measurements/points/mode mudar
    useEffect(() => {
        redrawCanvas();
    }, [points, measurements, mode, scalePxPerMm]);

    const redrawCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas || !imageRef.current) return;
        const ctx = canvas.getContext('2d');
        
        // Ajustar tamanho do canvas
        const containerWidth = canvas.parentElement.clientWidth;
        // Limit height to prevent overflow
        const containerHeight = canvas.parentElement.clientHeight;
        
        let scale = containerWidth / imageRef.current.width;
        if (imageRef.current.height * scale > containerHeight) {
            scale = containerHeight / imageRef.current.height;
        }

        canvas.width = imageRef.current.width * scale;
        canvas.height = imageRef.current.height * scale;
        canvas.dataset.scale = scale;
        
        ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);

        // Desenhar medições finalizadas
        measurements.forEach(m => drawMeasurement(ctx, m.p1, m.p2, m.mm, scale));
        
        // Desenhar interação atual
        if (points.length === 1) {
            drawPoint(ctx, points[0].x * scale, points[0].y * scale, '#FF5A1F');
        } else if (points.length === 2) {
            if (mode === 'calibrating') {
                drawLine(ctx, points[0].x * scale, points[0].y * scale, points[1].x * scale, points[1].y * scale, '#2E7D46');
            } else if (mode === 'measuring') {
                const distPx = Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y);
                const distMm = scalePxPerMm ? (distPx / scalePxPerMm).toFixed(2) : '?';
                drawMeasurement(ctx, points[0], points[1], distMm, scale);
            }
        }
    };

    const drawPoint = (ctx, x, y, color) => {
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#FFFFFF';
        ctx.stroke();
    };

    const drawLine = (ctx, x1, y1, x2, y2, color) => {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.stroke();
        drawPoint(ctx, x1, y1, color);
        drawPoint(ctx, x2, y2, color);
    };

    const drawMeasurement = (ctx, p1, p2, mm, viewScale) => {
        const x1 = p1.x * viewScale, y1 = p1.y * viewScale;
        const x2 = p2.x * viewScale, y2 = p2.y * viewScale;
        drawLine(ctx, x1, y1, x2, y2, '#FF5A1F');
        
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        ctx.fillStyle = 'rgba(255, 90, 31, 0.9)';
        const text = `${mm} mm`;
        const textWidth = ctx.measureText(text).width;
        ctx.fillRect(midX - textWidth/2 - 6, midY - 14, textWidth + 12, 22);
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 13px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, midX, midY - 2);
    };

    const handleCanvasClick = (e) => {
        if (mode === 'idle') return;
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const viewScale = parseFloat(canvas.dataset.scale);
        const x = (e.clientX - rect.left) / viewScale;
        const y = (e.clientY - rect.top) / viewScale;

        const newPoints = [...points, {x, y}];
        setPoints(newPoints);

        if (newPoints.length === 2) {
            if (mode === 'calibrating') {
                // Assume the drawn line is exactly 40mm (largura do marcador ArUco 4x4 padrão no cartão)
                const distPx = Math.hypot(newPoints[1].x - newPoints[0].x, newPoints[1].y - newPoints[0].y);
                setScalePxPerMm(distPx / 40.0);
                setMode('idle');
                setPoints([]);
            } else if (mode === 'measuring') {
                const distPx = Math.hypot(newPoints[1].x - newPoints[0].x, newPoints[1].y - newPoints[0].y);
                const distMm = (distPx / scalePxPerMm).toFixed(2);
                setMeasurements([...measurements, { p1: newPoints[0], p2: newPoints[1], mm: distMm }]);
                setMode('idle');
                setPoints([]);
            }
        }
    };

    const detectArUco = async () => {
        if (!window.cv || !imageRef.current) {
            alert("A biblioteca de Visão Computacional ainda está carregando. Aguarde um instante.");
            return;
        }
        setAnalyzing(true);
        try {
            const cv = window.cv;
            const tmpCanvas = document.createElement('canvas');
            tmpCanvas.width = imageRef.current.width;
            tmpCanvas.height = imageRef.current.height;
            const ctx = tmpCanvas.getContext('2d');
            ctx.drawImage(imageRef.current, 0, 0);
            
            const src = cv.imread(tmpCanvas);
            
            // O opencv.js via CDN frequentemente não vem com o módulo ArUco pré-compilado.
            // Para não quebrar caso esteja ausente, tentamos acessar; se falhar, lançamos erro para o catch.
            if (!cv.aruco_Dictionary || !cv.Dictionary) {
                throw new Error("Módulo ArUco ausente no build do OpenCV.js.");
            }
            
            let dictionary;
            if (cv.aruco_Dictionary) {
                 dictionary = new cv.aruco_Dictionary(cv.DICT_4X4_50);
            } else if (cv.Dictionary) {
                 dictionary = new cv.Dictionary(cv.DICT_4X4_50);
            }
            
            const markerCorners = new cv.MatVector();
            const markerIds = new cv.Mat();
            
            cv.detectMarkers(src, dictionary, markerCorners, markerIds);
            
            if (markerIds.rows > 0) {
                const corners = markerCorners.get(0).data32F;
                const d1 = Math.hypot(corners[2] - corners[0], corners[3] - corners[1]);
                const d2 = Math.hypot(corners[4] - corners[2], corners[5] - corners[3]);
                const d3 = Math.hypot(corners[6] - corners[4], corners[7] - corners[5]);
                const d4 = Math.hypot(corners[0] - corners[6], corners[1] - corners[7]);
                
                const avgPx = (d1 + d2 + d3 + d4) / 4;
                setScalePxPerMm(avgPx / 40.0);
            } else {
                alert("Nenhum Cartão ArUco foi detectado nesta foto de forma clara. Use o método 'Calibrar Manualmente'.");
            }
            
            src.delete(); markerCorners.delete(); markerIds.delete();
        } catch (err) {
            console.warn("OpenCV ArUco indisponível, usando fallback:", err);
            alert("A detecção automática requer o módulo ArUco (ou falhou na leitura). Por favor, use 'Calibrar Manualmente' e desenhe uma linha sobre o quadrado do cartão.");
        }
        setAnalyzing(false);
    };

    const handleSave = () => {
        if (measurements.length === 0) {
            alert("Faça ao menos uma medição antes de salvar.");
            return;
        }
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = imageRef.current.width;
        finalCanvas.height = imageRef.current.height;
        const ctx = finalCanvas.getContext('2d');
        ctx.drawImage(imageRef.current, 0, 0);
        measurements.forEach(m => drawMeasurement(ctx, m.p1, m.p2, m.mm, 1));
        
        const annotatedDataUrl = finalCanvas.toDataURL('image/jpeg', 0.85);
        const maxMm = Math.max(...measurements.map(m => parseFloat(m.mm)));
        
        onComplete(maxMm, annotatedDataUrl);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-0 sm:p-4">
            <div className="w-full max-w-lg bg-white dark:bg-slate-900 overflow-hidden flex flex-col h-full max-h-full sm:max-h-[92vh] sm:rounded-2xl shadow-2xl">
                {/* Header */}
                <div className="p-4 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800 shrink-0">
                    <div>
                        <h2 className="font-bold text-slate-800 dark:text-white uppercase tracking-wide text-sm">Laboratório V2 (Análise de Imagem)</h2>
                        <p className="text-[11px] text-slate-500">Fissurômetro digital de campo</p>
                    </div>
                    <button type="button" onClick={onCancel} className="p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>
                
                {/* Canvas Area */}
                <div className="flex-1 overflow-hidden bg-neutral-900 relative flex items-center justify-center p-2 min-h-[250px]">
                    {/* Tooltip Instruction */}
                    {mode === 'calibrating' && (
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg z-10 whitespace-nowrap animate-bounce">
                            Clique em 2 pontos no quadrado/marcador do cartão (40mm)
                        </div>
                    )}
                    {mode === 'measuring' && (
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg z-10 whitespace-nowrap animate-bounce">
                            Clique nas 2 bordas da abertura para medir a fissura
                        </div>
                    )}

                    <canvas 
                        ref={canvasRef} 
                        onClick={handleCanvasClick}
                        className={`max-w-full max-h-full object-contain shadow-2xl rounded ${mode !== 'idle' ? 'cursor-crosshair' : ''}`}
                    />
                    
                    {analyzing && (
                        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white backdrop-blur-sm z-20">
                            <RefreshCw className="animate-spin mb-3 text-blue-400" size={36} />
                            <p className="font-mono text-sm tracking-wider">RODANDO VISÃO COMPUTACIONAL...</p>
                        </div>
                    )}
                </div>

                {/* Control Panel (Scrollable to guarantee access on small screens) */}
                <div className="p-4 border-t dark:border-slate-800 space-y-3 bg-white dark:bg-slate-900 shrink-0 overflow-y-auto max-h-[45vh]">
                    {!scalePxPerMm ? (
                        <div className="space-y-2.5">
                            <p className="text-xs text-center text-slate-500 font-medium">
                                Passo 1: Calibre a escala usando o quadrado do cartão de referência (40mm).
                            </p>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <button 
                                    type="button"
                                    onClick={() => { setMode('calibrating'); setPoints([]); }}
                                    className={`py-3 px-4 rounded-xl font-bold text-sm flex justify-center items-center gap-2 border-2 transition-all ${mode === 'calibrating' ? 'border-amber-500 text-amber-700 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400 ring-2 ring-amber-400/50' : 'border-amber-500/80 text-amber-600 bg-amber-50/50 dark:border-amber-700 dark:text-amber-300 dark:bg-amber-950/20 hover:bg-amber-100/50'}`}
                                >
                                    <Maximize size={18} /> Calibrar Manualmente
                                </button>

                                <button 
                                    type="button"
                                    onClick={detectArUco}
                                    disabled={analyzing}
                                    className="py-3 px-4 bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl font-bold text-sm flex justify-center items-center gap-2 disabled:opacity-50 transition-colors"
                                >
                                    <Camera size={18} /> Detectar Auto-IA
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-300 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-800">
                                <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                                    ✓ Escala Calibrada: {(1/scalePxPerMm).toFixed(3)} mm/px
                                </span>
                                <button type="button" onClick={() => {setScalePxPerMm(null); setMeasurements([]); setMode('idle'); setPoints([]);}} className="text-red-500 font-bold hover:underline ml-2">
                                    Recalibrar
                                </button>
                            </div>
                            
                            <button 
                                type="button"
                                onClick={() => { setMode('measuring'); setPoints([]); }}
                                className={`w-full py-3 rounded-xl font-bold text-sm flex justify-center items-center gap-2 border-2 transition-colors ${mode === 'measuring' ? 'border-indigo-500 text-indigo-700 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400 ring-2 ring-indigo-400/50' : 'border-indigo-600 text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 dark:border-indigo-500 dark:text-indigo-300 hover:bg-indigo-100'}`}
                            >
                                <MousePointer2 size={18} /> Adicionar Medição (Clicar 2 pontos)
                            </button>
                        </div>
                    )}
                    
                    {measurements.length > 0 && (
                        <button 
                            type="button"
                            onClick={handleSave}
                            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-[15px] flex justify-center items-center gap-2 shadow-lg shadow-emerald-600/20 transition-transform active:scale-95"
                        >
                            <Check size={20} /> Concluir e Anexar Laudo ({measurements.length} {measurements.length === 1 ? 'medição' : 'medições'})
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
