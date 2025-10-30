const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

// Serve static files from the build directory
app.use(express.static(path.join(__dirname, 'build')));

// Set required headers for FHEVM
app.use((req, res, next) => {
  // Set COOP and COEP headers for FHEVM SDK
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  next();
});

// Simple CoinGecko proxy for local development
app.get('/api/cg/*', async (req, res) => {
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

    const response = await fetch(targetUrl, { headers });
    const data = await response.text();

    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(response.status).send(data);

  } catch (error) {
    console.error('CoinGecko proxy error:', error);
    res.status(500).json({ error: 'CoinGecko proxy failed', message: error.message });
  }
});

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 FHEVM React App running on http://localhost:${PORT}`);
  console.log('🔐 Headers set for FHEVM SDK compatibility');
  console.log('📊 CoinGecko API proxy enabled at /api/cg/*');
});
