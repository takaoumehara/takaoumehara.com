# Amazon Shopping on Fire TV

A native 10-foot Fire TV shopping experience for Amazon (protein powder POC). Pure HTML/CSS/JS — no build, no npm, no Silk browser. Shop from the couch with D-pad navigation, speak your order via Alexa voice, or use your phone as a wireless remote.

## Quick Start

### TV App (the main experience)

```bash
node server.js
```

Opens an HTTP relay on port 3456. In Chrome (full-screen: <kbd>F11</kbd> or <kbd>⌃⌘F</kbd>), navigate to:

```
http://localhost:3456
```

Chrome is preferred because Web Speech API (voice input) works reliably there. If you don't have Node, you can open `index.html` directly in a browser — voice and D-pad input work, but the phone remote falls back to a same-computer BroadcastChannel demo.

### Phone Remote

1. Same Wi-Fi as your TV.
2. On the TV screen, press <kbd>R</kbd> to show the QR code (or it appears bottom-right by default).
3. Scan with your phone browser.
4. Tap **Connect**, enter the 6-character pairing code shown on the TV.
5. Your phone becomes a wireless D-pad + Alexa mic + text search.

## Controls

| Action | Key / Input |
|--------|------------|
| Navigate | Arrow keys (or D-pad on remote) |
| Select / Confirm | <kbd>Enter</kbd> |
| Back | <kbd>Esc</kbd> or <kbd>Backspace</kbd> |
| Alexa Voice | <kbd>V</kbd> or Space, or tap mic on remote |
| Show/Hide Remote QR | <kbd>R</kbd> |
| Home | <kbd>H</kbd> |

## Voice Commands (Alexa)

Try these on a product page or from home:

- "show me chocolate protein powder"
- "sort by price"
- "add this to my cart"
- "subscribe and save"
- "open my cart"
- "checkout"
- "place my order"
- "reorder my protein"
- "read reviews"
- "is it gluten free"
- "show me plant based options"

## Features

- **Home screen** — Hero deal + discovery rails (Buy Again, Recommended, Deals, Plant-based)
- **Voice-first search** — Alexa intent parser + fallback TV keyboard
- **Results page** — Filters, sort, AI-powered Rufus summary strip
- **Product pages** — Image gallery, flavor/size selector, Subscribe & Save, quantity, AI-generated "Customers Say" summary, customer reviews, Ask Rufus Q&A
- **Cart** — Review, update quantities, remove items
- **Checkout** — Single page, delivery options, address/payment shortcuts
- **Order confirmation** — TTS read-aloud of order details
- **Order history** — View past orders, Buy Again one-click reorder
- **Phone remote** — D-pad input, hold-to-talk Alexa mic, live text search, snap-pair pairing (6-char code + presence heartbeat)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│  TV Browser (index.html)                                     │
│  ├─ CSS animations (10-foot safe, OKLCH palette)            │
│  ├─ Voice layer (Web Speech API + intent parser)            │
│  ├─ D-pad/keyboard nav + state machine routing              │
│  └─ SSE listener for remote input                           │
│                                                               │
│              ↕ HTTP + SSE                                    │
│                                                               │
│  server.js (Node.js, zero deps)                             │
│  ├─ File serving (html/css/js/images)                       │
│  ├─ Snap-pair pairing relay                                 │
│  │  (6-char codes, server-validated rooms, heartbeat)       │
│  ├─ SSE broadcast (D-pad, voice, text)                      │
│  └─ Catalog data (JSON in memory, can swap for DB)          │
│                                                               │
│              ↕ HTTP                                           │
│                                                               │
│  Phone Browser (remote.html)                                │
│  ├─ D-pad buttons                                           │
│  ├─ Hold-to-talk Alexa mic (MediaRecorder → SSE)           │
│  ├─ Text search input                                       │
│  └─ Live status (cart, pairing code, connection)           │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

