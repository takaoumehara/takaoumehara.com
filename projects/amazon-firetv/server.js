#!/usr/bin/env node
/* ============================================================
   Amazon Shopping on Fire TV — POC relay server (zero deps)

   Serves the TV app + phone remote, and relays remote input to
   the TV over Server-Sent Events, following the snap-pair
   architecture: short pairing codes are rendezvous handles that
   the server validates; the server (not the client) adds
   participants to a room; presence via heartbeat + disconnect.

     node server.js          → http://<LAN-IP>:3456
   ============================================================ */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const PORT = process.env.PORT || 3456;
const ROOT = __dirname;
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // font-safe (snap-pair)
const CODE_TTL_MS = 10 * 60 * 1000;   // pairing code validity
const MAX_PLAYERS = 8;

/* ---------------- Amazon Polly TTS (optional) ----------------
   Enabled only when AWS credentials are present in the environment:
     AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY [, AWS_SESSION_TOKEN]
     AWS_REGION (default us-east-1)
     POLLY_VOICE (default Ruth)   POLLY_ENGINE (default neural)
   Signs requests with SigV4 by hand — no AWS SDK dependency.
   Falls back silently to the browser's speechSynthesis when disabled. */
const POLLY = {
  get enabled() { return !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY); },
  region: process.env.AWS_REGION || 'us-east-1',
  voice: process.env.POLLY_VOICE || 'Ruth',          // Ruth/Matthew/Joanna/Danielle/Stephen…
  engine: process.env.POLLY_ENGINE || 'neural',      // 'neural' | 'generative' | 'long-form' | 'standard'
};
const ttsCache = new Map(); // "voice|engine|text" → mp3 Buffer

const sha256hex = m => crypto.createHash('sha256').update(m).digest('hex');
const hmac = (key, m) => crypto.createHmac('sha256', key).update(m).digest();

function pollySynthesize(text, voice, engine) {
  const region = POLLY.region, service = 'polly', host = `polly.${region}.amazonaws.com`;
  const uri = '/v1/speech';
  const body = JSON.stringify({ OutputFormat: 'mp3', Text: text, VoiceId: voice, Engine: engine, SampleRate: '24000' });
  const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');   // YYYYMMDDTHHMMSSZ
  const dateStamp = amzDate.slice(0, 8);
  const token = process.env.AWS_SESSION_TOKEN;

  // canonical headers must be lowercase & alphabetically sorted
  let canonicalHeaders = `content-type:application/json\nhost:${host}\nx-amz-date:${amzDate}\n`;
  let signedHeaders = 'content-type;host;x-amz-date';
  if (token) { canonicalHeaders += `x-amz-security-token:${token}\n`; signedHeaders += ';x-amz-security-token'; }

  const canonicalRequest = `POST\n${uri}\n\n${canonicalHeaders}\n${signedHeaders}\n${sha256hex(body)}`;
  const scope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${scope}\n${sha256hex(canonicalRequest)}`;
  const kSigning = hmac(hmac(hmac(hmac('AWS4' + process.env.AWS_SECRET_ACCESS_KEY, dateStamp), region), service), 'aws4_request');
  const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');
  const authorization = `AWS4-HMAC-SHA256 Credential=${process.env.AWS_ACCESS_KEY_ID}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const headers = { 'Content-Type': 'application/json', 'X-Amz-Date': amzDate, Authorization: authorization, 'Content-Length': Buffer.byteLength(body) };
  if (token) headers['X-Amz-Security-Token'] = token;

  return new Promise((resolve, reject) => {
    const r = https.request({ host, path: uri, method: 'POST', headers, timeout: 8000 }, resp => {
      const chunks = [];
      resp.on('data', c => chunks.push(c));
      resp.on('end', () => {
        const buf = Buffer.concat(chunks);
        if (resp.statusCode === 200) resolve(buf);
        else reject(new Error(`polly ${resp.statusCode}: ${buf.toString().slice(0, 160)}`));
      });
    });
    r.on('timeout', () => r.destroy(new Error('polly timeout')));
    r.on('error', reject);
    r.write(body); r.end();
  });
}

