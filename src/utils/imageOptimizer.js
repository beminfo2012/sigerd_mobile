import exifr from 'exifr';

/**
 * Utility to extract EXIF metadata from an image file.
 * Returns coordinates (lat, lng) and timestamp if available.
 */
export const extractMetadata = async (file) => {
    try {
        const metadata = await exifr.gps(file);
        let coords = null;
        let timestamp = null;

        if (metadata && typeof metadata.latitude === 'number' && typeof metadata.longitude === 'number') {
            coords = {
                lat: metadata.latitude.toFixed(6),
                lng: metadata.longitude.toFixed(6)
            };
        }

        const exif = await exifr.parse(file, ['DateTimeOriginal', 'CreateDate']);
        if (exif) {
            timestamp = exif.DateTimeOriginal || exif.CreateDate || null;
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
        coordinates = null, // { lat, lng }
        timestamp = true // can be boolean or Date object
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
                ctx.font = `600 ${fontSize}px "Roboto Mono", monospace, sans-serif`;

                const lines = [];
                if (coordinates && coordinates.lat && coordinates.lng) {
                    lines.push(`LAT: ${coordinates.lat} | LNG: ${coordinates.lng}`);
                }

                if (timestamp) {
                    const dateObj = (timestamp instanceof Date) ? timestamp : new Date();
                    const formattedDate = dateObj.toLocaleString('pt-BR', {
                        year: 'numeric', month: '2-digit', day: '2-digit',
                        hour: '2-digit', minute: '2-digit', second: '2-digit'
                    });
                    lines.push(`DATA: ${formattedDate}`);
                }

                if (lines.length > 0) {
                    // Calculate bar dimensions
                    const lineHeight = fontSize * 1.4;
                    const totalTextHeight = lines.length * lineHeight;
                    const barHeight = totalTextHeight + (padding * 1.5);

                    // Draw dark technical background with subtle gradient
                    const grad = ctx.createLinearGradient(0, height - barHeight, 0, height);
                    grad.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
                    grad.addColorStop(1, 'rgba(0, 0, 0, 0.95)');
                    ctx.fillStyle = grad;
                    ctx.fillRect(0, height - barHeight, width, barHeight);

                    // Add a subtle top border to the bar
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(0, height - barHeight);
                    ctx.lineTo(width, height - barHeight);
                    ctx.stroke();

                    // Draw technical text
                    ctx.fillStyle = '#FFFFFF';
                    ctx.textAlign = 'left';
                    ctx.shadowColor = "rgba(0,0,0,0.5)";
                    ctx.shadowBlur = 4;

                    lines.forEach((line, index) => {
                        const yPos = height - barHeight + padding + (lineHeight * (index + 0.7));
                        const parts = line.split(':');
                        const labelPart = parts[0] + ':';
                        const valuePart = parts.slice(1).join(':'); // Handle cases with multiple colons in time

                        ctx.font = `800 ${fontSize}px "Roboto Mono", monospace, sans-serif`;
                        ctx.fillText(labelPart.toUpperCase(), padding, yPos);

                        const labelWidth = ctx.measureText(labelPart.toUpperCase()).width;
                        ctx.font = `400 ${fontSize}px "Roboto Mono", monospace, sans-serif`;
                        ctx.fillText(valuePart, padding + labelWidth + 5, yPos);
                    });
                }
            }

            // Compress as JPEG
            const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
            resolve(compressedBase64);
        };
        img.onerror = (error) => reject(error);
    });
};

