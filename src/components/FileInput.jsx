import React, { useRef } from 'react'
import { Camera, Paperclip, X } from 'lucide-react'

const FileInput = ({ onFileSelect, type = 'photo', label = 'Adicionar' }) => {
    const cameraInputRef = useRef(null)
    const galleryInputRef = useRef(null)

    const handleCameraClick = () => {
        if (cameraInputRef.current) cameraInputRef.current.click()
    }

    const handleGalleryClick = (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (galleryInputRef.current) galleryInputRef.current.click()
    }

    const handleChange = (e) => {
        const files = Array.from(e.target.files)
        if (files.length > 0) {
            onFileSelect(files)
        }
    }

    return (
        <div className="relative">
            {/* Camera Input (Environment) */}
            <input
                type="file"
                ref={cameraInputRef}
                className="hidden"
                accept="image/*"
                capture="environment"
                multiple
                onChange={handleChange}
            />

            {/* Gallery Input (Standard) */}
            <input
                type="file"
                ref={galleryInputRef}
                className="hidden"
                accept="image/*"
                multiple
                onChange={handleChange}
            />

            <button
                type="button"
                onClick={handleCameraClick}
                className={`flex flex-col items-center justify-center p-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:bg-gray-50 hover:border-[#2a5299] hover:text-[#2a5299] transition-all w-full relative group ${type === 'photo' ? 'aspect-square' : ''}`}
            >
                <Camera size={32} strokeWidth={1.5} />
                <span className="text-[10px] font-bold uppercase mt-1">{label}</span>

                {/* Hidden "Discreet" Gallery Button overlay or corner */}
                {type === 'photo' && (
                    <div
                        onClick={handleGalleryClick}
                        className="absolute bottom-2 right-2 p-1.5 bg-white rounded-full shadow-sm border border-gray-200 text-gray-400 hover:text-[#2a5299] hover:border-[#2a5299] z-10"
                        title="Importar da Galeria"
                    >
                        <Paperclip size={14} />
                    </div>
                )}
            </button>
        </div>
    )
}

export default FileInput
