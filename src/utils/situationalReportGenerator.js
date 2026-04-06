import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { LOGO_BASE64 } from './logoBase64';

/**
 * MODv200 - Relatório Situacional Modernizado
 * Ajustes: Período no cabeçalho, Média de chuva, Avisos INMET, 
 * Seção de Pluviômetros, Novos campos na tabela e Preview PDF.
 */
export const generateSituationalReport = async (dashboardData, weatherData, pluviometerData, humanitarianData = null, timeframeLabel = 'Todo o Período', mapElement = null, shouldShare = false, reportType = 'vistorias', hours = 0) => {
    // Create a temporary container for the PDF content
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '840px'; 
    container.style.zIndex = '-1';
    document.body.appendChild(container);

    const now = new Date();
    const emissionDate = now.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).replace(',', ' -');

    // Status Logic
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

    // Calculate Average Accumulation (Only stations with data)
    const validStations = (pluviometerData || []).filter(p => (p.acc24hr || p.rainRaw || 0) > 0);
    const avgAcc = validStations.length > 0
        ? (validStations.reduce((acc, p) => acc + (p.acc24hr || p.rainRaw || 0), 0) / validStations.length).toFixed(1)
        : '0.0';

    // Get Active Warnings (INMET) - Simulated or from dashboardData.alerts
    const activeWarnings = dashboardData.alerts || [];

    const htmlContent = `
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
        <div style="font-family: 'Outfit', sans-serif; color: #1e293b; background: white; padding: 0; margin: 0; width: 840px; box-sizing: border-box;">
            
            <!-- HEADER -->
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
                        <span>Emissão: <strong>${emissionDate}</strong></span>
                        <span style="color: #cbd5e1;">|</span>
                        <span>Período: <strong>${timeframeLabel}</strong></span>
                    </div>
                </div>
                <div style="display: flex; gap: 8px;">
                    <span style="background: ${currentStatus.label === 'NORMAL' ? '#10b981' : '#f1f5f9'}; color: ${currentStatus.label === 'NORMAL' ? 'white' : '#94a3b8'}; padding: 6px 14px; border-radius: 8px; font-size: 11px; font-weight: 900; border: 1px solid ${currentStatus.label === 'NORMAL' ? '#059669' : '#e2e8f0'};">NORMAL</span>
                    <span style="background: ${currentStatus.label === 'ATENÇÃO' ? '#f59e0b' : '#f1f5f9'}; color: ${currentStatus.label === 'ATENÇÃO' ? 'white' : '#94a3b8'}; padding: 6px 14px; border-radius: 8px; font-size: 11px; font-weight: 900; border: 1px solid ${currentStatus.label === 'ATENÇÃO' ? '#d97706' : '#e2e8f0'};">ATENÇÃO</span>
                    <span style="background: ${currentStatus.label === 'ALERTA' ? '#ef4444' : '#f1f5f9'}; color: ${currentStatus.label === 'ALERTA' ? 'white' : '#94a3b8'}; padding: 6px 14px; border-radius: 8px; font-size: 11px; font-weight: 900; border: 1px solid ${currentStatus.label === 'ALERTA' ? '#dc2626' : '#e2e8f0'};">ALERTA</span>
                </div>
            </div>

            <div style="padding: 30px 40px;">

                <!-- STATS GRID -->
                <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 35px;">
                    <div style="background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 15px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); text-align: center; border-bottom: 4px solid #3b82f6;">
                        <div style="font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 5px; letter-spacing: 1px;">Vistorias</div>
                        <div style="font-size: 24px; font-weight: 900; color: #1e293b;">${dashboardData.vistorias?.stats?.total || 0}</div>
                    </div>
                    <div style="background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 15px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); text-align: center; border-bottom: 4px solid #8b5cf6;">
                        <div style="font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 5px; letter-spacing: 1px;">Ocorrências</div>
                        <div style="font-size: 24px; font-weight: 900; color: #1e293b;">${dashboardData.ocorrencias?.stats?.total || 0}</div>
                    </div>
                    <div style="background: #fff1f2; border: 1px solid #fecdd3; border-radius: 16px; padding: 15px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); text-align: center; border-bottom: 4px solid #ef4444;">
                        <div style="font-size: 9px; font-weight: 800; color: #cf222e; text-transform: uppercase; margin-bottom: 5px; letter-spacing: 1px;">Interdições</div>
                        <div style="font-size: 24px; font-weight: 900; color: #ef4444;">${dashboardData.interdicoes?.stats?.total || 0}</div>
                    </div>
                    <div style="background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 15px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); text-align: center; border-bottom: 4px solid #10b981;">
                        <div style="font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 5px; letter-spacing: 1px;">Média Chuva</div>
                        <div style="font-size: 24px; font-weight: 900; color: #1e293b;">${avgAcc}<span style="font-size: 12px; font-weight: 500; color: #94a3b8; margin-left: 2px;">mm</span></div>
                    </div>
                    <div style="background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 15px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); text-align: center; border-bottom: 4px solid #f59e0b;">
                        <div style="font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 5px; letter-spacing: 1px;">Avisos INMET</div>
                        <div style="font-size: 24px; font-weight: 900; color: #1e293b;">${activeWarnings.length}</div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 30px;">
                    
                    <!-- LEFT COLUMN -->
                    <div>
                        <div style="margin-bottom: 30px;">
                            <h3 style="font-size: 14px; font-weight: 900; color: #0f172a; text-transform: uppercase; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                                <div style="width: 4px; height: 16px; background: #3b82f6; border-radius: 2px;"></div>
                                Distribuição Geográfica
                            </h3>
                            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 20px; height: 380px; overflow: hidden; position: relative;">
                                <img src="https://tiles.stadiamaps.com/tiles/alidade_smooth/${now.getHours() > 18 || now.getHours() < 6 ? 'dark' : 'light'}/13/-20.0246/-40.7464.png" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.6; filter: grayscale(0.5); display: block;" crossorigin="anonymous" />
                                <div style="position: absolute; inset: 0; display: flex; items-center; justify-content: center; flex-direction: column; text-align: center; color: #475569; padding: 40px;">
                                    <div style="font-size: 60px; margin-bottom: 10px; opacity: 0.4;">🗺️</div>
                                    <div style="font-size: 14px; font-weight: 700; opacity: 0.8; text-transform: uppercase;">Mapeamento Situacional</div>
                                    <div style="font-size: 11px; opacity: 0.6; margin-top: 5px;">Visualização consolidada de ocorrências e vistorias</div>
                                </div>
                                <div style="position: absolute; bottom: 15px; left: 15px; background: rgba(255, 255, 255, 0.4); backdrop-filter: blur(10px); padding: 12px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.5); box-shadow: 0 4px 12px rgba(0,0,0,0.1); font-size: 9px; font-weight: 800; display: flex; flex-direction: column; gap: 8px;">
                                    <div style="display: flex; align-items: center; gap: 8px;"><div style="width: 10px; height: 10px; background: #ef4444; border-radius: 50%; border: 2px solid white;"></div> OCORRÊNCIA / VISTORIA</div>
                                    <div style="display: flex; align-items: center; gap: 8px;"><div style="width: 10px; height: 10px; background: #3b82f6; border-radius: 50%; border: 2px solid white;"></div> PLUVIÔMETRO CEMADEN</div>
                                </div>
                            </div>
                        </div>

                        <!-- Typology -->
                        <div style="margin-bottom: 30px;">
                            <h3 style="font-size: 14px; font-weight: 900; color: #0f172a; text-transform: uppercase; margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
                                <div style="width: 4px; height: 16px; background: #3b82f6; border-radius: 2px;"></div>
                                Tipologia das Atividades
                            </h3>
                            <div style="background: white; border: 1px solid #f1f5f9; border-radius: 16px; padding: 20px;">
                                ${dashboardData.breakdown.length > 0 ? dashboardData.breakdown.slice(0, 5).map(b => `
                                    <div style="margin-bottom: 15px;">
                                        <div style="display: flex; justify-content: space-between; font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 6px;">
                                            <span>${b.label}</span>
                                            <span style="color: #0f172a;">${b.percentage}% (${b.count})</span>
                                        </div>
                                        <div style="height: 10px; background: #f1f5f9; border-radius: 10px; overflow: hidden;">
                                            <div style="height: 100%; width: ${b.percentage}%; background: ${b.color || '#3b82f6'}; border-radius: 10px;"></div>
                                        </div>
                                    </div>
                                `).join('') : '<div style="font-size: 11px; color: #94a3b8; font-style: italic;">Nenhuma atividade no período.</div>'}
                            </div>
                        </div>
                    </div>

                    <!-- RIGHT COLUMN -->
                    <div>
                        <!-- Warnings INMET -->
                        <div style="margin-bottom: 30px;">
                            <h3 style="font-size: 14px; font-weight: 900; color: #0f172a; text-transform: uppercase; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                                <div style="width: 4px; height: 16px; background: #f59e0b; border-radius: 2px;"></div>
                                Avisos Ativos INMET
                            </h3>
                            <div style="display: flex; flex-direction: column; gap: 8px;">
                                ${activeWarnings.length > 0 ? activeWarnings.map(a => `
                                    <div style="padding: 12px 15px; background: #fefce8; border: 1px solid #fef08a; border-radius: 12px; border-left: 5px solid #f59e0b;">
                                        <div style="font-size: 11px; font-weight: 900; color: #854d0e; text-transform: uppercase; margin-bottom: 4px;">${a.categoria || 'ALERTA'}</div>
                                        <div style="font-size: 10px; font-weight: 600; color: #a16207; line-height: 1.4;">${a.descricao}</div>
                                    </div>
                                `).join('') : `
                                    <div style="padding: 15px; background: #f0fdf4; border: 1px solid #dcfce7; border-radius: 12px; border-left: 5px solid #10b981; display: flex; items-center; gap: 10px;">
                                        <div style="font-size: 18px;">✅</div>
                                        <div style="font-size: 11px; font-weight: 700; color: #166534; text-transform: uppercase;">Sem avisos meteorológicos ativos</div>
                                    </div>
                                `}
                            </div>
                        </div>

                        <!-- Pluviometers -->
                        <div style="margin-bottom: 30px;">
                            <h3 style="font-size: 14px; font-weight: 900; color: #0f172a; text-transform: uppercase; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                                <div style="width: 4px; height: 16px; background: #3b82f6; border-radius: 2px;"></div>
                                Índices Pluviométricos
                            </h3>
                            <div style="display: flex; flex-direction: column; gap: 8px;">
                                ${(pluviometerData || []).slice(0, 6).map(p => {
                                    const val = (p.acc24hr || p.rainRaw || 0);
                                    let color = '#10b981';
                                    if (val >= 80) color = '#ef4444';
                                    else if (val >= 50) color = '#f97316';
                                    else if (val >= 30) color = '#f59e0b';

                                    return `
                                        <div style="padding: 10px 15px; background: white; border: 1px solid #f1f5f9; border-radius: 12px; display: flex; justify-content: space-between; align-items: center;">
                                            <div style="font-size: 11px; font-weight: 700; color: #334155;">${p.name}</div>
                                            <div style="font-size: 12px; font-weight: 900; color: ${color};">${val.toFixed(1)} mm</div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>

                        <!-- Forecast -->
                        <div style="margin-bottom: 30px;">
                            <h3 style="font-size: 14px; font-weight: 900; color: #0f172a; text-transform: uppercase; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                                <div style="width: 4px; height: 16px; background: #2a5299; border-radius: 2px;"></div>
                                Previsão do Tempo
                            </h3>
                            <div style="display: flex; flex-direction: column; gap: 10px;">
                                ${weatherData && weatherData.daily ? weatherData.daily.slice(1, 4).map(day => `
                                    <div style="padding: 12px 15px; background: #f8fafc; border-radius: 12px; border: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center;">
                                        <span style="font-size: 11px; font-weight: 900; color: #0f172a; text-transform: uppercase;">${new Date(day.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '').toUpperCase()}</span>
                                        <span style="font-size: 12px; font-weight: 800; color: #334155;">${Math.round(day.tempMax)}° / ${Math.round(day.tempMin)}°</span>
                                        <span style="font-size: 10px; font-weight: 800; color: #3b82f6; background: white; padding: 2px 8px; border-radius: 5px; border: 1px solid #dbeafe;">${day.rainProb}%</span>
                                    </div>
                                `).join('') : ''}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- DETAILED TABLE -->
                <div style="margin-top: 10px;">
                    <h3 style="font-size: 14px; font-weight: 900; color: #0f172a; text-transform: uppercase; margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
                        <div style="width: 4px; height: 16px; background: #2a5299; border-radius: 2px;"></div>
                        Detalhamento das Ocorrências Mapeadas
                    </h3>
                    <table style="width: 100%; border-collapse: separate; border-spacing: 0; font-size: 10px; overflow: hidden; border-radius: 16px; border: 1px solid #f1f5f9; background: white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);">
                        <thead style="background: #f8fafc;">
                            <tr>
                                <th style="padding: 12px 15px; text-align: left; color: #64748b; font-weight: 800; text-transform: uppercase; font-size: 8px; border-bottom: 2px solid #f1f5f9;">DATA/HORA</th>
                                <th style="padding: 12px 15px; text-align: left; color: #64748b; font-weight: 800; text-transform: uppercase; font-size: 8px; border-bottom: 2px solid #f1f5f9;">TIPOLOGIA</th>
                                <th style="padding: 12px 15px; text-align: left; color: #64748b; font-weight: 800; text-transform: uppercase; font-size: 8px; border-bottom: 2px solid #f1f5f9;">SUBTIPO</th>
                                <th style="padding: 12px 15px; text-align: center; color: #64748b; font-weight: 800; text-transform: uppercase; font-size: 8px; border-bottom: 2px solid #f1f5f9;">COORDENADAS</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${dashboardData.locations.length > 0 ? dashboardData.locations.slice(0, 20).map((l, i) => `
                                <tr style="background: ${i % 2 === 0 ? 'white' : '#fafafa'}; border-bottom: 1px solid #f1f5f9;">
                                    <td style="padding: 10px 15px; font-weight: 700; color: #334155;">${l.date ? new Date(l.date).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                                    <td style="padding: 10px 15px; font-weight: 800; color: #1e293b;">${l.risk}</td>
                                    <td style="padding: 10px 15px; color: #64748b;">${l.details || l.subtype || '-'}</td>
                                    <td style="padding: 10px 15px; text-align: center; font-family: monospace; color: #94a3b8; font-size: 9px;">
                                        <span class="pdf-coord-link" data-lat="${l.lat}" data-lng="${l.lng}" style="color: #3b82f6; text-decoration: underline; cursor: pointer;">
                                            ${l.lat?.toFixed(5)}, ${l.lng?.toFixed(5)}
                                        </span>
                                    </td>
                                </tr>
                            `).join('') : `<tr><td colspan="4" style="padding: 30px; text-align: center; color: #94a3b8; font-style: italic;">Nenhum registro no período.</td></tr>`}
                        </tbody>
                    </table>
                </div>

                <!-- HUMANITARIAN -->
                ${humanitarianData ? `
                <div style="margin-top: 40px; page-break-inside: avoid;">
                    <h3 style="font-size: 14px; font-weight: 900; color: #0f172a; text-transform: uppercase; margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
                        <div style="width: 4px; height: 16px; background: #0ea5e9; border-radius: 2px;"></div>
                        Assistência Humanitária
                    </h3>
                    
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px;">
                        <div style="background: #f0f9ff; border: 1px solid #e0f2fe; border-radius: 16px; padding: 15px; text-align: center;">
                            <div style="font-size: 10px; font-weight: 800; color: #0369a1; text-transform: uppercase;">Abrigos Cadastrados</div>
                            <div style="font-size: 24px; font-weight: 900; color: #0c4a6e;">${humanitarianData.shelters?.length || 0}</div>
                        </div>
                        <div style="background: #f0f9ff; border: 1px solid #e0f2fe; border-radius: 16px; padding: 15px; text-align: center;">
                            <div style="font-size: 10px; font-weight: 800; color: #0369a1; text-transform: uppercase;">Abordagens / Famílias</div>
                            <div style="font-size: 24px; font-weight: 900; color: #0c4a6e;">${humanitarianData.occupants?.length || 0}</div>
                        </div>
                        <div style="background: #fdf2f8; border: 1px solid #fce7f3; border-radius: 16px; padding: 15px; text-align: center;">
                            <div style="font-size: 10px; font-weight: 800; color: #9d174d; text-transform: uppercase;">Kits Humanitários</div>
                            <div style="font-size: 24px; font-weight: 900; color: #831843;">${(humanitarianData.inventory || []).filter(i => String(i.item_name).toLowerCase().includes('kit')).length}</div>
                        </div>
                    </div>
                </div>
                ` : ''}

                <!-- FOOTER -->
                <div style="margin-top: 40px; background: #0f172a; border-radius: 20px; overflow: hidden; display: flex; padding: 25px; color: white; align-items: center; gap: 30px;">
                    <div style="flex: 1; border-right: 1px solid rgba(255,255,255,0.1); padding-right: 30px;">
                        <h4 style="margin: 0 0 10px; font-size: 13px; font-weight: 900; text-transform: uppercase;">Atenção Operacional</h4>
                        <p style="margin: 0; font-size: 11px; font-weight: 500; line-height: 1.6; opacity: 0.8;">
                            As equipes de campo continuam em alerta máximo. Em caso de deslizamentos ou inundações, acione imediatamente a Defesa Civil pelo telefone 199.
                        </p>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 18px; font-weight: 900; margin-bottom: 4px;">SIGERD Mobile</div>
                        <div style="font-size: 10px; font-weight: 700; opacity: 0.5; text-transform: uppercase;">Inovação em Defesa Civil</div>
                    </div>
                </div>
            </div>
        </div>
    `;

    container.innerHTML = htmlContent;

    try {
        await new Promise(resolve => setTimeout(resolve, 1200));

        if (container.offsetWidth === 0) {
            container.style.width = '840px';
            container.style.minWidth = '840px';
            container.style.display = 'block';
            container.style.visibility = 'visible';
        }

        const canvas = await html2canvas(container, {
            scale: 2.0,
            useCORS: true,
            backgroundColor: '#ffffff',
            windowWidth: 840,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.92);
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = pdfWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        let heightLeft = imgHeight;
        let position = 0;

        // Add first page
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;

        // Add subsequent pages if necessary
        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
            heightLeft -= pdfHeight;
        }

        // --- NEW: Handle Clickable Coordinates ---
        try {
            const pdfScale = pdfWidth / 840;
            const coordElements = container.querySelectorAll('.pdf-coord-link');
            
            coordElements.forEach(el => {
                const lat = el.getAttribute('data-lat');
                const lng = el.getAttribute('data-lng');
                
                if (lat && lng && lat !== '---' && lng !== '---') {
                    const rect = el.getBoundingClientRect();
                    const containerRect = container.getBoundingClientRect();
                    
                    const elTop = rect.top - containerRect.top;
                    const elLeft = rect.left - containerRect.left;
                    
                    const x_mm = elLeft * pdfScale;
                    const y_total_mm = elTop * pdfScale;
                    const w_mm = rect.width * pdfScale;
                    const h_mm = rect.height * pdfScale;
                    
                    const pageNum = Math.floor(y_total_mm / pdfHeight) + 1;
                    const y_on_page = y_total_mm % pdfHeight;
                    
                    if (pageNum <= pdf.internal.getNumberOfPages()) {
                        pdf.setPage(pageNum);
                        pdf.link(x_mm, y_on_page, w_mm, h_mm, {
                            url: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
                        });
                    }
                }
            });
        } catch (linkErr) {
            console.warn('Erro ao adicionar links de coordenadas ao PDF:', linkErr);
        }
        // -----------------------------------------

        const blob = pdf.output('blob');
        const timestamp = now.toLocaleDateString('pt-BR').replace(/\//g, '_');
        const timeStr = `${String(now.getHours()).padStart(2, '0')}_${String(now.getMinutes()).padStart(2, '0')}`;
        const fileName = `Relatório Situacional ${hours}h - ${timestamp} - ${timeStr}.pdf`;

        // Preview logic - Matching established pattern in other modules
        const blobURL = URL.createObjectURL(blob);
        
        // Attempt to open in new tab
        const viewer = window.open(blobURL);

        // Fallback to location change or direct download if blocked
        if (!viewer || viewer.closed || typeof viewer.closed === 'undefined') {
            const link = document.createElement('a');
            link.href = blobURL;
            link.download = fileName;
            link.click();
        }

    } catch (error) {
        console.error("Error generating situational report:", error);
        alert("Erro ao gerar PDF.");
    } finally {
        if (container && container.parentNode) {
            document.body.removeChild(container);
        }
    }
};
