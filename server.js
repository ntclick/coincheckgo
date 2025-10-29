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

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 FHEVM React App running on http://localhost:${PORT}`);
  console.log('🔐 Headers set for FHEVM SDK compatibility');
});
