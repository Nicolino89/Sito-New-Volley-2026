/**
 * FIPAV Romagna Proxy Worker
 * 
 * Cloudflare Worker che funge da proxy per fipavromagna.it.
 * Supera la protezione ASP.NET session perché gira lato server (non browser).
 * 
 * Deploy: npx wrangler deploy
 * URL risultante: https://fipav-proxy.NVA_USERNAME.workers.dev
 */

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders()
      });
    }

    // Only allow GET requests
    if (request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders() });
    }

    // Expect: ?url=https://www.fipavromagna.it/...
    const targetUrl = url.searchParams.get('url');

    if (!targetUrl) {
      return new Response(
        JSON.stringify({ error: 'Parametro "url" mancante nella query string.' }),
        { status: 400, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
      );
    }

    // Whitelist: only allow FIPAV and related portals
    const allowedDomains = [
      'fipavromagna.it',
      'fipav-er.it',
      'fipavonline.it',
      'portalefipav.net',
      'csiromagna.it',
      'csisport.it',
      'uisp.it'
    ];

    const targetDomain = new URL(targetUrl).hostname.toLowerCase();
    const isAllowed = allowedDomains.some(d => targetDomain === d || targetDomain.endsWith('.' + d));

    if (!isAllowed) {
      return new Response(
        JSON.stringify({ error: `Dominio non consentito: ${targetDomain}. Solo portali FIPAV/CSI/UISP sono supportati.` }),
        { status: 403, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
      );
    }

    // Fetch the FIPAV page server-side with full browser headers
    try {
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'it-IT,it;q=0.9,en;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Referer': 'https://www.fipavromagna.it/',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'same-origin',
          'Upgrade-Insecure-Requests': '1'
        },
        redirect: 'follow'
      });

      if (!response.ok) {
        return new Response(
          JSON.stringify({ 
            error: `Errore dal server FIPAV: HTTP ${response.status}`,
            status: response.status
          }),
          { status: 502, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
        );
      }

      const html = await response.text();

      // Validate that we got meaningful content
      if (!html || html.length < 500) {
        return new Response(
          JSON.stringify({ error: 'Risposta FIPAV vuota o troppo breve.' }),
          { status: 502, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
        );
      }

      // Return HTML with CORS headers
      return new Response(html, {
        status: 200,
        headers: {
          ...corsHeaders(),
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=300' // Cache 5 minutes
        }
      });

    } catch (err: any) {
      return new Response(
        JSON.stringify({ error: `Errore durante la fetch: ${err.message}` }),
        { status: 500, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
      );
    }
  }
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
  };
}
