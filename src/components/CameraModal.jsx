import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, Zap, ZapOff, RotateCw, Check, RefreshCw, Trash2, Plus, Layers, AlertCircle, ArrowLeft } from 'lucide-react';
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
    
    const [stream, setStream] = useState(null);
    const [flashMode, setFlashMode] = useState('off');
    const [facingMode, setFacingMode] = useState('environment');
    const [isStarting, setIsStarting] = useState(true);
    
    // Multi-photo state
    const [capturedPhotos, setCapturedPhotos] = useState([]); // Array of { id, dataUrl, timestamp }
    const [isReviewing, setIsReviewing] = useState(false);
    const [selectedReviewIndex, setSelectedReviewIndex] = useState(0);
    const [flashEffect, setFlashEffect] = useState(false);
    const [isConfirmingClose, setIsConfirmingClose] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Carrega fotos salvas do IndexedDB ao abrir o modal
    useEffect(() => {
        if (isOpen) {
            startCamera();
            loadSavedPhotos();
        } else {
            stopCamera();
            setIsReviewing(false);
            setIsConfirmingClose(false);
        }
        return () => stopCamera();
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

    const startCamera = async () => {
        setIsStarting(true);
        stopCamera();
        try {
            const constraints = {
                video: {
                    facingMode: facingMode,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            };
            const newStream = await navigator.mediaDevices.getUserMedia(constraints);
            setStream(newStream);
            if (videoRef.current) {
                videoRef.current.srcObject = newStream;
            }
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
    };

    const capturePhoto = async () => {
        if (!videoRef.current || !canvasRef.current) return;
        
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        const newPhoto = {
            id: `photo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            dataUrl,
            timestamp: Date.now()
        };

        // Flash visual effect
        setFlashEffect(true);
        setTimeout(() => setFlashEffect(false), 150);

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
            // Converte todos os DataURLs para objetos File
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

            // Limpa o armazenamento temporário
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

    return (
        <div className="fixed inset-0 z-[7000] bg-black flex flex-col items-center justify-center overflow-hidden font-sans select-none">
            {/* Direct Camera Capture Mode */}
            {!isReviewing ? (
                <>
                    {/* Live Video Preview */}
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                    />

                    {/* Visual Shutter Flash Effect */}
                    {flashEffect && (
                        <div className="absolute inset-0 bg-white z-[7050] animate-pulse" />
                    )}
                    
                    {/* Header Controls Overlay */}
                    <div className="absolute top-0 inset-x-0 p-6 flex justify-between items-center bg-gradient-to-b from-black/80 via-black/40 to-transparent z-[7010]">
                        <button 
                            type="button" 
                            onClick={handleCloseAttempt} 
                            className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-all active:scale-95"
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
                                <span className="text-xs font-black uppercase tracking-wider">{capturedPhotos.length} {capturedPhotos.length === 1 ? 'Foto' : 'Fotos'}</span>
                            </button>
                        )}

                        <div className="flex gap-3">
                            <button 
                                type="button"
                                onClick={toggleFlash} 
                                className={`p-3 rounded-full backdrop-blur-md flex items-center justify-center transition-all active:scale-95 ${flashMode !== 'off' ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-white/10 text-white'}`}
                            >
                                {flashMode === 'off' ? <ZapOff size={22} /> : <Zap size={22} />}
                            </button>
                            
                            <button 
                                type="button" 
                                onClick={toggleFacingMode} 
                                className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-all active:scale-95"
                            >
                                <RotateCw size={22} />
                            </button>
                        </div>
                    </div>

                    {/* Bottom Controls Bar */}
                    <div className="absolute bottom-0 inset-x-0 p-8 pt-16 flex items-center justify-between bg-gradient-to-t from-black/90 via-black/50 to-transparent z-[7010]">
                        {/* Thumbnail Slot (Left) */}
                        <div className="w-20 flex justify-start">
                            {capturedPhotos.length > 0 ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedReviewIndex(capturedPhotos.length - 1);
                                        setIsReviewing(true);
                                    }}
                                    className="relative group w-14 h-14 rounded-2xl overflow-hidden border-2 border-white/40 shadow-xl transition-transform active:scale-90"
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
                            className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center p-1.5 active:scale-90 transition-all shadow-2xl shadow-black/80"
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
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/60 backdrop-blur-sm z-[7020]">
                            <RefreshCw className="animate-spin text-blue-400" size={44} />
                            <span className="text-white font-black uppercase tracking-widest text-xs">Iniciando Câmera...</span>
                        </div>
                    )}
                </>
            ) : (
                /* Multi-Photo Review Gallery Screen */
                <div className="relative w-full h-full flex flex-col bg-slate-950 z-[7020]">
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
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[7100] flex items-center justify-center p-6 animate-fade-in">
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
