/* ============================================================
   Amazon Shopping on Fire TV — application core
   Screens: home / search / results / pdp / cart / checkout /
            confirm / orders (+deals variant of results)
   ============================================================ */

(() => {
  const { CATALOG, CDN, BRAND_COLORS, SUGGESTIONS, RUFUS_SUMMARY, ACCOUNT, SEED_ORDERS } = window.AMZ_DATA;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- persistent state ---------- */
  const store = {
    load(k, d) {
      try {
        return JSON.parse(localStorage.getItem('amztv.' + k)) ?? d;
      } catch (e) {
        console.warn(`[store] unreadable value for ${k} — falling back to the default`, e);
        return d;
      }
    },
    // Storage can be full or blocked (private mode); a failed save must not
    // abort the interaction that triggered it.
    save(k, v) {
      try {
        localStorage.setItem('amztv.' + k, JSON.stringify(v));
      } catch (e) {
        console.warn(`[store] could not persist ${k} — this session only`, e);
      }
    },
  };

  const state = {
    route: 'home',
    stack: [],                      // back navigation
    cart: store.load('cart', []),   // {productId, qty, flavor, size, sns, price}
    orders: store.load('orders', SEED_ORDERS),
    query: '',
    filters: { prime: false, brands: new Set(), types: new Set(), flavors: new Set(), rating4: false, under35: false },
    sort: 'featured',
    dealsOnly: false,
    pdp: null,                      // {product, flavor, sizeIdx, qty, sns, imgIdx}
    shipOpt: 0,
    lastConfirm: null,
    voice: 'Kore',
  };

  let onboardDone = false; // intro overlay dismissed?

  /* ---------- helpers ---------- */
  const money = n => { const [d, c] = n.toFixed(2).split('.'); return `<span class="price">$${d}<sup>${c}</sup></span>`; };
  const moneyFlat = n => '$' + n.toFixed(2);
  const starIcons = r => { let s = ''; for (let i = 1; i <= 5; i++) s += i <= Math.round(r) ? '★' : '☆'; return s; };
  const fmtCount = n => n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '') + 'K' : String(n);
  const product = id => CATALOG.find(p => p.id === id);

  function productImg(p, size) {
    if (!p.img) return null;
    const sz = p.imgSize ? `._AC_${p.imgSize}_.jpg` : `._AC_SL${size || 600}_.jpg`;
    return `https://m.media-amazon.com/images/I/${p.img}${sz}`;
  }
  function tileHTML(p, size) {
    const src = productImg(p, size);
    if (src) return `<img src="${src}" alt="" loading="lazy" onerror="this.parentNode.innerHTML=App.phTile('${p.id}')">`;
    return App.phTile(p.id);
  }
  function phTile(id) {
    const p = product(id);
    const [bg, fg] = BRAND_COLORS[p.brand] || ['#2b3a4a', '#dfe7ee'];
    return `<div class="ph-tile"><div class="ph-jar" data-initial="${esc(p.brand[0])}" style="background:${bg};color:${fg}"></div><div class="ph-brand">${esc(p.brand)}</div></div>`;
  }

  const deliveryDate = (days) => {
    const d = new Date(); d.setDate(d.getDate() + days);
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };
  const todayStr = () => new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  function cartCount() { return state.cart.reduce((a, i) => a + i.qty, 0); }
  function cartSubtotal() { return state.cart.reduce((a, i) => a + i.price * i.qty, 0); }
  function snsSavings() { return state.cart.reduce((a, i) => a + (i.sns ? (product(i.productId).price * (product(i.productId).sns / 100)) * i.qty : 0), 0); }

  function updateCartBadge() {
    const b = $('#cartBadge'), n = cartCount();
    b.style.display = n ? 'inline-flex' : 'none';
    b.textContent = n;
  }

  /* ---------- toasts ---------- */
  function toast(title, sub, blue) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `<div class="t-ico${blue ? ' blue' : ''}">${blue
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="7" y="2" width="10" height="20" rx="2.5"/><path d="M11 18.5h2"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><path d="m4.5 12.5 5 5 10-11"/></svg>'}</div>
      <div><div class="t-title">${esc(title)}</div>${sub ? `<div class="t-sub">${esc(sub)}</div>` : ''}</div>`;
    $('#toasts').appendChild(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 320); }, 3400);
  }

  /* ============================================================
     ROUTER
     ============================================================ */
  const screens = { home: renderHome, search: renderSearch, results: renderResults, deals: renderResults, pdp: renderPDP, cart: renderCart, checkout: renderCheckout, confirm: renderConfirm, orders: renderOrders };

  function go(route, opts = {}) {
    if (!screens[route]) return;
    if (!opts.replace && state.route !== route) state.stack.push(state.route);
    if (state.stack.length > 12) state.stack.shift();
    state.route = route;
    state.dealsOnly = route === 'deals';
    $$('.screen').forEach(s => s.classList.remove('active'));
    const scr = $('#screen-' + (route === 'deals' ? 'results' : route));
    scr.classList.add('active');
    $$('.nav-pill').forEach(p => p.classList.toggle('active-route', p.dataset.route === route));
    screens[route](opts);
    window.Pair && Pair.sendContext(route, opts.title || '');
  }

  function goBack() {
    if (!onboardDone) { dismissOnboard(); return; }
    if ($('#alexa').classList.contains('show')) { Voice.dismiss(); return; }
    if ($('#pairPop').classList.contains('show') && state._pairManual) { togglePair(false); return; }
    const prev = state.stack.pop();
    if (prev) go(prev, { replace: true, restoreFocus: true });
    else if (state.route !== 'home') go('home', { replace: true });
  }

  /* ============================================================
     CARD component
     ============================================================ */
  function cardHTML(p, opts = {}) {
    const deal = p.listPrice && p.listPrice > p.price;
    const pct = deal ? Math.round((1 - p.price / p.listPrice) * 100) : 0;
    const badge = opts.dealBadge && deal
      ? `<span class="card-badge deal">${pct}% off</span>`
      : p.badge ? `<span class="card-badge ${p.badge === 'Best Seller' ? 'bestseller' : p.badge === "Amazon's Choice" ? 'choice' : 'pick'}">${esc(p.badge)}</span>` : '';
    return `
    <button class="card focusable" tabindex="-1" data-pid="${p.id}">
      <div class="tile">${badge}${tileHTML(p, 500)}</div>
      <div class="card-info">
        <div class="card-title">${esc(p.short || p.title)}</div>
        <div class="card-meta"><span class="stars">${starIcons(p.rating)}</span><span class="rating-count">${fmtCount(p.ratings)}</span></div>
        <div class="card-price-row">${money(p.price)}${deal ? `<span class="price-list">$${p.listPrice.toFixed(2)}</span>` : ''}</div>
        <div class="prime-mark"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 9.9 8.6H3l5.6 4-2.1 6.6 5.5-4.1 5.5 4.1-2.1-6.6 5.6-4h-6.9z" opacity="0"/><path d="M4 12.5c5 3.2 11 3.2 16-.4" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M20 12.1l1.8-.5-1 1.7z" fill="currentColor"/></svg>prime</div>
        ${p.sns ? `<div class="card-sns">Save ${p.sns}% with Subscribe &amp; Save</div>` : ''}
      </div>
    </button>`;
  }

  function bindCards(root) {
    $$('.card[data-pid]', root).forEach(c => c.addEventListener('click', () => openProduct(c.dataset.pid)));
  }

  /* ============================================================
     HOME
     ============================================================ */
  function renderHome(opts = {}) {
    const root = $('#home-scroll');
    const hero = product('optimum');
    const buyAgainIds = [...new Set(state.orders.flatMap(o => o.items.map(i => i.productId)))];
    const recommended = CATALOG.filter(p => !buyAgainIds.slice(0, 2).includes(p.id));
    const dealsList = CATALOG.filter(p => p.listPrice && p.listPrice > p.price);
    const plant = CATALOG.filter(p => p.type === 'plant' || p.tags.includes('plant'));
    const pct = Math.round((1 - hero.price / hero.listPrice) * 100);

    root.innerHTML = `
      <div class="hero" data-row>
        <div class="hero-copy">
          <span class="hero-kicker">Deal of the day · Sports Nutrition</span>
          <h1 class="hero-title">The world's best-selling whey, back at its lowest price</h1>
          <p class="hero-sub">${esc(hero.short)} — ${esc(hero.protein)} protein, ${hero.servings} servings. ${esc(hero.bought)}.</p>
          <div class="hero-price-row"><span class="hero-deal">-${pct}%</span><span class="hero-price">${moneyFlat(hero.price)}</span><span class="hero-list">${moneyFlat(hero.listPrice)}</span></div>
          <div class="hero-ctas">
            <button class="btn btn-primary focusable" tabindex="-1" id="heroShop">View deal</button>
            <button class="btn btn-ghost focusable" tabindex="-1" id="heroAdd">Add to cart</button>
          </div>
        </div>
        <div class="hero-visual"><div class="tile">${tileHTML(hero, 600)}</div></div>
      </div>

      ${buyAgainIds.length ? `
      <div class="rail" data-row>
        <div class="rail-head"><h2 class="rail-title">Buy again</h2><span class="rail-hint">Based on your orders</span></div>
        <div class="rail-track">${buyAgainIds.map(id => cardHTML(product(id))).join('')}</div>
      </div>` : ''}

      <div class="rail" data-row>
        <div class="rail-head"><h2 class="rail-title">Recommended for you</h2><span class="rail-hint">Protein powder · Because you shop Sports Nutrition</span></div>
        <div class="rail-track">${recommended.map(p => cardHTML(p)).join('')}</div>
      </div>

      <div class="rail" data-row>
        <div class="rail-head"><h2 class="rail-title">Today's deals on protein</h2></div>
        <div class="rail-track">${dealsList.map(p => cardHTML(p, { dealBadge: true })).join('')}</div>
      </div>

      ${plant.length ? `
      <div class="rail" data-row>
        <div class="rail-head"><h2 class="rail-title">Plant-based picks</h2></div>
        <div class="rail-track">${plant.map(p => cardHTML(p)).join('')}</div>
      </div>` : ''}
    `;
    bindCards(root);
    $('#heroShop').addEventListener('click', () => openProduct(hero.id));
    $('#heroAdd').addEventListener('click', () => addToCart(hero.id, { qty: 1 }));
    if (!opts.restoreFocus || !Focus.current || !document.contains(Focus.current)) Focus.focus($('#heroShop'));
  }

  /* ============================================================
     SEARCH (TV keyboard + voice-first)
     ============================================================ */
  function renderSearch() {
    const root = $('#search-root');
    const KEYS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789'.split('');
    root.innerHTML = `
      <div class="search-left">
        <div class="search-box">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="opacity:.55;flex-shrink:0"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
          <span class="q" id="qText"></span><span class="caret"></span>
          <span class="placeholder" id="qPh">Search Amazon</span>
        </div>
        <div class="kbd" data-row>
          ${KEYS.map(k => `<button class="key focusable" tabindex="-1" data-k="${k}">${k}</button>`).join('')}
          <button class="key wide focusable" tabindex="-1" data-k=" ">Space</button>
          <button class="key wide focusable" tabindex="-1" data-k="DEL"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-6-7z"/><path d="m12 10 4 4m0-4-4 4"/></svg></button>
          <button class="key wide focusable" tabindex="-1" data-k="GO" style="background:oklch(0.5 0.1 210/.4)">Search</button>
        </div>
        <div class="voice-tip">
          <div class="mic-dot"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg></div>
          <div>Faster with your voice — press <b>V</b> (or the mic on your remote) and say <b>“protein powder”</b></div>
        </div>
      </div>
      <div class="search-right">
        <div class="sugg-title" id="suggTitle">Trending in Health &amp; Household</div>
        <div class="sugg-list" id="suggList" data-row></div>
        <div class="sugg-title">Keep shopping for</div>
        <div class="rail-track" data-row style="padding:.9rem .2rem 1rem" id="keepRow"></div>
      </div>`;

    const update = () => {
      $('#qText').textContent = state.query;
      $('#qPh').style.display = state.query ? 'none' : '';
      const q = state.query.trim().toLowerCase();
      const matches = q ? SUGGESTIONS.filter(s => s.includes(q)) : SUGGESTIONS.slice(0, 8);
      $('#suggTitle').textContent = q ? `Suggestions for “${state.query.trim()}”` : 'Trending in Health & Household';
      $('#suggList').innerHTML = matches.map(s => `
        <button class="sugg focusable" tabindex="-1" data-q="${esc(s)}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
          <span>${q ? s.replace(q, `<b>${esc(q)}</b>`) : esc(s)}</span>
          <svg class="go" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17 17 7M9 7h8v8"/></svg>
        </button>`).join('');
      $$('#suggList .sugg').forEach(b => b.addEventListener('click', () => doSearch(b.dataset.q)));
    };
    update();

    $('#keepRow').innerHTML = CATALOG.slice(0, 4).map(p => cardHTML(p)).join('');
    bindCards($('#keepRow'));

    $$('.key', root).forEach(k => k.addEventListener('click', () => {
      const v = k.dataset.k;
      if (v === 'DEL') state.query = state.query.slice(0, -1);
      else if (v === 'GO') { doSearch(state.query || 'protein powder'); return; }
      else state.query += v === ' ' ? ' ' : v.toLowerCase();
      update();
    }));
    Focus.focus($('.key', root));
  }

  function doSearch(q) {
    state.query = q;
    resetFilters();
    toastlessSpeakContext(`Results for ${q}`);
    go('results', { title: q });
  }
  function toastlessSpeakContext() { /* context hook for remote */ }

  /* ============================================================
     RESULTS + filters + Rufus strip
     ============================================================ */
  const SORTS = [
    ['featured', 'Featured'], ['price-asc', 'Price: Low to High'],
    ['price-desc', 'Price: High to Low'], ['rating', 'Avg. Customer Review'],
  ];
  function resetFilters() {
    state.filters = { prime: false, brands: new Set(), types: new Set(), flavors: new Set(), rating4: false, under35: false };
    state.sort = 'featured';
  }

  function cleanSearchQuery(q) {
    const stops = new Set(['the', 'one', 'with', 'taste', 'tastes', 'flavor', 'flavors', 'show', 'me', 'want', 'need', 'some', 'of', 'for', 'about', 'please', 'on', 'amazon', 'find', 'search', 'get']);
    return q.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 0 && !stops.has(w))
      .map(w => w.replace(/s$/, ''))
      .filter(w => w.length > 0);
  }

  function filteredProducts() {
    const f = state.filters;
    const q = (state.query || '').trim();
    const keywords = q ? cleanSearchQuery(q) : [];
    let list = CATALOG.filter(p => {
      if (state.dealsOnly && !(p.listPrice && p.listPrice > p.price)) return false;
      if (keywords.length > 0) {
        const targetStr = (p.title + ' ' + p.brand + ' ' + p.tags.join(' ')).toLowerCase().replace(/s\b/g, '');
        const matched = keywords.every(kw => targetStr.includes(kw));
        if (!matched) return false;
      }
      if (f.brands.size && !f.brands.has(p.brand)) return false;
      if (f.types.size && !f.types.has(p.type)) return false;
      if (f.flavors.size && ![...f.flavors].some(fl => p.tags.includes(fl))) return false;
      if (f.rating4 && p.rating < 4) return false;
      if (f.under35 && p.price >= 35) return false;
      return true;
    });
    if (state.sort === 'price-asc') list.sort((a, b) => a.price - b.price);
    if (state.sort === 'price-desc') list.sort((a, b) => b.price - a.price);
    if (state.sort === 'rating') list.sort((a, b) => b.rating - a.rating || b.ratings - a.ratings);
    return list;
  }

  function renderResults() {
    const root = $('#results-root');
    const f = state.filters;
    const list = filteredProducts();
    const brands = [...new Set(CATALOG.map(p => p.brand))];
    const types = [['whey', 'Whey'], ['isolate', 'Whey Isolate'], ['plant', 'Plant-Based']];
    const flavors = [['chocolate', 'Chocolate'], ['vanilla', 'Vanilla']];
    const title = state.dealsOnly ? "Today's Deals" : (state.query || 'protein powder');

    const chk = (on) => `<span class="box">${on ? '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4"><path d="m4.5 12.5 5 5 10-11"/></svg>' : ''}</span>`;

    root.innerHTML = `
      <aside class="filter-rail screen-scroll" style="position:relative;padding-top:1.1rem" data-row>
        <div class="filter-group"><div class="filter-label">Delivery</div>
          <button class="chip focusable ${f.prime ? 'on' : ''}" tabindex="-1" data-f="prime">${chk(f.prime)}Prime — Get it tomorrow</button>
        </div>
        <div class="filter-group"><div class="filter-label">Protein type</div>
          ${types.map(([v, l]) => `<button class="chip focusable ${f.types.has(v) ? 'on' : ''}" tabindex="-1" data-f="type" data-v="${v}">${chk(f.types.has(v))}${l}</button>`).join('')}
        </div>
        <div class="filter-group"><div class="filter-label">Flavor</div>
          ${flavors.map(([v, l]) => `<button class="chip focusable ${f.flavors.has(v) ? 'on' : ''}" tabindex="-1" data-f="flavor" data-v="${v}">${chk(f.flavors.has(v))}${l}</button>`).join('')}
        </div>
        <div class="filter-group"><div class="filter-label">Brand</div>
          ${brands.map(b => `<button class="chip focusable ${f.brands.has(b) ? 'on' : ''}" tabindex="-1" data-f="brand" data-v="${esc(b)}">${chk(f.brands.has(b))}${esc(b)}</button>`).join('')}
        </div>
        <div class="filter-group"><div class="filter-label">Price &amp; Reviews</div>
          <button class="chip focusable ${f.under35 ? 'on' : ''}" tabindex="-1" data-f="under35">${chk(f.under35)}Under $35</button>
          <button class="chip focusable ${f.rating4 ? 'on' : ''}" tabindex="-1" data-f="rating4">${chk(f.rating4)}4 stars &amp; up</button>
        </div>
      </aside>
      <div class="results-main screen-scroll" style="position:relative;padding-top:1.1rem">
        <div class="results-head">
          <span class="results-title">${state.dealsOnly ? `<b>Today's Deals</b> in Sports Nutrition` : `Results for <b>“${esc(title)}”</b>`}</span>
          <span class="results-count">${list.length} of ${CATALOG.length} items</span>
          <button class="sort-pill focusable" tabindex="-1" id="sortBtn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M3 6h18M6 12h12M10 18h4"/></svg>
            Sort: ${SORTS.find(s => s[0] === state.sort)[1]}
          </button>
        </div>
        <div class="rufus-strip">
          <div class="rufus-ico"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.8 5.6L19.5 9l-5.7 1.4L12 16l-1.8-5.6L4.5 9l5.7-1.4z"/><path d="M19 14l.9 2.8 2.8.9-2.8.9L19 21.4l-.9-2.8-2.8-.9 2.8-.9z"/></svg></div>
          <div class="rufus-body">
            <div class="rufus-name">Alexa for Shopping · AI assistant</div>
            <div class="rufus-text" id="rufusText">${RUFUS_SUMMARY.results}</div>
            <div class="rufus-chips" data-row>
              ${RUFUS_SUMMARY.chips.map(c => `<button class="rufus-chip focusable" tabindex="-1" data-rq="${esc(c)}">${esc(c)}</button>`).join('')}
            </div>
          </div>
        </div>
        ${list.length ? `<div class="results-grid" data-row>${list.map(p => cardHTML(p, { dealBadge: state.dealsOnly })).join('')}</div>`
        : `<div class="empty-state" data-row><div class="big">No results with these filters</div><p style="margin:.4rem 0 1.4rem">Try removing a filter — or say “Alexa, show all protein powder”.</p><button class="btn btn-primary focusable" tabindex="-1" id="clearFilters">Clear all filters</button></div>`}
      </div>`;

    $$('.chip', root).forEach(c => c.addEventListener('click', () => {
      const kind = c.dataset.f, v = c.dataset.v;
      if (kind === 'prime') f.prime = !f.prime;
      if (kind === 'rating4') f.rating4 = !f.rating4;
      if (kind === 'under35') f.under35 = !f.under35;
      if (kind === 'brand') f.brands.has(v) ? f.brands.delete(v) : f.brands.add(v);
      if (kind === 'type') f.types.has(v) ? f.types.delete(v) : f.types.add(v);
      if (kind === 'flavor') f.flavors.has(v) ? f.flavors.delete(v) : f.flavors.add(v);
      const keep = c.dataset.f + (c.dataset.v || '');
      renderResults();
      const again = $$('.chip', root).find(x => x.dataset.f + (x.dataset.v || '') === keep);
      if (again) Focus.focus(again);
    }));

    $('#sortBtn').addEventListener('click', () => {
      const i = SORTS.findIndex(s => s[0] === state.sort);
      state.sort = SORTS[(i + 1) % SORTS.length][0];
      renderResults();
      Focus.focus($('#sortBtn'));
    });

    $$('.rufus-chip', root).forEach(c => c.addEventListener('click', () => {
      typeRufus($('#rufusText'), RUFUS_SUMMARY.answers[c.dataset.rq] || RUFUS_SUMMARY.results);
    }));

    const clearBtn = $('#clearFilters', root);
    if (clearBtn) clearBtn.addEventListener('click', () => { resetFilters(); renderResults(); });

    bindCards(root);
    const firstCard = $('.results-grid .card', root);
    Focus.focus(firstCard || clearBtn || $('.chip', root), { noScroll: true });
    $('.results-main', root).scrollTop = 0;
  }

  /* typewriter for Rufus */
  function typeRufus(el, text) {
    clearInterval(el._t);
    let i = 0;
    el.innerHTML = '<span class="cursor"></span>';
    el._t = setInterval(() => {
      i += 3;
      el.innerHTML = esc(text.slice(0, i)) + '<span class="cursor"></span>';
      if (i >= text.length) { clearInterval(el._t); el.innerHTML = esc(text); }
    }, 16);
  }

  /* ============================================================
     PDP
     ============================================================ */
  function openProduct(id) {
    const p = product(id);
    if (!p) return;
    state.pdp = { product: p, flavor: p.flavors[0], sizeIdx: 0, qty: 1, sns: false, imgIdx: 0 };
    go('pdp', { title: p.short });
  }

  function renderPDP() {
    const s = state.pdp; if (!s) return go('home', { replace: true });
    const p = s.product;
    const root = $('#pdp-scroll');
    const deal = p.listPrice && p.listPrice > p.price;
    const pct = deal ? Math.round((1 - p.price / p.listPrice) * 100) : 0;
    const basePrice = p.sizes[s.sizeIdx]?.price ?? p.price;
    const snsPrice = basePrice * (1 - (p.sns || 0) / 100);
    const gallery = p.gallery.length ? p.gallery : (p.img ? [p.img] : []);
    const similar = CATALOG.filter(x => x.id !== p.id).slice(0, 8);

    root.innerHTML = `
      <div class="pdp-wrap">
        <div class="pdp-grid">
          <div class="thumbs" data-row>
            ${gallery.map((g, i) => `<button class="thumb focusable ${i === s.imgIdx ? 'current' : ''}" tabindex="-1" data-i="${i}" data-full="${CDN(g, 800)}"><img src="${CDN(g, 200)}" alt="" onerror="this.style.display='none'"></button>`).join('') || ''}
          </div>
          <div class="pdp-stage" id="pdpStage">${gallery.length ? `<img id="pdpMain" src="${CDN(gallery[s.imgIdx], 800)}" alt="" onerror="this.parentNode.innerHTML=App.phTile('${p.id}')">` : phTile(p.id)}</div>
          <div class="pdp-info">
            <div class="pdp-brand-row"><span class="pdp-brand">Visit the ${esc(p.brand)} Store</span>${p.badge ? `<span class="card-badge ${p.badge === 'Best Seller' ? 'bestseller' : p.badge === "Amazon's Choice" ? 'choice' : 'pick'}" style="position:static">${esc(p.badge)}</span>` : ''}</div>
            <h1 class="pdp-title">${esc(p.title)}</h1>
            <div class="pdp-rating-row"><span class="num">${p.rating}</span><span class="stars">${starIcons(p.rating)}</span><span class="rating-count">${p.ratings.toLocaleString()} ratings</span></div>
            <div class="pdp-bought">${esc(p.bought || '')}</div>

            <div class="pdp-price-row">${deal ? `<span class="pdp-deal">-${pct}%</span>` : ''}<span class="pdp-price">$${(s.sns ? snsPrice : basePrice).toFixed(2)}</span><span class="pdp-unit">(${esc(p.unit)})</span></div>
            ${deal ? `<div class="pdp-list">List Price: <s>$${p.listPrice.toFixed(2)}</s></div>` : ''}

            <div class="pdp-delivery">
              <b>FREE delivery ${deliveryDate(1)}</b> with Prime. Order within <span style="color:var(--success)">4 hrs 12 mins</span>.
              <div class="loc"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s-7-6.1-7-11a7 7 0 0 1 14 0c0 4.9-7 11-7 11z"/><circle cx="12" cy="10" r="2.6"/></svg>Deliver to ${esc(ACCOUNT.name)} — ${esc(ACCOUNT.city)} ${esc(ACCOUNT.zip)}</div>
            </div>
            <div class="in-stock">In Stock</div>

            <div class="opt-label">Flavor: <b>${esc(s.flavor)}</b></div>
            <div class="opt-row" data-row>${p.flavors.map(fl => `<button class="opt focusable ${fl === s.flavor ? 'on' : ''}" tabindex="-1" data-flavor="${esc(fl)}">${esc(fl)}</button>`).join('')}</div>

            ${p.sizes.length > 1 ? `
            <div class="opt-label">Size: <b>${esc(p.sizes[s.sizeIdx].label)}</b></div>
            <div class="opt-row" data-row>${p.sizes.map((z, i) => `<button class="opt focusable ${i === s.sizeIdx ? 'on' : ''}" tabindex="-1" data-size="${i}">${esc(z.label)}<small>$${z.price.toFixed(2)}</small></button>`).join('')}</div>` : ''}

            <div class="buy-mode" data-row>
              <button class="mode-card focusable ${!s.sns ? 'on' : ''}" tabindex="-1" data-sns="0">
                <div class="mode-name">One-time purchase</div>
                <div class="mode-price">$${basePrice.toFixed(2)}</div>
                <div class="mode-sub">FREE Prime delivery ${deliveryDate(1)}</div>
              </button>
              <button class="mode-card focusable ${s.sns ? 'on' : ''}" tabindex="-1" data-sns="1">
                <div class="mode-name">Subscribe &amp; Save <span class="mode-save">-${p.sns}%</span></div>
                <div class="mode-price">$${snsPrice.toFixed(2)}</div>
                <div class="mode-sub">Auto-delivery every month · Skip or cancel anytime</div>
              </button>
            </div>

            <div class="qty-row">
              <span class="opt-label" style="margin:0">Qty:</span>
              <button class="qty-btn focusable" tabindex="-1" id="qtyMinus">−</button>
              <span class="qty-val" id="qtyVal">${s.qty}</span>
              <button class="qty-btn focusable" tabindex="-1" id="qtyPlus">+</button>
            </div>

            <div class="pdp-ctas" data-row>
              <button class="btn btn-primary focusable" tabindex="-1" id="pdpAdd">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1"><path d="M3 4h2l2.4 12.2a1.4 1.4 0 0 0 1.4 1.1h8.9a1.4 1.4 0 0 0 1.4-1.1L21 8H6"/><circle cx="10" cy="21" r="1.4" fill="currentColor"/><circle cx="17.5" cy="21" r="1.4" fill="currentColor"/></svg>
                Add to Cart</button>
              <button class="btn btn-buy focusable" tabindex="-1" id="pdpBuy">Buy Now</button>
            </div>
          </div>
        </div>

        <div class="pdp-section">
          <h2 class="sec-title">About this item</h2>
          <div class="about-cols">
            ${p.bullets.map(b => `<div class="about-li"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><path d="m4.5 12.5 5 5 10-11"/></svg><span>${esc(b)}</span></div>`).join('')}
          </div>
        </div>

        <div class="pdp-section">
          <h2 class="sec-title">Customers say <span class="ai-spark">✦</span></h2>
          <div class="customers-say">
            <div class="cs-text">${esc(p.customersSay)}</div>
            <div class="cs-note">✦ Generated from the text of customer reviews</div>
            <div class="aspect-row" data-row>
              ${p.aspects.positive.map(a => `<button class="aspect pos focusable" tabindex="-1">✓ ${esc(a)}</button>`).join('')}
              ${p.aspects.negative.map(a => `<button class="aspect neg focusable" tabindex="-1">✕ ${esc(a)}</button>`).join('')}
            </div>
          </div>
        </div>

        <div class="pdp-section">
          <h2 class="sec-title">Top reviews from the United States</h2>
          <div class="review-row" data-row>
            ${p.reviews.map(r => `
              <button class="review-card focusable" tabindex="-1">
                <div class="rev-head"><span class="stars">${starIcons(r.stars)}</span><span class="rev-title">${esc(r.title)}</span></div>
                <div class="rev-meta">${esc(r.author)} · ${esc(r.date)} · <span class="verified">Verified Purchase</span></div>
                <div class="rev-text">${esc(r.text)}</div>
              </button>`).join('')}
          </div>
        </div>

        <div class="pdp-section" id="rufusSection">
          <h2 class="sec-title">Ask Alexa for Shopping about this product <span class="ai-spark">✦</span></h2>
          <div class="rufus-panel">
            <div class="rufus-chips" data-row>
              ${p.rufus.map((qa, i) => `<button class="rufus-chip focusable" tabindex="-1" data-qi="${i}">${esc(qa.q)}</button>`).join('')}
              <button class="rufus-chip focusable" tabindex="-1" id="rufusVoice">🎤 Ask with your voice</button>
            </div>
            <div class="rufus-answer" id="rufusAnswer">Select a question — or press <b>V</b> and just ask.</div>
          </div>
        </div>

        <div class="rail" data-row style="margin-top:2.6rem">
          <div class="rail-head"><h2 class="rail-title">Customers also viewed</h2></div>
          <div class="rail-track" style="padding-left:.2rem">${similar.map(x => cardHTML(x)).join('')}</div>
        </div>
      </div>`;

    /* interactions */
    $$('.thumb', root).forEach(t => t.addEventListener('click', () => {
      s.imgIdx = +t.dataset.i;
      $$('.thumb', root).forEach(x => x.classList.toggle('current', +x.dataset.i === s.imgIdx));
      const main = $('#pdpMain'); if (main) main.src = CDN(gallery[s.imgIdx], 800);
    }));
    $$('[data-flavor]', root).forEach(b => b.addEventListener('click', () => { s.flavor = b.dataset.flavor; rerenderPDPKeep(`[data-flavor="${CSS.escape(s.flavor)}"]`); }));
    $$('[data-size]', root).forEach(b => b.addEventListener('click', () => { s.sizeIdx = +b.dataset.size; rerenderPDPKeep(`[data-size="${s.sizeIdx}"]`); }));
    $$('[data-sns]', root).forEach(b => b.addEventListener('click', () => { s.sns = b.dataset.sns === '1'; rerenderPDPKeep(`[data-sns="${b.dataset.sns}"]`); }));
    $('#qtyMinus').addEventListener('click', () => { if (s.qty > 1) { s.qty--; $('#qtyVal').textContent = s.qty; } });
    $('#qtyPlus').addEventListener('click', () => { if (s.qty < 9) { s.qty++; $('#qtyVal').textContent = s.qty; } });
    $('#pdpAdd').addEventListener('click', () => addToCart(p.id, { qty: s.qty, flavor: s.flavor, sizeIdx: s.sizeIdx, sns: s.sns }));
    $('#pdpBuy').addEventListener('click', () => buyNow(p.id));

    $$('#rufusSection .rufus-chip[data-qi]').forEach(c => c.addEventListener('click', () => askRufus(p.rufus[+c.dataset.qi].q)));
    const rv = $('#rufusVoice'); if (rv) rv.addEventListener('click', () => Voice.start('rufus'));
    bindCards(root);
    Focus.focus($('#pdpAdd'), { noScroll: true });
    root.scrollTop = 0;
  }

  function rerenderPDPKeep(sel) {
    renderPDP();
    const el = $(sel, $('#pdp-scroll'));
    if (el) Focus.focus(el, { noScroll: true });
  }

  function askRufus(question) {
    const p = state.pdp?.product; if (!p) return null;
    const qa = p.rufus.find(x => x.q.toLowerCase() === question.toLowerCase());
    let answer = qa?.a;
    if (!answer) {
      const q = question.toLowerCase();
      if (/protein|gram|much/.test(q)) answer = `${p.short} has ${p.protein} of protein per serving, across ${p.servings} servings per container.`;
      else if (/gluten/.test(q)) answer = p.tags.includes('gluten-free') ? `Yes — ${p.short} is gluten-free.` : `The listing doesn't certify ${p.short} as gluten-free — check the label if you're sensitive.`;
      else if (/vegan|plant|dairy/.test(q)) answer = p.type === 'plant' ? `Yes — it's 100% plant-based and vegan.` : `No — this is a dairy-based whey protein. For plant-based, check Orgain Organic in the results.`;
      else if (/serving|many|last/.test(q)) answer = `You get ${p.servings} servings per container at ${p.protein} protein each.`;
      else if (/taste|flavor/.test(q)) answer = p.customersSay;
      else if (/price|cost|value|worth/.test(q)) answer = `It's ${moneyFlat(p.price)} (${p.unit}). With Subscribe & Save you'd pay ${moneyFlat(p.price * (1 - p.sns / 100))} — that's ${p.sns}% off every delivery.`;
      else answer = `Based on the listing: ${p.bullets[0]}. Customers say: ${p.customersSay.split('.')[0]}.`;
    }
    const el = $('#rufusAnswer');
    if (el) {
      $('#rufusSection').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      el.classList.add('thinking'); el.textContent = 'Alexa is thinking…';
      setTimeout(() => { el.classList.remove('thinking'); typeRufus(el, answer); }, 420);
    }
    return answer;
  }

  /* ============================================================
     CART
     ============================================================ */
  function addToCart(pid, opts = {}) {
    const p = product(pid);
    const sizeIdx = opts.sizeIdx ?? 0;
    const base = p.sizes[sizeIdx]?.price ?? p.price;
    const price = opts.sns ? base * (1 - (p.sns || 0) / 100) : base;
    const flavor = opts.flavor || p.flavors[0];
    const existing = state.cart.find(i => i.productId === pid && i.flavor === flavor && i.sizeIdx === sizeIdx && i.sns === !!opts.sns);
    if (existing) existing.qty += opts.qty || 1;
    else state.cart.push({ productId: pid, qty: opts.qty || 1, flavor, sizeIdx, sns: !!opts.sns, price });
    store.save('cart', state.cart);
    updateCartBadge();
    SFX.add();
    toast('Added to Cart', `${p.short} · ${flavor}${opts.sns ? ' · Subscribe & Save' : ''}`);
    window.Pair && Pair.sendContext(state.route, `Cart: ${cartCount()} items`);
    return p;
  }

  function buyNow(pid) {
    const s = state.pdp;
    addToCart(pid, s && s.product.id === pid ? { qty: s.qty, flavor: s.flavor, sizeIdx: s.sizeIdx, sns: s.sns } : { qty: 1 });
    go('checkout');
  }

  function renderCart() {
    const root = $('#cart-root');
    if (!state.cart.length) {
      root.innerHTML = `<div class="empty-state" style="grid-column:1/-1;align-self:center">
        <div class="big">Your Amazon Cart is empty</div>
        <p style="margin:.5rem 0 1.5rem">Check today's deals, or say “Alexa, show me protein powder”.</p>
        <button class="btn btn-primary focusable" tabindex="-1" id="emptyShop">Shop protein powder</button></div>`;
      $('#emptyShop').addEventListener('click', () => { state.query = 'protein powder'; go('results'); });
      Focus.focus($('#emptyShop'));
      return;
    }
    const sub = cartSubtotal();
    root.innerHTML = `
      <div class="cart-list screen-scroll" style="position:relative;padding-top:1rem">
        <h1 class="cart-h">Shopping Cart</h1>
        <div class="cart-sub">${cartCount()} item${cartCount() > 1 ? 's' : ''} · Price</div>
        ${state.cart.map((i, idx) => {
          const p = product(i.productId);
          return `<div class="cart-item" data-row>
            <div class="tile">${tileHTML(p, 300)}</div>
            <div>
              <div class="ci-title">${esc(p.title)}</div>
              <div class="ci-flavor">Flavor: ${esc(i.flavor)}${p.sizes[i.sizeIdx] ? ` · ${esc(p.sizes[i.sizeIdx].label)}` : ''}</div>
              ${i.sns ? `<div class="ci-sns">↻ Subscribe &amp; Save — ${p.sns}% off, delivers monthly</div>` : ''}
              <div class="ci-stock">In Stock · FREE Prime delivery ${deliveryDate(1)}</div>
              <div class="ci-actions">
                <button class="qty-btn focusable" tabindex="-1" data-dec="${idx}" style="width:2.1rem;height:2.1rem;font-size:1.05rem">−</button>
                <span class="qty-val" style="font-size:1rem">${i.qty}</span>
                <button class="qty-btn focusable" tabindex="-1" data-inc="${idx}" style="width:2.1rem;height:2.1rem;font-size:1.05rem">+</button>
                <button class="ci-link focusable" tabindex="-1" data-del="${idx}">Delete</button>
                <button class="ci-link focusable" tabindex="-1" data-view="${i.productId}">View item</button>
              </div>
            </div>
            <div class="ci-right"><div class="ci-price">$${(i.price * i.qty).toFixed(2)}</div></div>
          </div>`;
        }).join('')}
      </div>
      <div class="summary-card" data-row>
        <div class="sum-row"><span>Subtotal (${cartCount()} item${cartCount() > 1 ? 's' : ''})</span><b>$${sub.toFixed(2)}</b></div>
        ${snsSavings() > 0 ? `<div class="sum-row green"><span>Subscribe &amp; Save</span><span>−$${snsSavings().toFixed(2)}</span></div>` : ''}
        <div class="sum-row green"><span>Prime delivery</span><span>FREE</span></div>
        <div class="sum-total"><span>Order total</span><span style="color:var(--amz-yellow)">$${sub.toFixed(2)}</span></div>
        <button class="btn btn-primary focusable" tabindex="-1" id="toCheckout">Proceed to checkout</button>
        <button class="btn btn-ghost focusable" tabindex="-1" id="keepShopping" style="width:100%;margin-top:.6rem">Continue shopping</button>
        <div class="sum-note">🔒 Amazon-secured checkout</div>
      </div>`;

    $$('.qty-btn[data-inc]', root).forEach(b => b.addEventListener('click', () => { state.cart[+b.dataset.inc].qty++; saveCartRerender(); }));
    $$('.qty-btn[data-dec]', root).forEach(b => b.addEventListener('click', () => {
      const i = +b.dataset.dec;
      state.cart[i].qty > 1 ? state.cart[i].qty-- : state.cart.splice(i, 1);
      saveCartRerender();
    }));
    $$('.ci-link[data-del]', root).forEach(b => b.addEventListener('click', () => { state.cart.splice(+b.dataset.del, 1); saveCartRerender(); }));
    $$('.ci-link[data-view]', root).forEach(b => b.addEventListener('click', () => openProduct(b.dataset.view)));
    $('#toCheckout').addEventListener('click', () => go('checkout'));
    $('#keepShopping').addEventListener('click', () => go('home'));
    Focus.focus($('#toCheckout'));
  }
  function saveCartRerender() { store.save('cart', state.cart); updateCartBadge(); renderCart(); }

  /* ============================================================
     CHECKOUT
     ============================================================ */
  const SHIP_OPTS = [
    { name: () => `FREE Prime Delivery — <b>${deliveryDate(1)}</b>`, sub: 'Your everyday delivery speed', cost: 0 },
    { name: () => `Same-Day Delivery — <b>Today by 10 PM</b>`, sub: 'On orders over $25', cost: 2.99 },
    { name: () => `No-Rush Delivery — ${deliveryDate(5)}`, sub: 'Earn $1.50 in digital rewards', cost: 0 },
  ];

  function renderCheckout() {
    if (!state.cart.length) return go('cart', { replace: true });
    const root = $('#checkout-root');
    const sub = cartSubtotal();
    const ship = SHIP_OPTS[state.shipOpt];
    const tax = sub * 0.0863;
    const total = sub + tax + ship.cost;

    root.innerHTML = `
      <div class="co-main screen-scroll" style="position:relative;padding-top:1rem">
        <h1 class="cart-h">Checkout <span style="color:var(--ink-faint);font-size:1rem;font-weight:600">(${cartCount()} item${cartCount() > 1 ? 's' : ''})</span></h1>
        <div class="co-step"><div class="co-num">1</div>
          <div class="co-card"><h3>Delivery address <button class="co-change focusable" tabindex="-1">Change</button></h3>
          <p><b>${esc(ACCOUNT.name)} Umehara</b><br>${esc(ACCOUNT.address)}</p></div>
        </div>
        <div class="co-step"><div class="co-num">2</div>
          <div class="co-card"><h3>Payment method <button class="co-change focusable" tabindex="-1">Change</button></h3>
          <p>${esc(ACCOUNT.payment)} · <span style="color:var(--ink-faint)">1-Click enabled</span></p></div>
        </div>
        <div class="co-step"><div class="co-num">3</div>
          <div class="co-card"><h3>Delivery options</h3>
            ${SHIP_OPTS.map((o, i) => `
            <button class="ship-opt focusable ${i === state.shipOpt ? 'on' : ''}" tabindex="-1" data-ship="${i}">
              <span class="radio"></span>
              <span><span class="ship-name">${o.name()}${o.cost ? ` · $${o.cost.toFixed(2)}` : ''}</span><br><span class="ship-sub">${o.sub}</span></span>
            </button>`).join('')}
          </div>
        </div>
        <div class="co-step"><div class="co-num">4</div>
          <div class="co-card"><h3>Items</h3>
            ${state.cart.map(i => { const p = product(i.productId); return `<p style="margin-bottom:.4rem">• ${esc(p.short)} — ${esc(i.flavor)} × ${i.qty} <b style="color:var(--ink)">$${(i.price * i.qty).toFixed(2)}</b>${i.sns ? ' <span style="color:var(--success);font-size:.85em">↻ S&S</span>' : ''}</p>`; }).join('')}
          </div>
        </div>
      </div>
      <div class="summary-card" data-row>
        <button class="btn btn-primary focusable" tabindex="-1" id="placeOrder" style="margin:0 0 1.1rem">Place your order</button>
        <div class="sum-row"><span>Items:</span><b>$${sub.toFixed(2)}</b></div>
        <div class="sum-row"><span>Shipping:</span><b>${ship.cost ? '$' + ship.cost.toFixed(2) : 'FREE'}</b></div>
        <div class="sum-row"><span>Estimated tax:</span><b>$${tax.toFixed(2)}</b></div>
        <div class="sum-total"><span>Order total</span><span style="color:var(--amz-yellow)">$${total.toFixed(2)}</span></div>
        <div class="sum-note">By placing your order, you agree to Amazon's privacy notice and conditions of use.</div>
      </div>`;

    $$('[data-ship]', root).forEach(b => b.addEventListener('click', () => { state.shipOpt = +b.dataset.ship; renderCheckout(); Focus.focus($(`[data-ship="${state.shipOpt}"]`, root)); }));
    $$('.co-change', root).forEach(b => b.addEventListener('click', () => toast('Demo account', 'Address & payment are fixed in this proof of concept', true)));
    $('#placeOrder').addEventListener('click', placeOrder);
    Focus.focus($('#placeOrder'));
  }

  function placeOrder() {
    const sub = cartSubtotal();
    const ship = SHIP_OPTS[state.shipOpt];
    const total = sub + sub * 0.0863 + ship.cost;
    const order = {
      id: '112-' + String(Math.floor(Math.random() * 9e6 + 1e6)) + '-' + String(Math.floor(Math.random() * 9e6 + 1e6)),
      date: todayStr(),
      status: state.shipOpt === 1 ? 'Arriving today by 10 PM' : `Arriving ${deliveryDate(state.shipOpt === 2 ? 5 : 1)}`,
      items: state.cart.map(i => ({ productId: i.productId, qty: i.qty, price: i.price, sns: i.sns })),
      total,
    };
    state.orders.unshift(order);
    store.save('orders', state.orders);
    state.lastConfirm = order;
    state.cart = [];
    store.save('cart', state.cart);
    updateCartBadge();
    SFX.add();
    go('confirm');
    Voice.say(`Order placed. It will arrive ${order.status.replace('Arriving ', '')}. Thanks, ${ACCOUNT.name}!`);
  }

  function renderConfirm() {
    const o = state.lastConfirm; if (!o) return go('home', { replace: true });
    const root = $('#confirm-root');
    const first = product(o.items[0].productId);
    root.innerHTML = `
      <svg class="check-ring" viewBox="0 0 104 104"><circle cx="52" cy="52" r="48"/><path d="M32 54 47 68 73 38"/></svg>
      <h1 class="confirm-h">Order placed, thanks ${esc(ACCOUNT.name)}!</h1>
      <p class="confirm-sub">${esc(first.short)}${o.items.length > 1 ? ` and ${o.items.length - 1} more` : ''} — <b>${esc(o.status)}</b><br>
      Confirmation sent to your Amazon app.</p>
      <div class="confirm-order">Order # ${esc(o.id)} · Total $${o.total.toFixed(2)}</div>
      <div class="confirm-ctas" data-row>
        <button class="btn btn-ghost focusable" tabindex="-1" id="cTrack">View order</button>
        <button class="btn btn-primary focusable" tabindex="-1" id="cShop">Continue shopping</button>
      </div>`;
    $('#cTrack').addEventListener('click', () => go('orders'));
    $('#cShop').addEventListener('click', () => go('home'));
    Focus.focus($('#cShop'));
  }

  /* ============================================================
     ORDERS / BUY AGAIN
     ============================================================ */
  function renderOrders() {
    const root = $('#orders-root');
    root.innerHTML = `
      <h1 class="cart-h" style="margin-bottom:1.2rem">Your Orders &amp; Buy Again</h1>
      ${state.orders.map(o => `
        <div class="order-block">
          <div class="order-head">
            <span>ORDER PLACED<b>${esc(o.date)}</b></span>
            <span>ORDER #<b style="font-size:.85rem">${esc(o.id)}</b></span>
            <span class="status">✓ ${esc(o.status)}</span>
          </div>
          <div class="order-items">
            ${o.items.map(i => { const p = product(i.productId); return `
              <div class="order-item" data-row>
                <div class="tile">${tileHTML(p, 200)}</div>
                <div>
                  <div class="ci-title">${esc(p.title)}</div>
                  <div class="ci-flavor">Qty ${i.qty} · $${(i.price * i.qty).toFixed(2)}${i.sns ? ' · Subscribe & Save' : ''}</div>
                </div>
                <div style="display:flex;gap:.6rem">
                  <button class="btn btn-primary focusable" tabindex="-1" data-again="${p.id}" style="padding:.55rem 1.2rem;font-size:.9rem">Buy it again</button>
                  <button class="btn btn-ghost focusable" tabindex="-1" data-viewp="${p.id}" style="padding:.55rem 1.2rem;font-size:.9rem">View item</button>
                </div>
              </div>`; }).join('')}
          </div>
        </div>`).join('')}`;
    $$('[data-again]', root).forEach(b => b.addEventListener('click', () => { addToCart(b.dataset.again); }));
    $$('[data-viewp]', root).forEach(b => b.addEventListener('click', () => openProduct(b.dataset.viewp)));
    Focus.focus($('[data-again]', root) || $('.nav-pill'));
  }

  /* ============================================================
     Global input & boot
     ============================================================ */
  Focus.on('back', goBack);

  /* PDP gallery: preview the big image the moment a thumbnail is focused,
     so browsing photos needs no OK press (Netflix/Prime-style live preview). */
  Focus.on('focus', el => {
    if (!el || !el.classList.contains('thumb') || !el.dataset.full) return;
    const main = document.getElementById('pdpMain');
    if (main) main.src = el.dataset.full;
    el.parentNode && el.parentNode.querySelectorAll('.thumb').forEach(t => t.classList.toggle('current', t === el));
    if (state.pdp) state.pdp.imgIdx = +el.dataset.i;
  });

  // top bar routing
  $$('[data-route]').forEach(b => b.addEventListener('click', () => {
    const r = b.dataset.route;
    if (r === 'results') { state.query = 'protein powder'; resetFilters(); }
    go(r);
  }));
  $('#btnMic').addEventListener('click', () => Voice.toggle());
  $('#btnProfile').addEventListener('click', () => toast(`Hi ${ACCOUNT.name}!`, 'Prime member · 1-Click enabled · Profile switching is out of POC scope', true));

  // keyboard shortcuts
  document.addEventListener('keydown', e => {
    if (!onboardDone) return; // onboarding: only ↵/Esc via the focus engine
    if (e.key === 'v' || e.key === 'V' || e.key === ' ' && state.route !== 'search') {
      if (e.key === ' ') e.preventDefault();
      if (e.repeat) return;
      if (e.key.toLowerCase() === 'v') Voice.toggle();
      else Voice.toggle();
    }
    if (e.key === 'r' || e.key === 'R') togglePair();
    if (e.key === 'h' || e.key === 'H') go('home');
  });
  document.addEventListener('pointermove', () => document.body.classList.add('mouse-mode'), { once: true });

  function togglePair(force, auto) {
    const el = $('#pairPop');
    const show = force !== undefined ? force : !el.classList.contains('show');
    // Only user-initiated opens count as "manual" (governs Esc-to-dismiss & auto-hide)
    if (!auto) state._pairManual = show;
    el.classList.toggle('show', show);
  }

  // clock
  const tick = () => { $('#clock').textContent = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }); };
  tick(); setInterval(tick, 20000);

  /* ---------- onboarding (concept intro, skippable) ---------- */
  function dismissOnboard(viaPair) {
    if (onboardDone) return;
    onboardDone = true;
    $('#onboard').classList.add('gone');
    document.body.classList.remove('onboarding');
    if (!Focus.focus($('#heroShop'))) Focus.focusFirst();
    if (viaPair || (window.Pair && Pair.connected)) return;
    // QR was on the intro, but keep the pairing panel handy for a moment
    setTimeout(() => { if (!state._pairManual && window.Pair && !Pair.connected) togglePair(true, true); }, 700);
    setTimeout(() => { if (!Pair.connected && !state._pairManual && $('#pairPop').classList.contains('show')) togglePair(false, true); }, 14000);
  }

  /* Public API (used by voice.js, pair.js) */
  window.App = {
    go, goBack, openProduct, addToCart, buyNow, doSearch, askRufus, toast, phTile, togglePair, dismissOnboard,
    get state() { return state; },
    get catalog() { return CATALOG; },
    filteredProducts,
    setSort(s) { state.sort = s; if (['results', 'deals'].includes(state.route)) renderResults(); },
    setFilterFlavor(fl) { state.filters.flavors = new Set(fl ? [fl] : []); if (['results', 'deals'].includes(state.route)) renderResults(); },
    setFilterType(t) { state.filters.types = new Set(t ? [t] : []); if (['results', 'deals'].includes(state.route)) renderResults(); },
    clearFilters() { resetFilters(); if (['results', 'deals'].includes(state.route)) renderResults(); },
    focusedProduct() {
      const el = Focus.current?.closest('[data-pid]');
      return el ? product(el.dataset.pid) : (state.route === 'pdp' ? state.pdp?.product : null);
    },
    reorderLast() {
      const last = state.orders[0];
      if (!last) return null;
      last.items.forEach(i => addToCart(i.productId, { qty: i.qty, sns: i.sns }));
      return product(last.items[0].productId);
    },
  };

  /* boot — splash → onboarding (app renders hidden behind it) */
  updateCartBadge();
  document.body.classList.add('onboarding');
  go('home', { replace: true });
  $('#obStart').addEventListener('click', () => dismissOnboard());
  setTimeout(() => { $('#splash').classList.add('gone'); Focus.focus($('#obStart')); }, 900);
})();
