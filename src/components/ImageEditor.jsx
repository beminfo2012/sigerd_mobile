import React, { useRef, useState, useEffect, useCallback } from 'react';
import * as fabric from 'fabric';
import { 
    X, Check, Undo, RotateCcw, MousePointer2, 
    ArrowUpRight, Square, Circle as CircleIcon, PenTool,
    Trash2, Palette, Minus, Plus, Type, RotateCw, Sun, Zap, 
    Sliders, Crop, Maximize2, Move, RefreshCw, ZoomIn, ZoomOut,
    CheckCircle2, FlipHorizontal
} from 'lucide-react';

const COLORS = [
    { label: 'Vermelho Alerta', hex: '#EF4444' },
    { label: 'Amarelo Atenção', hex: '#F59E0B' },
    { label: 'Verde Seguro', hex: '#10B981' },
    { label: 'Azul Técnico', hex: '#3B82F6' },
    { label: 'Branco', hex: '#FFFFFF' },
    { label: 'Preto', hex: '#000000' }
];

const THICKNESSES = [2, 4, 8];

const ASPECT_RATIOS = [
    { id: '4:3', label: '4:3 Relatório', ratio: 4 / 3, desc: 'Padrão PDF/Impressão' },
    { id: '16:9', label: '16:9 Widescreen', ratio: 16 / 9, desc: 'Horizontal Panorâmico' },
    { id: '3:2', label: '3:2 Foto', ratio: 3 / 2, desc: 'Fotografia Clássica' },
    { id: '1:1', label: '1:1 Quadrado', ratio: 1, desc: 'Grid Quadrado' },
    { id: '3:4', label: '3:4 Retrato', ratio: 3 / 4, desc: 'Vertical Relatório' },
    { id: 'original', label: 'Original', ratio: null, desc: 'Manter proporção' }
];

/**
 * Utility to analyze if the image contains an existing bottom metadata bar
 * and separate the pure photo from the metadata bar.
 */
const extractPhotoAndTarja = (img, photoData) => {
    try {
        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        // Check if metadata is passed via photoData props
        const hasPropsMeta = !!(photoData && (
            (photoData.latitude && photoData.longitude) ||
            photoData.data_hora_captura ||
            photoData.timestamp
        ));

        // Scan bottom 25% of image for dark background with separator line
        const maxScanHeight = Math.round(h * 0.25);
        const imgData = ctx.getImageData(0, h - maxScanHeight, w, maxScanHeight);
        const data = imgData.data;

        let detectedTarjaY = -1;

        for (let relY = 0; relY < maxScanHeight - 15; relY++) {
            const absY = (h - maxScanHeight) + relY;
            let darkPixelCount = 0;
            const sampleSteps = 24;

            for (let s = 0; s < sampleSteps; s++) {
                const sampleX = Math.round((w / (sampleSteps + 1)) * (s + 1));
                const belowRelY = relY + 8;
                if (belowRelY < maxScanHeight) {
                    const idx = (belowRelY * w + sampleX) * 4;
                    const r = data[idx];
                    const g = data[idx + 1];
                    const b = data[idx + 2];
                    if (r < 45 && g < 50 && b < 65) {
                        darkPixelCount++;
                    }
                }
            }

            if (darkPixelCount >= sampleSteps * 0.85) {
                // Confirm bottom pixels are also dark
                let bottomDarkCount = 0;
                for (let s = 0; s < sampleSteps; s++) {
                    const sampleX = Math.round((w / (sampleSteps + 1)) * (s + 1));
                    const bottomIdx = ((maxScanHeight - 4) * w + sampleX) * 4;
                    const r = data[bottomIdx];
                    const g = data[bottomIdx + 1];
                    const b = data[bottomIdx + 2];
                    if (r < 45 && g < 50 && b < 65) {
                        bottomDarkCount++;
                    }
                }

                if (bottomDarkCount >= sampleSteps * 0.85) {
                    detectedTarjaY = absY;
                    break;
                }
            }
        }

        if (detectedTarjaY > 0 && detectedTarjaY < h - 20) {
            // Found tarja!
            const photoCanvas = document.createElement('canvas');
            photoCanvas.width = w;
            photoCanvas.height = detectedTarjaY;
            const pCtx = photoCanvas.getContext('2d');
            pCtx.drawImage(canvas, 0, 0, w, detectedTarjaY, 0, 0, w, detectedTarjaY);

            const tarjaH = h - detectedTarjaY;
            const tarjaCanvas = document.createElement('canvas');
            tarjaCanvas.width = w;
            tarjaCanvas.height = tarjaH;
            const tCtx = tarjaCanvas.getContext('2d');
            tCtx.drawImage(canvas, 0, detectedTarjaY, w, tarjaH, 0, 0, w, tarjaH);

            return {
                hasTarja: true,
                photoOnlyUrl: photoCanvas.toDataURL('image/jpeg', 0.95),
                tarjaCanvas,
                tarjaHeight: tarjaH,
                photoWidth: w,
                photoHeight: detectedTarjaY,
                hasPropsMeta
            };
        }

        return {
            hasTarja: false,
            photoOnlyUrl: canvas.toDataURL('image/jpeg', 0.95),
            tarjaCanvas: null,
            tarjaHeight: 0,
            photoWidth: w,
            photoHeight: h,
            hasPropsMeta
        };
    } catch (e) {
        console.warn('Tarja extraction error:', e);
        return {
            hasTarja: false,
            photoOnlyUrl: img.src,
            tarjaCanvas: null,
            tarjaHeight: 0,
            photoWidth: img.naturalWidth || img.width,
            photoHeight: img.naturalHeight || img.height,
            hasPropsMeta: false
        };
    }
};

