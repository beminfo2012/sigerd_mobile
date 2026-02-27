export default async function handler(request, response) {
    try {
        const targetUrl = 'https://alerta.es.gov.br/boletim-meteorologico';
        const res = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            }
        });

        if (!res.ok) {
            return response.status(200).json({ boletins: [] });
        }

        const html = await res.text();
        const boletins = [];
        const seenLinks = new Set();

        // Regex para encontrar as tags <a href="...">...</a>
        const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
        let match;

        while ((match = linkRegex.exec(html)) !== null) {
            let link = match[1];
            let name = match[2]
                .replace(/<[^>]*>?/gm, '') // Remove tags HTML internas (ex: <span>)
                .replace(/\s+/g, ' ')      // Remove quebras de linha e excesso de espaços
                .trim();

            if (link.toLowerCase().includes('.pdf')) {
                if (!link.startsWith('http')) {
                    if (link.startsWith('/')) {
                        link = 'https://alerta.es.gov.br' + link;
                    } else {
                        link = 'https://alerta.es.gov.br/' + link;
                    }
                }

                if (name.toLowerCase() === 'baixar' || !name) {
                    continue;
                }

                if (!seenLinks.has(link)) {
                    seenLinks.add(link);
                    boletins.push({
                        titulo: name,
                        url_pdf: link
                    });
                }
            }
        }

        // Cache na borda do servidor Vercel para não ficar batendo no site toda hora
        response.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=1800');
        response.setHeader('Access-Control-Allow-Credentials', true);
        response.setHeader('Access-Control-Allow-Origin', '*');

        // Aplica o limite se houver
        const limiteStr = request.query?.limite || 10;
        const limite = parseInt(limiteStr, 10);
        if (!isNaN(limite) && limite > 0) {
            boletins.splice(limite);
        }

        response.status(200).json({
            fonte: targetUrl,
            total_encontrado: boletins.length,
            boletins: boletins
        });

    } catch (err) {
        console.error('API Error:', err);
        response.status(200).json({ boletins: [] });
    }
}
