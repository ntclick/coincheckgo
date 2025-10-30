import type { VercelRequest, VercelResponse } from '@vercel/node';

// Simple CoinGecko proxy to bypass CORS and attach API key headers
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const apiBase = 'https://api.coingecko.com/api/v3';
    // Rebuild target URL by stripping the /api/cg prefix
    const originalUrl = req.url || '/';
    const prefix = '/api/cg';
    const pathWithQuery = originalUrl.startsWith(prefix)
      ? originalUrl.substring(prefix.length) || '/'
      : originalUrl;

    const targetUrl = apiBase + pathWithQuery;

    const headers: Record<string, string> = {
      'accept': 'application/json'
    };
    const apiKey = process.env.REACT_APP_COINCHECKGO_API_KEY || process.env.CG_API_KEY || '';
    if (apiKey) headers['x-cg-demo-api-key'] = apiKey;

    // Forward method, headers (limited) and body when present
    const init: RequestInit = {
      method: req.method,
      headers,
    };
    if (req.method && req.method !== 'GET' && req.method !== 'HEAD') {
      // Vercel provides body already parsed; re-stringify if object
      const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
      (init as any).body = body;
      headers['content-type'] = headers['content-type'] || 'application/json';
    }

    const resp = await fetch(targetUrl, init);
    const text = await resp.text();

    // Pass through status and set CORS/cache headers
    res.status(resp.status);
    res.setHeader('Content-Type', resp.headers.get('content-type') || 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    res.send(text);
  } catch (error: any) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(500).json({ error: 'CoinGecko proxy failed', message: error?.message || String(error) });
  }
}


