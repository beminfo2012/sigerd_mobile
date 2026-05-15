import React, { useRef, useState } from 'react'
import { Camera, Paperclip, X, Image as ImageIcon } from 'lucide-react'
import CameraModal from './CameraModal'

const FileInput = ({ onFileSelect, type = 'photo', label = 'Adicionar', acceptAll = false, compact = false }) => {
    const galleryInputRef = useRef(null)
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
        if (files.length > 0) {
            onFileSelect(files, source)
        }
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
                    accept={acceptAll ? "*" : "image/*"}
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
        <div className="grid grid-cols-2 gap-2 w-full">
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
                accept={acceptAll ? "*" : "image/*"}
                multiple
                onChange={(e) => handleChange(e, 'gallery')}
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
        </div>
    )
}

export default FileInput

