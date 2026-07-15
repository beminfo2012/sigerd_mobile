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

    return new Promise(async (resolve, reject) => {
        try {
            // Tenta obter a orientação original via EXIF
            let orientation = 1;
            try {
                const exif = await exifr.parse(base64Str, ['Orientation']).catch(() => null);
                if (exif && exif.Orientation) {
                    orientation = exif.Orientation;
                }
            } catch (e) {
                console.warn('Erro ao ler orientação:', e);
            }

            // Converter base64 para blob
            const res = await fetch(base64Str);
            const blob = await res.blob();

            // Usar createImageBitmap com imageOrientation: 'none' para evitar auto-rotação duplicada do navegador
            const img = await createImageBitmap(blob, { imageOrientation: 'none' });

            const canvas = document.createElement('canvas');

            // Determinar dimensões reais baseadas na orientação
            let width = img.width;
            let height = img.height;
            if (orientation >= 5 && orientation <= 8) {
                width = img.height;
                height = img.width;
            }

            // Calcular escala mantendo a proporção
            let scale = 1;
            if (width > height) {
                if (width > maxWidth) scale = maxWidth / width;
            } else {
                if (height > maxWidth) scale = maxWidth / height;
            }

            const targetWidth = width * scale;
            const targetHeight = height * scale;

            canvas.width = targetWidth;
            canvas.height = targetHeight;

            const ctx = canvas.getContext('2d');
            ctx.save();

            // Rotacionar o contexto do canvas com base na orientação EXIF
            switch (orientation) {
                case 2: ctx.transform(-1, 0, 0, 1, targetWidth, 0); break;
                case 3: ctx.transform(-1, 0, 0, -1, targetWidth, targetHeight); break;
                case 4: ctx.transform(1, 0, 0, -1, 0, targetHeight); break;
                case 5: ctx.transform(0, 1, 1, 0, 0, 0); break;
                case 6: ctx.transform(0, 1, -1, 0, targetWidth, 0); break;
                case 7: ctx.transform(0, -1, -1, 0, targetWidth, targetHeight); break;
                case 8: ctx.transform(0, -1, 1, 0, 0, targetHeight); break;
                default: break; // Orientação 1 (Normal)
            }

            // Desenhar a imagem (dimensões invertidas se rotacionado 90/270 graus)
            if (orientation >= 5 && orientation <= 8) {
                ctx.drawImage(img, 0, 0, targetHeight, targetWidth);
            } else {
                ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
            }
            
            ctx.restore();

            // Adicionar Geostamp no rodapé (já com a imagem na orientação correta)
            if (coordinates || timestamp) {
                const padding = targetWidth * 0.03;
                const fontSize = Math.max(14, Math.round(targetWidth * 0.035));
                ctx.font = `600 ${fontSize}px "Roboto Mono", monospace, sans-serif`;

                const lines = [];
                if (coordinates && coordinates.lat && coordinates.lng) {
                    lines.push(`LAT: ${coordinates.lat} | LNG: ${coordinates.lng}`);
                }

                if (timestamp) {
                    const dateObj = (timestamp instanceof Date) ? timestamp : new Date(timestamp);
                    const formattedDate = dateObj.toLocaleString('pt-BR', {
                        year: 'numeric', month: '2-digit', day: '2-digit',
                        hour: '2-digit', minute: '2-digit', second: '2-digit'
                    });
                    lines.push(`DATA: ${formattedDate}`);
                }
                
                if (fonteMetadados === 'exif_original') {
                    lines.push(`FONTE: EXTRAÍDO DO ARQUIVO`);
                } else if (fonteMetadados === 'gps_device') {
                    lines.push(`FONTE: GPS DO DISPOSITIVO`);
                }

                if (lines.length > 0) {
                    const lineHeight = fontSize * 1.4;
                    const totalTextHeight = lines.length * lineHeight;
                    const barHeight = totalTextHeight + (padding * 1.5);

                    const grad = ctx.createLinearGradient(0, targetHeight - barHeight, 0, targetHeight);
                    grad.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
                    grad.addColorStop(1, 'rgba(0, 0, 0, 0.95)');
                    ctx.fillStyle = grad;
                    ctx.fillRect(0, targetHeight - barHeight, targetWidth, barHeight);

                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(0, targetHeight - barHeight);
                    ctx.lineTo(targetWidth, targetHeight - barHeight);
                    ctx.stroke();

                    ctx.fillStyle = '#FFFFFF';
                    ctx.textAlign = 'left';
                    ctx.shadowColor = "rgba(0,0,0,0.5)";
                    ctx.shadowBlur = 4;

                    lines.forEach((line, index) => {
                        const yPos = targetHeight - barHeight + padding + (lineHeight * (index + 0.7));
                        const parts = line.split(':');
                        const labelPart = parts[0] + ':';
                        const valuePart = parts.slice(1).join(':');

                        ctx.font = `800 ${fontSize}px "Roboto Mono", monospace, sans-serif`;
                        ctx.fillText(labelPart.toUpperCase(), padding, yPos);

                        const labelWidth = ctx.measureText(labelPart.toUpperCase()).width;
                        ctx.font = `400 ${fontSize}px "Roboto Mono", monospace, sans-serif`;
                        ctx.fillText(valuePart, padding + labelWidth + 5, yPos);
                    });
                }
            }

            const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
            resolve(compressedBase64);
        } catch (error) {
            console.error('Erro ao processar imagem:', error);
            reject(error);
        }
    });
};

