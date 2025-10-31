export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method Not Allowed' });
      return;
    }

    const apiKey = process.env.REACT_APP_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: 'Missing OpenAI API key' });
      return;
    }

    const url = 'https://api.openai.com/v1/chat/completions';
    const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});

    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${apiKey}`,
      },
      body,
    });

    const text = await resp.text();
    res.status(resp.status);
    res.setHeader('content-type', resp.headers.get('content-type') || 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(text);
  } catch (error) {
    res.status(500).json({ error: 'OpenAI proxy failed', message: error?.message || String(error) });
  }
}


