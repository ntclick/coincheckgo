// Simple 60s in-memory cache (per lambda instance)
const memoryCache = new Map<string, { body: string; status: number; contentType: string; ts: number }>();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

// Simple CoinGecko proxy to bypass CORS and attach API key headers
// Handles all /api/cg/* paths
export default async function handler(req: any, res: any) {
  try {
    const apiBase = 'https://api.coingecko.com/api/v3';
    
    // Extract path from req.url or req.query
    // With rewrite rule: req.url = '/api/cg?path=coins/markets&vs_currency=usd&...'
    // Without rewrite: req.url = '/api/cg/coins/markets?vs_currency=usd&...'
    let path = '';
    let query = '';
    
    // Check if path is in query params (from rewrite rule)
    if (req.query && req.query.path) {
      // Fallback: try to get from req.query.path (for dynamic routes)
      const pathParam = req.query.path;
      const pathArray = Array.isArray(pathParam) ? pathParam : (pathParam ? [pathParam] : []);
      path = '/' + pathArray.join('/');
      
      // Get query string from req.query
      const queryParams = new URLSearchParams();
      for (const [key, value] of Object.entries(req.query)) {
        if (key !== 'path' && value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            value.forEach(v => {
              if (v !== undefined && v !== null && v !== '') {
                queryParams.append(key, String(v));
              }
            });
          } else {
            queryParams.append(key, String(value));
          }
        }
      }
      const queryString = queryParams.toString();
      if (queryString) {
        query = '?' + queryString;
      }
    } else if (req.url) {
      // Extract from req.url directly
      // Remove /api/cg prefix
      const urlWithoutPrefix = req.url.replace(/^\/api\/cg\/?/, '');
      const [pathPart, queryPart] = urlWithoutPrefix.split('?');
      path = pathPart || '';
      query = queryPart ? '?' + queryPart : '';
    }
    
    // Ensure path starts with /
    if (path && !path.startsWith('/')) {
      path = '/' + path;
    }
    
    const targetPath = path + query;
    const targetUrl = apiBase + targetPath;

    // Debug logging
    console.log('[CG Proxy] Request received:', {
      method: req.method,
      url: req.url,
      query: req.query,
      path,
      queryString: query,
      targetUrl
    });

    // Cache key includes method + URL
    const cacheKey = `${req.method || 'GET'} ${targetUrl}`;
    const cached = memoryCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      res.status(cached.status);
      res.setHeader('Content-Type', cached.contentType || 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
      return res.send(cached.body);
    }

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
    // Save to in-memory cache
    memoryCache.set(cacheKey, {
      body: text,
      status: resp.status,
      contentType: resp.headers.get('content-type') || 'application/json',
      ts: Date.now()
    });
    res.send(text);
  } catch (error: any) {
    console.error('[CG Proxy] Error:', error);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(500).json({ error: 'CoinGecko proxy failed', message: error?.message || String(error) });
  }
}

