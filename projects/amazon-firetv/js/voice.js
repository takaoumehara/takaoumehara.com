/* ============================================================
   Alexa voice layer — Web Speech API + intent parsing + TTS
   Activation: V key, Alexa button, phone-remote mic, or remote
   transcript relay. Understands shopping intents in context.
   ============================================================ */

const Voice = (() => {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let rec = null, listening = false, mode = 'alexa'; // 'alexa' | 'rufus'
  let dismissTimer = null;

  const el = () => document.getElementById('alexa');
  const heardEl = () => document.getElementById('alexaHeard');
  const replyEl = () => document.getElementById('alexaReply');
  const stateEl = () => document.getElementById('alexaState');
  const hintsEl = () => document.getElementById('alexaHints');

  function show(state) {
    clearTimeout(dismissTimer);
    el().classList.add('show');
    el().classList.toggle('listening', state === 'listening');
    stateEl().textContent = state === 'listening' ? 'Listening' : state === 'thinking' ? 'Thinking' : 'Alexa';
  }
  function dismiss(delay) {
    clearTimeout(dismissTimer);
    dismissTimer = setTimeout(() => {
      el().classList.remove('show', 'listening');
      stopRec();
    }, delay || 0);
  }
  function stopRec() {
    listening = false;
    if (rec) { try { rec.onend = null; rec.stop(); } catch (e) {} rec = null; }
  }

  /* TTS: prefer cloud speech (Gemini or Amazon Polly — whichever the relay
     has credentials for; server picks) when configured; otherwise fall back
     to the browser's speechSynthesis. */
  let cloudReady = false;
  let ttsAudio = null;
  (async () => {
    try {
      const r = await fetch('/api/tts/status');
      if (r.ok) { const s = await r.json(); cloudReady = !!s.enabled; }
      else console.info(`[voice] relay TTS probe returned ${r.status} — using browser speech`);
    } catch (e) {
      // file:// or no relay running — expected, but worth saying which path we take
      console.info('[voice] no TTS relay reachable — using browser speech', e.message);
    }
  })();

  /* Rank the available system voices, strongly preferring neural/natural
     ones. Best free result: open in Edge → "Microsoft … Online (Natural)"
     voices are neural-quality with no signup. Chrome → "Google US English". */
  function scoreVoice(v) {
    const n = v.name || '';
    let s = 0;
    if (/en[-_]US/i.test(v.lang)) s += 40; else if (/^en/i.test(v.lang)) s += 20;
    if (/Online \(Natural\)/i.test(n)) s += 100;              // Edge Microsoft neural (free, excellent)
    if (/Natural/i.test(n)) s += 40;
    if (/Neural/i.test(n)) s += 40;
    if (/^Google/i.test(n)) s += 55;                          // Chrome cloud voice (good)
    if (/Ava|Emma|Jenny|Aria|Andrew|Michelle|Sonia|Libby/i.test(n)) s += 25; // pleasant MS personas
    if (/Samantha|Serena|Allison|Ava \(Enhanced\)|Zoe/i.test(n)) s += 22;    // strong Apple voices
    if (/Enhanced|Premium/i.test(n)) s += 18;
    if (/Zira|David|Mark|compact|espeak/i.test(n)) s -= 25;   // robotic legacy voices
    if (v.localService === false) s += 12;                    // network voices tend to be nicer
    return s;
  }
  function pickVoice() {
    const voices = speechSynthesis.getVoices() || [];
    if (!voices.length) return null;
    return voices.slice().sort((a, b) => scoreVoice(b) - scoreVoice(a))[0];
  }

  function browserSay(text) {
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      const v = pickVoice();
      if (v) { u.voice = v; u.lang = v.lang; }
      // Natural voices read best at ~natural pace; legacy voices a touch faster
      u.rate = v && /Natural|Neural|Online|Google/i.test(v.name) ? 1.0 : 1.05;
      u.pitch = 1.0;
      speechSynthesis.speak(u);
    } catch (e) { console.warn('[voice] browser speech unavailable — continuing silently', e); }
  }

  /* Voice priority: cloud TTS (Gemini or Amazon Polly — server picks based
     on which credentials are set) → native speechSynthesis. */
  function say(text) {
    if (!cloudReady) return browserSay(text);
    try {
      try { speechSynthesis.cancel(); } catch (e) {}
      if (!ttsAudio) ttsAudio = new Audio();
      ttsAudio.onerror = () => {                 // bad creds / network → fall back
        console.warn('[voice] cloud TTS playback failed — falling back to browser speech');
        browserSay(text);
      };
      ttsAudio.pause();
      const voiceParam = (window.App && window.App.state && window.App.state.voice) ? `&voice=${encodeURIComponent(window.App.state.voice)}` : '';
      ttsAudio.src = `/api/tts?text=${encodeURIComponent(text)}${voiceParam}`;
      const pr = ttsAudio.play();
      if (pr && pr.catch) pr.catch(e => { console.warn('[voice] cloud TTS play() rejected', e); browserSay(text); });
    } catch (e) {
      console.warn('[voice] cloud TTS request failed — falling back to browser speech', e);
      browserSay(text);
    }
  }

  function reply(text, opts = {}) {
    show('reply');
    el().classList.remove('listening');
    replyEl().style.display = '';
    replyEl().textContent = text;
    hintsEl().style.display = 'none';
    if (!opts.silent) say(text);
    dismiss(opts.linger || 5200);
  }

  const escq = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function setHeard(text, dim) {
    // dim variant is internal copy only; user/remote-supplied text is escaped
    heardEl().innerHTML = dim ? `<span class="dim">${text}</span>` : `“${escq(text)}”`;
  }

  /* ---------------- Intent engine ---------------- */
  function normalize(t) {
    return t.toLowerCase().replace(/^(alexa|hey alexa|amazon)[,!.\s]+/, '').replace(/[?!.,]+$/g, '').trim();
  }

  function numberWord(t) {
    const map = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9 };
    const m = t.match(/\b(one|two|three|four|five|six|seven|eight|nine|[1-9])\b/);
    return m ? (map[m[1]] || parseInt(m[1], 10)) : null;
  }

  function handle(raw) {
    const t = normalize(raw);
    if (!t) { reply("Sorry, I didn't catch that. Try “show me protein powder.”"); return; }
    setHeard(t);
    const A = window.App;
    const route = A.state.route;

    // Rufus question mode (from PDP "ask with voice")
    if (mode === 'rufus' && route === 'pdp') {
      mode = 'alexa';
      const ans = A.askRufus(t);
      reply(ans ? 'Alexa: ' + ans : 'Alexa for Shopping can help on a product page.', { linger: 8000 });
      return;
    }

    /* ---- navigation ---- */
    if (/^(go |open |show |take me )?(to )?(home|home screen|main menu)$/.test(t)) { A.go('home'); reply('Here’s your home screen.'); return; }
    if (/(open|show|go to|view|check).*(cart|basket)|^(my )?cart$/.test(t)) { A.go('cart'); reply(cartReply()); return; }
    if (/(my )?orders|order history|buy again|past purchases/.test(t) && !/reorder/.test(t)) { A.go('orders'); reply('Here are your orders. You can buy anything again with one press.'); return; }
    if (/deals?|discount|on sale|offers/.test(t) && !/add|buy/.test(t)) { A.go('deals'); reply('Here are today’s protein deals.'); return; }
    if (/go back|previous screen/.test(t)) { A.goBack(); reply('Going back.', { silent: true }); return; }
    if (/^(help|what can (i|you) (say|do))$/.test(t)) {
      reply('You can say: show me chocolate protein powder — add this to my cart — sort by price — buy it now — or reorder my protein.', { linger: 8000 });
      return;
    }

    /* ---- checkout / purchase ---- */
    if (/(check ?out|place (my |the )?order|complete (my )?purchase)/.test(t)) {
      if (route === 'checkout') { document.getElementById('placeOrder')?.click(); return; }
      if (A.state.cart.length) { A.go('checkout'); reply(`Ready to check out — ${A.state.cart.length} item${A.state.cart.length > 1 ? 's' : ''}. Say “place my order” to confirm.`); }
      else reply('Your cart is empty. Try “add the Optimum Nutrition to my cart.”');
      return;
    }
    if (/reorder|order (my|the) (usual|protein|same)/.test(t)) {
      const p = A.reorderLast();
      reply(p ? `Done — I added ${p.short} from your last order to the cart. Say “checkout” when ready.` : 'I couldn’t find a past order to reorder.');
      return;
    }
    if (/(buy|purchase|order) (it|this|that|now)|^buy now$/.test(t)) {
      const p = targetProduct(t);
      if (p) { A.buyNow(p.id); reply(`Okay — buying ${p.short}. Review and say “place my order.”`); }
      else reply('Open a product first, or say “buy the Jocko protein.”');
      return;
    }

    /* ---- add to cart ---- */
    if (/(add|put|throw).*(cart|basket)|^add (it|this|that)$/.test(t)) {
      const qty = numberWord(t) || 1;
      const p = targetProduct(t);
      if (p) {
        const sns = /subscribe|save/.test(t);
        A.addToCart(p.id, { qty, sns });
        reply(`Added ${qty > 1 ? qty + ' of ' : ''}${p.short} to your cart${sns ? ' with Subscribe & Save' : ''}. Total is ${A.state.cart.reduce((a, i) => a + i.qty, 0)} item${A.state.cart.length > 1 ? 's' : ''}.`);
      } else reply('Which one? Focus a product or say the brand, like “add Orgain to my cart.”');
      return;
    }
    if (/subscribe (and|&) save/.test(t)) {
      const p = targetProduct(t);
      if (p) { A.addToCart(p.id, { sns: true }); reply(`Subscribed — ${p.short} will deliver monthly at ${p.sns}% off.`); }
      else reply('Open a product to subscribe.');
      return;
    }

    /* ---- sort & filter (results) ---- */
    if (/sort.*(price|cheap|low)/.test(t)) { ensureResults(); A.setSort(/high/.test(t) ? 'price-desc' : 'price-asc'); reply('Sorted by price.'); return; }
    if (/sort.*(rating|review|best)/.test(t)) { ensureResults(); A.setSort('rating'); reply('Sorted by customer rating.'); return; }
    if (/cheapest|lowest price/.test(t)) { ensureResults(); A.setSort('price-asc'); reply('Here’s the cheapest first.'); return; }
    if (/(only |show |filter )?(plant|vegan|dairy.?free)/.test(t) && /protein|powder|option|one|show|filter|only/.test(t)) {
      ensureResults(); A.setFilterType('plant'); reply('Filtered to plant-based options.'); return;
    }
    if (/filter|only|just/.test(t) && /chocolate/.test(t)) { ensureResults(); A.setFilterFlavor('chocolate'); reply('Chocolate only — done.'); return; }
    if (/filter|only|just/.test(t) && /vanilla/.test(t)) { ensureResults(); A.setFilterFlavor('vanilla'); reply('Vanilla only — done.'); return; }
    if (/clear (the )?filters?|show (me )?(all|everything)/.test(t)) { ensureResults(); A.clearFilters(); reply('Cleared — showing everything.'); return; }

    /* ---- product questions (Rufus handoff) ---- */
    if (route === 'pdp' && /(how much|how many|is it|does it|what.*(taste|flavor|protein|serving)|gluten|vegan|worth|good for)/.test(t)) {
      const ans = A.askRufus(t);
      reply('Alexa: ' + ans, { linger: 9000 });
      return;
    }
    if (/read.*(review|rating)|what (do|are) (customers|people|reviews) say/.test(t)) {
      const p = targetProduct(t) || A.focusedProduct();
      if (p) { if (route !== 'pdp') A.openProduct(p.id); reply(`Customers say: ${p.customersSay}`, { linger: 10000 }); }
      else reply('Open a product and I’ll read its reviews.');
      return;
    }

    /* ---- open a specific product by name ---- */
    const byName = matchProduct(t);
    if (byName && /show|open|view|tell me about|look at|go to/.test(t)) {
      A.openProduct(byName.id);
      reply(`${byName.short} — ${byName.rating} stars, ${byName.protein} protein, $${byName.price.toFixed(2)}.`);
      return;
    }

    /* ---- search (default shopping intent) ---- */
    const searchM = t.match(/(?:search(?: for)?|find|show me|look for|i (?:want|need)|shop for|get me)\s+(.+)/);
    if (searchM || /protein|powder|whey|creatine|supplement/.test(t)) {
      const q = (searchM ? searchM[1] : t).replace(/\b(some|a|an|the|please|on amazon)\b/g, '').trim();
      A.doSearch(q || 'protein powder');
      const n = A.filteredProducts().length;
      reply(`Here ${n === 1 ? 'is' : 'are'} ${n} result${n === 1 ? '' : 's'} for ${q || 'protein powder'}.`);
      return;
    }

    if (byName) { App.openProduct(byName.id); reply(`Opening ${byName.short}.`); return; }
    reply(`I heard “${t}” — try “show me protein powder,” or “add this to my cart.”`);
  }

  function cartReply() {
    const c = window.App.state.cart;
    if (!c.length) return 'Your cart is empty.';
    const n = c.reduce((a, i) => a + i.qty, 0);
    const total = c.reduce((a, i) => a + i.price * i.qty, 0);
    return `You have ${n} item${n > 1 ? 's' : ''} — total $${total.toFixed(2)}. Say “checkout” when you’re ready.`;
  }
  function ensureResults() {
    if (!['results', 'deals'].includes(window.App.state.route)) {
      window.App.state.query = window.App.state.query || 'protein powder';
      window.App.go('results');
    }
  }
  const GENERIC = new Set(['protein', 'powder', 'whey', 'plant', 'organic', 'vanilla', 'chocolate', 'grass', 'isolate', 'casein', 'nutrition', 'genuine', 'standard', 'micellar', 'ingredient', 'superfoods']);
  function matchProduct(t) {
    const A = window.App;
    const cleanT = t.toLowerCase().replace(/s\b/g, '');
    return A.catalog.find(p => {
      const brandWords = p.brand.toLowerCase().split(/\s+/).map(w => w.replace(/s$/, '')).filter(w => w.length > 3 && !GENERIC.has(w));
      if (brandWords.some(w => cleanT.includes(w))) return true;
      const words = p.short.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).map(w => w.replace(/s$/, '')).filter(w => w.length > 4 && !GENERIC.has(w));
      return words.some(w => cleanT.includes(w));
    });
  }
  function targetProduct(t) {
    return matchProduct(t) || window.App.focusedProduct();
  }

  /* ---------------- Recognition ---------------- */
  function start(m) {
    mode = m || 'alexa';
    if (listening) return;
    replyEl().style.display = 'none';
    hintsEl().style.display = '';
    setHeard(mode === 'rufus' ? 'Ask Alexa anything about this product…' : 'Try: “add this to my cart” · “show me chocolate protein”', true);
    show('listening');
    SFX.listen();

    if (!SR) {
      // No speech engine (e.g. Safari/permissions) — graceful typed fallback
      setHeard('Voice input isn’t available in this browser — type your command:', true);
      setTimeout(() => {
        const typed = prompt('Alexa (typed fallback) — what would you like?');
        if (typed) handle(typed); else dismiss(200);
      }, 50);
      return;
    }
    listening = true;
    rec = new SR();
    rec.lang = 'en-US';
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = e => {
      let interim = '', final = '';
      for (const r of e.results) (r.isFinal ? final += r[0].transcript : interim += r[0].transcript);
      if (interim) setHeard(interim.trim());
      if (final) { stopRec(); SFX.done(); show('thinking'); setTimeout(() => handle(final), 250); }
    };
    rec.onerror = e => {
      stopRec();
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        setHeard('Microphone blocked — allow mic access, or use your phone remote’s mic.', true);
        dismiss(4200);
      } else if (e.error === 'no-speech') { setHeard('Didn’t hear anything.', true); dismiss(2000); }
      else dismiss(1500);
    };
    rec.onend = () => { if (listening) { stopRec(); dismiss(400); } };
    try {
      rec.start();
    } catch (e) {
      console.warn('[voice] speech recognition could not start', e);
      setHeard('Voice input couldn’t start — try again, or use your phone remote’s mic.', true);
      stopRec();
      dismiss(3000);
    }
  }

  function toggle() {
    if (el().classList.contains('show') && listening) { stopRec(); dismiss(150); }
    else start('alexa');
  }

  /* transcript arriving from the phone remote */
  function fromRemote(transcript) {
    show('thinking');
    setHeard(transcript);
    setTimeout(() => handle(transcript), 250);
  }

  // Preload voices (Chrome loads async)
  try {
    speechSynthesis.getVoices();
    speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices();
  } catch (e) { console.info('[voice] speechSynthesis unavailable in this browser', e.message); }

  return { start, toggle, dismiss: () => dismiss(0), say, handle, fromRemote, get listening() { return listening; } };
})();
window.Voice = Voice;
