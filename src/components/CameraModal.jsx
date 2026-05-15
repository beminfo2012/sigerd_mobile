import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, Zap, ZapOff, RotateCw, Check, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';

const CameraModal = ({ isOpen, onClose, onCapture }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [flashMode, setFlashMode] = useState('off'); // 'off', 'on', 'auto'
    const [facingMode, setFacingMode] = useState('environment');
    const [isStarting, setIsStarting] = useState(true);
    const [capturedImage, setCapturedImage] = useState(null);

    useEffect(() => {
        if (isOpen) {
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [isOpen, facingMode]);

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
        const capabilities = track.getCapabilities();

        if (!capabilities.torch) {
            toast.error("Flash não suportado neste dispositivo/navegador.");
            return;
        }

        let nextMode = 'off';
        if (flashMode === 'off') nextMode = 'on';
        else if (flashMode === 'on') nextMode = 'auto';

        setFlashMode(nextMode);

        try {
            // No navegador, 'auto' não é nativo para torch, 
            // mas simularemos 'on' para 'on' e 'auto', e 'off' para 'off'
            await track.applyConstraints({
                advanced: [{ torch: nextMode !== 'off' }]
            });
        } catch (err) {
            console.error("Flash error:", err);
        }
    };

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;
        
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(dataUrl);
    };

    const handleConfirm = () => {
        // Convert dataUrl to File object to match the FileInput expectation
        fetch(capturedImage)
            .then(res => res.blob())
            .then(blob => {
                const file = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' });
                onCapture([file]);
                onClose();
                setCapturedImage(null);
            });
    };

    const toggleFacingMode = () => {
        setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[7000] bg-black flex flex-col items-center justify-center overflow-hidden">
            {!capturedImage ? (
                <>
                    {/* Preview Area */}
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                    />
                    
                    {/* Overlay Controls */}
                    <div className="absolute top-0 inset-x-0 p-6 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent">
                        <button onClick={onClose} className="p-3 bg-white/10 rounded-full text-white backdrop-blur-md">
                            <X size={24} />
                        </button>
                        
                        <div className="flex gap-4">
                            <button 
                                onClick={toggleFlash} 
                                className={`p-3 rounded-full backdrop-blur-md flex flex-col items-center gap-1 min-w-[60px] transition-all ${flashMode !== 'off' ? 'bg-yellow-500 text-black' : 'bg-white/10 text-white'}`}
                            >
                                {flashMode === 'off' ? <ZapOff size={24} /> : <Zap size={24} />}
                                <span className="text-[8px] font-black uppercase">{flashMode}</span>
                            </button>
                            
                            <button onClick={toggleFacingMode} className="p-3 bg-white/10 rounded-full text-white backdrop-blur-md">
                                <RotateCw size={24} />
                            </button>
                        </div>
                    </div>

                    {/* Bottom Controls */}
                    <div className="absolute bottom-0 inset-x-0 p-12 flex justify-center items-center bg-gradient-to-t from-black/80 to-transparent">
                        <button 
                            onClick={capturePhoto}
                            disabled={isStarting}
                            className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center p-1 group active:scale-90 transition-all"
                        >
                            <div className="w-full h-full bg-white rounded-full group-hover:bg-slate-200 transition-colors" />
                        </button>
                    </div>

                    {isStarting && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/40 backdrop-blur-sm">
                            <RefreshCw className="animate-spin text-white" size={40} />
                            <span className="text-white font-black uppercase tracking-widest text-xs">Iniciando Lente...</span>
                        </div>
                    )}
                </>
            ) : (
                <>
                    {/* Review Captured Photo */}
                    <img src={capturedImage} className="w-full h-full object-contain bg-slate-900" alt="Captured" />
                    
                    <div className="absolute bottom-12 inset-x-0 px-8 flex justify-between items-center">
                        <button 
                            onClick={() => setCapturedImage(null)}
                            className="flex-1 mr-4 py-4 bg-slate-800 text-white rounded-2xl font-black uppercase text-xs tracking-widest border border-white/10"
                        >
                            Tentar Novamente
                        </button>
                        <button 
                            onClick={handleConfirm}
                            className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2"
                        >
                            <Check size={18} /> USAR FOTO
                        </button>
                    </div>
                </>
            )}

            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
};

export default CameraModal;
