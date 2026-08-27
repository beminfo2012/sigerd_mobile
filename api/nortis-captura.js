import { nortisCrawlerService } from '../src/services/nortisCrawlerService';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const fontes = await nortisCrawlerService.getFontes();
    const fontesAtivas = fontes.filter(f => f.ativo);

    const resultados = [];
    for (const fonte of fontesAtivas) {
      try {
        const resCaptura = await nortisCrawlerService.executarCapturaFonte(fonte.id);
        resultados.push({ fonte: fonte.nome, status: 'SUCESSO', ...resCaptura });
      } catch (err) {
        resultados.push({ fonte: fonte.nome, status: 'FALHA', erro: err.message });
      }
    }

    return res.status(200).json({
      mensagem: 'Varredura de captura inteligente finalizada com sucesso',
      fontesProcessadas: resultados.length,
      detalhes: resultados
    });
  } catch (error) {
    console.error('Erro na rota de captura:', error);
    return res.status(500).json({ error: 'Falha ao executar rotina de captura', detalhe: error.message });
  }
}