/**
 * Draws the metadata tarja preta onto the target context at yPosition.
 */
const drawMetadataTarja = (ctx, width, yStart, photoData, fallbackTarjaCanvas) => {
    const lines = [];
    const lat = photoData?.latitude || photoData?.lat;
    const lng = photoData?.longitude || photoData?.lng;
    const timestamp = photoData?.data_hora_captura || photoData?.timestamp;
    const fonte = photoData?.fonte_metadados;

    if (lat && lng) {
        lines.push(`LAT: ${lat} | LNG: ${lng}`);
    }

    if (timestamp) {
        const dateObj = (timestamp instanceof Date) ? timestamp : new Date(timestamp);
        const formattedDate = !isNaN(dateObj.getTime())
            ? dateObj.toLocaleString('pt-BR', {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', second: '2-digit'
            })
            : new Date().toLocaleString('pt-BR');
        lines.push(`DATA: ${formattedDate}`);
    }

    if (fonte === 'exif_original') {
        lines.push(`FONTE: EXTRAÍDO DO ARQUIVO`);
    } else if (fonte === 'gps_device') {
        lines.push(`FONTE: GPS DO DISPOSITIVO`);
    }

    if (lines.length > 0) {
        const padding = Math.max(10, Math.round(width * 0.025));
        const fontSize = Math.max(13, Math.round(width * 0.028));
        const lineHeight = Math.round(fontSize * 1.45);
        const totalTextHeight = lines.length * lineHeight;
        const barHeight = totalTextHeight + (padding * 1.6);

        // Solid dark background
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, yStart, width, barHeight);

        // Separator line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, yStart);
        ctx.lineTo(width, yStart);
        ctx.stroke();

        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        lines.forEach((line, index) => {
            const yCenter = yStart + padding + (lineHeight * (index + 0.5));
            const parts = line.split(':');
            const labelPart = parts[0] + ':';
            const valuePart = parts.slice(1).join(':');

            ctx.font = `800 ${fontSize}px "Roboto Mono", monospace, sans-serif`;
            ctx.fillStyle = labelPart.includes('DATA') 
                ? '#34d399' 
                : (labelPart.includes('FONTE') ? '#fbbf24' : '#38bdf8');
            ctx.fillText(labelPart.toUpperCase(), padding, yCenter);

            const labelWidth = ctx.measureText(labelPart.toUpperCase()).width;
            ctx.font = `500 ${fontSize}px "Roboto Mono", monospace, sans-serif`;
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(valuePart, padding + labelWidth + 6, yCenter);
        });

        return barHeight;
    } else if (fallbackTarjaCanvas) {
        // Draw the extracted original tarja scaled to current width
        const scale = width / fallbackTarjaCanvas.width;
        const barHeight = Math.round(fallbackTarjaCanvas.height * scale);
        ctx.drawImage(fallbackTarjaCanvas, 0, 0, fallbackTarjaCanvas.width, fallbackTarjaCanvas.height, 0, yStart, width, barHeight);
        return barHeight;
    }

    return 0;
};