/* ---------------- Gemini TTS (optional) ----------------
   Enabled when GEMINI_API_KEY is set. Free tier via AI Studio
   (aistudio.google.com/apikey) — no credit card required.
     GEMINI_API_KEY (required)
     GEMINI_TTS_MODEL (default gemini-2.5-flash-preview-tts)
     GEMINI_VOICE (default Kore)
   Returns raw 16-bit PCM @ 24kHz mono, which we wrap in a WAV
   header ourselves (no audio libraries needed). */
const GEMINI = {
  get enabled() { return !!process.env.GEMINI_API_KEY; },
  model: process.env.GEMINI_TTS_MODEL || 'gemini-2.5-flash-preview-tts',
  voice: process.env.GEMINI_VOICE || 'Kore',
};

function pcm16ToWav(pcmBuffer, sampleRate = 24000, channels = 1, bitsPerSample = 16) {
  const byteRate = sampleRate * channels * (bitsPerSample / 8);
  const blockAlign = channels * (bitsPerSample / 8);
  const header = Buffer.alloc(44);
  header.write('RIFF', 0); header.writeUInt32LE(36 + pcmBuffer.length, 4); header.write('WAVE', 8);
  header.write('fmt ', 12); header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22); header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28); header.writeUInt16LE(blockAlign, 32); header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36); header.writeUInt32LE(pcmBuffer.length, 40);
  return Buffer.concat([header, pcmBuffer]);
}

/* Extracts {mimeType, base64} audio from a Gemini generateContent response,
   tolerant of minor shape differences across API versions. */
function extractGeminiAudio(json) {
  const part = json?.candidates?.[0]?.content?.parts?.find(p => p.inlineData || p.inline_data);
  const inline = part && (part.inlineData || part.inline_data);
  if (inline && inline.data) return { mimeType: inline.mimeType || inline.mime_type || '', base64: inline.data };
  const alt = json?.output_audio || json?.interaction?.output_audio;
  if (alt && alt.data) return { mimeType: alt.mime_type || alt.mimeType || '', base64: alt.data };
  return null;
}

