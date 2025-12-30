import React, { useRef } from 'react'
import { Camera, Paperclip, X } from 'lucide-react'

const FileInput = ({ onFileSelect, type = 'photo', label = 'Adicionar' }) => {
    const fileInputRef = useRef(null)

    const handleClick = () => {
        fileInputRef.current.click()
    }

    const handleChange = (e) => {
        const files = Array.from(e.target.files)
        if (files.length > 0) {
            onFileSelect(files)
        }
    }

    return (
        <div>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept={type === 'photo' ? "image/*" : "*/*"} // Specific mime types can be added
                capture={type === 'photo' ? "environment" : undefined} // Trigger camera on mobile for photos
                multiple
                onChange={handleChange}
            />
            <button
                type="button"
                onClick={handleClick}
                className={`flex items-center justify-center p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50 w-full ${type === 'photo' ? 'aspect-square' : ''}`}
            >
                {type === 'photo' ? <Camera className="mr-2" /> : <Paperclip className="mr-2" />}
                {label}
            </button>
        </div>
    )
}

export default FileInput
