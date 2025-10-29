/* eslint-disable no-console */
import express from 'express';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = process.env.LUNARCRUSH_PROXY_PORT || 5050;

// Load .env from parent folder (react-app/../.env)
try {
  const envPath = path.resolve(process.cwd(), '../.env');
  const content = fs.readFileSync(envPath, 'utf8');
  content.split(/\r?\n/).forEach((line) => {
    const t = line.trim();
    if (!t || t.startsWith('#')) return;
    const eq = t.indexOf('=');
    if (eq === -1) return;
    const k = t.slice(0, eq).trim();
    const v = t.slice(eq + 1).trim();
    if (!(k in process.env)) process.env[k] = v;
  });
  console.log('Loaded .env for proxy');
} catch (e) {
  console.warn('No .env loaded for proxy:', e.message);
}

const LUNAR_KEY = process.env.REACT_APP_LUNARCRUSH_API_KEY || '';
if (!LUNAR_KEY) {
  console.warn('WARNING: Missing REACT_APP_LUNARCRUSH_API_KEY for proxy. v4 calls will fail.');
}

// Basic CORS for dev
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// v2 passthrough: /api/lunarcrush-v2/* -> https://api.lunarcrush.com/v2/*
app.get(/^\/api\/lunarcrush-v2\/(.*)/, async (req, res) => {
  try {
    const suffix = req.url.replace('/api/lunarcrush-v2', '');
    const upstream = 'https://api.lunarcrush.com' + suffix;
    const url = upstream;
    const r = await fetch(url);
    const text = await r.text();
    res.status(r.status);
    res.setHeader('Content-Type', r.headers.get('content-type') || 'application/json');
    res.send(text);
  } catch (e) {
    res.status(502).json({ error: 'proxy_failed', message: String(e.message || e) });
  }
});

// v4 Bearer: /api/lunarcrush/(.*) -> https://lunarcrush.com/api4/public/(...)
app.get(/^\/api\/lunarcrush\/(.*)/, async (req, res) => {
  try {
    const suffix = req.url.replace('/api/lunarcrush', '');
    const upstream = 'https://lunarcrush.com/api4/public' + suffix;
    const url = upstream;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${LUNAR_KEY}` } });
    const text = await r.text();
    res.status(r.status);
    res.setHeader('Content-Type', r.headers.get('content-type') || 'application/json');
    res.send(text);
  } catch (e) {
    res.status(502).json({ error: 'proxy_failed', message: String(e.message || e) });
  }
});

app.listen(PORT, () => {
  console.log(`LunarCrush proxy listening on http://localhost:${PORT}`);
});


