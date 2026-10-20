import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
    Camera, X, Zap, ZapOff, RotateCw, Check, RefreshCw, Trash2, 
    Plus, Minus, Layers, AlertCircle, ArrowLeft, Maximize2, Minimize2 
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { 
    saveCameraTempPhotos, 
    getCameraTempPhotos, 
    clearCameraTempPhotos, 
    removeCameraTempPhoto 
} from '../services/cameraStorage';

const CameraModal = ({ isOpen, onClose, onCapture }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const previewContainerRef = useRef(null);
    
    const [stream, setStream] = useState(null);
    const [flashMode, setFlashMode] = useState('off');
    const [facingMode, setFacingMode] = useState('environment'); // 'environment' ou 'user'
    const [isStarting, setIsStarting] = useState(true);
    
    // Zoom & Abertura
    const [zoom, setZoom] = useState(1.0);
    const [minZoom, setMinZoom] = useState(0.5);
    const [maxZoom, setMaxZoom] = useState(5.0);
    const [isHardwareZoomActive, setIsHardwareZoomActive] = useState(false);
    const [isHardwareZoomSupported, setIsHardwareZoomSupported] = useState(false);
    const [fitMode, setFitMode] = useState('cover'); // 'cover' (preencher tela) ou 'contain' (sensor aberto total)
    const [zoomToastText, setZoomToastText] = useState('');
    const zoomToastTimerRef = useRef(null);
    
    // Dispositivos de vídeo traseiros (detectar ultra-wide)
    const [availableBackCameras, setAvailableBackCameras] = useState([]);
    const [activeDeviceId, setActiveDeviceId] = useState(null);
    const [ultraWideDeviceId, setUltraWideDeviceId] = useState(null);
    const [isUltraWideActive, setIsUltraWideActive] = useState(false);

    // Multi-photo state
    const [capturedPhotos, setCapturedPhotos] = useState([]); // Array de { id, dataUrl, timestamp }
    const [isReviewing, setIsReviewing] = useState(false);
    const [selectedReviewIndex, setSelectedReviewIndex] = useState(0);
    const [flashEffect, setFlashEffect] = useState(false);
    const [isConfirmingClose, setIsConfirmingClose] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Gestos de toque (Pinch-to-zoom & Double-tap)
    const touchStartDistRef = useRef(null);
    const touchStartZoomRef = useRef(1.0);
    const lastTapTimeRef = useRef(0);

    // Carrega fotos salvas do IndexedDB ao abrir o modal
    useEffect(() => {
        if (isOpen) {
            document.body.classList.add('camera-modal-open');
            setZoom(1.0);
            setIsUltraWideActive(false);
            startCamera();
            loadSavedPhotos();
        } else {
            document.body.classList.remove('camera-modal-open');
            stopCamera();
            setIsReviewing(false);
            setIsConfirmingClose(false);
            setZoom(1.0);
        }
        return () => {
            document.body.classList.remove('camera-modal-open');
            stopCamera();
            if (zoomToastTimerRef.current) clearTimeout(zoomToastTimerRef.current);
        };
    }, [isOpen, facingMode]);

    const loadSavedPhotos = async () => {
        try {
            const saved = await getCameraTempPhotos();
            if (saved && saved.length > 0) {
                setCapturedPhotos(saved);
                toast.success(`${saved.length} foto(s) recuperada(s) do recarregamento anterior!`, {
                    duration: 4000,
                    icon: '📷'
                });
            }
        } catch (e) {
            console.error('Erro ao carregar fotos salvas:', e);
        }
    };

    const showZoomToast = (text) => {
        setZoomToastText(text);
        if (zoomToastTimerRef.current) clearTimeout(zoomToastTimerRef.current);
        zoomToastTimerRef.current = setTimeout(() => {
            setZoomToastText('');
        }, 1500);
    };

    const enumerateDevicesAndFindUltraWide = async () => {
        try {
            if (!navigator.mediaDevices?.enumerateDevices) return;
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(d => d.kind === 'videoinput');
            
            const backCams = videoDevices.filter(d => {
                const label = (d.label || '').toLowerCase();
                return label.includes('back') || 
                       label.includes('traseira') || 
                       label.includes('environment') || 
                       (!label.includes('front') && !label.includes('frontal') && !label.includes('user'));
            });

            setAvailableBackCameras(backCams);

            // Procura se tem lente ultra-wide explicitamente indicada
            const ultra = backCams.find(d => {
                const label = (d.label || '').toLowerCase();
                return label.includes('ultra') || 
                       label.includes('wide') || 
                       label.includes('0.5') || 
                       label.includes('0,5') || 
                       label.includes('grande');
            });

            if (ultra) {
                setUltraWideDeviceId(ultra.deviceId);
            } else if (backCams.length > 1) {
                // Em muitos aparelhos modernos Android/iOS com 2+ câmeras traseiras, o segundo é ultra-wide
                setUltraWideDeviceId(backCams[1].deviceId);
            }
        } catch (e) {
            console.warn('Erro ao enumerar câmeras:', e);
        }
    };

    const startCamera = async (targetDeviceId = null) => {
        setIsStarting(true);
        stopCamera();

        try {
            const constraints = {
                video: {
                    facingMode: targetDeviceId ? undefined : facingMode,
                    deviceId: targetDeviceId ? { exact: targetDeviceId } : undefined,
                    width: { ideal: 1920, min: 1280 },
                    height: { ideal: 1080, min: 720 }
                },
                audio: false
            };

            let newStream;
            try {
                newStream = await navigator.mediaDevices.getUserMedia(constraints);
            } catch (fallbackErr) {
                console.warn("Falha com constraints ideais, tentando básico:", fallbackErr);
                newStream = await navigator.mediaDevices.getUserMedia({
                    video: targetDeviceId ? { deviceId: { exact: targetDeviceId } } : { facingMode: facingMode },
                    audio: false
                });
            }

            setStream(newStream);
            if (videoRef.current) {
                videoRef.current.srcObject = newStream;
            }

            // Inspeciona recursos de zoom e configurações da câmera
            const track = newStream.getVideoTracks()[0];
            const capabilities = track.getCapabilities ? track.getCapabilities() : {};
            const settings = track.getSettings ? track.getSettings() : {};

            if (settings.deviceId) {
                setActiveDeviceId(settings.deviceId);
            }

            if (capabilities.zoom) {
                setIsHardwareZoomSupported(true);
                const minZ = capabilities.zoom.min !== undefined ? capabilities.zoom.min : 1.0;
                const maxZ = capabilities.zoom.max !== undefined ? capabilities.zoom.max : 5.0;
                const stepZ = capabilities.zoom.step || 0.1;

                // Permitimos descer para 0.5x mesmo que minZ seja 1, usando fallback de abertura/escala
                setMinZoom(Math.min(minZ, 0.5));
                setMaxZoom(Math.max(maxZ, 5.0));

                // Aplica zoom inicial se suportado
                try {
                    const hwZoom = Math.max(minZ, Math.min(zoom, maxZ));
                    await track.applyConstraints({ advanced: [{ zoom: hwZoom }] });
                    setIsHardwareZoomActive(true);
                } catch (e) {
                    console.warn("Hardware zoom apply failed:", e);
                    setIsHardwareZoomActive(false);
                }
            } else {
                setIsHardwareZoomSupported(false);
                setIsHardwareZoomActive(false);
                setMinZoom(0.5);
                setMaxZoom(5.0);
            }

            await enumerateDevicesAndFindUltraWide();
            setIsStarting(false);
        } catch (err) {
            console.error("Camera error:", err);
            toast.error("Erro ao acessar a câmera. Verifique as permissões.");
            onClose();
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const toggleFlash = async () => {
        if (!stream) return;
        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities ? track.getCapabilities() : {};

        if (!capabilities.torch) {
            toast.error("Flash não suportado neste dispositivo/navegador.");
            return;
        }

        let nextMode = flashMode === 'off' ? 'on' : flashMode === 'on' ? 'auto' : 'off';
        setFlashMode(nextMode);

        try {
            await track.applyConstraints({
                advanced: [{ torch: nextMode !== 'off' }]
            });
        } catch (err) {
            console.error("Flash error:", err);
        }
    };

    const toggleFacingMode = () => {
        setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
        setZoom(1.0);
        setIsUltraWideActive(false);
    };

    const toggleFitMode = () => {
        const next = fitMode === 'cover' ? 'contain' : 'cover';
        setFitMode(next);
        if (navigator.vibrate) navigator.vibrate(15);
        showZoomToast(next === 'contain' ? 'Abertura Total (Sensor Aberto)' : 'Preencher Tela Inteira');
    };

    // Aplicação de Zoom com suporte a Abertura e Ultra-Wide
    const applyZoom = useCallback(async (targetZoom, showToast = true) => {
        const clampedZoom = Math.min(Math.max(targetZoom, minZoom), maxZoom);
        const roundedZoom = Number(clampedZoom.toFixed(1));
        setZoom(roundedZoom);

        if (showToast) {
            if (roundedZoom <= 0.5) {
                showZoomToast('0.5x (Abertura Máxima)');
            } else {
                showZoomToast(`${roundedZoom}x`);
            }
            if (navigator.vibrate) navigator.vibrate(15);
        }

        // Se o usuário selecionou Abertura (0.5x) e estiver na câmera traseira:
        if (roundedZoom <= 0.6) {
            // Se houver lente física ultra-wide disponível e não estiver ativa nela:
            if (ultraWideDeviceId && activeDeviceId !== ultraWideDeviceId && facingMode === 'environment') {
                setIsUltraWideActive(true);
                startCamera(ultraWideDeviceId);
                return;
            }
        } else if (isUltraWideActive && roundedZoom >= 1.0) {
            // Volta para a câmera padrão se estava na ultra-wide física
            setIsUltraWideActive(false);
            startCamera(null);
            return;
        }

        // Tenta aplicar via hardware se suportado no track atual
        if (stream && isHardwareZoomSupported) {
            const track = stream.getVideoTracks()[0];
            const caps = track?.getCapabilities ? track.getCapabilities() : {};
            if (caps.zoom) {
                const hwTarget = Math.max(caps.zoom.min || 1, Math.min(roundedZoom, caps.zoom.max || 5));
                try {
                    await track.applyConstraints({ advanced: [{ zoom: hwTarget }] });
                    setIsHardwareZoomActive(true);
                    return;
                } catch (e) {
                    console.warn("Hardware zoom apply failed, using digital scale:", e);
                    setIsHardwareZoomActive(false);
                }
            }
        }

        setIsHardwareZoomActive(false);
    }, [minZoom, maxZoom, ultraWideDeviceId, activeDeviceId, facingMode, isUltraWideActive, stream, isHardwareZoomSupported]);

    // Gestos de toque na tela (Pinch-to-zoom e Double Tap)
    const handleTouchStart = (e) => {
        if (e.touches.length === 2) {
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const dist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
            touchStartDistRef.current = dist;
            touchStartZoomRef.current = zoom;
        } else if (e.touches.length === 1) {
            const now = Date.now();
            if (now - lastTapTimeRef.current < 300) {
                // Toque duplo: cicla entre 1x -> 2x -> 0.5x -> 1x
                const nextZoom = zoom === 1.0 ? 2.0 : zoom === 2.0 ? 0.5 : 1.0;
                applyZoom(nextZoom);
                lastTapTimeRef.current = 0;
            } else {
                lastTapTimeRef.current = now;
            }
        }
    };

    const handleTouchMove = (e) => {
        if (e.touches.length === 2 && touchStartDistRef.current) {
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const dist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
            const factor = dist / touchStartDistRef.current;
            const newZoom = touchStartZoomRef.current * factor;
            applyZoom(newZoom, false);
            showZoomToast(`${Number(newZoom.toFixed(1))}x`);
        }
    };

    const handleTouchEnd = () => {
        touchStartDistRef.current = null;
    };

    const capturePhoto = async () => {
        if (!videoRef.current || !canvasRef.current) return;
        
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const vw = video.videoWidth || 1920;
        const vh = video.videoHeight || 1080;
        
        canvas.width = vw;
        canvas.height = vh;
        const ctx = canvas.getContext('2d');
        
        // Se o zoom foi aplicado via hardware ou se zoom é 1.0:
        if (isHardwareZoomActive || zoom === 1.0) {
            ctx.drawImage(video, 0, 0, vw, vh);
        } else if (zoom > 1.0) {
            // Zoom digital: recorta o centro proporcional ao zoom e expande para tamanho original
            const cropW = vw / zoom;
            const cropH = vh / zoom;
            const cropX = (vw - cropW) / 2;
            const cropY = (vh - cropH) / 2;
            ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, vw, vh);
        } else {
            // zoom < 1.0 (Abertura / sem corte): captura imagem completa sem perda
            ctx.drawImage(video, 0, 0, vw, vh);
        }
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        const newPhoto = {
            id: `photo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            dataUrl,
            timestamp: Date.now()
        };

        // Efeito visual de Flash do obturador
        setFlashEffect(true);
        if (navigator.vibrate) navigator.vibrate(30);
        setTimeout(() => setFlashEffect(false), 120);

        const updatedPhotos = [...capturedPhotos, newPhoto];
        setCapturedPhotos(updatedPhotos);

        // Persiste imediatamente no IndexedDB / local storage
        await saveCameraTempPhotos(updatedPhotos);
    };

    const handleDeletePhoto = async (indexToDelete) => {
        const photoToDelete = capturedPhotos[indexToDelete];
        if (!photoToDelete) return;

        const updated = capturedPhotos.filter((_, idx) => idx !== indexToDelete);
        setCapturedPhotos(updated);

        await removeCameraTempPhoto(photoToDelete.id);

        if (updated.length === 0) {
            setIsReviewing(false);
            setSelectedReviewIndex(0);
        } else if (selectedReviewIndex >= updated.length) {
            setSelectedReviewIndex(updated.length - 1);
        }
    };

    const handleConfirmAll = async () => {
        if (capturedPhotos.length === 0) return;

        setIsProcessing(true);
        try {
            const files = await Promise.all(
                capturedPhotos.map(async (photo, index) => {
                    const res = await fetch(photo.dataUrl);
                    const blob = await res.blob();
                    return new File(
                        [blob], 
                        `camera-${photo.timestamp || Date.now()}-${index + 1}.jpg`, 
                        { type: 'image/jpeg' }
                    );
                })
            );

            await clearCameraTempPhotos();
            setCapturedPhotos([]);
            setIsReviewing(false);

            onCapture(files);
            onClose();
        } catch (err) {
            console.error("Erro ao processar fotos:", err);
            toast.error("Erro ao converter fotos. Tente novamente.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCloseAttempt = () => {
        if (capturedPhotos.length > 0) {
            setIsConfirmingClose(true);
        } else {
            onClose();
        }
    };

    const handleDiscardAndClose = async () => {
        await clearCameraTempPhotos();
        setCapturedPhotos([]);
        setIsConfirmingClose(false);
        onClose();
    };

    if (!isOpen) return null;

    // Presets rápidos de zoom
    const zoomPresets = [
        { label: '0.5x', val: 0.5, name: 'Abertura' },
        { label: '1x', val: 1.0, name: 'Padrão' },
        { label: '2x', val: 2.0, name: 'Zoom 2x' },
        ...(maxZoom >= 3.0 ? [{ label: '3x', val: 3.0, name: 'Zoom 3x' }] : [])
    ];

    return (
        <div className="fixed inset-0 z-[10000] bg-black flex flex-col items-center justify-center overflow-hidden font-sans select-none">
            {/* Direct Camera Capture Mode */}
            {!isReviewing ? (
                <>
                    {/* Live Video Preview Area com Suporte a Toque e Zoom */}
                    <div 
                        ref={previewContainerRef}
                        className="relative w-full h-full flex items-center justify-center overflow-hidden touch-none"
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    >
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className={`w-full h-full ${fitMode === 'contain' ? 'object-contain' : 'object-cover'} transition-transform duration-100 ease-out`}
                            style={{
                                transform: (!isHardwareZoomActive && zoom > 1.0) 
                                    ? `scale(${zoom})` 
                                    : (fitMode === 'cover' && zoom < 1.0)
                                        ? `scale(${zoom})`
                                        : undefined,
                                transformOrigin: 'center center'
                            }}
                        />

                        {/* Linhas guias sutis de enquadramento da Defesa Civil */}
                        <div className="absolute inset-0 pointer-events-none opacity-20 border border-white/20">
                            <div className="absolute inset-x-0 top-1/3 border-b border-white/30" />
                            <div className="absolute inset-x-0 bottom-1/3 border-b border-white/30" />
                            <div className="absolute inset-y-0 left-1/3 border-r border-white/30" />
                            <div className="absolute inset-y-0 right-1/3 border-r border-white/30" />
                        </div>
                    </div>

                    {/* Visual Shutter Flash Effect */}
                    {flashEffect && (
                        <div className="absolute inset-0 bg-white z-[10050] animate-pulse pointer-events-none" />
                    )}
                    
                    {/* Header Controls Overlay */}
                    <div className="absolute top-0 inset-x-0 p-5 flex justify-between items-center bg-gradient-to-b from-black/85 via-black/40 to-transparent z-[10020] pointer-events-auto">
                        <button 
                            type="button" 
                            onClick={handleCloseAttempt} 
                            className="p-3 bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-full text-white backdrop-blur-md transition-all active:scale-95"
                            title="Fechar Câmera"
                        >
                            <X size={22} />
                        </button>
                        
                        {/* Status Badge of Captured Photos */}
                        {capturedPhotos.length > 0 && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedReviewIndex(capturedPhotos.length - 1);
                                    setIsReviewing(true);
                                }}
                                className="px-4 py-2 bg-blue-600/90 hover:bg-blue-600 text-white rounded-full backdrop-blur-md flex items-center gap-2 border border-blue-400/40 shadow-lg shadow-blue-600/30 transition-all active:scale-95 animate-fade-in"
                            >
                                <Layers size={16} />
                                <span className="text-xs font-black uppercase tracking-wider">
                                    {capturedPhotos.length} {capturedPhotos.length === 1 ? 'Foto' : 'Fotos'}
                                </span>
                            </button>
                        )}

                        <div className="flex gap-2.5">
                            {/* Alternar Enquadramento / Abertura Total do Sensor */}
                            <button 
                                type="button"
                                onClick={toggleFitMode} 
                                className={`p-3 rounded-full backdrop-blur-md flex items-center justify-center transition-all active:scale-95 ${fitMode === 'contain' ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-white/10 text-white hover:bg-white/20'}`}
                                title={fitMode === 'contain' ? "Sensor Completo (Abertura Total)" : "Preencher Tela"}
                            >
                                {fitMode === 'contain' ? <Maximize2 size={20} /> : <Minimize2 size={20} />}
                            </button>

                            {/* Flash */}
                            <button 
                                type="button"
                                onClick={toggleFlash} 
                                className={`p-3 rounded-full backdrop-blur-md flex items-center justify-center transition-all active:scale-95 ${flashMode !== 'off' ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-white/10 text-white hover:bg-white/20'}`}
                                title="Flash"
                            >
                                {flashMode === 'off' ? <ZapOff size={20} /> : <Zap size={20} />}
                            </button>
                            
                            {/* Alternar Câmera Frontal / Traseira */}
                            <button 
                                type="button" 
                                onClick={toggleFacingMode} 
                                className="p-3 bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-full text-white backdrop-blur-md transition-all active:scale-95"
                                title="Girar Câmera"
                            >
                                <RotateCw size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Central Toast de Zoom ao Ajustar */}
                    {zoomToastText && (
                        <div className="absolute top-24 inset-x-0 flex justify-center z-[10030] pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                            <div className="px-4 py-1.5 bg-black/80 border border-amber-400/40 text-amber-400 rounded-full text-xs font-black tracking-widest uppercase shadow-2xl backdrop-blur-xl">
                                {zoomToastText}
                            </div>
                        </div>
                    )}

                    {/* Barra de Controles Rápidos de Zoom & Abertura (Estilo Câmera Nativa) */}
                    <div className="absolute bottom-32 inset-x-0 flex justify-center items-center z-[10020] pointer-events-auto">
                        <div className="flex items-center gap-1.5 p-1.5 bg-black/65 backdrop-blur-2xl border border-white/20 rounded-full shadow-2xl">
                            {/* Botão de Ajuste Fino: Diminuir Zoom / Abrir */}
                            <button
                                type="button"
                                onClick={() => applyZoom(zoom - 0.2)}
                                className="w-8 h-8 rounded-full text-white/70 hover:text-white flex items-center justify-center active:scale-90 transition-transform"
                                title="Diminuir Zoom / Abrir Câmera"
                                aria-label="Diminuir Zoom"
                            >
                                <Minus size={15} />
                            </button>

                            {/* Pílulas de Zoom (0.5x Abertura, 1x, 2x, etc.) */}
                            {zoomPresets.map(preset => {
                                const isActive = Math.abs(zoom - preset.val) < 0.15;
                                return (
                                    <button
                                        key={preset.label}
                                        type="button"
                                        onClick={() => applyZoom(preset.val)}
                                        className={`h-8 px-3 rounded-full text-xs font-black transition-all flex items-center justify-center active:scale-95 ${
                                            isActive
                                                ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/40 font-black scale-105'
                                                : 'bg-white/10 text-white/90 hover:bg-white/20'
                                        }`}
                                        title={`${preset.name} (${preset.label})`}
                                    >
                                        {preset.label}
                                    </button>
                                );
                            })}

                            {/* Botão de Ajuste Fino: Aumentar Zoom */}
                            <button
                                type="button"
                                onClick={() => applyZoom(zoom + 0.2)}
                                className="w-8 h-8 rounded-full text-white/70 hover:text-white flex items-center justify-center active:scale-90 transition-transform"
                                title="Aumentar Zoom"
                                aria-label="Aumentar Zoom"
                            >
                                <Plus size={15} />
                            </button>
                        </div>
                    </div>

                    {/* Bottom Controls Bar */}
                    <div className="absolute bottom-0 inset-x-0 p-6 pt-12 pb-8 flex items-center justify-between bg-gradient-to-t from-black/95 via-black/60 to-transparent z-[10020] pointer-events-auto">
                        {/* Thumbnail Slot (Left) */}
                        <div className="w-20 flex justify-start">
                            {capturedPhotos.length > 0 ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedReviewIndex(capturedPhotos.length - 1);
                                        setIsReviewing(true);
                                    }}
                                    className="relative group w-14 h-14 rounded-2xl overflow-hidden border-2 border-white/50 shadow-xl transition-transform active:scale-90"
                                >
                                    <img 
                                        src={capturedPhotos[capturedPhotos.length - 1].dataUrl} 
                                        alt="Última foto" 
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-black w-5 h-5 rounded-bl-lg flex items-center justify-center">
                                        {capturedPhotos.length}
                                    </div>
                                </button>
                            ) : (
                                <div className="w-14 h-14" />
                            )}
                        </div>

                        {/* Shutter Button (Center) */}
                        <button 
                            type="button"
                            onClick={capturePhoto}
                            disabled={isStarting}
                            className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center p-1.5 active:scale-90 transition-all shadow-2xl shadow-black/90 cursor-pointer"
                            aria-label="Disparar Foto"
                        >
                            <div className="w-full h-full bg-white rounded-full hover:bg-slate-200 transition-colors flex items-center justify-center">
                                <div className="w-14 h-14 rounded-full border-2 border-slate-300" />
                            </div>
                        </button>

                        {/* Confirm Button (Right) */}
                        <div className="w-20 flex justify-end">
                            {capturedPhotos.length > 0 ? (
                                <button
                                    type="button"
                                    onClick={handleConfirmAll}
                                    disabled={isProcessing}
                                    className="px-4 py-3 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/30 flex items-center gap-1.5 transition-all"
                                >
                                    {isProcessing ? (
                                        <RefreshCw size={18} className="animate-spin" />
                                    ) : (
                                        <>
                                            <Check size={18} strokeWidth={3} />
                                            <span>OK ({capturedPhotos.length})</span>
                                        </>
                                    )}
                                </button>
                            ) : (
                                <div className="w-14 h-14" />
                            )}
                        </div>
                    </div>

                    {isStarting && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/75 backdrop-blur-md z-[10040]">
                            <RefreshCw className="animate-spin text-blue-400" size={44} />
                            <span className="text-white font-black uppercase tracking-widest text-xs">Iniciando Câmera...</span>
                        </div>
                    )}
                </>
            ) : (
                /* Multi-Photo Review Gallery Screen */
                <div className="relative w-full h-full flex flex-col bg-slate-950 z-[10030]">
                    {/* Header */}
                    <div className="p-6 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-white backdrop-blur-md">
                        <button
                            type="button"
                            onClick={() => setIsReviewing(false)}
                            className="flex items-center gap-2 text-slate-300 hover:text-white font-bold text-xs uppercase tracking-wider p-2 bg-slate-800 rounded-xl"
                        >
                            <ArrowLeft size={18} /> Câmera
                        </button>

                        <div className="text-center">
                            <h3 className="font-black text-sm uppercase tracking-wider text-white">Revisar Capturas</h3>
                            <p className="text-[11px] text-slate-400 font-medium">Foto {selectedReviewIndex + 1} de {capturedPhotos.length}</p>
                        </div>

                        <button
                            type="button"
                            onClick={() => handleDeletePhoto(selectedReviewIndex)}
                            className="p-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl border border-red-500/30 transition-colors"
                            title="Excluir foto"
                        >
                            <Trash2 size={20} />
                        </button>
                    </div>

                    {/* Main Image View */}
                    <div className="flex-1 relative flex items-center justify-center p-4 bg-black overflow-hidden">
                        {capturedPhotos[selectedReviewIndex] && (
                            <img 
                                src={capturedPhotos[selectedReviewIndex].dataUrl} 
                                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" 
                                alt={`Captura ${selectedReviewIndex + 1}`} 
                            />
                        )}
                    </div>

                    {/* Bottom Strip & Actions */}
                    <div className="p-4 bg-slate-900/95 border-t border-slate-800 flex flex-col gap-4">
                        {/* Horizontal Thumbnail Slider */}
                        <div className="flex items-center gap-3 overflow-x-auto py-1 scrollbar-none">
                            {capturedPhotos.map((photo, idx) => (
                                <button
                                    key={photo.id}
                                    type="button"
                                    onClick={() => setSelectedReviewIndex(idx)}
                                    className={`relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${selectedReviewIndex === idx ? 'border-blue-500 scale-105 shadow-md shadow-blue-500/40 ring-2 ring-blue-500/30' : 'border-slate-700 opacity-60 hover:opacity-100'}`}
                                >
                                    <img src={photo.dataUrl} className="w-full h-full object-cover" alt="thumb" />
                                    <div className={`absolute bottom-0 inset-x-0 text-[9px] font-black text-center py-0.5 ${selectedReviewIndex === idx ? 'bg-blue-600 text-white' : 'bg-black/60 text-slate-300'}`}>
                                        #{idx + 1}
                                    </div>
                                </button>
                            ))}

                            {/* Add More Photos Card in Carousel */}
                            <button
                                type="button"
                                onClick={() => setIsReviewing(false)}
                                className="flex-shrink-0 w-16 h-16 rounded-xl border-2 border-dashed border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white flex flex-col items-center justify-center gap-1 transition-all"
                            >
                                <Plus size={20} />
                                <span className="text-[8px] font-bold uppercase">Mais</span>
                            </button>
                        </div>

                        {/* Review Action Buttons */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setIsReviewing(false)}
                                className="py-3.5 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2 border border-slate-700 transition-all active:scale-95"
                            >
                                <Camera size={18} /> Tirar Mais
                            </button>

                            <button
                                type="button"
                                onClick={handleConfirmAll}
                                disabled={isProcessing}
                                className="py-3.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-wider shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                            >
                                {isProcessing ? (
                                    <RefreshCw size={18} className="animate-spin" />
                                ) : (
                                    <>
                                        <Check size={18} strokeWidth={3} /> Inserir {capturedPhotos.length} {capturedPhotos.length === 1 ? 'Foto' : 'Fotos'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Discard Modal */}
            {isConfirmingClose && (
                <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[10100] flex items-center justify-center p-6 animate-fade-in">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center flex flex-col items-center gap-4 shadow-2xl">
                        <div className="w-14 h-14 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                            <AlertCircle size={32} />
                        </div>
                        <div>
                            <h4 className="font-black text-white text-base uppercase tracking-tight">Descartar Fotos?</h4>
                            <p className="text-xs text-slate-400 mt-1 font-medium leading-relaxed">
                                Você possui <strong className="text-amber-400">{capturedPhotos.length} foto(s)</strong> capturada(s) nesta sessão. Deseja descartar tudo ou continuar tirando fotos?
                            </p>
                        </div>
                        <div className="flex flex-col gap-2 w-full mt-2">
                            <button
                                type="button"
                                onClick={() => setIsConfirmingClose(false)}
                                className="w-full py-3.5 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-wider shadow-lg shadow-blue-600/30 active:scale-95 transition-all"
                            >
                                Continuar Fotografando
                            </button>
                            <button
                                type="button"
                                onClick={handleDiscardAndClose}
                                className="w-full py-3.5 bg-slate-800 text-red-400 hover:bg-red-500/20 border border-red-500/20 rounded-2xl font-black uppercase text-xs tracking-wider active:scale-95 transition-all"
                            >
                                Descartar e Sair
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
};

export default CameraModal;
