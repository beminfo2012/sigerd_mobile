import React, { useRef, useState } from 'react'
import { Camera, Paperclip, X, Image as ImageIcon } from 'lucide-react'
import CameraModal from './CameraModal'

const FileInput = ({ onFileSelect, type = 'photo', label = 'Adicionar', acceptAll = false, compact = false }) => {
    const galleryInputRef = useRef(null)
    const refInputRef = useRef(null)
    const [isCameraOpen, setIsCameraOpen] = useState(false)

    const handleCameraClick = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsCameraOpen(true)
    }

    const handleGalleryClick = (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (galleryInputRef.current) galleryInputRef.current.click()
    }

    const handleChange = (e, source) => {
        const files = Array.from(e.target.files)
        
        if (source === 'gallery' && !acceptAll) {
            // Verifica se os arquivos são imagens
            const imageFiles = files.filter(f => f.type.startsWith('image/'));
            if (imageFiles.length > 0) {
                onFileSelect(imageFiles, source)
            } else if (files.length > 0) {
                alert("Por favor, selecione apenas arquivos de imagem.");
            }
        } else {
            if (files.length > 0) {
                onFileSelect(files, source)
            }
        }
        
        // clear value to allow re-selection of the same file if needed
        e.target.value = null;
    }

    const handleCameraCapture = (files) => {
        onFileSelect(files, 'camera')
        setIsCameraOpen(false)
    }

    if (compact) {
        return (
            <div className="relative w-full">
                <input
                    type="file"
                    ref={galleryInputRef}
                    className="hidden"
                    accept={acceptAll ? "*" : "*/*"} // Usando */* força o Android a abrir o explorador de arquivos (bypassa o Photo Picker)
                    multiple
                    onChange={(e) => handleChange(e, 'gallery')}
                />
                <button
                    type="button"
                    onClick={handleGalleryClick}
                    className="flex items-center justify-center gap-3 w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-slate-500 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
                >
                    <div className="p-2 bg-white dark:bg-slate-700 rounded-xl shadow-sm border border-slate-100 dark:border-slate-600 group-hover:scale-110 transition-transform">
                        <Paperclip size={20} className="text-blue-500" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-wider">{label}</span>
                </button>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-3 gap-2 w-full">
            <CameraModal 
                isOpen={isCameraOpen} 
                onClose={() => setIsCameraOpen(false)} 
                onCapture={handleCameraCapture} 
            />

            {/* Gallery Input (Standard) */}
            <input
                type="file"
                ref={galleryInputRef}
                className="hidden"
                accept={acceptAll ? "*" : "*/*"} // Usando */* força o Android a abrir o explorador de arquivos
                multiple
                onChange={(e) => handleChange(e, 'gallery')}
            />

            {/* Reference Input (Accepts Images and PDFs) */}
            <input
                type="file"
                ref={refInputRef}
                className="hidden"
                accept="image/*,application/pdf"
                multiple
                onChange={(e) => handleChange(e, 'referencia_historica')}
            />

            <button
                type="button"
                onClick={handleCameraClick}
                className={`flex flex-col items-center justify-center p-3 border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-2xl text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:border-[#2a5299] hover:text-[#2a5299] transition-all relative group ${type === 'photo' ? 'aspect-square' : ''}`}
            >
                <Camera size={28} strokeWidth={1.5} />
                <span className="text-[9px] font-black uppercase mt-1 tracking-wider text-center">Câmera</span>
            </button>

            <button
                type="button"
                onClick={handleGalleryClick}
                className={`flex flex-col items-center justify-center p-3 border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-2xl text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:border-emerald-500 hover:text-emerald-500 transition-all relative group ${type === 'photo' ? 'aspect-square' : ''}`}
            >
                <ImageIcon size={28} strokeWidth={1.5} />
                <span className="text-[9px] font-black uppercase mt-1 tracking-wider text-center">Galeria</span>
            </button>

            <button
                type="button"
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (refInputRef.current) refInputRef.current.click();
                }}
                className={`flex flex-col items-center justify-center p-3 border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-2xl text-gray-500 dark:text-slate-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:border-amber-500 hover:text-amber-500 transition-all relative group ${type === 'photo' ? 'aspect-square' : ''}`}
            >
                <div className="relative">
                    <ImageIcon size={28} strokeWidth={1.5} />
                    <span className="absolute -bottom-1 -right-1 bg-amber-500 text-white text-[8px] px-1 rounded-full font-bold">REF</span>
                </div>
                <span className="text-[9px] font-black uppercase mt-1 tracking-wider text-center">Referência</span>
            </button>
        </div>
    )
}

export default FileInput

