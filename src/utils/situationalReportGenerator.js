import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { LOGO_BASE64 } from './logoBase64';

export const generateSituationalReport = async (dashboardData, weatherData, pluviometerData, mapElement, timeframeLabel = 'Todo o Período') => {
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '840px';
    container.style.zIndex = '-1';
    document.body.appendChild(container);

    const formatDate = () => new Date().toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'medium' });

    const getRiskLevel = (acc24) => {
        const val = parseFloat(acc24) || 0;
        if (val >= 80) return { label: 'ALERTA MÁXIMO', color: '#dc2626' };
        if (val >= 50) return { label: 'ATENÇÃO', color: '#ea580c' };
        if (val >= 30) return { label: 'OBSERVAÇÃO', color: '#ca8a04' };
        return { label: 'NORMAL', color: '#16a34a' };
    };

    const sortedPluvios = [...(pluviometerData || [])].map(p => ({
        ...p,
        acc1hr: parseFloat(p.acc1hr || p.acumulado1h || p.valor || 0),
        acc24hr: parseFloat(p.acc24hr || p.acumulado24h || p.valor24h || 0)
    })).sort((a, b) => b.acc24hr - a.acc24hr);

    const topPluvios = sortedPluvios.slice(0, 10);
    const avgAcc24 = sortedPluvios.length > 0
        ? (sortedPluvios.reduce((acc, p) => acc + p.acc24hr, 0) / sortedPluvios.length).toFixed(1)
        : '0.0';

    let mapImage = null;
    if (mapElement) {
        try {
            console.log("[PDF] Starting map capture for element:", mapElement.id);
            // CRITICAL: Leaflet capture needs a bit of time to ensure all layers are synced
            await new Promise(r => setTimeout(r, 1500));
            const mapCanvas = await html2canvas(mapElement, {
                useCORS: true,
                allowTaint: true,
                scale: 1.5,
                logging: false,
                backgroundColor: '#f8fafc',
                onclone: (clonedDoc) => {
                    // Fix for Leaflet's transformed panes if needed
                    const mapEl = clonedDoc.getElementById('map-capture-area');
                    if (mapEl) {
                        mapEl.style.transform = 'none';
                    }
                }
            });
            mapImage = mapCanvas.toDataURL('image/jpeg', 0.85);
            console.log("[PDF] Map capture success, data length:", mapImage.length);
        } catch (e) {
            console.error("[PDF] Map Capture Error:", e);
        }
    } else {
        console.warn("[PDF] Map element not found for capture");
    }

    const htmlContent = `
        <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; background: white; padding: 45px;">
            
            <!-- Header (High Fidelity) -->
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 35px; border-bottom: 3px solid #1e3a8a; padding-bottom: 25px;">
                <div style="display: flex; align-items: center; gap: 18px;">
                    <img src="${LOGO_BASE64}" style="height: 70px; display: block;" />
                    <div>
                        <h1 style="margin: 0; font-size: 28px; color: #1e3a8a; text-transform: uppercase; font-weight: 900; letter-spacing: -0.5px;">Relatório Situacional</h1>
                        <p style="margin: 5px 0 0; font-size: 14px; color: #2563eb; font-weight: 900; text-transform: uppercase; letter-spacing: 1px;">Gestão de Desastres: ${timeframeLabel}</p>
                        <p style="margin: 2px 0 0; font-size: 11px; color: #64748b; font-weight: 700;">Santa Maria de Jetibá - ES | Defesa Civil Municipal</p>
                    </div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 5px;">Protocolo Digital</div>
                    <div style="font-size: 14px; font-weight: 800; color: #1e293b;">${formatDate()}</div>
                </div>
            </div>

            <!-- 1. Operational Overview -->
            <div style="margin-bottom: 40px;">
                <h2 style="font-size: 14px; color: #1e3a8a; text-transform: uppercase; font-weight: 900; border-left: 6px solid #1e3a8a; padding-left: 15px; margin-bottom: 25px; letter-spacing: 1px;">1. Panorama da Operação</h2>
                <div style="display: flex; gap: 15px;">
                    <div style="flex: 1; background: #f1f5f9; padding: 22px; border-radius: 16px; border: 1px solid #e2e8f0; text-align: center; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                        <div style="font-size: 36px; font-weight: 900; color: #1e293b; line-height: 1;">${dashboardData.stats.totalVistorias || 0}</div>
                        <div style="font-size: 10px; font-weight: 900; color: #64748b; text-transform: uppercase; margin-top: 10px;">Vistorias</div>
                    </div>
                    <div style="flex: 1; background: #fff1f2; padding: 22px; border-radius: 16px; border: 1px solid #fecdd3; text-align: center;">
                        <div style="font-size: 36px; font-weight: 900; color: #be123c; line-height: 1;">${dashboardData.stats.totalInterdicoes || 0}</div>
                        <div style="font-size: 10px; font-weight: 900; color: #be123c; text-transform: uppercase; margin-top: 10px;">Interdições</div>
                    </div>
                    <div style="flex: 1; background: #ecfdf5; padding: 22px; border-radius: 16px; border: 1px solid #d1fae5; text-align: center;">
                        <div style="font-size: 36px; font-weight: 900; color: #059669; line-height: 1;">${dashboardData.stats.totalPopulacao || 0}</div>
                        <div style="font-size: 10px; font-weight: 900; color: #059669; text-transform: uppercase; margin-top: 10px;">Impactados Est.</div>
                    </div>
                    <div style="flex: 1; background: #fefce8; padding: 22px; border-radius: 16px; border: 1px solid #fef08a; text-align: center;">
                        <div style="font-size: 36px; font-weight: 900; color: #a16207; line-height: 1;">${dashboardData.stats.activeOccurrences || 0}</div>
                        <div style="font-size: 10px; font-weight: 900; color: #a16207; text-transform: uppercase; margin-top: 10px;">Alertas Ativos</div>
                    </div>
                </div>
            </div>

            <!-- 2. Environmental Audit -->
            <div style="margin-bottom: 40px; display: flex; gap: 35px;">
                <div style="flex: 1;">
                    <h2 style="font-size: 13px; color: #1e3a8a; text-transform: uppercase; font-weight: 900; border-left: 6px solid #1e3a8a; padding-left: 15px; margin-bottom: 18px;">2. Condições Climáticas</h2>
                    ${weatherData ? `
                        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 25px; box-shadow: 0 2px 4px rgba(0,0,0,0.03);">
                            <div style="font-size: 52px; font-weight: 900; color: #1e293b; letter-spacing: -2px; line-height: 1;">${Math.round(weatherData.current.temp)}°C</div>
                            <div style="margin-top: 20px; border-top: 1px solid #f1f5f9; pt: 15px;">
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px;">
                                    <div style="font-size: 11px; color: #475569;"><strong>UMIDADE:</strong> ${weatherData.current.humidity}%</div>
                                    <div style="font-size: 11px; color: #475569;"><strong>VENTO:</strong> ${Math.round(weatherData.current.wind)} km/h</div>
                                    <div style="font-size: 11px; color: #475569;"><strong>PROB. CHUVA:</strong> ${weatherData.daily[0].rainProb}%</div>
                                    <div style="font-size: 11px; color: #475569; text-transform: uppercase;"><strong>STATUS:</strong> ${weatherData.current.description || 'ESTÁVEL'}</div>
                                </div>
                            </div>
                        </div>
                    ` : '<div style="color: #94a3b8; font-weight: 700; padding: 20px; background: #f8fafc; border-radius: 12px;">Serviço meteorológico offline.</div>'}

                    <!-- Social Impact Profile -->
                    <div style="margin-top: 25px; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 16px; padding: 20px;">
                        <h3 style="font-size: 10px; font-weight: 900; color: #0369a1; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 0.5px;">Perfil de Vulnerabilidade SOCIAL</h3>
                        <div style="font-size: 11px; color: #0c4a6e; font-weight: 600;">
                            Estima-se que <strong>${dashboardData.stats.totalPopulacao}</strong> pessoas estão em áreas de risco direto no período avaliado. 
                            Prioridade para famílias com crianças, idosos e PCDs registrados em campo.
                        </div>
                    </div>
                </div>

                <div style="flex: 1.5;">
                    <h2 style="font-size: 13px; color: #1e3a8a; text-transform: uppercase; font-weight: 900; border-left: 6px solid #1e3a8a; padding-left: 15px; margin-bottom: 18px;">3. Monitoramento Hidrológico (Cemaden)</h2>
                    <table style="width: 100%; font-size: 11px; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
                                <th style="padding: 12px 10px; text-align: left; color: #475569; font-weight: 900; text-transform: uppercase;">Estação</th>
                                <th style="padding: 12px 10px; text-align: right; color: #475569; font-weight: 900; text-transform: uppercase;">1h</th>
                                <th style="padding: 12px 10px; text-align: right; color: #475569; font-weight: 900; text-transform: uppercase;">24h</th>
                                <th style="padding: 12px 10px; text-align: center; color: #475569; font-weight: 900; text-transform: uppercase;">Condição</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${topPluvios.map(p => {
        const risk = getRiskLevel(p.acc24hr);
        return `
                                    <tr style="border-bottom: 1px solid #f1f5f9;">
                                        <td style="padding: 11px 10px; font-weight: 800; color: #1e293b;">${p.name}</td>
                                        <td style="padding: 11px 10px; text-align: right; color: #64748b; font-weight: 700;">${p.acc1hr.toFixed(1)} mm</td>
                                        <td style="padding: 11px 10px; text-align: right; font-weight: 900; color: #1e293b;">${p.acc24hr.toFixed(1)} mm</td>
                                        <td style="padding: 11px 10px; text-align: center;">
                                            <span style="background: ${risk.color}; color: white; padding: 4px 10px; border-radius: 6px; font-size: 9px; font-weight: 900; text-transform: uppercase;">
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

            <!-- 4. Risk Profile Analysis -->
            <div style="margin-bottom: 40px; page-break-inside: avoid;">
                <h2 style="font-size: 13px; color: #1e3a8a; text-transform: uppercase; font-weight: 900; border-left: 6px solid #1e3a8a; padding-left: 15px; margin-bottom: 25px;">4. Análise Crítica de Riscos</h2>
                <div style="display: flex; gap: 30px;">
                    <div style="flex: 1.2; background: #f8fafc; padding: 25px; border-radius: 20px; border: 1px solid #e2e8f0;">
                        <h3 style="font-size: 10px; font-weight: 900; color: #475569; text-transform: uppercase; margin-bottom: 18px; letter-spacing: 0.5px;">Distribuição por Tipologia</h3>
                        <div style="display: flex; flex-direction: column; gap: 14px;">
                            ${dashboardData.breakdown.map(b => {
        const hexMap = {
            'Geológico / Geotécnico': '#f97316',
            'Hidrológico': '#3b82f6',
            'Estrutural': '#64748b',
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
                                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                                            <span style="font-size: 10px; font-weight: 800; color: #475569; text-transform: uppercase;">${b.label}</span>
                                            <span style="font-size: 12px; font-weight: 900; color: #1e293b;">${b.count} <small style="color: #94a3b8; font-weight: 600;">(${b.percentage}%)</small></span>
                                        </div>
                                        <div style="width: 100%; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
                                            <div style="width: ${b.percentage}%; height: 100%; background: ${barColor};"></div>
                                        </div>
                                    </div>
                                `;
    }).join('')}
                        </div>
                    </div>

                    <div style="flex: 0.8; background: #ffffff; border: 1px solid #fee2e2; padding: 25px; border-radius: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                        <h3 style="font-size: 10px; font-weight: 900; color: #991b1b; text-transform: uppercase; margin-bottom: 18px; letter-spacing: 0.5px;">Severidade dos Riscos</h3>
                        <div style="display: flex; flex-direction: column; gap: 15px;">
                            ${Object.entries(dashboardData.stats.riskLevels || {}).map(([level, count]) => {
        const levelColors = {
            'Iminente': '#dc2626',
            'Alto': '#f97316',
            'Médio': '#ca8a04',
            'Baixo': '#16a34a'
        };
        const color = levelColors[level] || '#64748b';
        return `
                                    <div style="display: flex; justify-content: space-between; align-items: center; background: ${color}08; padding: 12px; border-radius: 12px; border: 1px solid ${color}20;">
                                        <span style="font-size: 11px; font-weight: 900; color: ${color}; text-transform: uppercase;">${level}</span>
                                        <span style="font-size: 16px; font-weight: 900; color: #1e293b;">${count}</span>
                                    </div>
                                `;
    }).join('')}
                        </div>
                    </div>
                </div>
            </div>

            <!-- 5. Cartographic Visualization -->
            <div style="page-break-inside: avoid;">
                <h2 style="font-size: 13px; color: #1e3a8a; text-transform: uppercase; font-weight: 900; border-left: 6px solid #1e3a8a; padding-left: 15px; margin-bottom: 25px;">5. Localização e Detalhamento das Ocorrências</h2>
                ${mapImage ? `
                    <div style="text-align: center; margin-bottom: 35px;">
                        <div style="display: inline-block; width: 100%; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; background: #f8fafc; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);">
                            <img src="${mapImage}" style="width: 100%; max-height: 420px; object-fit: contain; display: block;" />
                        </div>
                    </div>
                ` : '<div style="background: #f1f5f9; padding: 60px; text-align: center; color: #94a3b8; border-radius: 24px; margin-bottom: 35px; border: 3px dashed #cbd5e1; font-weight: 800; text-transform: uppercase; font-size: 11px;">Captura de geoprocessamento indisponível</div>'}
                
                <div style="margin-bottom: 40px;">
                    <table style="width: 100%; font-size: 9.5px; border-collapse: collapse; border: 1px solid #f1f5f9;">
                        <thead style="background: #1e3a8a; color: white;">
                            <tr>
                                <th style="padding: 12px 10px; text-align: left; text-transform: uppercase; font-weight: 900;">Data/Hora</th>
                                <th style="padding: 12px 10px; text-align: left; text-transform: uppercase; font-weight: 900;">Tipo / Gravidade</th>
                                <th style="padding: 12px 10px; text-align: left; text-transform: uppercase; font-weight: 900;">Localização e Descrição Técnica</th>
                                <th style="padding: 12px 10px; text-align: right; text-transform: uppercase; font-weight: 900;">Gps</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${dashboardData.locations.slice(0, 30).map((l, i) => {
        const levelColors = { 'Iminente': '#991b1b', 'Alto': '#c2410c', 'Médio': '#a16207', 'Baixo': '#15803d' };
        const color = l.type === 'interdicao' ? '#dc2626' : (levelColors[l.level] || '#1e3a8a');
        return `
                                <tr style="border-bottom: 1px solid #f1f5f9; background: ${i % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                                    <td style="padding: 12px 10px; color: #1e293b; font-weight: 800; white-space: nowrap;">
                                        ${new Date(l.date).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td style="padding: 12px 10px; font-weight: 900; color: ${color}; text-transform: uppercase;">
                                        ${l.risk}<br/><span style="font-size: 8px; font-weight: 700;">${l.level || 'NORMAL'}</span>
                                    </td>
                                    <td style="padding: 12px 10px; color: #334155; font-weight: 700; max-width: 300px;">
                                        ${l.details}
                                    </td>
                                    <td style="padding: 12px 10px; text-align: right; font-family: 'Courier New', monospace; color: #64748b; font-weight: 900;">
                                        ${(parseFloat(l.lat) || 0).toFixed(4)},<br/>${(parseFloat(l.lng) || 0).toFixed(4)}
                                    </td>
                                </tr>
                                `;
    }).join('')}
                        </tbody>
                    </table>
                    ${dashboardData.locations.length > 30 ? `<div style="text-align: center; padding: 15px; font-size: 11px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">...e mais ${dashboardData.locations.length - 30} ocorrências integradas ao mapa histórico.</div>` : ''}
                </div>

                <!-- 6. Critical Interdictions Details -->
                ${dashboardData.interdicoes.length > 0 ? `
                   <div style="margin-top: 45px; background: #fff1f2; border: 2px solid #fca5a5; padding: 30px; border-radius: 24px; page-break-inside: avoid;">
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
                            <div style="background: #dc2626; width: 12px; height: 12px; border-radius: 50%; animation: pulse 2s infinite;"></div>
                            <h3 style="font-size: 14px; font-weight: 900; color: #991b1b; text-transform: uppercase; margin: 0;">Detalhamento de Medidas Restritivas (Interdições)</h3>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr; gap: 15px;">
                            ${dashboardData.interdicoes.map(i => `
                                <div style="background: white; border: 1px solid #fca5a5; padding: 20px; border-radius: 16px; box-shadow: 0 2px 4px rgba(220, 38, 38, 0.05);">
                                    <div style="display: flex; justify-content: space-between; border-bottom: 2px dashed #fee2e2; padding-bottom: 12px; margin-bottom: 15px;">
                                        <div style="font-size: 12px; font-weight: 900; color: #dc2626;">PROTOCOLO: ${i.bizId || 'EM PROCESSAMENTO'}</div>
                                        <div style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase;">${new Date(i.normalizedDate).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</div>
                                    </div>
                                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                                        <div>
                                            <div style="font-size: 9px; font-weight: 900; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px;">Localização</div>
                                            <div style="font-size: 12px; font-weight: 800; color: #1e293b;">${i.bairro || i.endereco || 'Área Registrada'}</div>
                                        </div>
                                        <div>
                                            <div style="font-size: 9px; font-weight: 900; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px;">Motivação Técnica</div>
                                            <div style="font-size: 12px; font-weight: 800; color: #991b1b; text-transform: uppercase;">${i.riscoTipo} (${i.riscoGrau})</div>
                                        </div>
                                    </div>
                                    <div style="margin-top: 15px; padding: 12px; background: #fef2f2; border-radius: 8px; border-left: 4px solid #dc2626;">
                                        <div style="font-size: 10px; font-weight: 900; color: #dc2626; text-transform: uppercase; margin-bottom: 4px;">Medida Aplicada:</div>
                                        <div style="font-size: 11px; color: #991b1b; font-weight: 800; text-transform: uppercase;">${i.medidaTipo}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                   </div>
                ` : ''}
            </div>

            <!-- Forecast + Validation Area -->
            <div style="margin-top: 60px; display: flex; gap: 50px; page-break-inside: avoid;">
                 <div style="flex: 1;">
                    <h3 style="font-size: 15px; font-weight: 900; color: #1e3a8a; margin-bottom: 20px; border-bottom: 3px solid #f1f5f9; padding-bottom: 12px; text-transform: uppercase;">Previsão Meteorológica (72h)</h3>
                    ${weatherData && weatherData.daily ? `
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            ${weatherData.daily.slice(1, 4).map(day => `
                                <div style="display: flex; align-items: center; justify-content: space-between; background: #f8fafc; padding: 15px; border-radius: 12px; border: 1px solid #f1f5f9; box-shadow: 0 1px 2px rgba(0,0,0,0.02);">
                                    <div style="font-size: 12px; font-weight: 900; color: #1e3a8a; text-transform: uppercase;">
                                        ${new Date(day.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' })}
                                    </div>
                                    <div style="font-size: 14px; font-weight: 900; color: #1e293b;">
                                        ${Math.round(day.tempMax)}° <small style="color: #94a3b8;">/ ${Math.round(day.tempMin)}°</small>
                                    </div>
                                    <div style="font-size: 10px; color: white; font-weight: 900; background: #2563eb; padding: 5px 10px; border-radius: 8px; letter-spacing: 0.5px; text-transform: uppercase;">
                                        ${day.rainProb}% CHUVA
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : '<div style="font-size: 11px; color: #94a3b8; font-weight: 700; text-align: center; padding: 30px; background: #f8fafc; border-radius: 12px;">Dados de previsão indisponíveis.</div>'}
                 </div>

                 <div style="flex: 1.5; display: flex; flex-direction: column; justify-content: flex-end;">
                    <div style="display: flex; gap: 40px;">
                        <div style="flex: 1; text-align: center;">
                            <div style="height: 1px; background: #1e3a8a; width: 100%; margin-bottom: 15px;"></div>
                            <div style="font-size: 11px; font-weight: 900; color: #1e3a8a; text-transform: uppercase; letter-spacing: 1px;">Gestor Operacional</div>
                            <div style="font-size: 9px; color: #64748b; font-weight: 700; margin-top: 4px; text-transform: uppercase;">DEFESA CIVIL MUNICIPAL</div>
                        </div>
                        <div style="flex: 1; text-align: center;">
                            <div style="height: 1px; background: #1e3a8a; width: 100%; margin-bottom: 15px;"></div>
                            <div style="font-size: 11px; font-weight: 900; color: #1e3a8a; text-transform: uppercase; letter-spacing: 1px;">Coordenação Técnica</div>
                            <div style="font-size: 9px; color: #64748b; font-weight: 700; margin-top: 4px; text-transform: uppercase;">PROTOCOLO INTEGRADO</div>
                        </div>
                    </div>
                 </div>
            </div>

            <!-- Warning about Auto-Generation -->
            <div style="margin-top: 50px; border-top: 1px solid #f1f5f9; padding-top: 20px; text-align: center; font-size: 9px; color: #94a3b8; font-weight: 800; text-transform: uppercase; letter-spacing: 2px;">
                CENTRO DE MONITORAMENTO E ALERTA ANTECIPADO (CMAA) - SANTA MARIA DE JETIBÁ
            </div>
        </div>
    `;

    container.innerHTML = htmlContent;

    try {
        // Delay to allow all styles and the map to be captured
        await new Promise(resolve => setTimeout(resolve, 1500));

        const canvas = await html2canvas(container, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.92);
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

        const blob = pdf.output('blob');
        const blobURL = URL.createObjectURL(blob);
        const viewer = window.open(blobURL, '_blank');
        if (!viewer) pdf.save(`Relatorio_Situacional_${new Date().getTime()}.pdf`);

    } catch (error) {
        console.error("PDF Final Render Error:", error);
        alert("Erro na renderização final do documento.");
    } finally {
        document.body.removeChild(container);
    }
};
