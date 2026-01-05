/**
 * Utility to compress images on the client side before storage/sync.
 * Also supports geostamping (adding coordinates and timestamp on the image).
 */
export const compressImage = (base64Str, options = {}) => {
    const {
        maxWidth = 1200,
        quality = 0.7,
        coordinates = null, // { lat, lng }
        timestamp = true
    } = options;

    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            // Calculate new dimensions keeping aspect ratio
            if (width > height) {
                if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                }
            } else {
                if (height > maxWidth) {
                    width *= maxWidth / height;
                    height = maxWidth;
                }
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            // Add Geostamp if coordinates or timestamp are provided
            if (coordinates || timestamp) {
                const padding = width * 0.02;
                const fontSize = Math.max(12, Math.round(width * 0.025));
                ctx.font = `bold ${fontSize}px sans-serif`;

                const lines = [];
                if (coordinates) {
                    lines.push(`LAT: ${coordinates.lat} | LNG: ${coordinates.lng}`);
                }
                if (timestamp) {
                    const now = new Date().toLocaleString('pt-BR');
                    lines.push(`DATA: ${now}`);
                }

                // Draw background bar
                const barHeight = (lines.length * fontSize * 1.2) + (padding * 2);
                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.fillRect(0, height - barHeight, width, barHeight);

                // Draw text
                ctx.fillStyle = 'white';
                ctx.textAlign = 'left';
                lines.forEach((line, index) => {
                    ctx.fillText(line, padding, height - barHeight + padding + (fontSize * (index + 0.8)));
                });
            }

            // Compress as JPEG
            const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
            resolve(compressedBase64);
        };
        img.onerror = (error) => reject(error);
    });
};