function geminiSynthesize(text, voice, model) {
  const host = 'generativelanguage.googleapis.com';
  const uri = `/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const body = JSON.stringify({
    contents: [{ parts: [{ text }] }],
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
    },
  });
  const headers = { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY, 'Content-Length': Buffer.byteLength(body) };

  return new Promise((resolve, reject) => {
    const r = https.request({ host, path: uri, method: 'POST', headers, timeout: 15000 }, resp => {
      const chunks = [];
      resp.on('data', c => chunks.push(c));
      resp.on('end', () => {
        const raw = Buffer.concat(chunks);
        if (resp.statusCode !== 200) return reject(new Error(`gemini ${resp.statusCode}: ${raw.toString().slice(0, 200)}`));
        let json;
        try { json = JSON.parse(raw.toString()); } catch (e) { return reject(new Error('gemini: bad JSON response')); }
        const audio = extractGeminiAudio(json);
        if (!audio) return reject(new Error('gemini: no audio in response: ' + raw.toString().slice(0, 200)));
        const pcm = Buffer.from(audio.base64, 'base64');
        const rateMatch = /rate=(\d+)/.exec(audio.mimeType || '');
        resolve(pcm16ToWav(pcm, rateMatch ? parseInt(rateMatch[1], 10) : 24000));
      });
    });
    r.on('timeout', () => r.destroy(new Error('gemini timeout')));
    r.on('error', reject);
    r.write(body); r.end();
  });
}

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.ico': 'image/x-icon',
};

/* ---------------- rooms ---------------- */
/* rooms: roomId → { code, hostToken, createdAt, codeExpiresAt,
                     players: Map<playerId,{name,token,lastSeenAt}>,
                     tvStreams: Set<res>, remoteStreams: Set<res>, lastState } */
const rooms = new Map();
const codes = new Map(); // code → roomId

function newCode() {
  let c = '';
  const bytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) c += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  return codes.has(c) ? newCode() : c;
}

function lanIP() {
  const ifs = os.networkInterfaces();
  for (const name of Object.keys(ifs)) {
    for (const i of ifs[name] || []) {
      if (i.family === 'IPv4' && !i.internal) return i.address;
    }
  }
  return 'localhost';
}

function sse(res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write(':ok\n\n');
}
/* Writes to every stream in the set, dropping (and reporting) the ones that
   have gone away so dead responses don't accumulate. */
function writeAll(streamSet, line, what) {
  for (const res of streamSet) {
    try {
      res.write(line);
    } catch (e) {
      streamSet.delete(res);
      console.warn(`[sse] dropping stream after failed ${what}:`, e.message);
    }
  }
}
function push(streamSet, data) {
  writeAll(streamSet, `data: ${JSON.stringify(data)}\n\n`, 'push');
}

/* keepalive + presence sweep */
setInterval(() => {
  const now = Date.now();
  for (const [roomId, room] of rooms) {
    for (const set of [room.tvStreams, room.remoteStreams]) {
      writeAll(set, ':ka\n\n', 'keepalive');
    }
    for (const [pid, p] of room.players) {
      if (now - p.lastSeenAt > 45000) {
        room.players.delete(pid);
        push(room.tvStreams, { type: 'leave', name: p.name });
      }
    }
    // GC: room with no TV stream for 30 min
    if (!room.tvStreams.size && now - room.createdAt > 30 * 60 * 1000) {
      codes.delete(room.code);
      rooms.delete(roomId);
    }
  }
}, 15000);

/* Request failures the client is responsible for: reported as-is instead of
   being flattened into a 500 (or, worse, silently ignored). */
class RequestError extends Error {
  constructor(status, code) { super(code); this.status = status; this.code = code; }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', c => {
      data += c;
      // pause rather than destroy so the 413 actually reaches the client
      if (data.length > 64 * 1024) { req.pause(); reject(new RequestError(413, 'body_too_large')); }
    });
    req.on('end', () => {
      if (!data) return resolve({});
      try { resolve(JSON.parse(data)); } catch (e) { reject(new RequestError(400, 'bad_json')); }
    });
    req.on('error', reject);
  });
}
const json = (res, code, obj) => {
  if (res.writableEnded || res.headersSent) return;
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(obj));
};

/* ---------------- server ---------------- */
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const p = url.pathname;

  /* --- API --- */
  try {
    // Cloud TTS capability probe — Polly takes priority if both are set
    if (p === '/api/tts/status' && req.method === 'GET') {
      if (POLLY.enabled) return json(res, 200, { enabled: true, engine: 'polly', voice: POLLY.voice });
      if (GEMINI.enabled) return json(res, 200, { enabled: true, engine: 'gemini', voice: GEMINI.voice });
      return json(res, 200, { enabled: false });
    }
    // Cloud TTS synthesis → returns audio; 501 when neither is configured so client falls back
    if (p === '/api/tts' && req.method === 'GET') {
      if (!POLLY.enabled && !GEMINI.enabled) return json(res, 501, { enabled: false });
      const text = (url.searchParams.get('text') || '').slice(0, 1500).trim();
      if (!text) return json(res, 400, { error: 'no_text' });
      const send = (buf, mime) => { res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'public, max-age=86400', 'Content-Length': buf.length }); res.end(buf); };

      if (POLLY.enabled) {
        const voice = (url.searchParams.get('voice') || POLLY.voice).replace(/[^A-Za-z]/g, '');
        const key = `polly|${voice}|${POLLY.engine}|${text}`;
        if (ttsCache.has(key)) return send(ttsCache.get(key), 'audio/mpeg');
        try {
          const audio = await pollySynthesize(text, voice, POLLY.engine);
          if (ttsCache.size > 250) ttsCache.clear();
          ttsCache.set(key, audio);
          return send(audio, 'audio/mpeg');
        } catch (e) {
          console.warn('[tts] polly failed:', e.message);
          return json(res, 502, { error: 'polly_failed', detail: String(e.message).slice(0, 160) });
        }
      }

      const voice = url.searchParams.get('voice') || GEMINI.voice;
      const key = `gemini|${voice}|${GEMINI.model}|${text}`;
      if (ttsCache.has(key)) return send(ttsCache.get(key), 'audio/wav');
      try {
        const audio = await geminiSynthesize(text, voice, GEMINI.model);
        if (ttsCache.size > 250) ttsCache.clear();
        ttsCache.set(key, audio);
        return send(audio, 'audio/wav');
      } catch (e) {
        console.warn('[tts] gemini failed:', e.message);
        return json(res, 502, { error: 'gemini_failed', detail: String(e.message).slice(0, 200) });
      }
    }

    // TV creates a room (host)
    if (p === '/api/rooms' && req.method === 'POST') {
      const roomId = crypto.randomUUID();
      const code = newCode();
      const hostToken = crypto.randomBytes(16).toString('hex');
      const room = {
        code, hostToken, createdAt: Date.now(), codeExpiresAt: Date.now() + CODE_TTL_MS,
        players: new Map(), tvStreams: new Set(), remoteStreams: new Set(), lastState: null,
      };
      rooms.set(roomId, room);
      codes.set(code, roomId);
      const host = req.headers.host && !req.headers.host.startsWith('localhost') && !req.headers.host.startsWith('127.')
        ? req.headers.host : `${lanIP()}:${PORT}`;
      return json(res, 200, { roomId, code, hostToken, remoteUrl: `http://${host}/remote.html?code=${code}` });
    }

    // Phone joins by code — server validates & adds participant (snap-pair rule)
    if (p === '/api/join' && req.method === 'POST') {
      const body = await readBody(req);
      const code = String(body.code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      const roomId = codes.get(code);
      const room = roomId && rooms.get(roomId);
      if (!room) return json(res, 404, { error: 'invalid_code' });
      if (Date.now() > room.codeExpiresAt && !room.players.size) room.codeExpiresAt = Date.now() + CODE_TTL_MS; // TV still on-screen ⇒ refresh
      if (room.players.size >= MAX_PLAYERS) return json(res, 409, { error: 'room_full' });
      const playerId = crypto.randomUUID();
      const token = crypto.randomBytes(16).toString('hex');
      const name = String(body.name || 'Phone').slice(0, 40);
      room.players.set(playerId, { name, token, lastSeenAt: Date.now() });
      push(room.tvStreams, { type: 'join', name, playerId });
      return json(res, 200, { roomId, playerId, token, state: room.lastState });
    }

    // Room event streams
    const evM = p.match(/^\/api\/rooms\/([\w-]+)\/events$/);
    if (evM && req.method === 'GET') {
      const room = rooms.get(evM[1]);
      if (!room) return json(res, 404, { error: 'no_room' });
      const token = url.searchParams.get('token');
      const isHost = token === room.hostToken;
      const player = [...room.players.values()].find(pl => pl.token === token);
      if (!isHost && !player) return json(res, 403, { error: 'forbidden' });
      sse(res);
      const set = isHost ? room.tvStreams : room.remoteStreams;
      set.add(res);
      if (!isHost && room.lastState) res.write(`data: ${JSON.stringify(room.lastState)}\n\n`);
      req.on('close', () => set.delete(res));
      return;
    }

    // Remote input → TV
    const inM = p.match(/^\/api\/rooms\/([\w-]+)\/input$/);
    if (inM && req.method === 'POST') {
      const room = rooms.get(inM[1]);
      if (!room) return json(res, 404, { error: 'no_room' });
      const body = await readBody(req);
      const player = room.players.get(body.playerId);
      if (!player || player.token !== body.token) return json(res, 403, { error: 'forbidden' });
      player.lastSeenAt = Date.now();
      const evt = body.event || {};
      if (!['key', 'voice', 'text', 'leave'].includes(evt.type)) return json(res, 400, { error: 'bad_event' });
      if (evt.type === 'leave') {
        room.players.delete(body.playerId);
        push(room.tvStreams, { type: 'leave', name: player.name });
      } else {
        push(room.tvStreams, { ...evt, name: player.name });
      }
      return json(res, 200, { ok: true });
    }

    // TV → remotes shared state (screen context)
    const stM = p.match(/^\/api\/rooms\/([\w-]+)\/state$/);
    if (stM && req.method === 'POST') {
      const room = rooms.get(stM[1]);
      if (!room) return json(res, 404, { error: 'no_room' });
      const body = await readBody(req);
      if (body.token !== room.hostToken) return json(res, 403, { error: 'forbidden' });
      room.lastState = body.state;
      push(room.remoteStreams, body.state);
      return json(res, 200, { ok: true });
    }

    // heartbeat (presence)
    if (p === '/api/heartbeat' && req.method === 'POST') {
      const body = await readBody(req);
      const room = rooms.get(body.roomId);
      const player = room && room.players.get(body.playerId);
      if (player && player.token === body.token) { player.lastSeenAt = Date.now(); return json(res, 200, { ok: true }); }
      return json(res, 404, { error: 'gone' });
    }
  } catch (e) {
    if (e instanceof RequestError) return json(res, e.status, { error: e.code });
    console.error(`[api] ${req.method} ${p} failed:`, e);
    return json(res, 500, { error: 'server_error' });
  }

  /* --- static files --- */
  let file = p === '/' ? '/index.html' : decodeURIComponent(p);
  file = path.normalize(file).replace(/^(\.\.[/\\])+/, '');
  const abs = path.join(ROOT, file);
  if (!abs.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  fs.readFile(abs, (err, data) => {
    if (err) {
      const missing = err.code === 'ENOENT' || err.code === 'EISDIR';
      if (!missing) console.error(`[static] ${file} failed:`, err);
      res.writeHead(missing ? 404 : 500, { 'Content-Type': 'text/plain' });
      return res.end(missing ? 'Not found' : 'Internal error');
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(abs)] || 'application/octet-stream' });
    res.end(data);
  });
});

