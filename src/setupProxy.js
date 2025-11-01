const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // CoinGecko API proxy
  app.use(
    '/api/cg',
    createProxyMiddleware({
      target: 'https://api.coingecko.com/api/v3',
      changeOrigin: true,
      pathRewrite: {
        '^/api/cg': '', // Remove /api/cg prefix
      },
      onProxyReq: (proxyReq, req, res) => {
        // Add API key if available
        const apiKey = process.env.REACT_APP_COINCHECKGO_API_KEY || process.env.CG_API_KEY;
        if (apiKey) {
          proxyReq.setHeader('x-cg-demo-api-key', apiKey);
        }
      },
      headers: {
        'accept': 'application/json',
      },
    })
  );
};

