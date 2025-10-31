// Simple 60s in-memory cache (per lambda instance)
const memoryCache = new Map<string, { body: string; status: number; contentType: string; ts: number }>();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

// Simple CoinGecko proxy to bypass CORS and attach API key headers
// Vercel dynamic route: /api/cg/[...path] handles /api/cg/coins/markets, /api/cg/coins/bitcoin, etc.
export default async function handler(req: any, res: any) {
  try {
    const apiBase = 'https://api.coingecko.com/api/v3';
    
    // Get path from Vercel dynamic route - path is an array or string
    const path = req.query.path || [];
    const pathArray = Array.isArray(path) ? path : (path ? [path] : []);
    
    // Build path string - handle empty case
    let pathStr = '';
    if (pathArray.length > 0) {
      pathStr = '/' + pathArray.join('/');
    }
    
    // Get query string from req.query (Vercel parses query params for dynamic routes)
    // Priority: req.query > req.url (req.query is more reliable for dynamic routes)
    let query = '';
    if (req.query && Object.keys(req.query).length > 0) {
      // Build query string from req.query (exclude 'path' param which is the route param)
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
    } else if (req.url && req.url.includes('?')) {
      // Fallback to req.url if req.query is empty
      const urlParts = req.url.split('?');
      if (urlParts.length > 1) {
        query = '?' + urlParts.slice(1).join('?');
      }
    }
    
    const targetPath = pathStr + query;
    const targetUrl = apiBase + targetPath;
    
    // Debug logging
    console.log('[CG Proxy] Request received:', {
      method: req.method,
      url: req.url,
      query: req.query,
      path: pathArray,
      pathStr,
      queryString: query,
      targetUrl,
      hasQuery: !!req.query && Object.keys(req.query).length > 0
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
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(500).json({ error: 'CoinGecko proxy failed', message: error?.message || String(error) });
  }
}

