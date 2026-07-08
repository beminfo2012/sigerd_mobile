import React, { useEffect, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

const PdfToImages = ({ base64Data, filename }) => {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        
        const loadPdf = async () => {
            try {
                // Ensure data has no prefix
                const base64 = base64Data.replace(/^data:application\/pdf;base64,/, '');
                const binaryString = atob(base64);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }

                const loadingTask = pdfjsLib.getDocument({ data: bytes });
                const pdf = await loadingTask.promise;
                
                const numPages = pdf.numPages;
                const imageUrls = [];

                for (let i = 1; i <= numPages; i++) {
                    const page = await pdf.getPage(i);
                    const viewport = page.getViewport({ scale: 2.0 }); // High quality for printing
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;

                    const renderContext = {
                        canvasContext: context,
                        viewport: viewport
                    };
                    await page.render(renderContext).promise;
                    imageUrls.push(canvas.toDataURL('image/jpeg', 0.8));
                }

                if (isMounted) {
                    setImages(imageUrls);
                    setLoading(false);
                }
            } catch (error) {
                console.error("Error rendering PDF:", error);
                if (isMounted) setLoading(false);
            }
        };

        if (base64Data) {
            loadPdf();
        } else {
            setLoading(false);
        }

        return () => { isMounted = false; };
    }, [base64Data]);

    if (loading) {
        return (
            <div className="w-full flex flex-col items-center justify-center p-8 bg-slate-50 border border-slate-200 rounded text-slate-500 avoid-break my-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-3"></div>
                <div className="text-xs font-bold uppercase tracking-wider">Processando páginas do anexo PDF...</div>
            </div>
        );
    }

    if (images.length === 0) {
        return (
            <div className="w-full p-4 bg-red-50 text-red-500 border border-red-200 rounded text-center text-xs font-bold uppercase avoid-break my-4">
                Não foi possível processar o anexo PDF para impressão.
            </div>
        );
    }

    return (
        <div className="flex flex-col w-full my-6">
            <div className="section-header avoid-break">
                <span className="section-header-title">ANEXO: {filename || 'DOCUMENTO PDF'}</span>
                <div className="section-header-line"></div>
            </div>
            
            <div className="flex flex-col gap-6 w-full mt-4">
                {images.map((imgSrc, index) => (
                    <div key={index} className="w-full bg-white border border-slate-300 shadow-sm flex flex-col items-center avoid-break">
                        <div className="w-full bg-slate-100 border-b border-slate-300 px-3 py-1 flex justify-between items-center text-[9px] font-bold text-slate-500 uppercase">
                            <span>Documento Anexo</span>
                            <span>Página {index + 1} de {images.length}</span>
                        </div>
                        <img 
                            src={imgSrc} 
                            alt={`Página ${index + 1}`} 
                            className="max-w-full" 
                            style={{ objectFit: 'contain', width: '100%' }} 
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PdfToImages;
