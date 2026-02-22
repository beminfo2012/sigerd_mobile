import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { LOGO_BASE64 } from '../utils/logoBase64';

export const generateShelterReport = async (shelters, donations, occupants) => {
    // 1. Prepare Data

    // Stats Calculation
    const totalShelters = shelters.length;
    // Use the sum of current_occupancy from shelter records as the trusted source for "active" count
    const totalOccupants = shelters.reduce((acc, curr) => acc + (parseInt(curr.current_occupancy) || 0), 0);
    const totalCapacity = shelters.reduce((acc, curr) => acc + (parseInt(curr.capacity) || 0), 0);
    const occupancyRate = totalCapacity > 0 ? ((totalOccupants / totalCapacity) * 100).toFixed(1) : '0';

    const shelterList = shelters || [];
    const donationList = donations || [];

    // 2. Create Temporary Container for Report HTML
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '840px'; // A4 width scaling
    container.style.zIndex = '-1';
    document.body.appendChild(container);

    // Helpers
    const formatDate = () => new Date().toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'medium' });

    // 3. Build HTML Structure
    const htmlContent = `
        <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; background: white; padding: 40px;">
            
            <!-- Header -->
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 30px; border-bottom: 2px solid #2a5299; padding-bottom: 20px;">
                <div style="display: flex; align-items: center; gap: 15px;">
                    <img src="${LOGO_BASE64}" style="height: 60px; display: block;" />
                    <div>
                        <h1 style="margin: 0; font-size: 24px; color: #2a5299; text-transform: uppercase; font-weight: 900;">Relatório de Abrigos</h1>
                        <p style="margin: 5px 0 0; font-size: 14px; color: #64748b; font-weight: bold;">Gestão de ASSIST. HUMANITÁRIA</p>
                        <p style="margin: 2px 0 0; font-size: 12px; color: #94a3b8;">Defesa Civil de Santa Maria de Jetibá - ES</p>
                    </div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 12px; font-weight: bold; color: #94a3b8; text-transform: uppercase;">Emissão</div>
                    <div style="font-size: 14px; font-weight: 600;">${formatDate()}</div>
                </div>
            </div>

            <!-- 1. General Panorama -->
            <div style="margin-bottom: 30px;">
                <h2 style="font-size: 16px; color: #2a5299; text-transform: uppercase; font-weight: 800; border-left: 4px solid #2a5299; padding-left: 10px; margin-bottom: 15px;">1. Panorama Geral</h2>
                <div style="display: flex; gap: 20px;">
                    <div style="flex: 1; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center;">
                        <div style="font-size: 32px; font-weight: 900; color: #1e293b;">${totalShelters}</div>
                        <div style="font-size: 12px; font-weight: bold; color: #64748b; text-transform: uppercase;">Abrigos Ativos</div>
                    </div>
                    <div style="flex: 1; background: #eff6ff; padding: 15px; border-radius: 8px; border: 1px solid #dbeafe; text-align: center;">
                        <div style="font-size: 32px; font-weight: 900; color: #2563eb;">${totalOccupants}</div>
                        <div style="font-size: 12px; font-weight: bold; color: #1e40af; text-transform: uppercase;">Pessoas Abrigadas</div>
                    </div>
                    <div style="flex: 1; background: #fff7ed; padding: 15px; border-radius: 8px; border: 1px solid #ffedd5; text-align: center;">
                        <div style="font-size: 32px; font-weight: 900; color: #ea580c;">${occupancyRate}%</div>
                        <div style="font-size: 12px; font-weight: bold; color: #c2410c; text-transform: uppercase;">Taxa de Ocupação</div>
                    </div>
                </div>
            </div>

            <!-- 2. Active Shelters List -->
            <div style="margin-bottom: 30px;">
                <h2 style="font-size: 16px; color: #2a5299; text-transform: uppercase; font-weight: 800; border-left: 4px solid #2a5299; padding-left: 10px; margin-bottom: 15px;">2. Lista de Abrigos Ativos</h2>
                <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
                    <thead style="background: #f1f5f9; text-transform: uppercase;">
                        <tr>
                            <th style="padding: 10px 8px; text-align: left; color: #475569;">Nome do Abrigo</th>
                            <th style="padding: 10px 8px; text-align: left; color: #475569;">Endereço</th>
                            <th style="padding: 10px 8px; text-align: center; color: #475569;">Capacidade</th>
                            <th style="padding: 10px 8px; text-align: center; color: #475569;">Ocupação</th>
                            <th style="padding: 10px 8px; text-align: center; color: #475569;">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${shelterList.length > 0 ? shelterList.map((s, i) => {
        const occ = parseInt(s.current_occupancy) || 0;
        const isFull = occ >= s.capacity;
        const statusColor = isFull ? '#dc2626' : '#16a34a';
        const statusLabel = isFull ? 'LOTADO' : 'DISPONÍVEL';

        return `
                                <tr style="border-bottom: 1px solid #e2e8f0; background: ${i % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                                    <td style="padding: 10px 8px; font-weight: 700; color: #334155;">${s.name}</td>
                                    <td style="padding: 10px 8px; color: #64748b;">${s.address || '-'}</td>
                                    <td style="padding: 10px 8px; text-align: center; font-weight: 600;">${s.capacity}</td>
                                    <td style="padding: 10px 8px; text-align: center; font-weight: 700; color: #1e293b;">${occ}</td>
                                    <td style="padding: 10px 8px; text-align: center;">
                                        <span style="background: ${statusColor}15; color: ${statusColor}; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 800;">
                                            ${statusLabel}
                                        </span>
                                    </td>
                                </tr>
                            `;
    }).join('') : '<tr><td colspan="5" style="padding: 20px; text-align: center; color: #94a3b8; font-style: italic;">Nenhum abrigo cadastrado.</td></tr>'}
                    </tbody>
                </table>
            </div>

            <!-- 2.1 Donation Summary -->
            <div style="page-break-inside: avoid;">
                 <h2 style="font-size: 16px; color: #2a5299; text-transform: uppercase; font-weight: 800; border-left: 4px solid #2a5299; padding-left: 10px; margin-bottom: 15px;">3. Resumo de Doações Recentes</h2>
                 ${donationList.length > 0 ? `
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        ${donationList.slice(0, 5).map(d => `
                            <div style="display: flex; align-items: center; justify-content: space-between; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
                                <div style="display: flex; align-items: center; gap: 12px;">
                                    <div style="width: 32px; height: 32px; border-radius: 50%; background: #eff6ff; display: flex; align-items: center; justify-content: center; color: #2563eb; font-weight: bold; font-size: 14px;">📦</div>
                                    <div>
                                        <div style="font-size: 13px; font-weight: 700; color: #334155;">${d.item}</div>
                                        <div style="font-size: 11px; color: #64748b;">Doador: ${d.donor}</div>
                                    </div>
                                </div>
                                <div style="text-align: right;">
                                    <div style="font-size: 14px; font-weight: 800; color: #1e293b;">${d.quantity} <span style="font-size: 10px; font-weight: 600; color: #94a3b8; text-transform: uppercase;">unid.</span></div>
                                    <div style="font-size: 10px; color: #94a3b8;">${d.donation_date ? new Date(d.donation_date).toLocaleDateString() : '-'}</div>
                                </div>
                            </div>
                        `).join('')}
                        ${donationList.length > 5 ? `<div style="text-align: center; font-size: 11px; color: #64748b; padding: 5px; font-weight: 600;">+ ${donationList.length - 5} outras doações registradas</div>` : ''}
                    </div>
                 ` : '<div style="background: #f8fafc; padding: 20px; border-radius: 8px; text-align: center; color: #94a3b8; font-style: italic; border: 1px dashed #cbd5e1;">Nenhuma doação recente registrada.</div>'}
            </div>

            <!-- Signatures Section -->
            <div style="margin-top: 50px; display: flex; gap: 40px; page-break-inside: avoid;">
                <div style="flex: 1;">
                    <div style="height: 1px; background: #cbd5e1; width: 100%; margin-bottom: 12px;"></div>
                    <div style="text-align: center;">
                        <div style="font-size: 11px; font-weight: 900; color: #1e3a8a; text-transform: uppercase; letter-spacing: 0.5px;">Responsável Técnico</div>
                        <div style="font-size: 10px; color: #64748b; font-weight: 600;">Defesa Civil SMJ</div>
                    </div>
                </div>
                <div style="flex: 1;">
                    <div style="height: 1px; background: #cbd5e1; width: 100%; margin-bottom: 12px;"></div>
                    <div style="text-align: center;">
                        <div style="font-size: 11px; font-weight: 900; color: #1e3a8a; text-transform: uppercase; letter-spacing: 0.5px;">Coordenação Municipal</div>
                        <div style="font-size: 10px; color: #64748b; font-weight: 600;">Proteção e Defesa Civil</div>
                    </div>
                </div>
            </div>

            <!-- Footer Warning -->
            <div style="margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center; font-size: 9px; color: #cbd5e1; font-style: italic;">
                * Relatório gerado automaticamente pelo Sistema SIGERD Mobile.
            </div>

        </div>
    `;

    container.innerHTML = htmlContent;

    // 4. Render to Canvas & PDF
    try {
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

        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
            heightLeft -= pdfHeight;
        }

        const blob = pdf.output('blob');
        const blobURL = URL.createObjectURL(blob);
        const fileName = `Relatorio_Abrigos_${new Date().toISOString().split('T')[0]}.pdf`;

        const viewer = window.open(blobURL, '_blank');
        if (!viewer || viewer.closed || typeof viewer.closed === 'undefined') {
            pdf.save(fileName);
        }

    } catch (error) {
        console.error("Error generating PDF report:", error);
        alert("Erro ao gerar relatório gráfico. Verifique o console.");
    } finally {
        if (document.body.contains(container)) {
            document.body.removeChild(container);
        }
    }
};
