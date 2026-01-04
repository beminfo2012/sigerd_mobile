import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const generateSituationalReport = async (dashboardData, weatherData, pluviometerData, mapElement) => {
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
    const sortedPluvios = [...pluviometerData].sort((a, b) => (b.acc24hr || 0) - (a.acc24hr || 0)).slice(0, 5); // Top 5

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
                        <p style="margin: 5px 0 0; font-size: 14px; color: #64748b;">Defesa Civil de Santa Maria de Jetibá - ES</p>
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
                        <div style="font-size: 12px; font-weight: bold; color: #be123c; text-transform: uppercase;">Ocorrências Ativas</div>
                    </div>
                    <div style="flex: 1; background: #fff7ed; padding: 15px; border-radius: 8px; border: 1px solid #ffedd5; text-align: center;">
                        <div style="font-size: 32px; font-weight: 900; color: #ea580c;">${dashboardData.stats.inmetAlertsCount || 0}</div>
                        <div style="font-size: 12px; font-weight: bold; color: #c2410c; text-transform: uppercase;">Alertas Vigentes</div>
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
                            ${sortedPluvios.map(p => {
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

            <!-- 5. Concentration Map -->
            <div style="page-break-inside: avoid;">
                <h2 style="font-size: 16px; color: #2a5299; text-transform: uppercase; font-weight: 800; border-left: 4px solid #2a5299; padding-left: 10px; margin-bottom: 15px;">5. Mapa de Concentração</h2>
                ${mapImage ? `
                    <div style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                        <img src="${mapImage}" style="width: 100%; display: block;" />
                    </div>
                ` : '<div style="background: #f1f5f9; padding: 20px; text-align: center; color: #64748b; border-radius: 8px;">Imagem do mapa indisponível</div>'}
                
                <div style="margin-top: 20px;">
                    <h3 style="font-size: 14px; font-weight: bold; color: #1e293b; margin-bottom: 10px;">Locais Mapeados:</h3>
                    <div style="display: flex; flex-wrap: wrap; gap: 5px;">
                        ${dashboardData.locations.slice(0, 15).map(l => `
                            <span style="background: #f1f5f9; border: 1px solid #e2e8f0; padding: 4px 8px; border-radius: 4px; font-size: 11px; color: #475569;">
                                ${l.risk}
                            </span>
                        `).join('')}
                         ${dashboardData.locations.length > 15 ? `<span style="font-size: 11px; padding: 4px;">... (+${dashboardData.locations.length - 15})</span>` : ''}
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div style="margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; font-size: 10px; color: #94a3b8;">
                <p>Relatório gerado automaticamente pelo sistema SIGERD Mobile.</p>
                <p>Este documento é para uso exclusivo da Defesa Civil e órgãos competentes.</p>
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

        pdf.save(`Relatorio_Situacional_${new Date().toISOString().split('T')[0]}.pdf`);

    } catch (error) {
        console.error("Error generating situational report:", error);
        alert("Erro ao gerar relatório PDF.");
    } finally {
        document.body.removeChild(container);
    }
};