server.on('error', e => {
  if (e.code === 'EADDRINUSE') console.error(`  port ${PORT} is already in use — set PORT=<other> and retry.`);
  else console.error('  server error:', e);
  process.exit(1);
});

/* Async failures outside a request (timers, SSE writes) would otherwise be
   lost or take the process down without explanation. */
process.on('unhandledRejection', e => console.error('[unhandledRejection]', e));
process.on('uncaughtException', e => { console.error('[uncaughtException]', e); process.exit(1); });

server.listen(PORT, () => {
  const ip = lanIP();
  console.log('');
  console.log('  ┌─────────────────────────────────────────────────────┐');
  console.log('  │   Amazon Shopping on Fire TV — proof of concept     │');
  console.log('  ├─────────────────────────────────────────────────────┤');
  console.log(`  │   TV app     →  http://localhost:${PORT}               │`);
  console.log(`  │   LAN        →  http://${ip}:${PORT}${' '.repeat(Math.max(0, 15 - ip.length))}          │`);
  console.log('  │                                                     │');
  console.log('  │   Open the TV app fullscreen (F11 / ⌃⌘F).           │');
  console.log('  │   Scan the on-screen QR with your phone to pair.    │');
  console.log('  └─────────────────────────────────────────────────────┘');
  console.log('');
});
