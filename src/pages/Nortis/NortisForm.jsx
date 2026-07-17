import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, UploadCloud, FileText, CheckCircle, Trash2, DownloadCloud } from 'lucide-react';
import { nortisService } from '../../services/nortisService';
import { toast } from '../../components/ToastNotification';
import { supabase } from '../../services/supabase';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Configuração do Worker do PDF.js via pacote local (Vite cuidará disso)
if (typeof window !== 'undefined' && 'Worker' in window) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
}

export default function NortisForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const userProfile = JSON.parse(localStorage.getItem('userProfile'));
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [extractingPdf, setExtractingPdf] = useState(false);
  const [file, setFile] = useState(null);

  const [formData, setFormData] = useState({
    tipo: 'lei',
    numero: '',
    ano: new Date().getFullYear(),
    ambito: 'municipal',
    orgao_emissor: '',
    ementa: '',
    texto_integral: '',
    situacao: 'vigente',
    url_fonte_oficial: '',
    data_publicacao: ''
  });

  useEffect(() => {
    if (id) {
      loadNorma(id);
    }
  }, [id]);

  const loadNorma = async (normaId) => {
    try {
      setLoading(true);
      const data = await nortisService.getById(normaId);
      if (data) {
        setFormData({
          ...data,
          ano: data.ano || '',
          data_publicacao: data.data_publicacao ? data.data_publicacao.split('T')[0] : ''
        });
      }
    } catch (error) {
      toast.error('Erro', 'Falha ao carregar documento.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      if (selectedFile.type === 'application/pdf') {
        try {
          setExtractingPdf(true);
          toast.info('Aguarde', 'Lendo PDF e tentando extrair dados...');
          
          const arrayBuffer = await selectedFile.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          let fullText = "";
          
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            let lastY = -1;
            let pageText = "";
            for (let item of textContent.items) {
              const currentY = item.transform[5];
              // Diferenças muito grandes (ex: troca de página ou bloco muito distante) recebem quebra.
              // Diferenças normais de linha recebem apenas espaço.
              if (lastY !== -1 && Math.abs(currentY - lastY) > 30) {
                 pageText += "\n\n";
              } else if (lastY !== -1) {
                 pageText += " "; 
              }
              pageText += item.str.trim();
              lastY = currentY;
            }
            fullText += pageText + " ";
          }
          
          // Heurísticas de Extração
          let extractedNum = "";
          let extractedAno = "";
          let extractedEmenta = "";
          let extractedOrgao = "Prefeitura Municipal";
          let extractedDataPub = "";
          
          const matchLei = fullText.match(/(?:LEI|DECRETO|PORTARIA).*?(?:Nº|N|nº|n\.º)\s*([\d.]+).*?(?:DE|de)\s*(\d+).*?(?:DE|de)\s*([A-Za-zÇç]+)\s*(?:DE|de)\s*(\d{4})/i);
          if (matchLei) {
              extractedNum = matchLei[1].replace(/\.$/, ''); 
              const day = matchLei[2].padStart(2, '0');
              const monthName = matchLei[3].toUpperCase();
              extractedAno = matchLei[4];
              
              const meses = {
                  'JANEIRO': '01', 'FEVEREIRO': '02', 'MARÇO': '03', 'MARCO': '03',
                  'ABRIL': '04', 'MAIO': '05', 'JUNHO': '06', 'JULHO': '07',
                  'AGOSTO': '08', 'SETEMBRO': '09', 'OUTUBRO': '10',
                  'NOVEMBRO': '11', 'DEZEMBRO': '12'
              };
              
              if (meses[monthName]) {
                  extractedDataPub = `${extractedAno}-${meses[monthName]}-${day}`;
              }
          }

          const matchDisp = fullText.match(/(DISPÕE SOBRE|INSTITUI|ALTERA|REGULAMENTA)[\s\S]*?(?=\n\n|O PREFEITO|A CÂMARA|Art\.)/i);
          if (matchDisp) {
              extractedEmenta = matchDisp[0].replace(/[\n\r]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
          }

          let extractedUrl = "";
          const matchUrl = fullText.match(/https?:\/\/[^\s]+/i);
          if (matchUrl) {
              extractedUrl = matchUrl[0].trim();
          }

          // Formatação cosmética do texto integral (recuos e quebras corretas baseadas na semântica)
          // 1. Removemos quebras espúrias e normalizamos espaços
          let formattedText = fullText.replace(/[\r\n]+/g, ' ').replace(/\s{2,}/g, ' '); 
          
          // 2. Inserimos quebras antes de marcadores jurídicos
          formattedText = formattedText
             .replace(/\s(Art\.\s+\d+º?)/gi, '\n\n$1')
             .replace(/\s(Parágrafo\s+único)/gi, '\n\n$1')
             .replace(/\s(§\s+\d+º?)/gi, '\n\n$1')
             .replace(/\s([IVXLCDM]+\s*-)/g, '\n\n$1')
             .replace(/\s([a-z]\))/g, '\n\n$1')
             .replace(/\s(CAPÍTULO|TÍTULO|SEÇÃO)\s+([IVXLCDM]+)/gi, '\n\n$1 $2\n')
             .replace(/\s(DISPÕE SOBRE|INSTITUI|ALTERA|REGULAMENTA)/i, '\n\n$1');

          setFormData(prev => ({
            ...prev,
            numero: prev.numero || extractedNum,
            ano: prev.ano || extractedAno,
            ementa: prev.ementa || extractedEmenta,
            orgao_emissor: prev.orgao_emissor || extractedOrgao,
            data_publicacao: prev.data_publicacao || extractedDataPub,
            url_fonte_oficial: prev.url_fonte_oficial || extractedUrl,
            texto_integral: formattedText.trim()
          }));
          
          toast.success('Pronto!', 'Texto e metadados extraídos do PDF com sucesso.');
        } catch (error) {
          console.error("Erro ao extrair PDF:", error);
          toast.warning('Aviso', 'Não foi possível extrair o texto perfeitamente. Você precisará revisar os campos.');
        } finally {
          setExtractingPdf(false);
        }
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.ementa || !formData.tipo || !formData.ambito) {
      toast.warning('Atenção', 'Preencha os campos obrigatórios.');
      return;
    }

    try {
      setSaving(true);
      
      const payload = {
        ...formData,
        tenant_id: userProfile?.municipio_id || '00000000-0000-0000-0000-000000000000',
        criado_por: userProfile?.id,
        // Ensure ano is a number or null
        ano: formData.ano ? parseInt(formData.ano) : null,
      };

      await nortisService.save(payload, file);
      
      toast.success('Sucesso', 'Documento salvo com sucesso.');
      navigate('/nortis/busca');
    } catch (error) {
      console.error(error);
      if (error.message && error.message.includes('nortis_arquivos')) {
          toast.error('Erro de Upload', 'O bucket nortis_arquivos não existe no Supabase. Crie-o primeiro.');
      } else {
          toast.error('Erro', 'Falha ao salvar documento. Verifique sua conexão.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Tem certeza que deseja excluir esta norma?')) return;
    try {
      setLoading(true);
      await nortisService.delete(id);
      toast.success('Sucesso', 'Documento excluído.');
      navigate('/nortis/busca');
    } catch (error) {
      toast.error('Erro', 'Falha ao excluir.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUrlData = async () => {
    if (!formData.url_fonte_oficial) {
      toast.warning('Atenção', 'Insira uma URL primeiro.');
      return;
    }
    try {
      setFetching(true);
      // Tentativa primária usando corsproxy.io para burlar CORS no frontend
      const response = await fetch(`https://corsproxy.io/?${encodeURIComponent(formData.url_fonte_oficial)}`);
      
      if (!response.ok) {
         throw new Error(`Proxy retornou status ${response.status}`);
      }

      // Planalto usa ISO-8859-1, precisamos decodificar corretamente para evitar caracteres ''
      let charset = 'utf-8';
      if (formData.url_fonte_oficial.includes('planalto.gov.br')) {
         charset = 'iso-8859-1';
      }
      
      const buffer = await response.arrayBuffer();
      const htmlText = new TextDecoder(charset).decode(buffer);

      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, 'text/html');
      
      let newTexto = '';
      if (doc.body) {
          // 1. Remover elementos não visíveis
          doc.querySelectorAll('script, style, link, meta, noscript').forEach(n => n.remove());

          // 2. Processar recuos (identação) baseados em CSS inline, comum no Planalto
          doc.querySelectorAll('*[style]').forEach(el => {
              const style = el.getAttribute('style').toLowerCase();
              if (style.includes('text-indent') || style.includes('margin-left') || style.includes('padding-left')) {
                  el.prepend(doc.createTextNode('__INDENT__')); // Usamos um token para não perdê-lo na limpeza de espaços
              }
          });

          // 3. Marcar textos revogados
          doc.querySelectorAll('strike, s').forEach(node => {
              const span = doc.createElement('span');
              span.innerText = ` [REVOGADO: ${node.textContent}] `;
              node.replaceWith(span);
          });

          // 4. Trabalhar com innerHTML usando tokens para preservar blocos estruturais
          let html = doc.body.innerHTML;
          
          // Marcações de fim de bloco (parágrafos reais) viram token
          html = html.replace(/<\/(p|div|h[1-6]|tr|li|ul|table)>/gi, ' __BLOCK__ ');
          
          // Quebras de linha explícitas (<br>) no Planalto quase sempre significam quebra de frase ruim, 
          // é melhor transformá-las em espaço para que frases como "Art. 1º <br> Esta Lei..." fiquem na mesma linha.
          html = html.replace(/<br\s*\/?>/gi, ' ');
          
          // 5. Limpar todas as tags restantes (deixando apenas texto cru + tokens)
          html = html.replace(/<[^>]+>/g, ' ');
          
          // 6. Decodificar entidades HTML (ex: &nbsp;)
          const textarea = document.createElement('textarea');
          textarea.innerHTML = html;
          let parsedText = textarea.value;

          // 7. Limpeza e Reconstrução
          // Colapsa todas as quebras de linha do código HTML (\n) e múltiplos espaços em 1 único espaço
          parsedText = parsedText.replace(/[\s\r\n]+/g, ' ');

          // Substitui os tokens pelos formatações reais
          parsedText = parsedText.replace(/__BLOCK__/g, '\n\n');
          parsedText = parsedText.replace(/__INDENT__/g, '    ');

          // Remove espaços sobrando ao redor das quebras de linha recém-criadas
          parsedText = parsedText.replace(/\n /g, '\n').replace(/ \n/g, '\n');
          
          // Reduz múltiplos blocos em excesso para apenas 2 (paragrafação padrão)
          newTexto = parsedText.replace(/\n{3,}/g, '\n\n').trim();
      }
      
      let newEmenta = '';
      let newNumero = formData.numero;
      let newAno = formData.ano;
      let newAmbito = formData.ambito;
      let newOrgao = formData.orgao_emissor;
      let newTipo = formData.tipo;

      // Heurísticas específicas para o site do Planalto (Leis e Decretos Federais)
      if (formData.url_fonte_oficial.includes('planalto.gov.br')) {
          newAmbito = 'federal';
          newOrgao = 'Presidência da República';
          
          // Ementa no planalto costuma ter cor #800000 ou classe específica
          const ementaNodes = doc.querySelectorAll('font[color="#800000"], p.ementa, p.Ementa');
          if (ementaNodes.length > 0) {
              newEmenta = Array.from(ementaNodes).map(n => n.innerText.trim()).join(' ');
          }

          // Extrair Ano da URL
          const urlParts = formData.url_fonte_oficial.split('/');
          const yearPart = urlParts.find(p => p.length === 4 && !isNaN(p));
          if (yearPart) newAno = parseInt(yearPart);

          // Extrair Número da URL (ex: l14133.htm -> 14.133)
          const matchLei = formData.url_fonte_oficial.match(/\/l(\d+)[a-z_]*\.htm/i);
          if (matchLei) {
              let numStr = matchLei[1];
              if (numStr.length >= 4) numStr = numStr.slice(0, -3) + '.' + numStr.slice(-3);
              if (numStr.length >= 8) numStr = numStr.slice(0, -7) + '.' + numStr.slice(-7);
              newNumero = numStr;
              newTipo = 'lei';
          }
          
          const matchDecreto = formData.url_fonte_oficial.match(/\/d(\d+)[a-z_]*\.htm/i);
          if (matchDecreto) {
              let numStr = matchDecreto[1];
              if (numStr.length >= 4) numStr = numStr.slice(0, -3) + '.' + numStr.slice(-3);
              newNumero = numStr;
              newTipo = 'decreto';
          }
      } else {
          // Fallback genérico para outros sites
          newEmenta = doc.title;
      }
      
      if (!newEmenta && !newTexto) {
           toast.error('Aviso', 'A página não possui dados extraíveis em HTML legível.');
           return;
      }

      setFormData(prev => ({
        ...prev,
        ementa: newEmenta || prev.ementa,
        texto_integral: newTexto || prev.texto_integral,
        numero: newNumero || prev.numero,
        ano: newAno || prev.ano,
        ambito: newAmbito || prev.ambito,
        orgao_emissor: newOrgao || prev.orgao_emissor,
        tipo: newTipo || prev.tipo
      }));
      
      toast.success('Sucesso', 'Dados extraídos do link! Verifique se os campos estão corretos.');
    } catch (error) {
      console.error('Erro na extração do link:', error);
      toast.warning('Bloqueio Anti-Bot', 'O site oficial bloqueou nossa leitura automática (muito comum no Planalto/Gov). Por favor, copie e cole o texto manualmente.');
    } finally {
      setFetching(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Carregando...</div>;
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white leading-tight">
              {id ? 'Editar Documento' : 'Novo Documento'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Módulo NORTIS
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {id && ['Admin', 'Coordenador', 'admin', 'Coordenador de Proteção e Defesa Civil'].includes(userProfile?.role) && (
            <button
              type="button"
              onClick={handleDelete}
              className="bg-red-100 hover:bg-red-200 text-red-600 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors"
            >
              <Trash2 size={18} />
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Save size={18} />}
            <span>{saving ? 'Salvando...' : 'Salvar'}</span>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        <form className="max-w-7xl mx-auto space-y-6" onSubmit={handleSubmit}>
          
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700 pb-2 mb-4">
              Identificação
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Tipo de Documento *</label>
                <select 
                  name="tipo" 
                  value={formData.tipo} 
                  onChange={handleChange}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-indigo-500 dark:focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                >
                  <option value="lei">Lei</option>
                  <option value="decreto">Decreto</option>
                  <option value="portaria">Portaria</option>
                  <option value="nbr">Norma Técnica (NBR)</option>
                  <option value="nota_tecnica">Nota Técnica</option>
                  <option value="sumula">Súmula</option>
                  <option value="acordao">Acórdão</option>
                  <option value="parecer">Parecer</option>
                  <option value="faq">FAQ</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Número</label>
                <input 
                  type="text" 
                  name="numero" 
                  value={formData.numero} 
                  onChange={handleChange}
                  placeholder="Ex: 6.766"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-indigo-500 dark:focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Ano</label>
                <input 
                  type="number" 
                  name="ano" 
                  value={formData.ano} 
                  onChange={handleChange}
                  placeholder="Ex: 1979"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-indigo-500 dark:focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Âmbito *</label>
                <select 
                  name="ambito" 
                  value={formData.ambito} 
                  onChange={handleChange}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-indigo-500 dark:focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                >
                  <option value="federal">Federal</option>
                  <option value="estadual">Estadual</option>
                  <option value="municipal">Municipal</option>
                  <option value="institucional">Institucional</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Órgão Emissor</label>
                <input 
                  type="text" 
                  name="orgao_emissor" 
                  value={formData.orgao_emissor} 
                  onChange={handleChange}
                  placeholder="Ex: Presidência da República"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-indigo-500 dark:focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700 pb-2 mb-4">
              Conteúdo
            </h2>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Ementa / Resumo *</label>
              <textarea 
                name="ementa" 
                value={formData.ementa} 
                onChange={handleChange}
                rows={3}
                placeholder="Ex: Dispõe sobre o Parcelamento do Solo Urbano e dá outras Providências."
                className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-indigo-500 dark:focus:border-indigo-500 text-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Texto Integral</label>
              <textarea 
                name="texto_integral" 
                value={formData.texto_integral} 
                onChange={handleChange}
                rows={8}
                placeholder="Cole o texto integral da lei ou norma aqui..."
                className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-indigo-500 dark:focus:border-indigo-500 text-slate-800 dark:text-slate-100 font-mono text-sm"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700 pb-2 mb-4">
              Controle e Fontes
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Situação *</label>
                <select 
                  name="situacao" 
                  value={formData.situacao} 
                  onChange={handleChange}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-indigo-500 dark:focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                >
                  <option value="vigente">Vigente</option>
                  <option value="revogada">Revogada</option>
                  <option value="alterada">Alterada</option>
                  <option value="em_analise">Em Análise</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Data de Publicação</label>
                <input 
                  type="date" 
                  name="data_publicacao" 
                  value={formData.data_publicacao} 
                  onChange={handleChange}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-indigo-500 dark:focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">URL Oficial</label>
              <div className="flex items-center gap-2">
                <input 
                  type="url" 
                  name="url_fonte_oficial" 
                  value={formData.url_fonte_oficial} 
                  onChange={handleChange}
                  placeholder="Ex: https://planalto.gov.br/..."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-indigo-500 dark:focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                />
                <button 
                  type="button"
                  onClick={fetchUrlData}
                  disabled={fetching}
                  className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 p-3 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors whitespace-nowrap disabled:opacity-50"
                >
                  {fetching ? <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div> : <DownloadCloud size={18} />}
                  <span className="hidden sm:inline">Puxar Dados</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Insira o link e clique em Puxar Dados para tentar preencher a ementa automaticamente.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Arquivo PDF Original</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors border border-dashed border-slate-300 dark:border-slate-600">
                  {extractingPdf ? (
                    <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <UploadCloud size={20} />
                  )}
                  <span className="text-sm font-bold">{extractingPdf ? 'Extraindo Texto...' : file ? 'Alterar Arquivo' : 'Selecionar PDF'}</span>
                  <input type="file" accept=".pdf" className="hidden" onChange={handleFileChange} disabled={extractingPdf} />
                </label>
                {file && (
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <CheckCircle size={16} className="text-green-500" />
                    <span className="truncate max-w-[200px]">{file.name}</span>
                  </div>
                )}
                {!file && formData.arquivo_pdf_path && (
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <FileText size={16} className="text-indigo-500" />
                    <span>Arquivo já anexado</span>
                  </div>
                )}
              </div>
            </div>

          </div>
        </form>
      </main>
    </div>
  );
}
