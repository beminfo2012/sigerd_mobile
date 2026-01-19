import React, { useRef, useState, useEffect } from 'react'
import { Eraser, RotateCcw, Check, X } from 'lucide-react'

const SignaturePad = ({ onSave, onCancel, title = "Assinatura" }) => {
    const canvasRef = useRef(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const [hasContent, setHasContent] = useState(false)

    useEffect(() => {
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')

        // Handle resizing/scaling for high DPI screens
        const ratio = window.devicePixelRatio || 1
        canvas.width = canvas.offsetWidth * ratio
        canvas.height = canvas.offsetHeight * ratio
        ctx.scale(ratio, ratio)

        ctx.lineWidth = 2
        ctx.lineCap = 'round'
        ctx.strokeStyle = '#1e3a8a'
    }, [])

    const getCoordinates = (e) => {
        const canvas = canvasRef.current
        const rect = canvas.getBoundingClientRect()
        const clientX = e.touches ? e.touches[0].clientX : e.clientX
        const clientY = e.touches ? e.touches[0].clientY : e.clientY
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        }
    }

    const startDrawing = (e) => {
        e.preventDefault()
        const { x, y } = getCoordinates(e)
        const ctx = canvasRef.current.getContext('2d')
        ctx.beginPath()
        ctx.moveTo(x, y)
        setIsDrawing(true)
    }

    const draw = (e) => {
        if (!isDrawing) return
        e.preventDefault()
        const { x, y } = getCoordinates(e)
        const ctx = canvasRef.current.getContext('2d')
        ctx.lineTo(x, y)
        ctx.stroke()
        setHasContent(true)
    }

    const stopDrawing = () => {
        setIsDrawing(false)
    }

    const clear = () => {
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        setHasContent(false)
    }

    const save = () => {
        if (!hasContent) {
            alert("Por favor, assine antes de salvar.")
            return
        }
        const dataUrl = canvasRef.current.toDataURL('image/png')
        onSave(dataUrl)
    }

    return (
        <div className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-[32px] p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">{title}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Assine dentro do quadro abaixo</p>
                    </div>
                    <button onClick={onCancel} className="text-slate-300 hover:text-red-500 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="relative aspect-[4/2] w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl overflow-hidden touch-none mb-6 shadow-inner">
                    <canvas
                        ref={canvasRef}
                        className="w-full h-full cursor-crosshair"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseOut={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                    />
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={clear}
                        className="flex-1 p-4 bg-slate-100 text-slate-500 rounded-2xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-200 active:scale-95 transition-all"
                    >
                        <RotateCcw size={18} /> Limpar
                    </button>
                    <button
                        onClick={save}
                        className="flex-[2] p-4 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-blue-200 active:scale-95 transition-all"
                    >
                        <Check size={20} /> Confirmar
                    </button>
                </div>
            </div>
        </div>
    )
}

export default SignaturePad
