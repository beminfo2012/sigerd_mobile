import React, { useState, useEffect, useRef } from 'react';
import { Camera, Maximize, Check, X, MousePointer2, RefreshCw, HelpCircle, CornerDownRight, QrCode } from 'lucide-react';
import MarcadorQRModal from './MarcadorQRModal';

export default function FissurometroAnalyzer({ fotoUrl, onComplete, onCancel, defaultQrSizeMm = 30.0 }) {
    const canvasRef = useRef(null);
    const imageRef = useRef(null);

    const [mode, setMode] = useState('idle'); // idle, calibrating_qr4, calibrating_line2, measuring
    const [qrSizeMm, setQrSizeMm] = useState(defaultQrSizeMm);
    
    // Matriz de Homografia H (Array 3x3) para retificação de perspectiva
    const [homographyMatrix, setHomographyMatrix] = useState(null);
    const [pxPerMm, setPxPerMm] = useState(null);
    
    const [points, setPoints] = useState([]); // [{x, y}]
    const [measurements, setMeasurements] = useState([]); // [{p1, p2, mm}]
    const [cvLoaded, setCvLoaded] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [showQrModal, setShowQrModal] = useState(false);
    const [statusMessage, setStatusMessage] = useState(null);

    // Carregar OpenCV.js
    useEffect(() => {
        if (window.cv && window.cv.Mat) {
            setCvLoaded(true);
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://docs.opencv.org/4.8.0/opencv.js';
        script.async = true;
        script.onload = () => {
            // Pequeno atraso para garantir que a memória do WASM/Emscripten inicialize totalmente
            const checkCv = setInterval(() => {
                if (window.cv && window.cv.Mat) {
                    setCvLoaded(true);
                    clearInterval(checkCv);
                }
            }, 200);
        };
        document.body.appendChild(script);
        return () => {};
    }, []);

    // Desenhar imagem inicial no canvas
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

    // Redesenhar canvas quando o estado mudar
    useEffect(() => {
        redrawCanvas();
    }, [points, measurements, mode, pxPerMm, homographyMatrix]);

    // Função de transformação de ponto (x,y) da foto original para o espaço retificado através de Homografia H (3x3)
    const transformPointWithHomography = (pt, H) => {
        if (!H) return pt;
        // H é matriz 3x3: H00 H01 H02 / H10 H11 H12 / H20 H21 H22
        const x = pt.x;
        const y = pt.y;
        const X = H[0] * x + H[1] * y + H[2];
        const Y = H[3] * x + H[4] * y + H[5];
        const Z = H[6] * x + H[7] * y + H[8];
        if (Math.abs(Z) < 1e-6) return pt;
        return { x: X / Z, y: Y / Z };
    };

    // Calcular matriz de homografia 3x3 a partir de 4 pontos de origem -> 4 pontos de destino (DLT algorithm)
    const calculateHomographyDLT = (srcPts, dstPts) => {
        // srcPts: [{x,y}, {x,y}, {x,y}, {x,y}]
        // dstPts: [{x,y}, {x,y}, {x,y}, {x,y}]
        if (window.cv && window.cv.getPerspectiveTransform) {
            try {
                const cv = window.cv;
                const srcData = new Float32Array([
                    srcPts[0].x, srcPts[0].y,
                    srcPts[1].x, srcPts[1].y,
                    srcPts[2].x, srcPts[2].y,
                    srcPts[3].x, srcPts[3].y,
                ]);
                const dstData = new Float32Array([
                    dstPts[0].x, dstPts[0].y,
                    dstPts[1].x, dstPts[1].y,
                    dstPts[2].x, dstPts[2].y,
                    dstPts[3].x, dstPts[3].y,
                ]);
                const srcMat = cv.matFromArray(4, 1, cv.CV_32FC2, srcData);
                const dstMat = cv.matFromArray(4, 1, cv.CV_32FC2, dstData);
                const hMat = cv.getPerspectiveTransform(srcMat, dstMat);
                
                const H = Array.from(hMat.data64F);
                srcMat.delete(); dstMat.delete(); hMat.delete();
                return H;
            } catch (err) {
                console.warn("[Homography] Error using OpenCV.js getPerspectiveTransform, falling back to JS solver:", err);
            }
        }

        // Native JS Fallback for Homography
        const A = [];
        for (let i = 0; i < 4; i++) {
            const xs = srcPts[i].x, ys = srcPts[i].y;
            const xd = dstPts[i].x, yd = dstPts[i].y;
            A.push([-xs, -ys, -1, 0, 0, 0, xs * xd, ys * xd, xd]);
            A.push([0, 0, 0, -xs, -ys, -1, xs * yd, ys * yd, yd]);
        }
        
        // Solve Ah = 0 via Gaussian elimination setting h8 = 1
        const M = A.map(row => [...row]);
        for (let i = 0; i < 8; i++) {
            let maxRow = i;
            for (let k = i + 1; k < 8; k++) {
                if (Math.abs(M[k][i]) > Math.abs(M[maxRow][i])) maxRow = k;
            }
            const tmp = M[i]; M[i] = M[maxRow]; M[maxRow] = tmp;
            if (Math.abs(M[i][i]) < 1e-8) continue;
            for (let k = i + 1; k < 8; k++) {
                const c = -M[k][i] / M[i][i];
                for (let j = i; j < 9; j++) {
                    M[k][j] += c * M[i][j];
                }
            }
        }

        const h = new Array(9).fill(0);
        h[8] = 1;
        for (let i = 7; i >= 0; i--) {
            let sum = M[i][8];
            for (let j = i + 1; j < 8; j++) {
                sum -= M[i][j] * h[j];
            }
            h[i] = Math.abs(M[i][i]) > 1e-8 ? sum / M[i][i] : 0;
        }
        return h;
    };

    const redrawCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas || !imageRef.current) return;
        const ctx = canvas.getContext('2d');
        
        const containerWidth = canvas.parentElement.clientWidth;
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
        
        // Desenhar pontos de interação atual
        if (mode === 'calibrating_qr4') {
            // Desenhar polígono/pontos dos cantos do QR
            points.forEach((pt, idx) => {
                drawPoint(ctx, pt.x * scale, pt.y * scale, '#F59E0B', `${idx + 1}`);
            });
            if (points.length > 1) {
                ctx.beginPath();
                ctx.moveTo(points[0].x * scale, points[0].y * scale);
                for (let i = 1; i < points.length; i++) {
                    ctx.lineTo(points[i].x * scale, points[i].y * scale);
                }
                if (points.length === 4) {
                    ctx.closePath();
                    ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
                    ctx.fill();
                }
                ctx.strokeStyle = '#F59E0B';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        } else if (points.length === 1) {
            drawPoint(ctx, points[0].x * scale, points[0].y * scale, '#FF5A1F');
        } else if (points.length === 2) {
            if (mode === 'calibrating_line2') {
                drawLine(ctx, points[0].x * scale, points[0].y * scale, points[1].x * scale, points[1].y * scale, '#2E7D46');
            } else if (mode === 'measuring') {
                const mmVal = calculateDistanceInMm(points[0], points[1]);
                drawMeasurement(ctx, points[0], points[1], mmVal, scale);
            }
        }
    };

    const drawPoint = (ctx, x, y, color, label = '') => {
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#FFFFFF';
        ctx.stroke();
        
        if (label) {
            ctx.fillStyle = color;
            ctx.font = 'bold 12px sans-serif';
            ctx.fillText(label, x + 8, y - 8);
        }
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
        ctx.fillStyle = 'rgba(255, 90, 31, 0.95)';
        const text = `${mm} mm`;
        ctx.font = 'bold 13px monospace';
        const textWidth = ctx.measureText(text).width;
        ctx.fillRect(midX - textWidth/2 - 6, midY - 14, textWidth + 12, 22);
        ctx.fillStyle = '#FFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, midX, midY - 2);
    };

    // Calcular distância em mm entre 2 pontos na imagem original
    const calculateDistanceInMm = (p1, p2) => {
        if (homographyMatrix && pxPerMm) {
            // Usar retificação de perspectiva via Homografia
            const p1Ret = transformPointWithHomography(p1, homographyMatrix);
            const p2Ret = transformPointWithHomography(p2, homographyMatrix);
            const distPxRet = Math.hypot(p2Ret.x - p1Ret.x, p2Ret.y - p1Ret.y);
            return (distPxRet / pxPerMm).toFixed(2);
        } else if (pxPerMm) {
            // Fallback para escala linear simples
            const distPx = Math.hypot(p2.x - p1.x, p2.y - p1.y);
            return (distPx / pxPerMm).toFixed(2);
        }
        return '?';
    };

    const handleCanvasClick = (e) => {
        if (mode === 'idle') return;
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const viewScale = parseFloat(canvas.dataset.scale);
        const x = (e.clientX - rect.left) / viewScale;
        const y = (e.clientY - rect.top) / viewScale;

        const newPoints = [...points, { x, y }];
        setPoints(newPoints);

        if (mode === 'calibrating_qr4') {
            if (newPoints.length === 4) {
                // Calibração por 4 cantos do QR (TL, TR, BR, BL)
                apply4PointHomography(newPoints, qrSizeMm);
                setMode('idle');
                setPoints([]);
            }
        } else if (newPoints.length === 2) {
            if (mode === 'calibrating_line2') {
                // Calibração por linha de tamanho conhecido (ex: 30mm)
                const distPx = Math.hypot(newPoints[1].x - newPoints[0].x, newPoints[1].y - newPoints[0].y);
                setPxPerMm(distPx / qrSizeMm);
                setHomographyMatrix(null);
                setMode('idle');
                setPoints([]);
                setStatusMessage(`Calibração linear concluída: ${(distPx / qrSizeMm).toFixed(2)} px/mm`);
            } else if (mode === 'measuring') {
                const distMm = calculateDistanceInMm(newPoints[0], newPoints[1]);
                setMeasurements([...measurements, { p1: newPoints[0], p2: newPoints[1], mm: distMm }]);
                setMode('idle');
                setPoints([]);
            }
        }
    };

    // Aplicar Homografia a partir de 4 cantos (TL, TR, BR, BL)
    const apply4PointHomography = (srcCorners, realMmSize) => {
        const targetPxPerMm = 10.0;
        const sidePx = realMmSize * targetPxPerMm;
        const margin = sidePx * 2;
        
        const dstCorners = [
            { x: margin, y: margin },
            { x: margin + sidePx, y: margin },
            { x: margin + sidePx, y: margin + sidePx },
            { x: margin, y: margin + sidePx }
        ];

        const H = calculateHomographyDLT(srcCorners, dstCorners);
        setHomographyMatrix(H);
        setPxPerMm(targetPxPerMm);
        setStatusMessage(`Homografia calibrada com sucesso! (${realMmSize}mm QR retificado)`);
    };

    // Detecção Automática do QR Marcador via OpenCV.js QRCodeDetector
    const detectQrAuto = async () => {
        setAnalyzing(true);
        setStatusMessage(null);
        try {
            if (!window.cv || !imageRef.current) {
                throw new Error("OpenCV.js não inicializado.");
            }
            const cv = window.cv;
            const tmpCanvas = document.createElement('canvas');
            tmpCanvas.width = imageRef.current.width;
            tmpCanvas.height = imageRef.current.height;
            const ctx = tmpCanvas.getContext('2d');
            ctx.drawImage(imageRef.current, 0, 0);

            const srcMat = cv.imread(tmpCanvas);
            let detected = false;
            let corners = [];

            // 1. Tentar cv.QRCodeDetector nativo do OpenCV
            if (cv.QRCodeDetector) {
                try {
                    const detector = new cv.QRCodeDetector();
                    const pointsMat = new cv.Mat();
                    const ok = detector.detect(srcMat, pointsMat);
                    
                    if (ok && pointsMat.data32F && pointsMat.data32F.length >= 8) {
                        const pts = pointsMat.data32F;
                        corners = [
                            { x: pts[0], y: pts[1] },
                            { x: pts[2], y: pts[3] },
                            { x: pts[4], y: pts[5] },
                            { x: pts[6], y: pts[7] }
                        ];
                        detected = true;
                    }
                    pointsMat.delete();
                } catch (errQr) {
                    console.warn("[Fissurometro] QRCodeDetector error:", errQr);
                }
            }

            // 2. Fallback para ArUco / Contornos de Quadrado se QRCodeDetector não encontrar
            if (!detected && cv.findContours) {
                const gray = new cv.Mat();
                cv.cvtColor(srcMat, gray, cv.COLOR_RGBA2GRAY);
                cv.GaussianBlur(gray, gray, new cv.Size(5, 5), 0);
                const thresh = new cv.Mat();
                cv.adaptiveThreshold(gray, thresh, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, 11, 2);
                
                const contours = new cv.MatVector();
                const hierarchy = new cv.Mat();
                cv.findContours(thresh, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

                let maxArea = 0;
                let bestApprox = null;

                for (let i = 0; i < contours.size(); i++) {
                    const cnt = contours.get(i);
                    const area = cv.contourArea(cnt);
                    if (area > 400) {
                        const peri = cv.arcLength(cnt, true);
                        const approx = new cv.Mat();
                        cv.approxPolyDP(cnt, approx, 0.04 * peri, true);

                        if (approx.rows === 4 && area > maxArea) {
                            maxArea = area;
                            bestApprox = approx;
                        } else {
                            approx.delete();
                        }
                    }
                }

                if (bestApprox) {
                    const pts = bestApprox.data32S;
                    corners = [
                        { x: pts[0], y: pts[1] },
                        { x: pts[2], y: pts[3] },
                        { x: pts[4], y: pts[5] },
                        { x: pts[6], y: pts[7] }
                    ];
                    detected = true;
                    bestApprox.delete();
                }
                gray.delete(); thresh.delete(); contours.delete(); hierarchy.delete();
            }

            srcMat.delete();

            if (detected && corners.length === 4) {
                apply4PointHomography(corners, qrSizeMm);
            } else {
                alert("Nenhum Cartão QR (SIGERD:CRFP:v1) foi detectado com clareza. Por favor, use 'Calibrar Manualmente' para marcar os 4 cantos do cartão.");
            }
        } catch (err) {
            console.error("[Fissurometro] Erro na detecção automática:", err);
            alert("A detecção automática falhou ou o módulo não está disponível neste navegador. Use a calibração manual por 4 cantos.");
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

        // Desenhar todas as medições na imagem anotada final
        measurements.forEach(m => drawMeasurement(ctx, m.p1, m.p2, m.mm, 1));
        
        const annotatedDataUrl = finalCanvas.toDataURL('image/jpeg', 0.88);
        const maxMm = Math.max(...measurements.map(m => parseFloat(m.mm)));
        
        onComplete(maxMm, annotatedDataUrl);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-0 sm:p-4">
            <div className="w-full max-w-xl bg-white dark:bg-slate-900 overflow-hidden flex flex-col h-full max-h-full sm:max-h-[94vh] sm:rounded-2xl shadow-2xl">
                {/* Header */}
                <div className="p-4 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800 shrink-0">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="font-bold text-slate-800 dark:text-white uppercase tracking-wide text-xs sm:text-sm">Fissurômetro 2 — Retificação & Visão Computacional</h2>
                            <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                                CRFP v1 ({qrSizeMm}mm)
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-500">Medição de aberturas com correção de ângulo por Homografia</p>
                    </div>
                    <div className="flex items-center gap-1">
                        <button 
                            type="button" 
                            onClick={() => setShowQrModal(true)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-slate-700 rounded-full transition-colors flex items-center gap-1 text-xs font-semibold"
                            title="Ver/Imprimir Cartão QR de Referência"
                        >
                            <QrCode size={18} />
                        </button>
                        <button type="button" onClick={onCancel} className="p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </div>
                
                {/* Canvas Area */}
                <div className="flex-1 overflow-hidden bg-neutral-900 relative flex items-center justify-center p-2 min-h-[250px]">
                    {/* Tooltip Instruction */}
                    {mode === 'calibrating_qr4' && (
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg z-10 whitespace-nowrap animate-bounce flex items-center gap-1.5">
                            Clique nos 4 CANTOS do Cartão QR (TL, TR, BR, BL) — {points.length}/4 marcados
                        </div>
                    )}
                    {mode === 'calibrating_line2' && (
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-amber-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg z-10 whitespace-nowrap animate-bounce flex items-center gap-1.5">
                            Clique nos 2 extremos do marcador ({qrSizeMm}mm)
                        </div>
                    )}
                    {mode === 'measuring' && (
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg z-10 whitespace-nowrap animate-bounce flex items-center gap-1.5">
                            Clique nas 2 bordas da abertura para medir a fissura
                        </div>
                    )}

                    <canvas 
                        ref={canvasRef} 
                        onClick={handleCanvasClick}
                        className={`max-w-full max-h-full object-contain shadow-2xl rounded ${mode !== 'idle' ? 'cursor-crosshair' : ''}`}
                    />
                    
                    {analyzing && (
                        <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center text-white backdrop-blur-sm z-20">
                            <RefreshCw className="animate-spin mb-3 text-blue-400" size={36} />
                            <p className="font-mono text-sm tracking-wider font-bold">DETECTANDO MARCADOR E RETIFICANDO PERSPECTIVA...</p>
                        </div>
                    )}
                </div>

                {/* Control Panel */}
                <div className="p-4 border-t dark:border-slate-800 space-y-3 bg-white dark:bg-slate-900 shrink-0 overflow-y-auto max-h-[48vh]">
                    {statusMessage && (
                        <div className="text-xs bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 p-2.5 rounded-lg border border-indigo-200 dark:border-indigo-800 font-medium">
                            {statusMessage}
                        </div>
                    )}

                    {!pxPerMm ? (
                        <div className="space-y-3">
                            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border dark:border-slate-700">
                                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Tamanho do Marcador Físico:</span>
                                <div className="flex items-center gap-1.5">
                                    <input 
                                        type="number" 
                                        value={qrSizeMm} 
                                        onChange={(e) => setQrSizeMm(Number(e.target.value) || 30.0)}
                                        className="w-16 px-2 py-1 text-xs border rounded-lg text-center dark:bg-slate-900 dark:border-slate-700 font-bold"
                                    />
                                    <span className="text-xs font-mono text-slate-500">mm</span>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <button 
                                    type="button"
                                    onClick={detectQrAuto}
                                    disabled={analyzing}
                                    className="py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs sm:text-sm flex justify-center items-center gap-2 transition-colors shadow-md shadow-indigo-600/20"
                                >
                                    <Camera size={18} /> Detectar QR Auto-IA (Homografia)
                                </button>

                                <button 
                                    type="button"
                                    onClick={() => { setMode('calibrating_qr4'); setPoints([]); }}
                                    className={`py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex justify-center items-center gap-2 border-2 transition-all ${mode === 'calibrating_qr4' ? 'border-amber-500 text-amber-700 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400 ring-2 ring-amber-400/50' : 'border-amber-500/80 text-amber-600 bg-amber-50/50 dark:border-amber-700 dark:text-amber-300 dark:bg-amber-950/20 hover:bg-amber-100/50'}`}
                                >
                                    <Maximize size={18} /> Calibrar 4 Cantos (Manual)
                                </button>
                            </div>

                            <button 
                                type="button"
                                onClick={() => { setMode('calibrating_line2'); setPoints([]); }}
                                className="w-full py-2 px-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-semibold flex justify-center items-center gap-1.5 hover:bg-slate-200"
                            >
                                <CornerDownRight size={14} /> Fallback: Escala Linear Simples por Linha
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-300 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
                                <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                                        ✓ {homographyMatrix ? 'Homografia & Perspectiva Corrigidas' : 'Escala Calibrada'} ({(1/pxPerMm).toFixed(3)} mm/px)
                                    </span>
                                </div>
                                <button type="button" onClick={() => {setPxPerMm(null); setHomographyMatrix(null); setMeasurements([]); setMode('idle'); setPoints([]); setStatusMessage(null);}} className="text-red-500 font-bold hover:underline ml-2">
                                    Recalibrar
                                </button>
                            </div>
                            
                            <button 
                                type="button"
                                onClick={() => { setMode('measuring'); setPoints([]); }}
                                className={`w-full py-3 rounded-xl font-bold text-xs sm:text-sm flex justify-center items-center gap-2 border-2 transition-colors ${mode === 'measuring' ? 'border-indigo-500 text-indigo-700 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400 ring-2 ring-indigo-400/50' : 'border-indigo-600 text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 dark:border-indigo-500 dark:text-indigo-300 hover:bg-indigo-100'}`}
                            >
                                <MousePointer2 size={18} /> Adicionar Medição de Abertura (Clicar 2 pontos)
                            </button>
                        </div>
                    )}
                    
                    {measurements.length > 0 && (
                        <button 
                            type="button"
                            onClick={handleSave}
                            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm sm:text-[15px] flex justify-center items-center gap-2 shadow-lg shadow-emerald-600/20 transition-transform active:scale-95"
                        >
                            <Check size={20} /> Concluir e Anexar Versão Anotada ({measurements.length} {measurements.length === 1 ? 'medição' : 'medições'})
                        </button>
                    )}
                </div>
            </div>

            {/* Modal do Marcador QR */}
            <MarcadorQRModal isOpen={showQrModal} onClose={() => setShowQrModal(false)} />
        </div>
    );
}
