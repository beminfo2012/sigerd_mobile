import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export const generateSituationalReport = async (dashboardData, weatherData, pluviometerData, mapElement, timeframeLabel = 'Todo o Período') => {
    // Create a temporary container for the PDF content
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '840px'; // A4 width at 2x scale approx
    container.style.zIndex = '-1';
    document.body.appendChild(container);

    // Helpers
    const formatDate = () => new Date().toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'medium' });

    // Risk Analysis helper
    const getRiskLevel = (acc24) => {
        if (acc24 >= 80) return { label: 'ALERTA MÁXIMO', color: '#dc2626' };
        if (acc24 >= 50) return { label: 'ATENÇÃO', color: '#ea580c' };
        if (acc24 >= 30) return { label: 'OBSERVAÇÃO', color: '#ca8a04' };
        return { label: 'NORMAL', color: '#16a34a' };
    };

    // Sort Pluviometers by 24h accumulation
    const sortedPluvios = [...pluviometerData].sort((a, b) => (b.acc24hr || 0) - (a.acc24hr || 0));
    const topPluvios = sortedPluvios.slice(0, 5); // Top 5 for table

    // Calculate Average 24h Accumulation
    const avgAcc24 = pluviometerData.length > 0
        ? (pluviometerData.reduce((acc, p) => acc + (p.acc24hr || 0), 0) / pluviometerData.length).toFixed(1)
        : '0.0';

    // Capture Map if provided
    let mapImage = null;
    if (mapElement) {
        try {
            const mapCanvas = await html2canvas(mapElement, {
                useCORS: true,
                allowTaint: true,
                scale: 1.5,
                logging: false
            });
            mapImage = mapCanvas.toDataURL('image/jpeg', 0.8);
        } catch (e) {
            console.error("Error capturing map:", e);
        }
    }

    const htmlContent = `
        <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; background: white; padding: 40px;">
            
            <!-- Header -->
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 30px; border-bottom: 2px solid #2a5299; padding-bottom: 20px;">
                <div style="display: flex; align-items: center; gap: 15px;">
                    <img src="/logo_defesa_civil.png" style="height: 60px; display: block;" />
                    <div>
                        <h1 style="margin: 0; font-size: 24px; color: #2a5299; text-transform: uppercase; font-weight: 900;">Relatório Situacional</h1>
                        <p style="margin: 5px 0 0; font-size: 14px; color: #64748b; font-weight: bold;">Período: ${timeframeLabel}</p>
                        <p style="margin: 2px 0 0; font-size: 12px; color: #94a3b8;">Defesa Civil de Santa Maria de Jetibá - ES</p>
                    </div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 12px; font-weight: bold; color: #94a3b8; text-transform: uppercase;">Emissão</div>
                    <div style="font-size: 14px; font-weight: 600;">${formatDate()}</div>
                </div>
            </div>

            <!-- 1. Operational Panorama -->
            <div style="margin-bottom: 30px;">
                <h2 style="font-size: 16px; color: #2a5299; text-transform: uppercase; font-weight: 800; border-left: 4px solid #2a5299; padding-left: 10px; margin-bottom: 15px;">1. Panorama Operacional</h2>
                <div style="display: flex; gap: 20px;">
                    <div style="flex: 1; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center;">
                        <div style="font-size: 32px; font-weight: 900; color: #1e293b;">${dashboardData.stats.totalVistorias || 0}</div>
                        <div style="font-size: 12px; font-weight: bold; color: #64748b; text-transform: uppercase;">Total de Vistorias</div>
                    </div>
                    <div style="flex: 1; background: #fff1f2; padding: 15px; border-radius: 8px; border: 1px solid #fecdd3; text-align: center;">
                        <div style="font-size: 32px; font-weight: 900; color: #e11d48;">${dashboardData.stats.activeOccurrences || 0}</div>
                        <div style="font-size: 12px; font-weight: bold; color: #be123c; text-transform: uppercase;">Avisos Ativos</div>
                    </div>
                    <div style="flex: 1; background: #fff7ed; padding: 15px; border-radius: 8px; border: 1px solid #ffedd5; text-align: center;">
                        <div style="font-size: 32px; font-weight: 900; color: #ea580c;">${avgAcc24}</div>
                        <div style="font-size: 12px; font-weight: bold; color: #c2410c; text-transform: uppercase;">Média de Chuva (24h)</div>
                    </div>
                </div>
            </div>

            <!-- 2. Environmental Conditions -->
            <div style="margin-bottom: 30px; display: flex; gap: 30px;">
                <!-- Weather -->
                <div style="flex: 1;">
                    <h2 style="font-size: 16px; color: #2a5299; text-transform: uppercase; font-weight: 800; border-left: 4px solid #2a5299; padding-left: 10px; margin-bottom: 15px;">2. Meteorologia</h2>
                    ${weatherData ? `
                        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px;">
                            <div style="font-size: 42px; font-weight: 900; color: #1e293b;">${Math.round(weatherData.current.temp)}°C</div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px;">
                                <div style="font-size: 12px;"><strong>Chuva:</strong> ${weatherData.daily[0].rainProb}%</div>
                                <div style="font-size: 12px;"><strong>Umidade:</strong> ${weatherData.current.humidity}%</div>
                                <div style="font-size: 12px;"><strong>Vento:</strong> ${Math.round(weatherData.current.wind)} km/h</div>
                            </div>
                        </div>
                    ` : '<div style="color: #64748b; font-style: italic;">Dados indisponíveis</div>'}
                </div>

                <!-- Pluviometers -->
                <div style="flex: 1.5;">
                    <h2 style="font-size: 16px; color: #2a5299; text-transform: uppercase; font-weight: 800; border-left: 4px solid #2a5299; padding-left: 10px; margin-bottom: 15px;">3. Maiores Acumulados (24h)</h2>
                    <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
                        <thead style="background: #f1f5f9; text-transform: uppercase;">
                            <tr>
                                <th style="padding: 8px; text-align: left; color: #475569;">Local</th>
                                <th style="padding: 8px; text-align: right; color: #475569;">1h</th>
                                <th style="padding: 8px; text-align: right; color: #475569;">24h</th>
                                <th style="padding: 8px; text-align: center; color: #475569;">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${topPluvios.map(p => {
        const risk = getRiskLevel(p.acc24hr);
        return `
                                    <tr style="border-bottom: 1px solid #e2e8f0;">
                                        <td style="padding: 8px; font-weight: 600;">${p.name}</td>
                                        <td style="padding: 8px; text-align: right;">${p.acc1hr?.toFixed(1) || '-'} mm</td>
                                        <td style="padding: 8px; text-align: right; font-weight: bold;">${p.acc24hr?.toFixed(1) || '-'} mm</td>
                                        <td style="padding: 8px; text-align: center;">
                                            <span style="background: ${risk.color}20; color: ${risk.color}; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 800;">
                                                ${risk.label}
                                            </span>
                                        </td>
                                    </tr>
                                `;
    }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- 4. Typology Analysis -->
            <div style="margin-bottom: 30px;">
                <h2 style="font-size: 16px; color: #2a5299; text-transform: uppercase; font-weight: 800; border-left: 4px solid #2a5299; padding-left: 10px; margin-bottom: 15px;">4. Distribuição por Tipologia</h2>
                <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                    ${dashboardData.breakdown.map(b => `
                        <div style="flex: 1 1 30%; background: #ffffff; border: 1px solid #e2e8f0; padding: 10px; border-radius: 6px;">
                            <div style="font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase;">${b.label}</div>
                            <div style="display: flex; align-items: baseline; gap: 5px;">
                                <div style="font-size: 18px; font-weight: 900; color: #1e293b;">${b.count}</div>
                                <div style="font-size: 12px; color: #94a3b8;">(${b.percentage}%)</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- 5. Concentration Map & Locations -->
            <div style="page-break-inside: avoid;">
                <h2 style="font-size: 16px; color: #2a5299; text-transform: uppercase; font-weight: 800; border-left: 4px solid #2a5299; padding-left: 10px; margin-bottom: 15px;">5. Detalhamento Geográfico e Riscos</h2>
                ${mapImage ? `
                    <div style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin-bottom: 20px;">
                        <img src="${mapImage}" style="width: 100%; display: block;" />
                    </div>
                ` : '<div style="background: #f1f5f9; padding: 20px; text-align: center; color: #64748b; border-radius: 8px; margin-bottom: 20px;">Imagem do mapa indisponível</div>'}
                
                <div>
                    <h3 style="font-size: 14px; font-weight: bold; color: #1e293b; margin-bottom: 10px;">Últimos Registros Mapeados:</h3>
                    <table style="width: 100%; font-size: 10px; border-collapse: collapse;">
                        <thead style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                            <tr>
                                <th style="padding: 6px; text-align: left; color: #475569;">Data/Hora</th>
                                <th style="padding: 6px; text-align: left; color: #475569;">Tipologia</th>
                                <th style="padding: 6px; text-align: left; color: #475569;">Subtipos / Detalhes</th>
                                <th style="padding: 6px; text-align: right; color: #475569;">Coordenadas</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${dashboardData.locations.slice(0, 15).map((l, i) => `
                                <tr style="border-bottom: 1px solid #f1f5f9; background: ${i % 2 === 0 ? '#ffffff' : '#fcfcfc'};">
                                    <td style="padding: 6px; color: #64748b; font-weight: 600;">
                                        ${l.date ? new Date(l.date).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'}
                                    </td>
                                    <td style="padding: 6px; font-weight: 700; color: #334155;">${l.risk}</td>
                                    <td style="padding: 6px; color: #64748b;">${l.details}</td>
                                    <td style="padding: 6px; text-align: right; font-family: monospace; color: #475569;">
                                        ${l.lat.toFixed(5)}, ${l.lng.toFixed(5)}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    ${dashboardData.locations.length > 15 ? `<div style="text-align: center; padding: 10px; font-size: 10px; color: #94a3b8; font-style: italic;">...e mais ${dashboardData.locations.length - 15} registros não listados.</div>` : ''}
                </div>

                <!-- Strategic Clusters Section (Heat Information) -->
                ${(() => {
            // Simple cluster detection by neighborhood or proximity
            const clusters = {};
            dashboardData.locations.forEach(loc => {
                // Using a 0.005 approx grid for simple clustering (roughly 500m)
                const gridKey = `${loc.lat.toFixed(3)},${loc.lng.toFixed(3)}`;
                clusters[gridKey] = (clusters[gridKey] || 0) + 1;
            });
            const clusterEntries = Object.entries(clusters).filter(([_, count]) => count >= 2);

            if (clusterEntries.length === 0) return '';

            return `
                        <div style="margin-top: 20px; background: #fff7ed; border: 1px solid #ffedd5; padding: 15px; border-radius: 8px;">
                            <h3 style="font-size: 12px; font-weight: 900; color: #c2410c; text-transform: uppercase; margin-bottom: 8px; display: flex; align-items: center; gap: 5px;">
                                🔥 Zonas de Concentração (Heat Zones)
                            </h3>
                            <p style="font-size: 11px; color: #9a3412; margin-bottom: 10px;">
                                Foram identificados agrupamentos de ocorrências que sugerem estresse geológico ou hidrológico elevado nestas áreas:
                            </p>
                            <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                                ${clusterEntries.map(([coords, count]) => `
                                    <div style="background: white; border: 1px solid #fed7aa; padding: 8px; border-radius: 6px; min-width: 120px;">
                                        <div style="font-size: 10px; font-weight: 800; color: #ea580c;">Cluster @ ${coords}</div>
                                        <div style="font-size: 12px; font-weight: 900; color: #1e293b;">${count} Ocorrências</div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `;
        })()}
            </div>

            <!-- Forecast + Pluviometers Row -->
            <div style="margin-bottom: 30px; display: flex; gap: 30px;">
                 <!-- Forecast -->
                 <div style="flex: 1;">
                    <h3 style="font-size: 14px; font-weight: bold; color: #1e293b; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">Previsão (3 Dias)</h3>
                    ${weatherData && weatherData.daily ? `
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            ${weatherData.daily.slice(1, 4).map(day => `
                                <div style="display: flex; align-items: center; justify-content: space-between; background: #f8fafc; padding: 8px; border-radius: 6px;">
                                    <div style="font-size: 11px; font-weight: bold; color: #64748b;">
                                        ${new Date(day.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' })}
                                    </div>
                                    <div style="font-size: 11px; font-weight: 800; color: #1e293b;">
                                        ${Math.round(day.tempMax)}° <span style="color: #94a3b8; font-weight: normal;">/ ${Math.round(day.tempMin)}°</span>
                                    </div>
                                    <div style="font-size: 10px; color: #3b82f6; font-weight: 600;">
                                        ${day.rainProb}% Chuva
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : '<div style="font-size: 11px; color: #94a3b8;">Previsão indisponível</div>'}
                 </div>

                 <!-- Signatures Area (New) -->
                 <div style="flex: 1.5; display: flex; flex-direction: column; justify-content: flex-end;">
                    <div style="display: flex; gap: 20px; margin-top: 10px;">
                        <div style="flex: 1; border-top: 1px solid #94a3b8; padding-top: 5px; text-align: center;">
                            <div style="font-size: 10px; font-weight: bold; color: #1e293b;">Responsável Operacional</div>
                            <div style="font-size: 9px; color: #94a3b8;">Defesa Civil</div>
                        </div>
                        <div style="flex: 1; border-top: 1px solid #94a3b8; padding-top: 5px; text-align: center;">
                            <div style="font-size: 10px; font-weight: bold; color: #1e293b;">Autoridade Competente</div>
                            <div style="font-size: 9px; color: #94a3b8;">Visto</div>
                        </div>
                    </div>
                 </div>
            </div>

            <!-- Warning about Auto-Generation -->
            <div style="margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center; font-size: 9px; color: #cbd5e1; font-style: italic;">
                * Documento para simples conferência. A validade oficial depende da assinatura das autoridades competentes acima.
            </div>
        </div>
    `;

    container.innerHTML = htmlContent;

    // Generate PDF
    try {
        // Wait for potential images to load
        await new Promise(resolve => setTimeout(resolve, 500));

        const canvas = await html2canvas(container, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = pdfWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;

        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
            heightLeft -= pdfHeight;
        }

        // OPEN PDF IN NATIVE READER / NEW TAB
        // For mobile devices, we use a Blob URL which most browsers can then pass to the native PDF viewer.
        const blob = pdf.output('blob');
        const blobURL = URL.createObjectURL(blob);
        const fileName = `Relatorio_Situacional_${new Date().toISOString().split('T')[0]}.pdf`;

        // 1. Force the browser to open it in a new tab (which triggers the PDF viewer)
        const viewer = window.open(blobURL, '_blank');

        // 2. If blocked or on some Android browsers, also trigger a direct download as fallback
        if (!viewer || viewer.closed || typeof viewer.closed === 'undefined') {
            pdf.save(fileName);
        }

    } catch (error) {
        console.error("Error generating situational report:", error);
        alert("Erro ao gerar relatório PDF.");
    } finally {
        document.body.removeChild(container);
    }
};
