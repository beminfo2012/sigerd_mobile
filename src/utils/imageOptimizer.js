import exifr from 'exifr';

/**
 * Utility to extract EXIF metadata from an image file.
 * Returns coordinates (lat, lng) and timestamp if available.
 */
export const extractMetadata = async (file) => {
    try {
        let coords = null;
        let timestamp = null;

        // Tenta extrair o GPS primariamente
        let gpsMeta = await exifr.gps(file).catch(() => null);

        if (gpsMeta && typeof gpsMeta.latitude === 'number' && typeof gpsMeta.longitude === 'number') {
            coords = {
                lat: gpsMeta.latitude.toFixed(6),
                lng: gpsMeta.longitude.toFixed(6)
            };
        }

        // Faz o parse completo para buscar a data e usar como fallback para o GPS (alguns Androids escondem a tag de GPS)
        const exif = await exifr.parse(file).catch(() => null);

        if (exif) {
            timestamp = exif.DateTimeOriginal || exif.CreateDate || exif.ModifyDate || null;

            if (!coords && typeof exif.latitude === 'number' && typeof exif.longitude === 'number') {
                coords = {
                    lat: exif.latitude.toFixed(6),
                    lng: exif.longitude.toFixed(6)
                };
            }
        }

        return { coords, timestamp };
    } catch (error) {
        console.error('Error extracting EXIF metadata:', error);
        return { coords: null, timestamp: null };
    }
};

/**
 * Utility to compress images on the client side before storage/sync.
 * Also supports geostamping (adding coordinates and timestamp on the image).
 */
export const compressImage = (base64Str, options = {}) => {
    const {
        maxWidth = 1200,
        quality = 0.7,
        coordinates = null,
        timestamp = true,
        fonteMetadados = 'ausente'
    } = options;

    return new Promise((resolve, reject) => {
        try {
            const img = new Image();
            
            img.onload = () => {
                const canvas = document.createElement('canvas');

                // Dimensões já rotacionadas corretamente pelo navegador no elemento Image
                let width = img.width;
                let height = img.height;

                // Calcular escala mantendo a proporção
                let scale = 1;
                if (width > height) {
                    if (width > maxWidth) scale = maxWidth / width;
                } else {
                    if (height > maxWidth) scale = maxWidth / height;
                }

                const targetWidth = width * scale;
                const targetHeight = height * scale;

                // Preparar linhas do Geostamp
                const lines = [];
                if (coordinates && coordinates.lat && coordinates.lng) {
                    lines.push(`LAT: ${coordinates.lat} | LNG: ${coordinates.lng}`);
                }

                if (timestamp) {
                    const dateObj = (timestamp instanceof Date) ? timestamp : new Date(timestamp);
                    const formattedDate = !isNaN(dateObj.getTime())
                        ? dateObj.toLocaleString('pt-BR', {
                            year: 'numeric', month: '2-digit', day: '2-digit',
                            hour: '2-digit', minute: '2-digit', second: '2-digit'
                        })
                        : new Date().toLocaleString('pt-BR');
                    lines.push(`DATA: ${formattedDate}`);
                }
                
                if (fonteMetadados === 'exif_original') {
                    lines.push(`FONTE: EXTRAÍDO DO ARQUIVO`);
                } else if (fonteMetadados === 'gps_device') {
                    lines.push(`FONTE: GPS DO DISPOSITIVO`);
                }

                let barHeight = 0;
                let fontSize = 14;
                let padding = 12;
                let lineHeight = 20;

                if (lines.length > 0) {
                    padding = Math.max(10, Math.round(targetWidth * 0.025));
                    fontSize = Math.max(13, Math.round(targetWidth * 0.028));
                    lineHeight = Math.round(fontSize * 1.45);
                    const totalTextHeight = lines.length * lineHeight;
                    barHeight = totalTextHeight + (padding * 1.6);
                }

                // O canvas expande a altura para alocar a tarja na parte inferior, FORA da foto
                canvas.width = targetWidth;
                canvas.height = targetHeight + barHeight;

                const ctx = canvas.getContext('2d');
                
                // 1. Desenha a foto completa mantendo 100% da sua visibilidade
                ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

                // 2. Adicionar Geostamp na parte inferior, FORA da foto
                if (lines.length > 0 && barHeight > 0) {
                    ctx.fillStyle = '#0f172a'; // Fundo preto/slate-900 sólido e profissional
                    ctx.fillRect(0, targetHeight, targetWidth, barHeight);

                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(0, targetHeight);
                    ctx.lineTo(targetWidth, targetHeight);
                    ctx.stroke();

                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'middle';

                    lines.forEach((line, index) => {
                        const yCenter = targetHeight + padding + (lineHeight * (index + 0.5));
                        const parts = line.split(':');
                        const labelPart = parts[0] + ':';
                        const valuePart = parts.slice(1).join(':');

                        ctx.font = `800 ${fontSize}px "Roboto Mono", monospace, sans-serif`;
                        ctx.fillStyle = labelPart.includes('DATA') 
                            ? '#34d399' 
                            : (labelPart.includes('FONTE') ? '#fbbf24' : '#38bdf8');
                        ctx.fillText(labelPart.toUpperCase(), padding, yCenter);

                        const labelWidth = ctx.measureText(labelPart.toUpperCase()).width;
                        ctx.font = `500 ${fontSize}px "Roboto Mono", monospace, sans-serif`;
                        ctx.fillStyle = '#FFFFFF';
                        ctx.fillText(valuePart, padding + labelWidth + 6, yCenter);
                    });
                }

                const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
                resolve(compressedBase64);
            };
            
            img.onerror = (err) => {
                console.error('Erro ao carregar imagem para compressão:', err);
                reject(err);
            };

            // Inicia o carregamento
            img.src = base64Str;
            
        } catch (error) {
            console.error('Erro ao processar imagem:', error);
            reject(error);
        }
    });
};

