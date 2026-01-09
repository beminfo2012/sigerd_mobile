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

            // Add Geostamp with High Fidelity Style
            if (coordinates || timestamp) {
                const padding = width * 0.03;
                const fontSize = Math.max(14, Math.round(width * 0.035));
                // Use monospace font/sans-serif combination for technical look
                ctx.font = `600 ${fontSize}px "Roboto Mono", monospace, sans-serif`;

                const lines = [];
                if (coordinates) {
                    lines.push(`LAT: ${coordinates.lat} | LNG: ${coordinates.lng}`);
                }
                if (timestamp) {
                    const now = new Date().toLocaleString('pt-BR', {
                        year: 'numeric', month: '2-digit', day: '2-digit',
                        hour: '2-digit', minute: '2-digit', second: '2-digit'
                    });
                    lines.push(`DATA: ${now}`);
                }

                // Calculate bar dimensions
                const lineHeight = fontSize * 1.4;
                const totalTextHeight = lines.length * lineHeight;
                const barHeight = totalTextHeight + (padding * 1.5);

                // Draw dark technical background (High Contrast)
                ctx.fillStyle = 'rgba(10, 10, 10, 0.85)'; // Almost black, high fidelity
                ctx.fillRect(0, height - barHeight, width, barHeight);

                // Draw technical text
                ctx.fillStyle = '#FFFFFF';
                ctx.textAlign = 'left';
                ctx.shadowColor = "rgba(0,0,0,0.5)";
                ctx.shadowBlur = 2;

                lines.forEach((line, index) => {
                    const yPos = height - barHeight + padding + (lineHeight * (index + 0.7));
                    ctx.fillText(line.toUpperCase(), padding, yPos);
                });
            }

            // Compress as JPEG
            const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
            resolve(compressedBase64);
        };
        img.onerror = (error) => reject(error);
    });
};
