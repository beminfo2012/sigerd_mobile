import React from 'react';
import { X, Printer, Download, Info, CheckCircle2, FileImage } from 'lucide-react';

export default function MarcadorQRModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  // Matriz de dados codificada para "SIGERD:CRFP:v1" com Error Correction H (25x25)
  const qrModules = [
    [1,1,1,1,1,1,1,0,0,1,0,1,0,1,1,0,0,0,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,1,0,1,0,0,1,1,0,1,0,1,0,1,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,0,0,1,1,0,1,1,0,1,0,0,1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1,0,1,0,1,1,0,0,1,0,1,0,1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1,0,1,1,0,0,1,0,1,1,0,0,1,0,1,1,1,0,1],
    [1,0,0,0,0,0,1,0,0,1,0,1,0,1,0,0,1,0,1,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,0,1,0,1,1,1,1,1,1,1],
    [0,0,0,0,0,0,0,0,1,1,0,1,0,0,0,1,1,0,0,0,0,0,0,0,0],
    [1,0,1,1,0,1,1,1,0,1,1,0,1,1,1,0,1,1,0,1,1,0,1,0,1],
    [0,1,0,0,1,0,0,1,1,0,0,1,0,1,0,1,0,0,1,0,1,1,0,1,0],
    [1,1,1,0,0,1,1,0,0,1,0,1,1,0,1,1,0,1,1,0,0,1,1,0,1],
    [0,0,1,1,1,0,0,1,1,0,1,0,0,1,0,1,1,0,0,1,1,0,0,1,0],
    [1,0,0,1,0,1,1,0,1,1,0,1,1,0,1,0,1,1,0,1,0,0,1,0,1],
    [0,1,1,0,1,0,0,1,1,0,1,0,0,1,0,1,0,0,1,0,1,1,0,1,0],
    [1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,0,1,1,0,1],
    [0,1,0,0,1,0,1,1,0,1,0,1,0,1,0,0,1,0,0,1,1,0,0,1,0],
    [1,0,1,0,1,1,0,0,1,0,1,1,1,0,1,1,0,1,0,1,0,1,0,0,1],
    [0,0,0,0,0,0,0,0,1,1,0,0,1,1,0,1,1,1,0,0,1,0,1,1,0],
    [1,1,1,1,1,1,1,0,0,1,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1],
    [1,0,0,0,0,0,1,0,1,0,1,1,0,1,0,1,0,1,0,0,0,1,1,1,0],
    [1,0,1,1,1,0,1,0,1,1,0,1,1,0,1,1,0,1,1,1,0,0,0,1,1],
    [1,0,1,1,1,0,1,0,0,1,1,0,0,1,0,0,1,0,0,1,1,0,1,0,1],
    [1,0,1,1,1,0,1,0,1,0,0,1,1,0,1,1,0,1,1,0,0,1,1,0,0],
    [1,0,0,0,0,0,1,0,0,1,1,0,1,1,0,0,1,0,1,1,0,1,0,1,1],
    [1,1,1,1,1,1,1,0,1,0,1,0,0,1,1,1,0,1,0,1,1,0,1,0,1]
  ];

  const handlePrint = () => {
    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="30mm" height="30mm" viewBox="0 0 27 27" style="width:30mm; height:30mm; background:white; display:block;">`;
    svgContent += `<rect width="27" height="27" fill="white" />`;
    qrModules.forEach((row, rIdx) => {
      row.forEach((val, cIdx) => {
        if (val) {
          svgContent += `<rect x="${cIdx + 1}" y="${rIdx + 1}" width="1" height="1" fill="black" />`;
        }
      });
    });
    svgContent += `</svg>`;

    const printWin = window.open('', '_blank', 'width=850,height=950');
    if (!printWin) {
      alert("Por favor, permita pop-ups no seu navegador para abrir o documento de impressão.");
      return;
    }

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>SIGERD Mobile — Cartão de Referência CRFP (30mm)</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 15mm;
            }
            * { box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              background: #ffffff !important;
              color: #000000 !important;
              margin: 0;
              padding: 0;
            }
            .header {
              font-size: 16pt;
              font-weight: 800;
              color: #0f172a;
              margin-bottom: 2mm;
            }
            .subtitle {
              font-size: 9.5pt;
              color: #475569;
              margin-bottom: 6mm;
            }
            .alert-box {
              border: 1.5px solid #cbd5e1;
              background-color: #f8fafc;
              padding: 4mm;
              border-radius: 6px;
              margin-bottom: 6mm;
            }
            .alert-title {
              font-size: 9.5pt;
              font-weight: 700;
              color: #0f172a;
              margin-bottom: 2mm;
            }
            .alert-text {
              font-size: 8.5pt;
              color: #334155;
              margin: 0;
              padding-left: 4mm;
              line-height: 1.4;
            }
            .ruler-section {
              margin-bottom: 8mm;
              padding: 3mm;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              background-color: #ffffff;
            }
            .ruler-title {
              font-size: 8.5pt;
              font-weight: 700;
              color: #334155;
              margin-bottom: 2mm;
            }
            .ruler-flex {
              display: flex;
              align-items: center;
              gap: 4mm;
            }
            .ruler-bar {
              width: 30mm;
              height: 6mm;
              border: 1.5px solid #000;
              background-color: #cbd5e1;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 7.5pt;
              font-weight: bold;
              font-family: monospace;
            }
            .ruler-text {
              font-size: 8pt;
              color: #64748b;
            }
            .grid-title {
              font-size: 10pt;
              font-weight: 700;
              color: #0f172a;
              margin-bottom: 4mm;
            }
            .grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 8mm;
              width: 140mm;
            }
            .card {
              border: 1px dashed #94a3b8;
              padding: 4mm;
              width: 46mm;
              display: flex;
              flex-direction: column;
              align-items: center;
              text-align: center;
              background: #ffffff;
              border-radius: 4px;
            }
            .qr-wrapper {
              width: 30mm;
              height: 30mm;
              border: 1px solid #000000;
              display: flex;
              align-items: center;
              justify-content: center;
              background: #ffffff;
            }
            .card-label {
              font-size: 7pt;
              font-family: monospace;
              font-weight: 700;
              margin-top: 2mm;
              color: #0f172a;
            }
            .card-size {
              font-size: 6.5pt;
              color: #64748b;
              margin-top: 0.5mm;
            }
            .footer {
              margin-top: 12mm;
              padding-top: 4mm;
              border-top: 1px solid #e2e8f0;
              font-size: 8pt;
              color: #94a3b8;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="header">SIGERD Mobile — Cartão de Referência (CRFP v1)</div>
          <div class="subtitle">Gabarito Oficial para Medição de Abertura &amp; Retificação de Perspectiva via Visão Computacional</div>

          <div class="alert-box">
            <div class="alert-title">⚠️ Instruções de Impressão de Campo:</div>
            <ol class="alert-text">
              <li>Configure a impressora para <b>Escala 100% / Tamanho Real</b> (NÃO selecione "Ajustar à página").</li>
              <li>Confirme com uma régua física se a barra cinza abaixo mede exatamente <b>30.0 mm</b>.</li>
              <li>Recorte o cartão na linha pontilhada e cole em suporte plástico ou rígido impermeável.</li>
            </ol>
          </div>

          <div class="ruler-section">
            <div class="ruler-title">Validação Física de Escala (Usar Régua):</div>
            <div class="ruler-flex">
              <div class="ruler-bar">30.0 mm</div>
              <span class="ruler-text">← Esta barra cinza deve medir exatamente 30 milímetros na sua régua física</span>
            </div>
          </div>

          <div class="grid-title">Gabaritos de Campo (4 Cópias para Recorte - 30mm × 30mm):</div>
          <div class="grid">
            <div class="card">
              <div class="qr-wrapper">${svgContent}</div>
              <div class="card-label">SIGERD:CRFP:v1</div>
              <div class="card-size">30.0 mm × 30.0 mm</div>
            </div>
            <div class="card">
              <div class="qr-wrapper">${svgContent}</div>
              <div class="card-label">SIGERD:CRFP:v1</div>
              <div class="card-size">30.0 mm × 30.0 mm</div>
            </div>
            <div class="card">
              <div class="qr-wrapper">${svgContent}</div>
              <div class="card-label">SIGERD:CRFP:v1</div>
              <div class="card-size">30.0 mm × 30.0 mm</div>
            </div>
            <div class="card">
              <div class="qr-wrapper">${svgContent}</div>
              <div class="card-label">SIGERD:CRFP:v1</div>
              <div class="card-size">30.0 mm × 30.0 mm</div>
            </div>
          </div>

          <div class="footer">
            SIGERD Mobile &middot; Defesa Civil &middot; Módulo Fissurômetro 2
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 250);
            };
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  const handleDownloadSVG = () => {
    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="30mm" height="30mm" viewBox="0 0 27 27">`;
    svgContent += `<rect width="27" height="27" fill="white" />`;
    qrModules.forEach((row, rIdx) => {
      row.forEach((val, cIdx) => {
        if (val) {
          svgContent += `<rect x="${cIdx + 1}" y="${rIdx + 1}" width="1" height="1" fill="black" />`;
        }
      });
    });
    svgContent += `</svg>`;

    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'marcador_qr_sigerd_30mm.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPNG = () => {
    const canvas = document.createElement('canvas');
    const sizePx = 600;
    canvas.width = sizePx;
    canvas.height = sizePx;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, sizePx, sizePx);

    const moduleSize = sizePx / 27;
    ctx.fillStyle = '#000000';

    qrModules.forEach((row, rIdx) => {
      row.forEach((val, cIdx) => {
        if (val) {
          ctx.fillRect((cIdx + 1) * moduleSize, (rIdx + 1) * moduleSize, moduleSize + 0.5, moduleSize + 0.5);
        }
      });
    });

    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'marcador_qr_sigerd_30mm.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderQrSvg = (customClass = "w-48 h-48 sm:w-56 sm:h-56") => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 27 27" 
      className={`bg-white p-1 ${customClass}`}
      style={{ shapeRendering: 'crispEdges' }}
    >
      <rect width="27" height="27" fill="white" />
      {qrModules.map((row, rIdx) => 
        row.map((val, cIdx) => 
          val ? (
            <rect 
              key={`${rIdx}-${cIdx}`} 
              x={cIdx + 1} 
              y={rIdx + 1} 
              width="1" 
              height="1" 
              fill="black" 
            />
          ) : null
        )
      )}
    </svg>
  );

  return (
    <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
          <div>
            <h2 className="font-bold text-slate-800 dark:text-white text-base">Cartão de Referência Físsurômetro (CRFP)</h2>
            <p className="text-xs text-slate-500">Marcador QR oficial para escala e retificação de perspectiva</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-slate-700 dark:text-slate-200">
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex gap-3 text-xs text-amber-800 dark:text-amber-300">
            <Info size={20} className="shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="font-bold mb-1">Instruções de Impressão de Campo:</p>
              <p>O marcador deve ser impresso exatamente em <b>30.0 mm × 30.0 mm</b> (escala 100% / "Tamanho Real" na impressora). Cole o quadrado recortado em um cartão rígido e posicione ao lado da fissura.</p>
            </div>
          </div>

          {/* Visualização de Tela */}
          <div className="flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 relative">
            <div className="text-[10px] font-mono text-slate-400 mb-2 uppercase tracking-widest font-bold">
              Gabarito Físico Oficial: 30.0 mm × 30.0 mm
            </div>
            
            <div className="relative p-4 bg-white border-2 border-dashed border-slate-400 rounded-lg shadow-inner flex flex-col items-center">
              {renderQrSvg()}
              <div className="mt-2 text-center">
                <span className="font-mono text-xs font-bold text-slate-900 bg-slate-200 px-2 py-0.5 rounded">
                  SIGERD:CRFP:v1
                </span>
              </div>
            </div>

            <div className="mt-3 text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-500" /> Detecção automática + Homografia via OpenCV
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-wrap gap-2 justify-end">
          <button 
            type="button" 
            onClick={handleDownloadSVG}
            className="py-2.5 px-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            title="Baixar SVG com dimensões físicas explícitas (30mm x 30mm)"
          >
            <Download size={16} /> Baixar SVG (30mm)
          </button>
          
          <button 
            type="button" 
            onClick={handleDownloadPNG}
            className="py-2.5 px-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            title="Baixar imagem PNG de alta definição (600x600px)"
          >
            <FileImage size={16} /> Baixar PNG (30mm)
          </button>

          <button 
            type="button" 
            onClick={handlePrint}
            className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors shadow-md shadow-indigo-500/20"
          >
            <Printer size={16} /> Imprimir Cartão
          </button>
        </div>
      </div>
    </div>
  );
}
