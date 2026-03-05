import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { LOGO_BASE64 } from './logoBase64';

export const generateSituationalReport = async (dashboardData, weatherData, pluviometerData, humanitarianData = null, timeframeLabel = 'Todo o Período', mapElement = null, shouldShare = false, reportType = 'vistorias') => {
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
    // 1. DATA PROCESSING FOR NEW LAYOUT
    const now = new Date();
    const emissionDate = now.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).replace(',', ' -');

    // Status Logic (Match Dashboard's logic roughly)
    const hasHighAlerts = (dashboardData.locations || []).some(l =>
        String(l.risk).includes('Alto') || String(l.risk).includes('Crítico') || String(l.risk).includes('Perigo')
    );
    const hasMediumAlerts = (dashboardData.locations || []).some(l =>
        String(l.risk).includes('Médio') || String(l.risk).includes('Média') || String(l.risk).includes('Atenção')
    );

    let currentStatus = { label: 'NORMAL', bg: '#10b981', text: 'white' };
    if (hasHighAlerts) {
        currentStatus = { label: 'ALERTA', bg: '#ef4444', text: 'white' };
    } else if (hasMediumAlerts || (weatherData?.daily?.[0]?.rainProb > 50)) {
        currentStatus = { label: 'ATENÇÃO', bg: '#f59e0b', text: 'white' };
    }

    // Neighborhood Breakdown
    const neighborhoodStats = {};
    (dashboardData.locations || []).forEach(loc => {
        const n = loc.neighborhood || loc.details?.split('-')[0]?.trim() || 'Centro';
        neighborhoodStats[n] = (neighborhoodStats[n] || 0) + 1;
    });
    const topNeighborhoods = Object.entries(neighborhoodStats)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    // Filter critical areas
    const criticalAreas = (dashboardData.locations || [])
        .filter(l => String(l.risk).includes('Alto') || String(l.risk).includes('Crítico'))
        .slice(0, 5);

    // Calculate Average 24h Accumulation
    const avgAcc24 = (pluviometerData && pluviometerData.length > 0)
        ? (pluviometerData.reduce((acc, p) => acc + (p.acc24hr || p.rainRaw || 0), 0) / pluviometerData.length).toFixed(1)
        : '0.0';

    const htmlContent = `
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
        <div style="font-family: 'Outfit', sans-serif; color: #1e293b; background: white; padding: 0; margin: 0; width: 840px; box-sizing: border-box;">
            
            <!-- HEADER (Dark Blue) -->
            <div style="background: #0f172a; color: white; padding: 40px 40px 30px; border-bottom: 8px solid #2a5299;">
                <div style="display: flex; align-items: center; gap: 24px;">
                    <img src="${LOGO_BASE64}" style="height: 70px; display: block;" />
                    <div style="flex: 1;">
                        <h1 style="margin: 0; font-size: 28px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase;">Relatório Situacional - Defesa Civil</h1>
                        <p style="margin: 4px 0 0; font-size: 16px; font-weight: 500; opacity: 0.8; letter-spacing: 0.5px;">Centro de Monitoramento Municipal</p>
                    </div>
                </div>
            </div>

            <!-- INFO BAR -->
            <div style="padding: 25px 40px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: flex-start;">
                <div style="max-width: 60%;">
                    <div style="font-size: 16px; font-weight: 800; color: #0f172a; margin-bottom: 8px;">Município: <span style="font-weight: 500;">Santa Maria de Jetibá - ES</span></div>
                    <div style="font-size: 14px; font-weight: 600; color: #64748b; display: flex; gap: 12px;">
                        <span>Data/Hora de emissão: <strong>${emissionDate}</strong></span>
                        <span style="color: #cbd5e1;">|</span>
                        <span>Período analisado: <strong>${timeframeLabel}</strong></span>
                    </div>
                </div>
                <!-- Status Indicators -->
                <div style="display: flex; gap: 8px;">
                    <span style="background: ${currentStatus.label === 'NORMAL' ? '#10b981' : '#f1f5f9'}; color: ${currentStatus.label === 'NORMAL' ? 'white' : '#94a3b8'}; padding: 6px 14px; border-radius: 8px; font-size: 11px; font-weight: 900; border: 1px solid ${currentStatus.label === 'NORMAL' ? '#059669' : '#e2e8f0'};">NORMAL</span>
                    <span style="background: ${currentStatus.label === 'ATENÇÃO' ? '#f59e0b' : '#f1f5f9'}; color: ${currentStatus.label === 'ATENÇÃO' ? 'white' : '#94a3b8'}; padding: 6px 14px; border-radius: 8px; font-size: 11px; font-weight: 900; border: 1px solid ${currentStatus.label === 'ATENÇÃO' ? '#d97706' : '#e2e8f0'};">ATENÇÃO</span>
                    <span style="background: ${currentStatus.label === 'ALERTA' ? '#ef4444' : '#f1f5f9'}; color: ${currentStatus.label === 'ALERTA' ? 'white' : '#94a3b8'}; padding: 6px 14px; border-radius: 8px; font-size: 11px; font-weight: 900; border: 1px solid ${currentStatus.label === 'ALERTA' ? '#dc2626' : '#e2e8f0'};">ALERTA</span>
                </div>
            </div>

            <div style="padding: 30px 40px;">

                <!-- STATS GRID -->
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 35px;">
                    <div style="background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); text-align: center; border-bottom: 4px solid #3b82f6;">
                        <div style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 5px; letter-spacing: 1px;">Ocorrências</div>
                        <div style="font-size: 32px; font-weight: 900; color: #1e293b;">${dashboardData.locations?.length || 0}</div>
                    </div>
                    <div style="background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); text-align: center; border-bottom: 4px solid #ef4444;">
                        <div style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 5px; letter-spacing: 1px;">Avisos Ativos</div>
                        <div style="font-size: 32px; font-weight: 900; color: #1e293b;">${dashboardData.stats?.activeOccurrences || 0}</div>
                    </div>
                    <div style="background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); text-align: center; border-bottom: 4px solid #10b981;">
                        <div style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 5px; letter-spacing: 1px;">Chuva Média 24h</div>
                        <div style="font-size: 32px; font-weight: 900; color: #1e293b;">${avgAcc24}<span style="font-size: 14px; font-weight: 500; color: #94a3b8; margin-left: 2px;">mm</span></div>
                    </div>
                    <div style="background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); text-align: center; border-bottom: 4px solid #6366f1;">
                        <div style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 5px; letter-spacing: 1px;">Áreas em Monitoramento</div>
                        <div style="font-size: 32px; font-weight: 900; color: #1e293b;">${Object.keys(neighborhoodStats).length}</div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 30px;">
                    
                    <!-- LEFT COLUMN -->
                    <div>
                        <!-- Simulated Map Area -->
                        <div style="margin-bottom: 30px;">
                            <h3 style="font-size: 14px; font-weight: 900; color: #0f172a; text-transform: uppercase; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                                <div style="width: 4px; height: 16px; background: #3b82f6; border-radius: 2px;"></div>
                                Mapa de Ocorrências
                            </h3>
                            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 20px; height: 350px; overflow: hidden; position: relative;">
                                <div style="width: 100%; height: 100%; background: url('https://tiles.stadiamaps.com/tiles/alidade_smooth/${now.getHours() > 18 || now.getHours() < 6 ? 'dark' : 'light'}/13/-20.0246/-40.7464.png'); background-size: cover; background-position: center; opacity: 0.6; filter: grayscale(0.5);"></div>
                                <div style="position: absolute; inset: 0; display: flex; items-center; justify-content: center; flex-direction: column; text-align: center; color: #475569; padding: 40px;">
                                    <div style="font-size: 60px; margin-bottom: 10px; opacity: 0.4;">🗺️</div>
                                    <div style="font-size: 14px; font-weight: 700; opacity: 0.8;">DISTRIBUIÇÃO GEOGRÁFICA</div>
                                    <div style="font-size: 11px; opacity: 0.6; margin-top: 5px;">Mapeamento de riscos e ocorrências no período</div>
                                </div>
                                <!-- Legend inside map -->
                                <div style="position: absolute; bottom: 15px; left: 15px; background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(10px); padding: 10px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.3); box-shadow: 0 4px 12px rgba(0,0,0,0.05); font-size: 9px; font-weight: 800; display: flex; flex-direction: column; gap: 6px;">
                                    <div style="display: flex; align-items: center; gap: 6px;"><div style="width: 8px; height: 8px; background: #ef4444; border-radius: 50%;"></div> OCORRÊNCIA</div>
                                    <div style="display: flex; align-items: center; gap: 6px;"><div style="width: 8px; height: 8px; background: #f59e0b; border-radius: 50%;"></div> ÁREA DE RISCO</div>
                                    <div style="display: flex; align-items: center; gap: 6px;"><div style="width: 8px; height: 8px; background: #3b82f6; border-radius: 50%;"></div> PLUVIÔMETRO</div>
                                </div>
                            </div>
                        </div>

                        <!-- Typology Breakdown -->
                        <div style="margin-bottom: 30px;">
                            <h3 style="font-size: 14px; font-weight: 900; color: #0f172a; text-transform: uppercase; margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
                                <div style="width: 4px; height: 16px; background: #3b82f6; border-radius: 2px;"></div>
                                Tipologia das Ocorrências
                            </h3>
                            <div style="background: white; border: 1px solid #f1f5f9; border-radius: 16px; padding: 20px;">
                                ${dashboardData.breakdown.slice(0, 4).map(b => `
                                    <div style="margin-bottom: 15px;">
                                        <div style="display: flex; justify-content: space-between; font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 6px;">
                                            <span>${b.label}</span>
                                            <span style="color: #0f172a;">${b.percentage}%</span>
                                        </div>
                                        <div style="height: 10px; background: #f1f5f9; border-radius: 10px; overflow: hidden;">
                                            <div style="height: 100%; width: ${b.percentage}%; background: ${b.color || '#3b82f6'}; border-radius: 10px;"></div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <!-- Critical Areas -->
                        <div>
                            <h3 style="font-size: 14px; font-weight: 900; color: #0f172a; text-transform: uppercase; margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
                                <div style="width: 4px; height: 16px; background: #ef4444; border-radius: 2px;"></div>
                                Áreas Críticas
                            </h3>
                            <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                                ${criticalAreas.length > 0 ? criticalAreas.map(a => `
                                    <div style="padding: 8px 12px; border-radius: 10px; background: #fff1f2; border: 1px solid #fecdd3; font-size: 10px; font-weight: 700; color: #be123c; display: flex; align-items: center; gap: 6px;">
                                        <span style="font-size: 14px;">🚩</span> ${a.neighborhood || a.details?.split('-')[0] || 'Local'}
                                    </div>
                                `).join('') : `<div style="font-size: 11px; color: #94a3b8; font-style: italic;">Nenhuma área crítica no período.</div>`}
                            </div>
                        </div>
                    </div>

                    <!-- RIGHT COLUMN -->
                    <div>
                        <!-- Weather Conditions -->
                        <div style="margin-bottom: 30px;">
                            <h3 style="font-size: 14px; font-weight: 900; color: #0f172a; text-transform: uppercase; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                                <div style="width: 4px; height: 16px; background: #3b82f6; border-radius: 2px;"></div>
                                Condições Meteorológicas
                            </h3>
                            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 20px; padding: 25px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                                ${weatherData ? `
                                    <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 20px;">
                                        <div style="font-size: 48px; font-weight: 900; color: #0f172a;">${Math.round(weatherData.current.temp)}°C</div>
                                        <div style="flex: 1;">
                                            <div style="font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase;">Santa Maria de Jetibá</div>
                                            <div style="font-size: 11px; font-weight: 500; color: #94a3b8;">Umidade: ${weatherData.current.humidity}% | Vento: ${Math.round(weatherData.current.wind)} km/h</div>
                                        </div>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; background: #f8fafc; padding: 12px; border-radius: 12px;">
                                        <div style="text-align: center;">
                                            <div style="font-size: 9px; font-weight: 800; color: #94a3b8; margin-bottom: 4px;">PRECIPITAÇÃO</div>
                                            <div style="font-size: 14px; font-weight: 900; color: #3b82f6;">${weatherData.daily && weatherData.daily[0] ? weatherData.daily[0].rainProb : 0}%</div>
                                        </div>
                                        <div style="text-align: center;">
                                            <div style="font-size: 9px; font-weight: 800; color: #94a3b8; margin-bottom: 4px;">ACUL. 1H</div>
                                            <div style="font-size: 14px; font-weight: 900; color: #1e293b;">${weatherData.current.rain} mm</div>
                                        </div>
                                        <div style="text-align: center;">
                                            <div style="font-size: 9px; font-weight: 800; color: #94a3b8; margin-bottom: 4px;">TENDÊNCIA</div>
                                            <div style="font-size: 14px; font-weight: 900; color: #10b981;">ESTÁVEL</div>
                                        </div>
                                    </div>
                                ` : '<div style="font-style: italic; color: #94a3b8;">Dados não disponíveis</div>'}
                            </div>
                        </div>

                        <!-- Areas Under Monitoring -->
                        <div style="margin-bottom: 30px;">
                            <h3 style="font-size: 14px; font-weight: 900; color: #0f172a; text-transform: uppercase; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                                <div style="width: 4px; height: 16px; background: #f59e0b; border-radius: 2px;"></div>
                                Áreas sob Monitoramento
                            </h3>
                            <div style="display: flex; flex-direction: column; gap: 8px;">
                                ${topNeighborhoods.length > 0 ? topNeighborhoods.map(([n, count]) => `
                                    <div style="padding: 10px 15px; background: white; border: 1px solid #f1f5f9; border-radius: 12px; display: flex; justify-content: space-between; align-items: center;">
                                        <div style="font-size: 12px; font-weight: 700; color: #334155; display: flex; align-items: center; gap: 8px;">
                                            <div style="width: 8px; height: 8px; background: #f59e0b; border-radius: 2px;"></div> ${n}
                                        </div>
                                        <div style="font-size: 10px; font-weight: 800; color: #94a3b8;">${count} reg.</div>
                                    </div>
                                `).join('') : '<div style="font-size: 11px; color: #94a3b8; font-style: italic; padding: 10px;">Consolidando monitoramento...</div>'}
                            </div>
                        </div>

                        <!-- Forecast -->
                        <div style="margin-bottom: 30px;">
                            <h3 style="font-size: 14px; font-weight: 900; color: #0f172a; text-transform: uppercase; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                                <div style="width: 4px; height: 16px; background: #3b82f6; border-radius: 2px;"></div>
                                Previsão Meteorológica
                            </h3>
                            <div style="display: flex; flex-direction: column; gap: 10px;">
                                ${weatherData && weatherData.daily ? weatherData.daily.slice(1, 4).map(day => `
                                    <div style="padding: 12px 15px; background: #f8fafc; border-radius: 12px; border: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center;">
                                        <span style="font-size: 11px; font-weight: 900; color: #0f172a; text-transform: uppercase;">${new Date(day.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '').toUpperCase()} • ${new Date(day.date + 'T12:00:00').getDate()}</span>
                                        <span style="font-size: 12px; font-weight: 800; color: #334155;">${Math.round(day.tempMax)}° / ${Math.round(day.tempMin)}°</span>
                                        <span style="font-size: 10px; font-weight: 800; color: #3b82f6; background: white; padding: 2px 8px; border-radius: 5px; border: 1px solid #dbeafe;">${day.rainProb}%</span>
                                    </div>
                                `).join('') : ''}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- DETAILED TABEL -->
                <div style="margin-top: 10px;">
                    <h3 style="font-size: 14px; font-weight: 900; color: #0f172a; text-transform: uppercase; margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
                        <div style="width: 4px; height: 16px; background: #2a5299; border-radius: 2px;"></div>
                        Detalhamento das Ocorrências Mapeadas
                    </h3>
                    <table style="width: 100%; border-collapse: separate; border-spacing: 0; font-size: 11px; overflow: hidden; border-radius: 16px; border: 1px solid #f1f5f9; background: white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);">
                        <thead style="background: #f8fafc;">
                            <tr>
                                <th style="padding: 12px 15px; text-align: left; color: #64748b; font-weight: 800; text-transform: uppercase; font-size: 9px; border-bottom: 2px solid #f1f5f9;">DATA/HORA</th>
                                <th style="padding: 12px 15px; text-align: left; color: #64748b; font-weight: 800; text-transform: uppercase; font-size: 9px; border-bottom: 2px solid #f1f5f9;">TIPOLOGIA</th>
                                <th style="padding: 12px 15px; text-align: left; color: #64748b; font-weight: 800; text-transform: uppercase; font-size: 9px; border-bottom: 2px solid #f1f5f9;">LOCAL</th>
                                <th style="padding: 12px 15px; text-align: center; color: #64748b; font-weight: 800; text-transform: uppercase; font-size: 9px; border-bottom: 2px solid #f1f5f9;">STATUS</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${dashboardData.locations.length > 0 ? dashboardData.locations.slice(0, 15).map((l, i) => `
                                <tr style="background: ${i % 2 === 0 ? 'white' : '#fafafa'}; border-bottom: 1px solid #f1f5f9;">
                                    <td style="padding: 12px 15px; font-weight: 700; color: #334155;">${l.date ? new Date(l.date).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                                    <td style="padding: 12px 15px; font-weight: 800; color: #1e293b;">${l.risk}</td>
                                    <td style="padding: 12px 15px; color: #64748b;">${l.neighborhood || l.details?.split('-')[0] || 'Santa Maria'}</td>
                                    <td style="padding: 12px 15px; text-align: center;">
                                        <span style="font-size: 9px; font-weight: 900; color: ${l.status === 'Finalizada' ? '#10b981' : l.status === 'Pendente' ? '#ef4444' : '#f59e0b'}; text-transform: uppercase;">
                                            ${l.status || 'Ativo'}
                                        </span>
                                    </td>
                                </tr>
                            `).join('') : `<tr><td colspan="4" style="padding: 30px; text-align: center; color: #94a3b8; font-style: italic;">Nenhuma ocorrência registrada nas últimas 24 horas</td></tr>`}
                        </tbody>
                    </table>
                </div>

                <!-- HUMANITARIAN ASSISTANCE SECTION -->
                ${humanitarianData ? `
                <div style="margin-top: 40px; page-break-inside: avoid;">
                    <h3 style="font-size: 14px; font-weight: 900; color: #0f172a; text-transform: uppercase; margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
                        <div style="width: 4px; height: 16px; background: #0ea5e9; border-radius: 2px;"></div>
                        Assistência Humanitária e Suprimentos
                    </h3>
                    
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px;">
                        <div style="background: #f0f9ff; border: 1px solid #e0f2fe; border-radius: 16px; padding: 15px; text-align: center;">
                            <div style="font-size: 10px; font-weight: 800; color: #0369a1; text-transform: uppercase;">Abrigos Ativos</div>
                            <div style="font-size: 24px; font-weight: 900; color: #0c4a6e;">${humanitarianData.shelters?.length || 0}</div>
                        </div>
                        <div style="background: #f0f9ff; border: 1px solid #e0f2fe; border-radius: 16px; padding: 15px; text-align: center;">
                            <div style="font-size: 10px; font-weight: 800; color: #0369a1; text-transform: uppercase;">Pessoas Abrigadas</div>
                            <div style="font-size: 24px; font-weight: 900; color: #0c4a6e;">${humanitarianData.occupants?.filter(o => o.status !== 'exited')?.length || 0}</div>
                        </div>
                        <div style="background: #fdf2f8; border: 1px solid #fce7f3; border-radius: 16px; padding: 15px; text-align: center;">
                            <div style="font-size: 10px; font-weight: 800; color: #9d174d; text-transform: uppercase;">Itens de Estoque</div>
                            <div style="font-size: 24px; font-weight: 900; color: #831843;">${humanitarianData.inventory?.length || 0}</div>
                        </div>
                    </div>

                    <div style="background: white; border: 1px solid #f1f5f9; border-radius: 16px; padding: 15px;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
                            <thead>
                                <tr style="border-bottom: 2px solid #f1f5f9; text-align: left; color: #64748b;">
                                    <th style="padding: 8px;">ITEM ESTRATÉGICO</th>
                                    <th style="padding: 8px;">CATEGORIA</th>
                                    <th style="padding: 8px; text-align: right;">SALDO ATUAL</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${humanitarianData.inventory && humanitarianData.inventory.length > 0 ?
                humanitarianData.inventory.sort((a, b) => b.quantity - a.quantity).slice(0, 5).map(i => `
                                    <tr style="border-bottom: 1px solid #f8fafc;">
                                        <td style="padding: 10px 8px; font-weight: 700; color: #334155;">${i.item_name}</td>
                                        <td style="padding: 10px 8px; color: #64748b;">${i.category || 'Geral'}</td>
                                        <td style="padding: 10px 8px; text-align: right; font-weight: 900; color: #0f172a;">${i.quantity} ${i.unit || 'un'}</td>
                                    </tr>
                                `).join('') : '<tr><td colspan="3" style="padding: 20px; text-align: center; color: #94a3b8;">Nenhum suprimento crítico registrado.</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>
                ` : ''}

                <!-- OBSERVATION FOOTER -->
                <div style="margin-top: 40px; background: #0f172a; border-radius: 20px; overflow: hidden; display: grid; grid-template-columns: 0.35fr 0.65fr;">
                    <div style="background: #2a5299; padding: 25px; color: white;">
                        <h4 style="margin: 0 0 15px; font-size: 13px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px;">OBSERVAÇÃO OPERACIONAL</h4>
                        <div style="font-size: 10px; font-weight: 700; margin-bottom: 10px; opacity: 0.8; display: flex; align-items: center; gap: 8px;">📞 Emergência: ligue 199</div>
                        <div style="font-size: 10px; font-weight: 700; opacity: 0.8; display: flex; align-items: center; gap: 8px;">📡 Fonte: Defesa Civil, INMET, CEMADEN</div>
                    </div>
                    <div style="padding: 25px; color: white; display: flex; flex-direction: column; justify-content: center;">
                        <p style="margin: 0; font-size: 11px; font-weight: 500; line-height: 1.6; opacity: 0.9;">
                            Até o momento não há registro de vítimas ou danos estruturais relevantes.
                            As equipes da Defesa Civil permanecem em monitoramento devido a a previsão de chuva moderada nas próximas 24 horas.
                        </p>
                    </div>
                </div>

                <div style="text-align: center; margin-top: 25px; font-size: 9px; color: #cbd5e1; font-weight: 700; letter-spacing: 0.5px;">
                    * Documento gerado automaticamente pelo sistema SIGERD - Todos os direitos reservados.
                </div>
            </div>
        </div>
    `;

    container.innerHTML = htmlContent;

    // Generate PDF
    try {
        // Wait for potential images to load and ensure container has width
        await new Promise(resolve => setTimeout(resolve, 1500)); // Increased wait for font and images

        // CRITICAL FIX: Ensure container has a real width for html2canvas
        if (container.offsetWidth === 0) {
            container.style.width = '840px';
            container.style.minWidth = '840px';
            container.style.display = 'block';
            container.style.visibility = 'visible';
        }

        const canvas = await html2canvas(container, {
            scale: 2.0, // Scale 2.0 is safer for memory and usually enough
            useCORS: true,
            logging: true, // Internal logging for debug
            backgroundColor: '#ffffff',
            windowWidth: 840,
            // allowTaint: true - REMOVED: this can prevent toDataURL if non-CORS images are present
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.90);
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = pdfWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;

        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
            heightLeft -= pdfHeight;
        }

        // Create the PDF Blob for sharing or viewing
        const blob = pdf.output('blob');
        const fileName = `(Rel. Situacional).pdf`;

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
        console.error("CRITICAL ERROR generating situational report PDF:", error);
        alert("Erro ao gerar relatório PDF. Verifique se o navegador permitiu a criação do arquivo.");
    } finally {
        if (container && container.parentNode) {
            document.body.removeChild(container);
        }
    }
};
