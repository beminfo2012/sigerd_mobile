import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { LOGO_DEFESA_CIVIL, LOGO_SIGERD } from './reportLogos';

export const generatePDF = async (rawData, type) => {
    // 1. Data Normalization
    const data = type === 'vistoria' ? {
        // Vistoria Fields
        id: rawData.vistoriaId || rawData.vistoria_id || '---',
        protocolo: rawData.processo || rawData.vistoriaId || '---',
        dataRegistro: formatDate(rawData.dataHora || rawData.created_at),
        emissao: new Date().toLocaleString('pt-BR'),
        agente: rawData.agente || '---',
        matricula: rawData.matricula || '---',
        assinaturaAgente: rawData.assinaturaAgente,

        solicitante: rawData.solicitante || '---',
        endereco: rawData.endereco || '---',
        latitude: rawData.latitude || '---',
        longitude: rawData.longitude || '---',

        // Diagnosis
        categoria: rawData.categoriaRisco || '---',
        nivel: rawData.nivelRisco || 'Baixo',
        subtipo: Array.isArray(rawData.subtiposRisco) ? rawData.subtiposRisco.join(', ') : (rawData.subtiposRisco || '---'),
        situacao: rawData.situacaoObservada || '---',
        populacao: rawData.populacaoEstimada || '---',

        // Content
        descricao: rawData.observacoes || 'Não informado',
        medidas: rawData.medidasTomadas || [],

        // Technical
        checklist: rawData.checklistRespostas || {},

        // Photos
        fotos: (rawData.fotos || []).map(f => typeof f === 'string' ? { data: f } : f),

        apoio: rawData.apoioTecnico
    } : {
        // Fallback for non-vistoria (keeping minimum viable)
        id: rawData.interdicaoId || '---',
        protocolo: rawData.interdicaoId || '---',
        dataRegistro: formatDate(rawData.dataHora),
        emissao: new Date().toLocaleString('pt-BR'),
        agente: rawData.agente || 'Agente',
        descricao: rawData.relatorioTecnico || '---',
        medidas: [rawData.recomendacoes].filter(Boolean)
    };

    // Helper: Level Color Mapping
    const getLevelColor = (level) => {
        const l = String(level).toLowerCase();
        if (l.includes('alto') || l.includes('imininente') || l.includes('crítico')) return 'bg-orange-500 text-white shadow-orange-500/20';
        if (l.includes('médio') || l.includes('medio')) return 'bg-yellow-500 text-white shadow-yellow-500/20';
        return 'bg-green-600 text-white shadow-green-500/20';
    };

    // Helper: Format Date
    function formatDate(dateStr) {
        if (!dateStr) return '---';
        try {
            return new Date(dateStr).toLocaleString('pt-BR');
        } catch (e) { return dateStr; }
    }

    // Helper: Base64 Converter
    const urlToBase64 = (url) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            };
            img.onerror = () => resolve(url);
            img.src = url;
        });
    };

    // Pre-load logos
    const logoDC = await urlToBase64(LOGO_DEFESA_CIVIL);
    const logoSig = await urlToBase64(LOGO_SIGERD);

    // 2. Build HTML Content (User Provided Template)
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="utf-8"/>
        <link href="https://fonts.googleapis.com" rel="preconnect"/>
        <link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&amp;family=Libre+Baskerville:ital@0;1&amp;family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet"/>
        <style>
            .material-symbols-rounded { font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
            /* Force white background for PDF */
            body { background-color: white !important; -webkit-print-color-adjust: exact; }
            .no-print { display: none !important; }
        </style>
    </head>
    <body class="bg-white font-display text-slate-800 antialiased">
        <div id="pdf-wrapper" class="max-w-3xl mx-auto p-8 space-y-8 pb-20">
            
            <!-- HEADER -->
            <div class="flex flex-col items-center text-center space-y-4 py-4 border-b border-slate-200">
                <div class="flex justify-between w-full items-center">
                    <img alt="Defesa Civil Logo" class="h-16 w-auto object-contain" src="${logoDC}"/>
                    <div class="flex-1 px-4">
                        <h2 class="text-sm font-bold uppercase leading-tight text-slate-900">Prefeitura Municipal de<br/>Santa Maria de Jetibá</h2>
                        <p class="text-[10px] uppercase text-slate-500 mt-1">Coordenadoria Municipal de Proteção e Defesa Civil</p>
                    </div>
                    <img alt="SIGERD Logo" class="h-16 w-auto object-contain" src="${logoSig}"/>
                </div>
                <div class="w-full bg-primary py-2 rounded">
                    <h3 class="text-white text-xs font-bold uppercase tracking-widest">Relatório de Vistoria Técnica</h3>
                </div>
            </div>

            <!-- 1. IDENTIFICAÇÃO -->
            <section class="space-y-4">
                <div class="flex items-center gap-3">
                    <div class="w-1 h-6 bg-primary rounded-full"></div>
                    <h4 class="text-sm font-bold uppercase text-primary tracking-wide">1. Identificação e Responsável</h4>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div class="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                        <p class="text-[10px] uppercase text-slate-500 mb-1">Data do Registro</p>
                        <p class="text-sm font-medium">${data.dataRegistro}</p>
                    </div>
                    <div class="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                        <p class="text-[10px] uppercase text-slate-500 mb-1">Protocolo/Processo</p>
                        <p class="text-sm font-bold text-primary">${data.protocolo}</p>
                    </div>
                    <div class="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                        <p class="text-[10px] uppercase text-slate-500 mb-1">Emissão do Laudo</p>
                        <p class="text-sm font-medium">${data.emissao}</p>
                    </div>
                    <div class="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                        <p class="text-[10px] uppercase text-slate-500 mb-1">Agente Responsável</p>
                        <p class="text-sm font-medium">${data.agente}</p>
                    </div>
                </div>
            </section>

            <!-- 2. LOCALIZAÇÃO -->
            <section class="space-y-4">
                <div class="flex items-center gap-3">
                    <div class="w-1 h-6 bg-primary rounded-full"></div>
                    <h4 class="text-sm font-bold uppercase text-primary tracking-wide">2. Localização e Solicitante</h4>
                </div>
                <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="space-y-3">
                            <div>
                                <p class="text-[10px] uppercase text-slate-500">Solicitante</p>
                                <p class="text-sm font-medium">${data.solicitante}</p>
                            </div>
                            <div>
                                <p class="text-[10px] uppercase text-slate-500">Endereço da Ocorrência</p>
                                <p class="text-sm font-medium">${data.endereco}</p>
                            </div>
                            <div class="flex items-center gap-2 text-primary">
                                <span class="material-symbols-rounded text-sm">location_on</span>
                                <p class="text-xs font-mono">${data.latitude}, ${data.longitude}</p>
                            </div>
                        </div>
                        <!-- Placeholder Map or First Photo -->
                        <div class="relative h-32 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center border border-slate-200">
                             <div class="text-center">
                                <span class="material-symbols-rounded text-primary text-3xl mb-1">map</span>
                                <p class="text-[10px] text-slate-400 font-mono">LAT: ${data.latitude}<br>LNG: ${data.longitude}</p>
                             </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- 3. DIAGNÓSTICO -->
            <section class="space-y-4">
                <div class="flex items-center gap-3">
                    <div class="w-1 h-6 bg-primary rounded-full"></div>
                    <h4 class="text-sm font-bold uppercase text-primary tracking-wide">3. Diagnóstico de Risco</h4>
                </div>
                <div class="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
                    <div class="flex justify-between items-center">
                        <div>
                            <p class="text-[10px] uppercase text-slate-500">Categoria Principal</p>
                            <p class="text-sm font-semibold">${data.categoria}</p>
                        </div>
                        <div class="flex flex-col items-end">
                            <p class="text-[10px] uppercase text-slate-500 mb-1">Nível de Risco</p>
                            <span class="${getLevelColor(data.nivel)} px-3 py-1 rounded-full text-xs font-bold tracking-widest shadow-lg">${String(data.nivel).toUpperCase()}</span>
                        </div>
                    </div>
                    <hr class="border-slate-100"/>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <p class="text-[10px] uppercase text-slate-500">Subtipo</p>
                            <p class="text-sm">${data.subtipo}</p>
                        </div>
                        <div>
                            <p class="text-[10px] uppercase text-slate-500">Situação</p>
                            <p class="text-sm">${data.situacao}</p>
                        </div>
                    </div>
                    <div class="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center gap-3">
                        <span class="material-symbols-rounded text-slate-400">groups</span>
                        <div>
                            <p class="text-[10px] uppercase text-slate-500">População Exposta</p>
                            <p class="text-sm font-medium">${data.populacao}</p>
                        </div>
                    </div>
                </div>
            </section>

            <!-- 4. PARECER -->
            <section class="space-y-4">
                <div class="flex items-center gap-3">
                    <div class="w-1 h-6 bg-primary rounded-full"></div>
                    <h4 class="text-sm font-bold uppercase text-primary tracking-wide">4. Parecer e Recomendações</h4>
                </div>
                <div class="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
                    <div>
                        <p class="text-[10px] uppercase text-slate-500 mb-2">Descrição Técnica</p>
                        <p class="font-serif text-sm leading-relaxed text-slate-700 italic text-justify">
                            "${data.descricao}"
                        </p>
                    </div>
                    <div class="grid gap-4 pt-4 border-t border-slate-100">
                        <div>
                            <p class="text-[10px] uppercase text-primary font-bold mb-2">Medidas Recomendadas</p>
                            <ul class="text-sm space-y-1 list-disc list-inside text-slate-600">
                                ${(data.medidas.length ? data.medidas : ['Nenhuma medida específica']).map(m => `<li>${m}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

             <!-- 5. CONSTATAÇÕES -->
            ${Object.keys(data.checklist).some(k => data.checklist[k]) ? `
            <section class="space-y-4">
                <div class="flex items-center gap-3">
                    <div class="w-1 h-6 bg-primary rounded-full"></div>
                    <h4 class="text-sm font-bold uppercase text-primary tracking-wide">5. Constatações Técnicas</h4>
                </div>
                <div class="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm grid gap-2">
                    ${Object.entries(data.checklist).filter(([_, v]) => v).map(([k, v]) => `
                        <div class="flex items-center gap-4 bg-blue-50 p-2 rounded-xl">
                            <div class="bg-primary text-white p-1 rounded-full flex items-center justify-center min-w-[24px]">
                                <span class="material-symbols-rounded text-xs">check</span>
                            </div>
                            <p class="text-xs font-medium">${k}</p>
                        </div>
                    `).join('')}
                </div>
            </section>
            ` : ''}

            <!-- 6. FOTOS -->
            ${data.fotos.length > 0 ? `
            <section class="space-y-4 break-before-page">
                <div class="flex items-center gap-3">
                    <div class="w-1 h-6 bg-primary rounded-full"></div>
                    <h4 class="text-sm font-bold uppercase text-primary tracking-wide">6. Anexo Fotográfico</h4>
                </div>
                <div class="grid gap-6">
                    ${data.fotos.map((foto, idx) => `
                        <div class="group relative bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-xl" style="page-break-inside: avoid;">
                            <div class="aspect-[4/3] w-full bg-slate-200">
                                <img src="${foto.data}" class="w-full h-full object-cover"/>
                            </div>
                            <div class="p-3 bg-white flex justify-between items-center">
                                <span class="text-[10px] uppercase font-bold text-slate-400">Foto ${String(idx + 1).padStart(2, '0')}</span>
                                ${foto.legenda ? `<span class="text-[9px] font-mono text-slate-500 truncate max-w-[200px]">${foto.legenda}</span>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </section>
            ` : ''}

            <!-- SIGNATURES -->
            <section class="py-12 flex flex-col items-center space-y-6 border-t border-slate-200 mt-12" style="page-break-inside: avoid;">
                <div class="flex justify-center gap-12 w-full">
                    <!-- Agente -->
                    <div class="flex flex-col items-center">
                        <div class="mb-4 h-20 flex items-end">
                            ${data.assinaturaAgente ? `<img src="${data.assinaturaAgente}" class="h-20 w-auto opacity-90"/>` : '<div class="h-px w-40 bg-slate-400"></div>'}
                        </div>
                        <div class="w-48 h-px bg-slate-300 mb-2"></div>
                        <h5 class="text-sm font-bold text-primary uppercase">${data.agente}</h5>
                        <p class="text-[10px] uppercase font-medium text-slate-500">Agente de Defesa Civil</p>
                        <p class="text-[9px] text-slate-400">Matrícula: ${data.matricula}</p>
                    </div>

                    <!-- Apoio (if exists) -->
                    ${data.apoio && data.apoio.assinatura ? `
                    <div class="flex flex-col items-center">
                        <div class="mb-4 h-20 flex items-end">
                            <img src="${data.apoio.assinatura}" class="h-20 w-auto opacity-90"/>
                        </div>
                        <div class="w-48 h-px bg-slate-300 mb-2"></div>
                        <h5 class="text-sm font-bold text-primary uppercase">${data.apoio.nome}</h5>
                        <p class="text-[10px] uppercase font-medium text-slate-500">Apoio Técnico</p>
                        <p class="text-[9px] text-slate-400">CREA: ${data.apoio.crea}</p>
                    </div>
                    ` : ''}
                </div>

                <div class="text-center px-8">
                    <p class="text-[9px] uppercase tracking-tighter text-slate-400 leading-normal">
                        Documento oficial gerado em ${data.emissao} pelo sistema de gerenciamento de riscos e desastres da defesa civil.
                    </p>
                </div>
            </section>
        </div>
    </body>
    </html>
    `;

    // 3. Mount and Render
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = '840px'; // Keep fixed width for consistency
    container.innerHTML = htmlContent;
    document.body.appendChild(container);

    // Inject Tailwind Script & Config - SEQ FIX
    await new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = "https://cdn.tailwindcss.com?plugins=forms,typography";
        script.onload = () => {
            // Configure Tailwind after load
            // @ts-ignore
            window.tailwind.config = {
                darkMode: "class",
                theme: {
                    extend: {
                        colors: {
                            primary: "#1e3a8a",
                            "background-light": "#f8fafc",
                            "background-dark": "#0f172a",
                        },
                        fontFamily: {
                            display: ["Inter", "sans-serif"],
                            serif: ["Libre+Baskerville", "serif"],
                        },
                        borderRadius: {
                            DEFAULT: "12px",
                        },
                    },
                },
            };
            console.log("PDF Generator: Tailwind loaded and configured");
            resolve();
        };
        script.onerror = () => {
            console.error("PDF Generator: Failed to load Tailwind CDN");
            resolve(); // Verify fallback or fail
        };
        container.appendChild(script);
    });

    // Extra wait for fonts and rendering
    await new Promise(resolve => setTimeout(resolve, 2500));

    try {
        const canvas = await html2canvas(container.querySelector('#pdf-wrapper') || container, {
            scale: 2, // High resolution
            useCORS: true,
            logging: false,
            windowWidth: 840,
            backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        const pageHeight = pdf.internal.pageSize.getHeight();

        // Multi-page splitting logic
        let heightLeft = pdfHeight;
        let position = 0;
        let page = 0;

        while (heightLeft > 0) {
            position = Math.min(0, position); // Top of page
            pdf.addImage(imgData, 'JPEG', 0, position - (page * pageHeight), pdfWidth, pdfHeight);

            heightLeft -= pageHeight;
            page++;
            if (heightLeft > 0) {
                pdf.addPage();
            }
        }

        // Save
        const filename = `Relatorio_Vistoria_${data.id.replace(/[^a-z0-9]/gi, '_')}.pdf`;

        // Mobile share or download
        const blob = pdf.output('blob');
        const file = new File([blob], filename, { type: 'application/pdf' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
                files: [file],
                title: 'Relatório de Vistoria',
                text: `Segue laudo técnico ${data.id}`
            });
        } else {
            pdf.save(filename);
        }

    } catch (error) {
        console.error("PDF Generation Critical Error:", error);
        console.error("Stack:", error.stack);
        alert(`Erro detalhado: ${error.message}`);
    } finally {
        if (document.body.contains(container)) {
            document.body.removeChild(container);
        }
    }
};
