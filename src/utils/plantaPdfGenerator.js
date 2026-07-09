import { jsPDF } from 'jspdf';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

/**
 * Converte hex para rgba
 */
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Gera o PDF mesclando a planta renderizada com as anotações geométricas e cria página de legenda.
 */
export async function gerarEImprimirPlanta(pdfUrl, shapes, catalogo) {
  const loadingTask = pdfjsLib.getDocument({ url: pdfUrl });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4'
  });

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    
    // Usar a mesma escala 2.0 do editor para garantir que as coordenadas batem perfeitamente
    const scale = 2.0;
    const viewport = page.getViewport({ scale });
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    // 1. Renderiza o PDF no canvas
    await page.render({ canvasContext: ctx, viewport }).promise;

    // 2. Filtra as anotações dessa página e desenha por cima
    const pageShapes = shapes.filter(s => Number(s.page || 1) === Number(pageNum));
    
    for (const shape of pageShapes) {
      if (!shape.points || shape.points.length < 3) continue;
      
      // Desenhar Polígono (Preenchimento)
      ctx.fillStyle = hexToRgba(shape.color, 0.4);
      ctx.strokeStyle = shape.color;
      ctx.lineWidth = 3;
      
      ctx.beginPath();
      ctx.moveTo(shape.points[0].x, shape.points[0].y);
      for (let i = 1; i < shape.points.length; i++) {
        ctx.lineTo(shape.points[i].x, shape.points[i].y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Desenhar Rótulo (Badge)
      // Calcular centro do polígono
      const minX = Math.min(...shape.points.map(p => p.x));
      const maxX = Math.max(...shape.points.map(p => p.x));
      const minY = Math.min(...shape.points.map(p => p.y));
      const maxY = Math.max(...shape.points.map(p => p.y));
      const centerX = minX + (maxX - minX) / 2;
      const centerY = minY + (maxY - minY) / 2;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      const text = shape.label.toUpperCase();
      ctx.font = 'bold 12px Arial';
      const textWidth = ctx.measureText(text).width;
      
      // Fundo do texto
      ctx.fillRect(centerX - textWidth/2 - 6, centerY - 10, textWidth + 12, 20);
      
      // Texto
      ctx.fillStyle = '#1e293b';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, centerX, centerY);
    }

    // 3. Adicionar o Canvas como Imagem no jsPDF
    const imgData = canvas.toDataURL('image/jpeg', 0.8);
    
    // O jsPDF A4 landscape tem tamanho: 841.89 x 595.28 pt
    // Calcular escala para caber na página A4 preservando proporção
    const a4Width = 841.89;
    const a4Height = 595.28;
    const ratio = Math.min(a4Width / canvas.width, a4Height / canvas.height);
    const renderWidth = canvas.width * ratio;
    const renderHeight = canvas.height * ratio;
    const xPos = (a4Width - renderWidth) / 2;
    const yPos = (a4Height - renderHeight) / 2;

    if (pageNum > 1) {
      pdf.addPage();
    }
    
    pdf.addImage(imgData, 'JPEG', xPos, yPos, renderWidth, renderHeight);
  }

  // 4. Criar página de Legenda
  pdf.addPage();
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(24);
  pdf.setTextColor(30, 41, 59);
  pdf.text('LEGENDA DA PLANTA BAIXA', 40, 60);

  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Mapeamento das áreas da doutrina estabelecidas:', 40, 90);

  // Extrair categorias únicas utilizadas
  const usedCategoryIds = [...new Set(shapes.map(s => s.categoryId))];
  let yOffset = 130;

  for (const catId of usedCategoryIds) {
    const cat = catalogo.find(c => c.id === catId);
    if (!cat) continue;
    
    // Pega a cor usada por alguma shape dessa categoria
    const shapeOfCat = shapes.find(s => s.categoryId === catId);
    const color = shapeOfCat ? shapeOfCat.color : '#000000';

    // Quadrado de cor
    pdf.setFillColor(color);
    pdf.rect(40, yOffset - 12, 16, 16, 'F');
    
    // Nome da categoria
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(30, 41, 59);
    pdf.text(cat.nome, 65, yOffset);
    
    // Descrição
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(100, 116, 139);
    const desc = pdf.splitTextToSize(cat.descricao_funcao || '', 700);
    pdf.text(desc, 65, yOffset + 15);

    yOffset += 40 + (desc.length - 1) * 12;
    
    // Se a página encher, criar nova
    if (yOffset > 500) {
      pdf.addPage();
      yOffset = 60;
    }
  }

  // 5. Abrir em nova aba
  const pdfBlobUrl = pdf.output('bloburl');
  window.open(pdfBlobUrl, '_blank');
}
