/* ============================================================
   Phone-remote pairing — snap-pair over Firebase Realtime DB.
   TV = host: anonymous auth → creates a room (6-char code is a
   rendezvous handle, NOT authorization), shows QR, subscribes to
   rooms/{id}/state/input for remote events, and writes
   rooms/{id}/state/context for the phone to mirror the screen.
   Presence uses onDisconnect(). Falls back to BroadcastChannel
   when Firebase isn't configured/unreachable (local demo).
   ============================================================ */

const Pair = (() => {
  let db = null, auth = null, uid = null;
  let room = null;          // { roomId, code }
  let refs = {};
  let bc = null;            // BroadcastChannel fallback
  let connected = 0;
  let hbTimer = null;

  const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // font-safe (snap-pair)
  const CODE_TTL_MS = 10 * 60 * 1000;
  const MAX_PLAYERS = 8;

  const cfg = window.FIREBASE_CONFIG || {};
  const fbReady = !!(window.firebase && cfg.apiKey && !String(cfg.apiKey).startsWith('YOUR_'));

  function newCode() {
    const bytes = new Uint8Array(6);
    crypto.getRandomValues(bytes);
    let c = '';
    for (let i = 0; i < 6; i++) c += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
    return c;
  }

  function qrInto(elId, text) {
    const box = document.getElementById(elId);
    if (!box) return;
    try {
      if (typeof qrcode === 'function') {
        const qr = qrcode(0, 'M');
        qr.addData(text); qr.make();
        box.innerHTML = qr.createImgTag(4, 8);
        return;
      }
    } catch (e) { console.warn('[pair] QR render failed — showing the URL as text', e); }
    box.innerHTML = `<div style="color:#111;font-size:.62rem;word-break:break-all;padding:.4rem;font-weight:600">${text}</div>`;
  }

  async function init() {
    const isLocalForced = new URLSearchParams(location.search).get('local') === '1';
    if (!fbReady || isLocalForced) { console.warn('[pair] Firebase not configured or bypassed — BroadcastChannel demo mode'); return initFallback(); }
    try {
      firebase.initializeApp(window.FIREBASE_CONFIG);
      db = firebase.database();
      auth = firebase.auth();
      
      let initialized = false;
      auth.onAuthStateChanged(async (user) => {
        if (user && !initialized) {
          initialized = true;
          uid = user.uid;
          try {
            await createRoom();
            subscribe();
          } catch (e) {
            console.warn('[pair] createRoom failed', e);
            initFallback();
          }
        }
      });

      await auth.signInAnonymously();
    } catch (e) {
      console.warn('[pair] Firebase init failed — fallback', e);
      initFallback();
    }
  }

  /* ---- host creates the room (single multi-location write) ---- */
  async function createRoom() {
    const roomId = crypto.randomUUID();
    const code = newCode();
    const now = Date.now();
    room = { roomId, code };

    const hostPlayer = { id: uid, name: 'Fire TV', role: 'host', connected: true, joinedAt: now, lastSeenAt: now };
    const upd = {};
    upd[`pairingCodes/${code}`]      = { roomId, hostId: uid, createdAt: now, expiresAt: now + CODE_TTL_MS, maxPlayers: MAX_PLAYERS };
    upd[`roomMembers/${roomId}/${uid}`] = true;
    upd[`rooms/${roomId}/meta`]       = { hostId: uid, status: 'waiting', createdAt: now, updatedAt: now, participantCount: 1, maxPlayers: MAX_PLAYERS };
    upd[`rooms/${roomId}/joinState`]  = { count: 0, members: {} }; // host isn't a remote slot; remotes transact here
    upd[`rooms/${roomId}/players/${uid}`] = hostPlayer;
    await db.ref().update(upd);

    // presence: if the TV drops, mark it disconnected
    const hostRef = db.ref(`rooms/${roomId}/players/${uid}`);
    hostRef.onDisconnect().update({ connected: false, lastSeenAt: firebase.database.ServerValue.TIMESTAMP })
      .catch(e => console.warn('[pair] presence onDisconnect not registered — remotes may not see the TV drop', e));
    hbTimer = setInterval(() => {
      hostRef.update({ lastSeenAt: Date.now() }).catch(e => console.warn('[pair] heartbeat failed', e));
    }, 25000);

    const remoteUrl = `${location.origin}/remote.html?code=${code}`;
    qrInto('pairQr', remoteUrl);
    qrInto('obQr', remoteUrl);
    setCodeText(code.split('').join(' '));
  }

  function setCodeText(text) {
    for (const id of ['pairCode', 'obCode']) {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    }
  }

  /* ---- subscribe to remote input + player presence ---- */
  function subscribe() {
    const onSubError = (what) => (e) => {
      console.error(`[pair] ${what} subscription failed — remote input will not arrive`, e);
      if (window.App && App.toast) App.toast('Remote link lost', 'Reload the TV app to pair again', true);
    };

    refs.input = db.ref(`rooms/${room.roomId}/state/input`);
    refs.input.on('child_added',   s => onInput(s.val()), onSubError('input'));
    refs.input.on('child_changed', s => onInput(s.val()), onSubError('input'));

    refs.players = db.ref(`rooms/${room.roomId}/players`);
    refs.players.on('child_added', s => {
      const p = s.val(); if (!p || p.role === 'host') return;
      if (p.connected !== false) { connected++; onJoin(p); }
    }, onSubError('players'));
    refs.players.on('child_changed', s => {
      const p = s.val(); if (!p || p.role === 'host') return;
      if (p.connected === false) { connected = Math.max(0, connected - 1); onLeave(p); }
    }, onSubError('players'));
  }

  function onJoin(p) {
    if (window.App && App.dismissOnboard) App.dismissOnboard(true); // phone paired from the intro → straight in
    const nameEl = document.getElementById('pairName');
    const connEl = document.getElementById('pairConnected');
    if (connEl) connEl.style.display = '';
    if (nameEl) nameEl.textContent = `${p.name || 'Phone'} connected`;
    App.toast('Remote connected', `${p.name || 'A phone'} is now your Fire TV remote`, true);
    SFX.add();
    setTimeout(() => { if (!App.state._pairManual) App.togglePair(false, true); }, 2600);
    sendContext(App.state.route, '');
  }
  function onLeave(p) {
    if (!connected && document.getElementById('pairConnected')) document.getElementById('pairConnected').style.display = 'none';
    App.toast('Remote disconnected', p.name || '', true);
  }

  /* ---- events from remotes ---- */
  function onInput(msg) {
    if (!msg || !msg.type) return;
    switch (msg.type) {
      case 'key': {
        const k = msg.key;
        if (k === 'back') Focus.back();
        else if (k === 'home') App.go('home');
        else if (k === 'select') Focus.select();
        else if (['up', 'down', 'left', 'right'].includes(k)) Focus.move(k);
        else if (k === 'mic') Voice.toggle();
        break;
      }
      case 'voice': Voice.fromRemote(msg.transcript); break;
      case 'text': if (msg.value) App.doSearch(msg.value); break;
      case 'voice-change': if (window.App && msg.voice) App.state.voice = msg.voice; break;
    }
  }

  /* ---- host → remotes context (screen name shown on phone) ---- */
  function sendContext(screen, detail) {
    const payload = { type: 'context', screen, detail, cart: App.state.cart.reduce((a, i) => a + i.qty, 0), ts: Date.now() };
    if (db && room) {
      db.ref(`rooms/${room.roomId}/state/context`).set(payload)
        .catch(e => console.warn('[pair] context sync failed — the phone may show a stale screen', e));
    } else if (bc) {
      try { bc.postMessage(payload); } catch (e) { console.warn('[pair] context broadcast failed', e); }
    }
  }

  /* ---- BroadcastChannel fallback (same-device demo, no Firebase) ---- */
  function initFallback() {
    try {
      bc = new BroadcastChannel('amztv-remote');
      bc.onmessage = ev => { const m = ev.data; if (m && m.type !== 'context') onInput(m); };
      const url = location.href.replace(/index\.html.*$|$/, m => 'remote.html');
      qrInto('pairQr', url);
      qrInto('obQr', url);
      setCodeText('LOCAL MODE');
      const sub = document.querySelector('#pairPop .pair-sub');
      if (sub) sub.innerHTML = 'Firebase not configured. Open <b>remote.html</b> in another tab of this computer (demo), or fill in <b>app/firebase-config.js</b> for real phone pairing.';
    } catch (e) {
      console.error('[pair] local fallback unavailable — phone pairing is disabled', e);
      setCodeText('UNAVAILABLE');
      const sub = document.querySelector('#pairPop .pair-sub');
      if (sub) sub.textContent = 'Pairing is unavailable in this browser. Use the on-screen remote instead.';
      return;
    }
    // still listen for local joins via BroadcastChannel
    if (bc) bc.onmessage = ev => {
      const m = ev.data;
      if (!m) return;
      if (m.type === 'join') onJoin(m);
      else if (m.type === 'leave') onLeave(m);
      else if (m.type !== 'context') onInput(m);
    };
  }

  window.addEventListener('DOMContentLoaded', init);
  return { sendContext, get connected() { return connected > 0; } };
})();
window.Pair = Pair;