const ImageEditor = ({ imageUrl, photoData = null, onSave, onCancel }) => {
    const canvasRef = useRef(null);
    const fabricRef = useRef(null);
    const containerRef = useRef(null);
    const isUndoing = useRef(false);
    
    // Editor Modes: 'frame', 'arrow', 'rect', 'circle', 'pen', 'text', 'select', 'adjust'
    const [mode, setMode] = useState('arrow');
    const [color, setColor] = useState('#EF4444');
    const [thickness, setThickness] = useState(4);
    const [selectedObject, setSelectedObject] = useState(null);
    const [history, setHistory] = useState([]);
    const [adjustments, setAdjustments] = useState({ brightness: 0, contrast: 0, saturation: 0 });
    const [rotation, setRotation] = useState(0);

    // Pure photo data (excluding the bottom tarja to prevent cropping it)
    const [photoInfo, setPhotoInfo] = useState({
        photoUrl: imageUrl,
        hasTarja: false,
        tarjaCanvas: null,
        tarjaHeight: 0
    });

    const [currentCanvasImage, setCurrentCanvasImage] = useState(imageUrl);
    const photoImgRef = useRef(null);

    // Framing / Crop State
    const [frameRatioId, setFrameRatioId] = useState('4:3');
    const [frameZoom, setFrameZoom] = useState(1.0);
    const [framePan, setFramePan] = useState({ x: 0, y: 0 });
    const [frameRotation, setFrameRotation] = useState(0);
    const [frameFlipH, setFrameFlipH] = useState(false);
    const [isDraggingFrame, setIsDraggingFrame] = useState(false);
    const dragStartRef = useRef({ x: 0, y: 0, initialPanX: 0, initialPanY: 0 });
    const cropContainerRef = useRef(null);

    const modeRef = useRef(mode);
    const colorRef = useRef(color);
    const thicknessRef = useRef(thickness);

    useEffect(() => { modeRef.current = mode; }, [mode]);
    useEffect(() => { colorRef.current = color; }, [color]);
    useEffect(() => { thicknessRef.current = thickness; }, [thickness]);

    // Load and analyze image on mount
    useEffect(() => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            photoImgRef.current = img;
            const extracted = extractPhotoAndTarja(img, photoData);
            setPhotoInfo({
                photoUrl: extracted.photoOnlyUrl,
                hasTarja: extracted.hasTarja || extracted.hasPropsMeta,
                tarjaCanvas: extracted.tarjaCanvas,
                tarjaHeight: extracted.tarjaHeight
            });
            setCurrentCanvasImage(extracted.photoOnlyUrl);
        };
        img.src = imageUrl;
    }, [imageUrl]);

    // Initialize Fabric Canvas ONCE
    useEffect(() => {
        if (!canvasRef.current || !containerRef.current) return;

        const canvas = new fabric.Canvas(canvasRef.current, {
            width: 400,
            height: 300,
            backgroundColor: '#090d16',
            preserveObjectStacking: true,
            selection: true
        });
        
        fabricRef.current = canvas;

        const saveHistory = () => {
            if (isUndoing.current) return;
            const json = canvas.toJSON(['selectable', 'evented']);
            setHistory(prev => [...prev.slice(-25), JSON.stringify(json)]);
        };

        canvas.on('selection:created', (e) => setSelectedObject(e.selected[0]));
        canvas.on('selection:updated', (e) => setSelectedObject(e.selected[0]));
        canvas.on('selection:cleared', () => setSelectedObject(null));
        
        canvas.on('object:modified', saveHistory);
        canvas.on('object:added', (e) => {
            if (!isUndoing.current && e.target.get('type') !== 'image') saveHistory();
        });

        // Drawing Handlers
        let isDrawing = false;
        let currentShape = null;
        let startPoint = null;

        const handleMouseDown = (options) => {
            const currentMode = modeRef.current;
            if (currentMode === 'select' || currentMode === 'pen' || currentMode === 'frame' || currentMode === 'adjust') return;
            
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
                    width: thicknessRef.current * 4.5,
                    height: thicknessRef.current * 4.5,
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

            if (currentMode === 'rect') {
                currentShape.set({
                    width: Math.abs(pointer.x - startPoint.x),
                    height: Math.abs(pointer.y - startPoint.y),
                    left: Math.min(pointer.x, startPoint.x),
                    top: Math.min(pointer.y, startPoint.y)
                });
            } else if (currentMode === 'circle') {
                const radius = Math.sqrt(Math.pow(pointer.x - startPoint.x, 2) + Math.pow(pointer.y - startPoint.y, 2)) / 2;
                currentShape.set({
                    radius: radius,
                    left: Math.min(pointer.x, startPoint.x),
                    top: Math.min(pointer.y, startPoint.y)
                });
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

        return () => {
            try {
                canvas.dispose();
            } catch (e) {
                console.warn('Canvas disposal notice:', e);
            }
            fabricRef.current = null;
        };
    }, []);

    // Update Image in Fabric Canvas whenever currentCanvasImage changes
    useEffect(() => {
        const canvas = fabricRef.current;
        const container = containerRef.current;
        if (!canvas || !container || !currentCanvasImage) return;

        // Skip if the canvas container is hidden (frame mode) to avoid Fabric.js
        // setDimensions crash: "Cannot destructure property 'el' of 'this.lower'"
        if (modeRef.current === 'frame') return;

        fabric.FabricImage.fromURL(currentCanvasImage, { crossOrigin: 'anonymous' }).then((img) => {
            // Re-check: mode might have changed while image was loading
            if (modeRef.current === 'frame') return;

            const maxWidth = container.clientWidth - 30;
            const maxHeight = container.clientHeight - 180;
            
            let scale = Math.min(maxWidth / img.width, maxHeight / img.height);
            
            img.set({
                scaleX: scale,
                scaleY: scale,
                selectable: false,
                evented: false,
                originX: 'center',
                originY: 'center',
            });

            // Remove existing image object
            const existingImg = canvas.getObjects().find(o => o.get('type') === 'image');
            if (existingImg) canvas.remove(existingImg);

            canvas.setDimensions({
                width: Math.round(img.width * scale),
                height: Math.round(img.height * scale)
            });

            canvas.insertAt(0, img);
            canvas.centerObject(img);

            if (!isUndoing.current) {
                const json = canvas.toJSON(['selectable', 'evented']);
                setHistory([JSON.stringify(json)]);
            }

            canvas.requestRenderAll();
        }).catch(err => {
            console.error('Erro ao renderizar imagem no canvas:', err);
        });
    }, [currentCanvasImage]);

    // When leaving frame mode, re-render the (possibly updated) image into the Fabric canvas.
    // This is needed because canvas updates are skipped while in frame mode (canvas is hidden).
    const prevModeRef = useRef(mode);
    useEffect(() => {
        const prevMode = prevModeRef.current;
        prevModeRef.current = mode;

        if (prevMode === 'frame' && mode !== 'frame') {
            // Force re-render into Fabric canvas with the current image
            const canvas = fabricRef.current;
            const container = containerRef.current;
            if (!canvas || !container || !currentCanvasImage) return;

            fabric.FabricImage.fromURL(currentCanvasImage, { crossOrigin: 'anonymous' }).then((img) => {
                const maxWidth = container.clientWidth - 30;
                const maxHeight = container.clientHeight - 180;
                let scale = Math.min(maxWidth / img.width, maxHeight / img.height);

                img.set({
                    scaleX: scale, scaleY: scale,
                    selectable: false, evented: false,
                    originX: 'center', originY: 'center',
                });

                const existingImg = canvas.getObjects().find(o => o.get('type') === 'image');
                if (existingImg) canvas.remove(existingImg);

                canvas.setDimensions({
                    width: Math.round(img.width * scale),
                    height: Math.round(img.height * scale)
                });

                canvas.insertAt(0, img);
                canvas.centerObject(img);
                canvas.requestRenderAll();
            }).catch(() => {});
        }
    }, [mode]);

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

    // Update properties of selected object
    useEffect(() => {
        const canvas = fabricRef.current;
        if (!canvas || !selectedObject) return;

        if (selectedObject.get('type') === 'group') {
            const objects = selectedObject.getObjects();
            if (objects[0]) objects[0].set({ stroke: color, strokeWidth: thickness });
            if (objects[1]) objects[1].set({ fill: color });
        } else if (selectedObject.get('type') === 'i-text' || selectedObject.get('type') === 'textbox') {
            selectedObject.set({ fill: color });
        } else {
            selectedObject.set({
                stroke: color,
                strokeWidth: thickness
            });
        }
        canvas.requestRenderAll();
    }, [color, thickness, selectedObject]);

    // Add Text Annotation
    const handleAddText = () => {
        const canvas = fabricRef.current;
        if (!canvas) return;

        const text = new fabric.IText('Anotação Técnica', {
            left: canvas.width / 2 - 80,
            top: canvas.height / 2 - 20,
            fontFamily: 'Inter, Arial, sans-serif',
            fontSize: Math.max(16, Math.round(canvas.width * 0.035)),
            fontWeight: '700',
            fill: color,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            padding: 8,
            cornerColor: '#38bdf8',
            cornerStyle: 'circle',
            transparentCorners: false
        });

        canvas.add(text);
        canvas.setActiveObject(text);
        setMode('select');
        canvas.requestRenderAll();
    };

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

    // Apply Framing / Crop (Ensuring the pure photo is cropped and tarja is NOT cut)
    // After applying, returns to annotation mode ('arrow')
    const handleApplyFraming = () => {
        const photoUrl = photoInfo.photoUrl;
        if (!photoUrl) return;

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const selectedRatioObj = ASPECT_RATIOS.find(r => r.id === frameRatioId);
            const naturalW = img.naturalWidth || img.width;
            const naturalH = img.naturalHeight || img.height;
            const imgRatio = naturalW / naturalH;

            let targetRatio = selectedRatioObj?.ratio || imgRatio;
            if (frameRatioId === 'original' || !targetRatio) {
                targetRatio = imgRatio;
            }

            const outputWidth = 1400;
            const outputHeight = Math.round(outputWidth / targetRatio);

            const cropCanvas = document.createElement('canvas');
            cropCanvas.width = outputWidth;
            cropCanvas.height = outputHeight;
            const ctx = cropCanvas.getContext('2d');

            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, outputWidth, outputHeight);

            ctx.save();
            ctx.translate(outputWidth / 2, outputHeight / 2);
            ctx.rotate((frameRotation * Math.PI) / 180);
            if (frameFlipH) ctx.scale(-1, 1);

            let baseScale = Math.max(outputWidth / naturalW, outputHeight / naturalH);
            const totalScale = baseScale * frameZoom;

            const panScaleRatio = outputWidth / 600;
            const panX = framePan.x * panScaleRatio;
            const panY = framePan.y * panScaleRatio;

            ctx.drawImage(
                img,
                - (naturalW * totalScale) / 2 + panX,
                - (naturalH * totalScale) / 2 + panY,
                naturalW * totalScale,
                naturalH * totalScale
            );
            ctx.restore();

            const framedDataUrl = cropCanvas.toDataURL('image/jpeg', 0.95);
            setPhotoInfo(prev => ({ ...prev, photoUrl: framedDataUrl }));
            setCurrentCanvasImage(framedDataUrl);

            // Reset framing state and return to annotation mode
            setFrameZoom(1.0);
            setFramePan({ x: 0, y: 0 });
            setFrameRotation(0);
            setFrameFlipH(false);
            setMode('arrow');
        };
        img.src = photoUrl;
    };

    // Framing Drag & Pointer Handlers
    const handleFramePointerDown = (e) => {
        setIsDraggingFrame(true);
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        dragStartRef.current = {
            x: clientX,
            y: clientY,
            initialPanX: framePan.x,
            initialPanY: framePan.y
        };
    };

    const handleFramePointerMove = (e) => {
        if (!isDraggingFrame) return;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const dx = clientX - dragStartRef.current.x;
        const dy = clientY - dragStartRef.current.y;
        setFramePan({
            x: dragStartRef.current.initialPanX + dx,
            y: dragStartRef.current.initialPanY + dy
        });
    };

    const handleFramePointerUp = () => {
        setIsDraggingFrame(false);
    };

    // Attach wheel zoom to the frame container imperatively with { passive: false }
    // so that preventDefault() works (React onWheel is passive by default).
    useEffect(() => {
        const el = cropContainerRef.current;
        if (!el) return;

        const onWheel = (e) => {
            if (modeRef.current !== 'frame') return;
            e.preventDefault();
            const delta = e.deltaY < 0 ? 0.08 : -0.08;
            setFrameZoom(prev => Math.min(3.5, Math.max(0.5, prev + delta)));
        };

        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);
    }, []);

    // Helper: generate framed dataURL from current frameZoom/framePan/frameRotation/frameFlipH
    const generateFramedDataUrl = (photoUrl, ratioId, zoom, pan, rot, flipH) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                const selectedRatioObj = ASPECT_RATIOS.find(r => r.id === ratioId);
                const naturalW = img.naturalWidth || img.width;
                const naturalH = img.naturalHeight || img.height;
                const imgRatio = naturalW / naturalH;

                let targetRatio = selectedRatioObj?.ratio || imgRatio;
                if (ratioId === 'original' || !targetRatio) {
                    targetRatio = imgRatio;
                }

                const outputWidth = 1400;
                const outputHeight = Math.round(outputWidth / targetRatio);

                const cropCanvas = document.createElement('canvas');
                cropCanvas.width = outputWidth;
                cropCanvas.height = outputHeight;
                const ctx = cropCanvas.getContext('2d');

                ctx.fillStyle = '#000000';
                ctx.fillRect(0, 0, outputWidth, outputHeight);

                ctx.save();
                ctx.translate(outputWidth / 2, outputHeight / 2);
                ctx.rotate((rot * Math.PI) / 180);
                if (flipH) ctx.scale(-1, 1);

                let baseScale = Math.max(outputWidth / naturalW, outputHeight / naturalH);
                const totalScale = baseScale * zoom;

                const panScaleRatio = outputWidth / 600;
                const panX = pan.x * panScaleRatio;
                const panY = pan.y * panScaleRatio;

                ctx.drawImage(
                    img,
                    - (naturalW * totalScale) / 2 + panX,
                    - (naturalH * totalScale) / 2 + panY,
                    naturalW * totalScale,
                    naturalH * totalScale
                );
                ctx.restore();

                resolve(cropCanvas.toDataURL('image/jpeg', 0.95));
            };
            img.onerror = () => resolve(photoUrl); // fallback
            img.src = photoUrl;
        });
    };

    // Save final edited image. If in frame mode, auto-applies framing first.
    // Always appends the tarja de informações outside/below the photo.
    const handleSave = async () => {
        const isFrameMode = mode === 'frame';
        const hasFramingChanges = frameZoom !== 1.0 || framePan.x !== 0 || framePan.y !== 0 || frameRotation !== 0 || frameFlipH;

        let sourceDataUrl;

        if (isFrameMode || hasFramingChanges) {
            // Auto-apply framing before saving
            try {
                sourceDataUrl = await generateFramedDataUrl(
                    photoInfo.photoUrl,
                    frameRatioId,
                    frameZoom,
                    framePan,
                    frameRotation,
                    frameFlipH
                );
            } catch (e) {
                console.warn('Erro ao gerar enquadramento no save:', e);
                sourceDataUrl = currentCanvasImage;
            }
        } else {
            // Normal mode: export from fabric canvas with annotations
            const canvas = fabricRef.current;
            if (!canvas) {
                onSave(currentCanvasImage);
                return;
            }
            canvas.discardActiveObject();
            canvas.requestRenderAll();
            sourceDataUrl = canvas.toDataURL({ format: 'jpeg', quality: 0.95, multiplier: 1.5 });
        }

        // Stitch the metadata tarja cleanly at the bottom (NEVER cut off)
        if (photoInfo.hasTarja || photoData) {
            const tempImg = new Image();
            tempImg.crossOrigin = 'anonymous';
            tempImg.onload = () => {
                const finalW = tempImg.naturalWidth || tempImg.width;
                const finalH = tempImg.naturalHeight || tempImg.height;

                // Measure the bar height
                const measureCanvas = document.createElement('canvas');
                measureCanvas.width = finalW;
                measureCanvas.height = 300;
                const measureCtx = measureCanvas.getContext('2d');
                const barHeight = drawMetadataTarja(measureCtx, finalW, 0, photoData, photoInfo.tarjaCanvas);

                if (barHeight > 0) {
                    const finalCanvas = document.createElement('canvas');
                    finalCanvas.width = finalW;
                    finalCanvas.height = finalH + barHeight;
                    const finalCtx = finalCanvas.getContext('2d');

                    // 1. Draw the photo (framed or annotated) in the top portion
                    finalCtx.drawImage(tempImg, 0, 0, finalW, finalH);

                    // 2. Draw the info bar below the photo (outside)
                    drawMetadataTarja(finalCtx, finalW, finalH, photoData, photoInfo.tarjaCanvas);

                    onSave(finalCanvas.toDataURL('image/jpeg', 0.92));
                } else {
                    onSave(sourceDataUrl);
                }
            };
            tempImg.src = sourceDataUrl;
        } else {
            onSave(sourceDataUrl);
        }
    };

    return (
        <div 
            ref={containerRef}
            className="fixed inset-0 z-[6000] bg-slate-950 flex flex-col items-center overflow-hidden select-none font-sans"
        >
            {/* Top Toolbar - Frame Mode: dedicated minimal header */}
            {mode === 'frame' ? (
                <div className="w-full bg-indigo-950/95 backdrop-blur-md border-b border-indigo-500/30 px-4 py-3 pt-10 sm:pt-3 flex items-center justify-between z-50">
                    {/* Back button - discards framing changes */}
                    <button 
                        onClick={() => {
                            setFrameZoom(1.0);
                            setFramePan({ x: 0, y: 0 });
                            setFrameRotation(0);
                            setFrameFlipH(false);
                            setMode('arrow');
                        }}
                        className="flex items-center gap-2 px-3 py-2 text-indigo-300 hover:text-white hover:bg-indigo-800/60 rounded-xl transition-all text-sm font-bold"
                        title="Cancelar enquadramento"
                    >
                        <X size={18} />
                        <span className="hidden sm:inline">Cancelar</span>
                    </button>

                    {/* Title */}
                    <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-indigo-600/40 rounded-lg">
                            <Crop size={18} className="text-indigo-300" />
                        </div>
                        <div className="text-center">
                            <div className="text-sm font-black text-white tracking-wide">Enquadrar Foto</div>
                            <div className="text-[10px] text-indigo-300/70 font-medium">Ajuste o zoom e posição • Clique em Aplicar para confirmar</div>
                        </div>
                    </div>

                    {/* Spacer to balance layout */}
                    <div className="w-24" />
                </div>
            ) : (
                /* Normal Toolbar */
                <div className="w-full bg-slate-900/95 backdrop-blur-md border-b border-white/10 px-3 py-3 pt-10 sm:pt-3 flex items-center justify-between z-50">
                    <button 
                        onClick={onCancel} 
                        className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                        title="Cancelar"
                    >
                        <X size={20} />
                    </button>
                    
                    {/* Tools Selector */}
                    <div className="flex bg-slate-950/80 p-1 rounded-xl border border-white/10 gap-0.5 overflow-x-auto max-w-[70vw] sm:max-w-none scrollbar-none">
                        {[
                            { id: 'frame', icon: Crop, label: 'Enquadrar' },
                            { id: 'arrow', icon: ArrowUpRight, label: 'Seta' },
                            { id: 'rect', icon: Square, label: 'Retângulo' },
                            { id: 'circle', icon: CircleIcon, label: 'Círculo' },
                            { id: 'pen', icon: PenTool, label: 'Caneta' },
                            { id: 'text', icon: Type, label: 'Texto', isAction: true },
                            { id: 'select', icon: MousePointer2, label: 'Mover' },
                            { id: 'adjust', icon: Sliders, label: 'Ajustes' }
                        ].map(t => (
                            <button 
                                key={t.id}
                                onClick={() => {
                                    if (t.isAction && t.id === 'text') {
                                        handleAddText();
                                    } else {
                                        setMode(t.id);
                                    }
                                }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                                    mode === t.id 
                                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                                        : 'text-white/50 hover:text-white hover:bg-white/5'
                                }`}
                                title={t.label}
                            >
                                <t.icon size={16} />
                                <span className="hidden md:inline">{t.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-1.5">
                        <button 
                            onClick={() => {
                                const canvas = fabricRef.current;
                                if (!canvas) return;
                                const mainImg = canvas.getObjects().find(obj => obj.get('type') === 'image');
                                if (mainImg) {
                                    const newRotation = (rotation + 90) % 360;
                                    mainImg.set('angle', newRotation);
                                    setRotation(newRotation);
                                    canvas.requestRenderAll();
                                }
                            }}
                            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                            title="Girar 90°"
                        >
                            <RotateCw size={18} />
                        </button>
                        <button 
                            onClick={handleUndo} 
                            disabled={history.length <= 1} 
                            className={`p-2 rounded-xl transition-all ${history.length <= 1 ? 'text-white/15' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                            title="Desfazer"
                        >
                            <Undo size={18} />
                        </button>
                        <button 
                            onClick={handleSave} 
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs tracking-wider shadow-lg shadow-emerald-600/30 active:scale-95 flex items-center gap-1.5 transition-all"
                        >
                            <Check size={16} />
                            <span>OK</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Central Work Area: Both framing container and canvas container are always mounted to avoid removeChild errors */}
            <div className="flex-1 w-full flex items-center justify-center relative bg-slate-950 overflow-hidden">
                {/* Framing Mode Viewport Container */}
                <div 
                    ref={cropContainerRef}
                    style={{ display: mode === 'frame' ? 'flex' : 'none' }}
                    className="relative w-full h-full flex-col items-center justify-center p-4 select-none touch-none cursor-grab active:cursor-grabbing"
                    onPointerDown={handleFramePointerDown}
                    onPointerMove={handleFramePointerMove}
                    onPointerUp={handleFramePointerUp}
                    onPointerCancel={handleFramePointerUp}
                >
                    {(() => {
                        const selectedObj = ASPECT_RATIOS.find(r => r.id === frameRatioId);
                        let ratio = selectedObj?.ratio;
                        if (!ratio && photoImgRef.current) {
                            ratio = (photoImgRef.current.naturalWidth || photoImgRef.current.width) / 
                                    (photoImgRef.current.naturalHeight || photoImgRef.current.height);
                        }
                        if (!ratio) ratio = 4 / 3;

                        const maxBoxW = Math.min(cropContainerRef.current?.clientWidth ? cropContainerRef.current.clientWidth - 40 : 500, 640);
                        const maxBoxH = Math.min(cropContainerRef.current?.clientHeight ? cropContainerRef.current.clientHeight - 80 : 400, 480);

                        let boxWidth = maxBoxW;
                        let boxHeight = boxWidth / ratio;
                        if (boxHeight > maxBoxH) {
                            boxHeight = maxBoxH;
                            boxWidth = boxHeight * ratio;
                        }

                        return (
                            <div 
                                style={{ width: `${boxWidth}px`, height: `${boxHeight}px` }}
                                className="relative rounded-lg overflow-hidden border-2 border-indigo-400 shadow-2xl shadow-black/80 bg-black flex items-center justify-center group"
                            >
                                {/* Transforming Image Inside Frame */}
                                <div 
                                    style={{
                                        transform: `translate(${framePan.x}px, ${framePan.y}px) scale(${frameZoom}) rotate(${frameRotation}deg) scaleX(${frameFlipH ? -1 : 1})`,
                                        transformOrigin: 'center center',
                                        transition: isDraggingFrame ? 'none' : 'transform 0.15s ease-out'
                                    }}
                                    className="w-full h-full flex items-center justify-center pointer-events-none"
                                >
                                    <img 
                                        src={photoInfo.photoUrl} 
                                        alt="Framing preview" 
                                        className="max-w-none max-h-none object-cover pointer-events-none"
                                        style={{
                                            width: ratio >= 1 ? '100%' : 'auto',
                                            height: ratio < 1 ? '100%' : 'auto',
                                            minWidth: '100%',
                                            minHeight: '100%'
                                        }}
                                        crossOrigin="anonymous"
                                    />
                                </div>

                                {/* Rule-of-Thirds Grid Guides */}
                                <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-40">
                                    <div className="border-r border-b border-white/30" />
                                    <div className="border-r border-b border-white/30" />
                                    <div className="border-b border-white/30" />
                                    <div className="border-r border-b border-white/30" />
                                    <div className="border-r border-b border-white/30" />
                                    <div className="border-b border-white/30" />
                                    <div className="border-r border-b border-white/30" />
                                    <div className="border-r border-b border-white/30" />
                                    <div />
                                </div>

                                {/* Corner Brackets */}
                                <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-indigo-400 pointer-events-none" />
                                <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-indigo-400 pointer-events-none" />
                                <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-indigo-400 pointer-events-none" />
                                <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-indigo-400 pointer-events-none" />

                                {/* Aspect Ratio Badge Overlay */}
                                <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-black text-indigo-300 uppercase tracking-widest border border-indigo-500/30 pointer-events-none">
                                    Quadro {selectedObj?.label}
                                </div>

                                {photoInfo.hasTarja && (
                                    <div className="absolute top-3 right-3 bg-emerald-950/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-black text-emerald-300 uppercase tracking-widest border border-emerald-500/30 pointer-events-none flex items-center gap-1">
                                        <CheckCircle2 size={12} />
                                        Tarja Preservada
                                    </div>
                                )}

                                {/* Hint Floating Badge */}
                                <div className="absolute bottom-3 inset-x-0 mx-auto w-max bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-white/70 border border-white/10 pointer-events-none flex items-center gap-1.5 shadow-lg">
                                    <Move size={12} className="text-indigo-400 animate-pulse" />
                                    Arraste para posicionar • Use + / - para zoom
                                </div>
                            </div>
                        );
                    })()}
                </div>

                {/* Fabric Annotation Canvas Container (Always in DOM) */}
                <div 
                    style={{ display: mode === 'frame' ? 'none' : 'flex' }}
                    className="w-full h-full items-center justify-center relative"
                >
                    <canvas ref={canvasRef} />
                    {selectedObject && (
                        <button 
                            onClick={handleDelete}
                            className="absolute bottom-4 right-4 p-3.5 bg-red-600 hover:bg-red-500 text-white rounded-full shadow-2xl animate-in zoom-in duration-150 active:scale-95 transition-all"
                            title="Excluir elemento selecionado"
                        >
                            <Trash2 size={20} />
                        </button>
                    )}
                </div>
            </div>

            {/* Bottom Control Bar */}
            <div className="w-full bg-slate-900/95 backdrop-blur-xl border-t border-white/10 p-3 pb-8 sm:pb-4 z-50">
                <div className="max-w-2xl mx-auto flex flex-col gap-3">
                    {mode === 'frame' ? (
                        /* Framing Controls */
                        <div className="flex flex-col gap-3">
                            {/* Aspect Ratios Selection */}
                            <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1 scrollbar-none">
                                {ASPECT_RATIOS.map(ratio => (
                                    <button
                                        key={ratio.id}
                                        onClick={() => {
                                            setFrameRatioId(ratio.id);
                                            setFramePan({ x: 0, y: 0 });
                                        }}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex flex-col items-center ${
                                            frameRatioId === ratio.id 
                                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                                                : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10'
                                        }`}
                                    >
                                        <span>{ratio.label}</span>
                                        <span className="text-[9px] opacity-60 font-normal">{ratio.desc}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Zoom, Pan & Quick Frame Action Controls */}
                            <div className="flex items-center justify-between gap-3 bg-white/5 p-2 rounded-xl border border-white/5">
                                {/* Zoom Slider & Buttons */}
                                <div className="flex items-center gap-2 flex-1">
                                    <button 
                                        onClick={() => setFrameZoom(prev => Math.max(0.5, prev - 0.15))}
                                        className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
                                        title="Reduzir Zoom"
                                    >
                                        <ZoomOut size={16} />
                                    </button>
                                    
                                    <input 
                                        type="range"
                                        min={0.5}
                                        max={3.0}
                                        step={0.05}
                                        value={frameZoom}
                                        onChange={(e) => setFrameZoom(parseFloat(e.target.value))}
                                        className="flex-1 accent-indigo-500 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                    />

                                    <button 
                                        onClick={() => setFrameZoom(prev => Math.min(3.0, prev + 0.15))}
                                        className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
                                        title="Aumentar Zoom"
                                    >
                                        <ZoomIn size={16} />
                                    </button>

                                    <span className="text-xs font-black text-white/60 w-12 text-right">
                                        {(frameZoom * 100).toFixed(0)}%
                                    </span>
                                </div>

                                <div className="h-6 w-px bg-white/10" />

                                {/* Quick Framing Tools */}
                                <div className="flex items-center gap-1.5">
                                    <button 
                                        onClick={() => {
                                            setFramePan({ x: 0, y: 0 });
                                            setFrameZoom(1.0);
                                        }}
                                        className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition-all"
                                        title="Centralizar"
                                    >
                                        Centralizar
                                    </button>
                                    <button 
                                        onClick={() => {
                                            setFrameRotation(prev => (prev + 90) % 360);
                                        }}
                                        className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
                                        title="Girar 90°"
                                    >
                                        <RotateCw size={16} />
                                    </button>
                                    <button 
                                        onClick={() => setFrameFlipH(prev => !prev)}
                                        className={`p-1.5 rounded-lg transition-all ${frameFlipH ? 'bg-indigo-600 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                                        title="Espelhar Horizontal"
                                    >
                                        <FlipHorizontal size={16} />
                                    </button>
                                </div>

                                {/* Apply Framing Button */}
                                <button
                                    onClick={handleApplyFraming}
                                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-black tracking-wide shadow-md shadow-indigo-600/30 flex items-center gap-1.5 active:scale-95 transition-all"
                                >
                                    <CheckCircle2 size={15} />
                                    Aplicar
                                </button>
                            </div>
                        </div>
                    ) : mode === 'adjust' ? (
                        /* Image Adjustment Sliders */
                        <div className="flex flex-col gap-2.5 animate-in fade-in slide-in-from-bottom-2">
                            {[
                                { id: 'brightness', icon: Sun, label: 'Brilho', min: -1, max: 1, step: 0.05 },
                                { id: 'contrast', icon: Zap, label: 'Contraste', min: -1, max: 1, step: 0.05 },
                                { id: 'saturation', icon: Palette, label: 'Saturação', min: -1, max: 1, step: 0.05 }
                            ].map(adj => (
                                <div key={adj.id} className="flex items-center gap-3">
                                    <adj.icon size={15} className="text-white/50 shrink-0" />
                                    <span className="text-xs font-bold text-white/70 w-20">{adj.label}</span>
                                    <input 
                                        type="range"
                                        min={adj.min}
                                        max={adj.max}
                                        step={adj.step}
                                        value={adjustments[adj.id]}
                                        onChange={(e) => {
                                            const val = parseFloat(e.target.value);
                                            setAdjustments(prev => ({ ...prev, [adj.id]: val }));
                                            const canvas = fabricRef.current;
                                            const img = canvas?.getObjects().find(o => o.get('type') === 'image');
                                            if (img) {
                                                if (adj.id === 'brightness') {
                                                    img.filters = (img.filters || []).filter(f => !(f instanceof fabric.filters.Brightness));
                                                    if (val !== 0) img.filters.push(new fabric.filters.Brightness({ brightness: val }));
                                                } else if (adj.id === 'contrast') {
                                                    img.filters = (img.filters || []).filter(f => !(f instanceof fabric.filters.Contrast));
                                                    if (val !== 0) img.filters.push(new fabric.filters.Contrast({ contrast: val }));
                                                } else if (adj.id === 'saturation') {
                                                    img.filters = (img.filters || []).filter(f => !(f instanceof fabric.filters.Saturation));
                                                    if (val !== 0) img.filters.push(new fabric.filters.Saturation({ saturation: val }));
                                                }
                                                img.applyFilters();
                                                canvas.requestRenderAll();
                                            }
                                        }}
                                        className="flex-1 accent-indigo-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <span className="text-[11px] font-black text-white/50 w-10 text-right">
                                        {(adjustments[adj.id] * 100).toFixed(0)}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        /* Color Palette, Stroke Thickness and Clear */
                        <div className="flex flex-col gap-2.5">
                            <div className="flex items-center justify-between gap-3">
                                {/* Color Swatches */}
                                <div className="flex items-center gap-2">
                                    {COLORS.map(c => (
                                        <button
                                            key={c.hex}
                                            onClick={() => setColor(c.hex)}
                                            className={`w-7 h-7 rounded-full border-2 transition-all ${color === c.hex ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                            style={{ backgroundColor: c.hex }}
                                            title={c.label}
                                        />
                                    ))}
                                </div>

                                <div className="h-6 w-px bg-white/10" />

                                {/* Thickness Selection */}
                                <div className="flex items-center gap-1.5">
                                    {THICKNESSES.map(t => (
                                        <button
                                            key={t}
                                            onClick={() => setThickness(t)}
                                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black transition-all ${thickness === t ? 'bg-white text-slate-900 shadow-md scale-105' : 'bg-white/5 text-white/50 hover:text-white'}`}
                                            title={`Espessura ${t}px`}
                                        >
                                            {t}px
                                        </button>
                                    ))}
                                </div>

                                <div className="h-6 w-px bg-white/10" />

                                {/* Clear Annotations */}
                                <button 
                                    onClick={handleClear}
                                    className="flex items-center gap-1 px-2.5 py-1.5 bg-white/5 text-white/40 rounded-lg font-bold text-[10px] uppercase tracking-wider hover:bg-red-900/30 hover:text-red-300 transition-all"
                                    title="Limpar todos os desenhos da foto"
                                >
                                    <RotateCcw size={12} />
                                    Limpar
                                </button>
                            </div>

                            <div className="flex justify-between items-center text-[10px] text-white/30 font-bold uppercase tracking-widest px-1">
                                <span>
                                    {mode === 'select' ? 'Modo Seleção: Toque num elemento para mover ou editar' : `Ferramenta Ativa: ${mode.toUpperCase()} • ${thickness}px`}
                                </span>
                                <button 
                                    onClick={() => setMode('frame')}
                                    className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 normal-case font-semibold"
                                >
                                    <Crop size={11} />
                                    Ajustar Enquadramento de Impressão
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImageEditor;