The pairing layer uses the **snap-pair architecture**: short alphanumeric codes as rendezvous handles, validated server-side. The server (not the client) adds participants to a room. Presence is tracked via heartbeat; on disconnect, the remote is purged. For cross-network use, the relay can be swapped to Firebase RTDB or similar.

## Technical Stack

- **Runtime:** Node.js (server only)
- **Dependencies:** None (built-in modules only)
- **Frontend:** Vanilla HTML5/CSS3/JS
  - Web Speech API (Chrome, Firefox) for voice
  - BroadcastChannel API fallback for same-machine remote
  - Server-Sent Events for live relay
- **Styling:** OKLCH color space, CSS Grid/Flex, no frameworks

## Natural voice — cloud TTS with browser fallback

Alexa's spoken replies use the best available voice automatically:

1. **Cloud TTS** (natural, consistent across all browsers) — used when the relay has credentials. The server picks **Amazon Polly** if AWS keys are set, otherwise **Google Gemini TTS** if a Gemini key is set. Audio is synthesized server-side and streamed to the browser, so every viewer hears the same high-quality voice.
2. **Browser `speechSynthesis`** (instant, quality varies by OS/browser) — automatic fallback when no cloud key is set, or if a cloud call fails. Voice selection auto-ranks system voices, preferring neural/natural ones (e.g. Chrome's "Google US English").

Set **one** provider before starting the server:

### Google Gemini TTS (free tier, no credit card)

Get a key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey) — the AI Studio free tier requires no billing card:

```bash
export GEMINI_API_KEY=...
export GEMINI_VOICE=Kore                       # optional: Kore, Puck, Charon, Aoede, Leda…
export GEMINI_TTS_MODEL=gemini-2.5-flash-preview-tts   # optional
node server.js
```

Gemini returns raw 16-bit/24 kHz PCM; the server wraps it in a WAV header (no audio libraries needed) and streams `audio/wav`.

### Amazon Polly (12-month free tier, needs AWS account)

```bash
export AWS_ACCESS_KEY_ID=...
export AWS_SECRET_ACCESS_KEY=...
export AWS_REGION=us-east-1        # optional (default us-east-1)
export POLLY_VOICE=Ruth           # optional: Ruth, Matthew, Joanna, Danielle, Stephen…
export POLLY_ENGINE=generative    # optional: neural (default) | generative | long-form
node server.js
```

SigV4 is signed by hand with Node's `crypto` — no AWS SDK dependency. The IAM user needs only `polly:SynthesizeSpeech`.

- The TV app probes `GET /api/tts/status` on load; if a provider is configured it plays `GET /api/tts?text=…`, otherwise it silently uses the browser voice.
- Responses are cached in memory per phrase to cut latency and cost.
- Cloud calls need outbound internet; without any key the app runs exactly as before.

## Limitations & Notes

- **POC catalog:** Demo data is grounded in real Amazon product pages saved July 2026 (protein powder category). Can be swapped for live API or expanded catalog.
- **Images:** Product photos served from Amazon's public CDN (requires internet connectivity).
- **Voice recognition:** Web Speech API requires Chrome (TV). Falls back to typed input on other browsers.
- **Voice output:** Browser `speechSynthesis` by default; set a Gemini or AWS Polly key to upgrade to natural cloud speech (see above).
- **Scope:** Single-category showcase (protein powder). Not affiliated with Amazon.
- **Design:** 10-foot optimized for Fire TV / smart TV (16:9 landscape). Phone remote is mobile-first (portrait/landscape).

## Development Notes

- Edit HTML/CSS/JS files directly; server auto-detects changes (no build step).
- Catalog data is loaded from `data/` JSON files (can be swapped to a real API).
- Voice intents are parsed in `js/voice.js` and routed through the app state machine.
- Remote pairing is managed in `server.js`; rooms timeout if heartbeat isn't received for 10 seconds.
- To test phone remote locally without a second device: open `remote.html` on the same machine and use BroadcastChannel (automatic fallback).

---

**Ready to ship?** Start with `node server.js`, open http://localhost:3456 in Chrome fullscreen, and speak your first order.
