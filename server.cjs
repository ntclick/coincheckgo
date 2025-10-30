require('dotenv').config();
const express = require('express');
const path = require('path');
const NodeCache = require('node-cache');

const app = express();
const PORT = process.env.PORT || 4000;

// Serve static files from the build directory
app.use(express.static(path.join(__dirname, 'build')));
// JSON parser for proxy POST bodies
app.use(express.json());

// Set required headers for FHEVM
app.use((req, res, next) => {
  // Set COOP and COEP headers for FHEVM SDK
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  next();
});

// Simple in-memory cache (10 minutes)
const cache = new NodeCache({ stdTTL: 600 });

// Simple CoinGecko proxy for local development (with caching)
app.use('/api/cg', async (req, res) => {
  try {
    const apiBase = 'https://api.coingecko.com/api/v3';
    const pathWithQuery = req.originalUrl.replace('/api/cg', '');

    const targetUrl = apiBase + pathWithQuery;

    const headers = {
      'accept': 'application/json'
    };

    // Add API key if available
    const apiKey = process.env.REACT_APP_COINCHECKGO_API_KEY || process.env.CG_API_KEY;
    if (apiKey) {
      headers['x-cg-demo-api-key'] = apiKey;
    }

    const cacheKey = `${req.method}:${targetUrl}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      res.setHeader('Content-Type', cached.contentType || 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(200).send(cached.body);
    }

    const response = await fetch(targetUrl, { headers });
    const data = await response.text();

    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(response.status).send(data);

    if (response.ok) {
      cache.set(cacheKey, { body: data, contentType: response.headers.get('content-type') || 'application/json' });
    }

  } catch (error) {
    console.error('CoinGecko proxy error:', error);
    res.status(500).json({ error: 'CoinGecko proxy failed', message: error.message });
  }
});

// OpenAI backend proxy - never expose key to frontend
app.use('/api/openai', async (req, res) => {
  try {
    const apiBase = 'https://api.openai.com/v1';
    const pathWithQuery = req.originalUrl.replace('/api/openai', '');
    const targetUrl = apiBase + pathWithQuery;

    const headers = {
      'accept': 'application/json',
      'content-type': 'application/json',
      'authorization': `Bearer ${process.env.OPENAI_API_KEY || process.env.REACT_APP_OPENAI_API_KEY || ''}`
    };

    const init = {
      method: req.method,
      headers,
      body: ['GET','HEAD'].includes((req.method || 'GET').toUpperCase()) ? undefined : JSON.stringify(req.body || {})
    };

    const response = await fetch(targetUrl, init);
    const text = await response.text();

    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(response.status).send(text);
  } catch (error) {
    console.error('OpenAI proxy error:', error);
    res.status(500).json({ error: 'OpenAI proxy failed' });
  }
});

// Handle React routing, return all requests to React app (Express v5 compatible)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 FHEVM React App running on http://localhost:${PORT}`);
  console.log('🔐 Headers set for FHEVM SDK compatibility');
  console.log('📊 CoinGecko API proxy enabled at /api/cg/*');
});
