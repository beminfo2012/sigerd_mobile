import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, Check, X, MapPin, Calendar, Clock } from 'lucide-react';

const RedapPhotoCapture = ({ onSave, onCancel }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [coords, setCoords] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const startCamera = async () => {
        try {
            setError('');
            const s = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' },
                audio: false
            });
            setStream(s);
            if (videoRef.current) {
                videoRef.current.srcObject = s;
            }
        } catch (err) {
            console.error('Camera error:', err);
            setError('Não foi possível acessar a câmera. Verifique as permissões.');
        }
    };

    const getGeoLocation = useCallback(() => {
        if (!navigator.geolocation) {
            console.warn('Geolocation not supported');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setCoords({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude
                });
            },
            (err) => console.warn('Geo error:', err),
            { enableHighAccuracy: true }
        );
    }, []);

    useEffect(() => {
        startCamera();
        getGeoLocation();
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;
        const barHeight = 90;

        canvas.width = videoWidth;
        canvas.height = videoHeight + barHeight;
        context.drawImage(video, 0, 0, videoWidth, videoHeight);

        // Watermark formatting
        const timestamp = new Date().toLocaleString('pt-BR');
        const lat = coords?.lat?.toFixed(6) || '---';
        const lng = coords?.lng?.toFixed(6) || '---';

        // Background for text (fora da foto)
        context.fillStyle = '#0f172a';
        context.fillRect(0, videoHeight, videoWidth, barHeight);

        context.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(0, videoHeight);
        context.lineTo(videoWidth, videoHeight);
        context.stroke();

        context.textBaseline = 'middle';
        context.font = 'bold 20px "Roboto Mono", Inter, Arial, sans-serif';
        context.fillStyle = '#38bdf8';
        context.fillText(`📍 LAT: ${lat} | LNG: ${lng}`, 25, videoHeight + 30);

        context.fillStyle = '#34d399';
        context.fillText(`🕒 DATA: ${timestamp}`, 25, videoHeight + 65);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setPreviewUrl(dataUrl);

        // Stop camera tracks
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    };

    const handleConfirm = () => {
        onSave({
            url: previewUrl,
            lat: coords?.lat,
            lng: coords?.lng,
            timestamp: new Date().toISOString()
        });
    };

    const handleRetake = () => {
        setPreviewUrl(null);
        startCamera();
    };

    return (
        <div className="fixed inset-0 bg-slate-900 z-[9999] flex flex-col font-sans overflow-hidden">
            {/* Header */}
            <div className="p-6 bg-slate-900 flex items-center justify-between text-white border-b border-slate-800">
                <div>
                    <h2 className="font-black uppercase tracking-tight text-lg">Captura de Evidência</h2>
                    <div className="flex items-center gap-2 mt-1">
                        <div className={`w-2 h-2 rounded-full ${coords ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {coords ? `Georeferenciamento Ativado: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : 'Aguardando GPS...'}
                        </span>
                    </div>
                </div>
                <button onClick={onCancel} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors">
                    <X size={24} />
                </button>
            </div>

            {/* Camera View / Preview */}
            <div className="flex-1 relative bg-black flex items-center justify-center">
                {error ? (
                    <div className="p-10 text-center">
                        <p className="text-red-400 font-bold mb-4">{error}</p>
                        <button onClick={startCamera} className="px-6 py-3 bg-white text-slate-900 rounded-2xl font-black uppercase text-xs">
                            Ativar Câmera
                        </button>
                    </div>
                ) : !previewUrl ? (
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <img src={previewUrl} className="w-full h-full object-contain" alt="Preview" />
                )
                }

                {/* Hidden Canvas for Processing */}
                <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>

            {/* Controls */}
            <div className="p-8 bg-slate-900 border-t border-slate-800 flex items-center justify-center gap-8">
                {!previewUrl ? (
                    <button
                        onClick={capturePhoto}
                        className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-xl active:scale-90 transition-transform"
                    >
                        <div className="w-16 h-16 rounded-full border-4 border-slate-900 flex items-center justify-center">
                            <Camera size={32} className="text-slate-900" />
                        </div>
                    </button>
                ) : (
                    <>
                        <button
                            onClick={handleRetake}
                            className="flex flex-col items-center gap-2 group"
                        >
                            <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center group-active:scale-90 transition-transform">
                                <RefreshCw size={24} className="text-white" />
                            </div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Refazer</span>
                        </button>
                        <button
                            onClick={handleConfirm}
                            className="flex flex-col items-center gap-2 group"
                        >
                            <div className="w-20 h-20 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/20 flex items-center justify-center group-active:scale-90 transition-transform">
                                <Check size={32} className="text-white" />
                            </div>
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Confirmar</span>
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default RedapPhotoCapture;
