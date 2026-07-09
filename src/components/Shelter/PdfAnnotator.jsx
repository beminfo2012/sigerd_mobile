import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export function PdfAnnotator({ 
  pdfUrl, 
  shapes, 
  onShapesChange, 
  activeCategoryColor, 
  activeCategoryId, 
  readOnly = false,
  hoveredShapeId,
  setHoveredShapeId,
  selectedShapeId,
  setSelectedShapeId
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPolygon, setCurrentPolygon] = useState([]);
  const [pdfDimensions, setPdfDimensions] = useState({ width: 800, height: 600 });
  const [isLoading, setIsLoading] = useState(true);
  const [draggingPoint, setDraggingPoint] = useState(null); // { shapeId, pointIndex }

  useEffect(() => {
    let renderTask = null;
    const loadPdf = async () => {
      try {
        setIsLoading(true);
        const loadingTask = pdfjsLib.getDocument({ url: pdfUrl });
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);
        
        const viewport = page.getViewport({ scale: 2.0 }); // High quality scale
        const canvas = canvasRef.current;
        if(!canvas) return;
        
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        setPdfDimensions({ width: viewport.width, height: viewport.height });

        const renderContext = { canvasContext: context, viewport: viewport };
        renderTask = page.render(renderContext);
        await renderTask.promise;
      } catch (err) {
        console.error('Error rendering PDF:', err);
      } finally {
        setIsLoading(false);
      }
    };
    if (pdfUrl) loadPdf();
    
    return () => { if(renderTask) renderTask.cancel(); };
  }, [pdfUrl]);

  const [mouseDownPos, setMouseDownPos] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedShapeId && setSelectedShapeId(null);
        setIsDrawing(false);
        setCurrentPolygon([]);
        setDraggingPoint(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setSelectedShapeId]);

  // --- Drawing Logic ---
  const handleSvgMouseDown = (e) => {
    if (e.button !== 0) return; // Only track left click
    setMouseDownPos({ x: e.clientX, y: e.clientY });
  };

  const handleSvgClick = (e) => {
    if (readOnly || draggingPoint) return;
    
    // Se arrastou o mouse para fazer panning, não desenha ponto
    if (mouseDownPos) {
      const dx = e.clientX - mouseDownPos.x;
      const dy = e.clientY - mouseDownPos.y;
      if (Math.sqrt(dx * dx + dy * dy) > 5) {
        return; // Foi um arraste (panning), não um clique
      }
    }
    
    // Se clicou num polígono para selecionar, não desenha ponto novo (stopPropagation lidará com isso)
    if (!activeCategoryId) {
      setSelectedShapeId(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    // Using simple clientX/Y mapped to current target (SVG) via current scale
    const x = e.nativeEvent.offsetX;
    const y = e.nativeEvent.offsetY;

    if (!isDrawing) {
      setIsDrawing(true);
      setCurrentPolygon([{ x, y }]);
      setSelectedShapeId(null);
    } else {
      setCurrentPolygon(prev => [...prev, { x, y }]);
    }
  };

  const handleDoubleClick = (e) => {
    if (readOnly || !activeCategoryId || !isDrawing) return;
    e.preventDefault();
    e.stopPropagation();
    
    if (currentPolygon.length > 2) {
      const newShape = {
        id: Date.now().toString(),
        type: 'polygon',
        points: currentPolygon,
        color: activeCategoryColor,
        categoryId: activeCategoryId
      };
      onShapesChange([...shapes, newShape]);
      setSelectedShapeId(newShape.id);
    }
    setIsDrawing(false);
    setCurrentPolygon([]);
  };

  // --- Point Editing Logic ---
  const handlePointMouseDown = (e, shapeId, pointIndex) => {
    if (readOnly) return;
    e.stopPropagation();
    e.preventDefault();
    setDraggingPoint({ shapeId, pointIndex });
  };

  const handlePointContextMenu = (e, shapeId, pointIndex) => {
    if (readOnly) return;
    e.preventDefault();
    e.stopPropagation();
    const shape = shapes.find(s => s.id === shapeId);
    if (shape && shape.points.length > 3) {
      const newPoints = shape.points.filter((_, i) => i !== pointIndex);
      onShapesChange(shapes.map(s => s.id === shapeId ? { ...s, points: newPoints } : s));
    }
  };

  const handleSvgMouseMove = (e) => {
    if (readOnly || !draggingPoint) return;
    e.preventDefault();
    const x = e.nativeEvent.offsetX;
    const y = e.nativeEvent.offsetY;

    onShapesChange(shapes.map(s => {
      if (s.id === draggingPoint.shapeId) {
        const newPoints = [...s.points];
        newPoints[draggingPoint.pointIndex] = { x, y };
        return { ...s, points: newPoints };
      }
      return s;
    }));
  };

  const handleSvgMouseUp = () => {
    if (draggingPoint) {
      setDraggingPoint(null);
    }
  };

  const removeShape = (id, e) => {
    e.stopPropagation();
    if(readOnly) return;
    onShapesChange(shapes.filter(s => s.id !== id));
    if (selectedShapeId === id) setSelectedShapeId(null);
  };

  const renderPolygonPoints = (points) => points.map(p => `${p.x},${p.y}`).join(' ');

  const getPolygonCenter = (points) => {
    if (!points || points.length === 0) return { x: 0, y: 0 };
    const minX = Math.min(...points.map(p => p.x));
    const maxX = Math.max(...points.map(p => p.x));
    const minY = Math.min(...points.map(p => p.y));
    const maxY = Math.max(...points.map(p => p.y));
    return { x: minX + (maxX - minX) / 2, y: minY + (maxY - minY) / 2 };
  };

  return (
    <div className="relative border border-slate-300 rounded-xl bg-slate-100 overflow-hidden w-full h-full flex flex-col">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100/80 z-10">
          <span className="text-slate-500 font-semibold animate-pulse">Carregando visualização da planta...</span>
        </div>
      )}
      
      <TransformWrapper 
        initialScale={1} 
        minScale={0.1} 
        maxScale={8} 
        disabled={isDrawing || draggingPoint !== null} // Disable pan/zoom while drawing or dragging
        wheel={{ step: 0.005, smoothStep: 0.002 }}
        panning={{ wheelPanning: false, activationKeys: [] }}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 bg-white/90 p-1.5 rounded-lg shadow-md backdrop-blur-sm">
              <button onClick={() => zoomIn(0.25)} className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-bold text-lg">+</button>
              <button onClick={() => zoomOut(0.25)} className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-bold text-lg">-</button>
              <button onClick={() => resetTransform()} className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-bold text-xs">1:1</button>
            </div>

            <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
              <div 
                className="relative inline-block origin-top-left" 
                style={{ width: pdfDimensions.width, height: pdfDimensions.height }}
              >
                <canvas ref={canvasRef} className="absolute top-0 left-0" style={{ width: pdfDimensions.width, height: pdfDimensions.height }} />
                
                <svg 
                  className="absolute top-0 left-0" 
                  style={{ width: pdfDimensions.width, height: pdfDimensions.height, cursor: readOnly ? 'default' : (isDrawing ? 'crosshair' : 'grab') }}
                  onMouseDown={handleSvgMouseDown}
                  onClick={handleSvgClick}
                  onDoubleClick={handleDoubleClick}
                  onMouseMove={handleSvgMouseMove}
                  onMouseUp={handleSvgMouseUp}
                  onMouseLeave={handleSvgMouseUp}
                >
                  {/* Saved Shapes */}
                  {shapes.map((s) => {
                    const pts = s.type === 'polygon' && s.points ? s.points : 
                                // Fallback for old rects
                                [{x: s.x, y: s.y}, {x: s.x + s.width, y: s.y}, {x: s.x + s.width, y: s.y + s.height}, {x: s.x, y: s.y + s.height}];
                    const center = getPolygonCenter(pts);
                    const isHovered = hoveredShapeId === s.id;
                    const isSelected = selectedShapeId === s.id;
                    
                    return (
                      <g 
                        key={s.id} 
                        className={readOnly ? '' : 'cursor-pointer group'}
                        onClick={(e) => {
                          if (readOnly || isDrawing) return;
                          e.stopPropagation();
                          setSelectedShapeId(s.id);
                        }}
                        onMouseEnter={() => setHoveredShapeId && setHoveredShapeId(s.id)}
                        onMouseLeave={() => setHoveredShapeId && setHoveredShapeId(null)}
                      >
                        <polygon 
                          points={renderPolygonPoints(pts)} 
                          fill={`${s.color}${isHovered || isSelected ? '80' : '40'}`} 
                          stroke={s.color} 
                          strokeWidth={isSelected ? "4" : "2"} 
                          className="transition-all duration-200"
                        />
                        
                        {/* Editor Nodes for selected shape */}
                        {!readOnly && isSelected && pts.map((p, i) => (
                          <circle 
                            key={`node-${i}`} 
                            cx={p.x} cy={p.y} r="6" 
                            fill="#fff" stroke={s.color} strokeWidth="2"
                            className="cursor-move hover:r-8 transition-all"
                            onMouseDown={(e) => handlePointMouseDown(e, s.id, i)}
                            onContextMenu={(e) => handlePointContextMenu(e, s.id, i)}
                            title="Arraste para mover. Botão direito para excluir vértice."
                          />
                        ))}

                        {/* Label Badge */}
                        <foreignObject x={center.x - 60} y={center.y - 20} width="120" height="40" className="overflow-visible pointer-events-none">
                          <div className="flex flex-col items-center justify-center w-full h-full">
                            <span className={`bg-white/90 px-2 py-0.5 rounded text-[10px] font-black uppercase drop-shadow-sm text-center ${isSelected ? 'text-blue-600 border border-blue-400' : 'text-slate-800'}`}>
                              {s.label}
                            </span>
                          </div>
                        </foreignObject>

                        {!readOnly && isSelected && (
                          <foreignObject x={center.x + 60} y={center.y - 20} width="30" height="30" className="overflow-visible">
                            <button 
                              onClick={(e) => removeShape(s.id, e)}
                              className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-[10px] font-bold shadow-md hover:bg-red-600 pointer-events-auto"
                              title="Excluir Área"
                            >
                              X
                            </button>
                          </foreignObject>
                        )}
                      </g>
                    );
                  })}

                  {/* Current Drawing Polygon */}
                  {isDrawing && currentPolygon.length > 0 && (
                    <g className="pointer-events-none">
                      <polygon 
                        points={renderPolygonPoints(currentPolygon)} 
                        fill={`${activeCategoryColor}40`} 
                        stroke={activeCategoryColor} 
                        strokeWidth="2" 
                        strokeDasharray="4"
                      />
                      {currentPolygon.map((p, i) => (
                        <circle key={i} cx={p.x} cy={p.y} r="4" fill={activeCategoryColor} />
                      ))}
                    </g>
                  )}
                </svg>
              </div>
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
      
      {!readOnly && isDrawing && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg opacity-90 z-20 pointer-events-none text-center">
          Clique para adicionar pontos.<br/>Dê DUPLO CLIQUE para fechar a área.
        </div>
      )}
      {!readOnly && !isDrawing && selectedShapeId && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg opacity-90 z-20 pointer-events-none">
          Arraste os pontos brancos para ajustar. Botão direito num ponto para excluí-lo.
        </div>
      )}
    </div>
  );
}
