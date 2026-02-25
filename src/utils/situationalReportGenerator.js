import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { LOGO_BASE64 } from './logoBase64';

export const generateSituationalReport = async (dashboardData, weatherData, pluviometerData, mapElement, timeframeLabel = 'Todo o Período', humanitarianData = null, shouldShare = false) => {
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
    const sortedPluvios = [...(pluviometerData || [])].sort((a, b) => (b.acc24hr || 0) - (a.acc24hr || 0));
    const topPluvios = sortedPluvios.slice(0, 5); // Top 5 for table

    // Calculate Average 24h Accumulation
    const avgAcc24 = (pluviometerData && pluviometerData.length > 0)
        ? (pluviometerData.reduce((acc, p) => acc + (p.acc24hr || 0), 0) / pluviometerData.length).toFixed(1)
        : '0.0';

    // Map capture removed as per user request
    let mapImage = null;

    const htmlContent = `
        <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; background: white; padding: 40px;">
            
            <!-- Header -->
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 30px; border-bottom: 2px solid #2a5299; padding-bottom: 20px;">
                <div style="display: flex; align-items: center; gap: 15px;">
                    <img src="${LOGO_BASE64}" style="height: 60px; display: block;" />
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
            <div style="margin-bottom: 30px; page-break-inside: avoid;">
                <h2 style="font-size: 16px; color: #2a5299; text-transform: uppercase; font-weight: 800; border-left: 4px solid #2a5299; padding-left: 10px; margin-bottom: 18px;">4. Distribuição por Tipologia de Risco</h2>
                <div style="display: flex; flex-direction: column; gap: 12px; background: #ffffff; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px;">
                    ${dashboardData.breakdown.map(b => {
        const hexMap = {
            'Geológico / Geotécnico': '#f97316',
            'Risco Geológico': '#f97316',
            'Hidrológico': '#3b82f6',
            'Inundação/Alagamento': '#3b82f6',
            'Estrutural': '#94a3b8',
            'Estrutural/Predial': '#94a3b8',
            'Ambiental': '#10b981',
            'Tecnológico': '#f59e0b',
            'Climático / Meteorológico': '#0ea5e9',
            'Infraestrutura Urbana': '#6366f1',
            'Sanitário': '#f43f5e',
            'Outros': '#94a3b8'
        };
        const barColor = hexMap[b.label] || '#94a3b8';
        return `
                        <div style="width: 100%;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                                <span style="font-size: 11px; font-weight: 800; color: #334155; text-transform: uppercase; letter-spacing: 0.5px;">${b.label}</span>
                                <span style="font-size: 12px; font-weight: 900; color: #1e293b;">${b.count} <span style="color: #94a3b8; font-weight: 600; font-size: 10px;">(${b.percentage}%)</span></span>
                            </div>
                            <div style="width: 100%; height: 8px; background: #f1f5f9; border-radius: 4px; overflow: hidden;">
                                <div style="width: ${b.percentage}%; height: 100%; background: ${barColor}; border-radius: 4px;"></div>
                            </div>
                        </div>
                    `;
    }).join('')}
                </div>
            </div>

            <!-- 5. Detailed Occurrences -->
            <div style="page-break-inside: avoid; margin-bottom: 30px;">
                <h2 style="font-size: 16px; color: #2a5299; text-transform: uppercase; font-weight: 800; border-left: 4px solid #2a5299; padding-left: 10px; margin-bottom: 18px;">5. Detalhamento das Ocorrências Mapeadas</h2>
                
                <table style="width: 100%; font-size: 10px; border-collapse: collapse; border: 1px solid #f1f5f9;">
                    <thead style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                        <tr>
                            <th style="padding: 10px 8px; text-align: left; color: #475569; text-transform: uppercase; font-size: 9px;">Data/Hora</th>
                            <th style="padding: 10px 8px; text-align: left; color: #475569; text-transform: uppercase; font-size: 9px;">Tipologia</th>
                            <th style="padding: 10px 8px; text-align: left; color: #475569; text-transform: uppercase; font-size: 9px;">Local / Detalhes</th>
                            <th style="padding: 10px 8px; text-align: right; color: #475569; text-transform: uppercase; font-size: 9px;">Coordenadas</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${dashboardData.locations.slice(0, 20).map((l, i) => {
        const parts = String(l.coordenadas || '').split(',');
        const lat = parseFloat(parts[0]) || parseFloat(l.lat) || 0;
        const lng = parseFloat(parts[1]) || parseFloat(l.lng) || 0;
        return `
                            <tr style="border-bottom: 1px solid #f1f5f9; background: ${i % 2 === 0 ? '#ffffff' : '#fcfcfc'};">
                                <td style="padding: 8px; color: #64748b; font-weight: 700;">
                                    ${l.date ? new Date(l.date).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'}
                                </td>
                                <td style="padding: 8px; font-weight: 800; color: #334155;">${l.risk}</td>
                                <td style="padding: 8px; color: #64748b; font-weight: 500;">${l.details}</td>
                                <td style="padding: 8px; text-align: right; font-family: monospace; color: #475569; font-weight: 600;">
                                    ${lat.toFixed(5)}, ${lng.toFixed(5)}
                                </td>
                            </tr>
                            `;
    }).join('')}
                    </tbody>
                </table>
                ${dashboardData.locations.length > 20 ? `<div style="text-align: center; padding: 12px; font-size: 10px; color: #94a3b8; font-style: italic; font-weight: 500;">...exibindo os 20 registros mais significativos do período.</div>` : ''}
            </div>

            <!-- 6. Humanitarian Assistance (New Integration) -->
            ${humanitarianData ? `
                <div style="margin-top: 35px; page-break-inside: avoid;">
                    <h2 style="font-size: 16px; color: #2a5299; text-transform: uppercase; font-weight: 800; border-left: 4px solid #2a5299; padding-left: 10px; margin-bottom: 20px;">6. ASSIST. HUMANITÁRIA</h2>
                    
                    <!-- KPIs Section -->
                    <div style="display: flex; gap: 20px; margin-bottom: 25px;">
                        <div style="flex: 1; background: #eff6ff; padding: 15px; border-radius: 12px; border: 1px solid #dbeafe; text-align: center;">
                            <div style="font-size: 28px; font-weight: 900; color: #1e40af;">${humanitarianData.shelters?.length || 0}</div>
                            <div style="font-size: 10px; font-weight: 800; color: #3b82f6; text-transform: uppercase; letter-spacing: 0.5px;">Abrigos Ativos</div>
                        </div>
                        <div style="flex: 1; background: #f0f9ff; padding: 15px; border-radius: 12px; border: 1px solid #e0f2fe; text-align: center;">
                            <div style="font-size: 28px; font-weight: 900; color: #0369a1;">${humanitarianData.occupants?.filter(o => o.status !== 'exited').length || 0}</div>
                            <div style="font-size: 10px; font-weight: 800; color: #0ea5e9; text-transform: uppercase; letter-spacing: 0.5px;">Pessoas Abrigadas</div>
                        </div>
                        <div style="flex: 1; background: #fdf2f8; padding: 15px; border-radius: 12px; border: 1px solid #fce7f3; text-align: center;">
                            <div style="font-size: 28px; font-weight: 900; color: #9d174d;">${humanitarianData.inventory?.length || 0}</div>
                            <div style="font-size: 10px; font-weight: 800; color: #db2777; text-transform: uppercase; letter-spacing: 0.5px;">Itens em Estoque</div>
                        </div>
                    </div>

                    <!-- Top Resources Table -->
                    <div style="background: #ffffff; border: 1px solid #f1f5f9; border-radius: 12px; padding: 15px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);">
                        <h3 style="font-size: 12px; font-weight: 800; color: #1e293b; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Recursos Estratégicos Disponíveis:</h3>
                        <table style="width: 100%; font-size: 11px; border-collapse: collapse;">
                            <thead>
                                <tr style="background: #f8fafc; text-align: left; color: #64748b;">
                                    <th style="padding: 8px; border-bottom: 2px solid #e2e8f0; border-top-left-radius: 6px;">Item</th>
                                    <th style="padding: 8px; border-bottom: 2px solid #e2e8f0;">Categoria</th>
                                    <th style="padding: 8px; border-bottom: 2px solid #e2e8f0; text-align: right; border-top-right-radius: 6px;">Quantidade</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${humanitarianData.inventory && humanitarianData.inventory.length > 0 ?
                humanitarianData.inventory.sort((a, b) => b.quantity - a.quantity).slice(0, 5).map(i => `
                                        <tr style="border-bottom: 1px solid #f1f5f9;">
                                            <td style="padding: 10px 8px; font-weight: 700; color: #334155;">${i.item_name}</td>
                                            <td style="padding: 10px 8px; color: #64748b; font-weight: 600;">${i.category || 'Geral'}</td>
                                            <td style="padding: 10px 8px; text-align: right; font-weight: 900; color: #1e293b;">${i.quantity} <span style="font-size: 9px; color: #94a3b8; font-weight: 600;">${i.unit || 'un'}</span></td>
                                        </tr>
                                    `).join('') :
                '<tr><td colspan="3" style="padding: 20px; text-align: center; color: #94a3b8; font-style: italic;">Nenhum item registrado no inventário central</td></tr>'
            }
                            </tbody>
                        </table>
                    </div>
                </div>
            ` : ''}

            <!-- Forecast + Signatures Row -->
            <div style="margin-top: 40px; display: flex; gap: 40px; page-break-inside: avoid;">
                 <!-- Forecast -->
                 <div style="flex: 1;">
                    <h3 style="font-size: 14px; font-weight: 800; color: #2a5299; margin-bottom: 12px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Previsão (72 Horas)</h3>
                    ${weatherData && weatherData.daily ? `
                        <div style="display: flex; flex-direction: column; gap: 10px;">
                            ${weatherData.daily.slice(1, 4).map(day => `
                                <div style="display: flex; align-items: center; justify-content: space-between; background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #f1f5f9;">
                                    <div style="font-size: 11px; font-weight: 900; color: #334155;">
                                        ${new Date(day.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' }).toUpperCase()}
                                    </div>
                                    <div style="font-size: 12px; font-weight: 900; color: #1e293b;">
                                        ${Math.round(day.tempMax)}° <span style="color: #94a3b8; font-weight: 600;">/ ${Math.round(day.tempMin)}°</span>
                                    </div>
                                    <div style="font-size: 11px; color: #2a5299; font-weight: 900; background: #eff6ff; padding: 2px 6px; border-radius: 4px;">
                                        ${day.rainProb}% CHUVA
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : '<div style="font-size: 11px; color: #94a3b8; padding: 20px; text-align: center; background: #f8fafc; border-radius: 8px;">Dados meteorológicos indisponíveis.</div>'}
                 </div>

                 <!-- Signatures Area (Professional High-Fidelity) -->
                 <div style="flex: 1.5; display: flex; flex-direction: column;">
                    <div style="display: flex; gap: 30px; margin-top: 15px;">
                        <div style="flex: 1;">
                            <div style="height: 90px; border-bottom: 2px solid #2a5299; width: 100%; margin-bottom: 12px;"></div>
                            <div style="text-align: center;">
                                <div style="font-size: 11px; font-weight: 900; color: #1e3a8a; text-transform: uppercase; letter-spacing: 0.5px;">RESPONSÁVEL OPERACIONAL</div>
                                <div style="font-size: 9px; color: #64748b; font-weight: 700; text-transform: uppercase;">Defesa Civil SMJ</div>
                            </div>
                        </div>
                        <div style="flex: 1;">
                            <div style="height: 90px; border-bottom: 2px solid #2a5299; width: 100%; margin-bottom: 12px;"></div>
                            <div style="text-align: center;">
                                <div style="font-size: 11px; font-weight: 900; color: #1e3a8a; text-transform: uppercase; letter-spacing: 0.5px;">AUTORIDADE COMPETENTE</div>
                                <div style="font-size: 9px; color: #64748b; font-weight: 700; text-transform: uppercase;">Coordenação Municipal</div>
                            </div>
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
        // Wait for potential images to load and ensure container has width
        await new Promise(resolve => setTimeout(resolve, 800));

        // CRITICAL FIX: Ensure container has a real width for html2canvas
        if (container.offsetWidth === 0) {
            container.style.width = '840px';
            container.style.minWidth = '840px';
            container.style.display = 'block';
            container.style.visibility = 'visible';
        }

        const canvas = await html2canvas(container, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            windowWidth: 840 // Force window width for capture
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
        const blob = pdf.output('blob');
        const fileName = `Relatorio_Situacional_${new Date().toISOString().split('T')[0]}.pdf`;

        // 1. ATTEMPT NATIVE SHARE (Web Share API)
        if (shouldShare && navigator.canShare) {
            const file = new File([blob], fileName, { type: 'application/pdf' });
            if (navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({
                        files: [file],
                        title: 'Relatório Situacional - Defesa Civil',
                        text: `Relatório da Defesa Civil de SMJ - ${timeframeLabel}`
                    });
                    return; // Success, exit
                } catch (shareErr) {
                    if (shareErr.name !== 'AbortError') {
                        console.error("Share failed:", shareErr);
                    } else {
                        return; // User cancelled, don't fallback to opening
                    }
                }
            }
        }

        // 2. FALLBACK: OPEN PDF IN NATIVE READER / NEW TAB
        const blobURL = URL.createObjectURL(blob);

        // Force the browser to open it in a new tab (which triggers the PDF viewer)
        const viewer = window.open(blobURL, '_blank');

        // If blocked or on some Android browsers, also trigger a direct download as fallback
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
