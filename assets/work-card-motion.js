// Shared motion system for the thumbnail-led work-card grids on the home,
// Product Design, and Brand & Visual pages. Exposes helpers on
// window.WorkCardMotion; each page wires them to its own observer/filter.
(() => {
  "use strict";

  // Palette presets (from the 5-3C family — 6 presets).
  const presets = [
    { angle:"102deg", a1:"hsla(198 82% 72% / 0.44)", a2:"hsla(248 74% 80% / 0.36)", a3:"hsla(324 72% 81% / 0.40)", a4:"hsla(36 80% 78% / 0.34)", t1:"hsl(198 58% 56%)", t2:"hsl(248 58% 70%)", t3:"hsl(324 60% 72%)", t4:"hsl(36 58% 62%)" },
    { angle:"96deg",  a1:"hsla(222 84% 62% / 0.48)", a2:"hsla(198 80% 74% / 0.34)", a3:"hsla(274 62% 80% / 0.32)", a4:"hsla(36 74% 80% / 0.28)",  t1:"hsl(222 62% 52%)", t2:"hsl(198 56% 60%)", t3:"hsl(274 50% 72%)", t4:"hsl(36 54% 66%)" },
    { angle:"110deg", a1:"hsla(40 80% 74% / 0.38)",  a2:"hsla(320 70% 76% / 0.42)", a3:"hsla(266 62% 80% / 0.34)", a4:"hsla(194 78% 74% / 0.32)", t1:"hsl(40 56% 62%)",  t2:"hsl(320 58% 68%)", t3:"hsl(266 52% 72%)", t4:"hsl(194 56% 60%)" },
    { angle:"90deg",  a1:"hsla(206 86% 70% / 0.46)", a2:"hsla(232 86% 60% / 0.42)", a3:"hsla(274 62% 78% / 0.28)", a4:"hsla(42 72% 82% / 0.22)",  t1:"hsl(206 62% 56%)", t2:"hsl(232 62% 52%)", t3:"hsl(274 50% 72%)", t4:"hsl(42 54% 70%)" },
    { angle:"108deg", a1:"hsla(42 78% 78% / 0.34)",  a2:"hsla(28 84% 72% / 0.28)",  a3:"hsla(314 68% 76% / 0.40)", a4:"hsla(196 78% 76% / 0.30)", t1:"hsl(42 58% 68%)",  t2:"hsl(28 60% 62%)",  t3:"hsl(314 58% 70%)", t4:"hsl(196 56% 62%)" },
    { angle:"100deg", a1:"hsla(202 70% 84% / 0.30)", a2:"hsla(248 62% 82% / 0.32)", a3:"hsla(330 62% 84% / 0.28)", a4:"hsla(48 70% 84% / 0.24)",  t1:"hsl(202 52% 66%)", t2:"hsl(248 50% 72%)", t3:"hsl(330 52% 74%)", t4:"hsl(48 52% 72%)" }
  ];

  const pickPreset = () => presets[Math.floor(Math.random() * presets.length)];
  const whole = (min, max) => Math.round(min + Math.random() * (max - min));

  const applyPreset = (target, preset) => {
    target.style.setProperty("--angle", preset.angle);
    target.style.setProperty("--a1", preset.a1);
    target.style.setProperty("--a2", preset.a2);
    target.style.setProperty("--a3", preset.a3);
    target.style.setProperty("--a4", preset.a4);
    target.style.setProperty("--t1", preset.t1);
    target.style.setProperty("--t2", preset.t2);
    target.style.setProperty("--t3", preset.t3);
    target.style.setProperty("--t4", preset.t4);
  };

  const triggerReveal = (item, delay) => {
    const speed = parseInt(item.dataset.speed || "900", 10);
    item.style.setProperty("--delay", `${delay}ms`);
    item.style.setProperty("--dur", `${speed}ms`);
    item.classList.remove("is-on");
    requestAnimationFrame(() => requestAnimationFrame(() => item.classList.add("is-on")));
  };

  // Assign a fresh palette to a card and stagger its .rr items into view.
  const revealCard = (card, baseDelay) => {
    applyPreset(card, pickPreset());
    const order = { image: 0, meta: 1, title: 2, body: 3 };
    const sorted = [...card.querySelectorAll(".rr")].sort(
      (a, b) => (order[a.dataset.role] ?? 2) - (order[b.dataset.role] ?? 2),
    );
    let cursor = baseDelay;
    sorted.forEach((item) => {
      cursor += whole(20, 48);
      triggerReveal(item, cursor);
    });
  };

  // Reveal cards once when they scroll into view.
  // getDelay(index) sets the per-card stagger; isVisible narrows the index
  // pool to currently-shown cards (used by the filterable grids).
  const observeCards = (cards, { threshold, rootMargin, getDelay, isVisible } = {}) => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const card = entry.target;
        if (!entry.isIntersecting || card._revealed) return;
        card._revealed = true;
        observer.unobserve(card);
        const pool = isVisible ? cards.filter(isVisible) : cards;
        revealCard(card, getDelay ? getDelay(pool.indexOf(card)) : 0);
      });
    }, { threshold, rootMargin });
    cards.forEach((card) => observer.observe(card));
  };

  const initCardHovers = (cards) => {
    cards.forEach((card) => {
      const cardImage = card.querySelector(".card-image");
      const trioTexts = [...card.querySelectorAll(".card-title, .card-desc, .pill")];

      const startTextHover = () => {
        applyPreset(card, pickPreset());
        trioTexts.forEach((el) => {
          el.style.setProperty("--hover-shift", `${whole(18, 78)}%`);
          el.classList.remove("is-exiting");
          el.classList.add("is-hovered");
        });
        if (cardImage) {
          cardImage.classList.remove("hover-leaving");
          cardImage.classList.add("hover-active");
        }
      };

      const startTextExit = () => {
        trioTexts.forEach((el) => {
          el.classList.remove("is-hovered");
          el.classList.add("is-exiting");
          clearTimeout(el._exitTimer);
          el._exitTimer = setTimeout(() => {
            el.classList.remove("is-exiting");
            el.style.removeProperty("--hover-shift");
          }, 560);
        });
        if (cardImage) {
          cardImage.classList.remove("hover-active");
          cardImage.classList.add("hover-leaving");
          clearTimeout(cardImage._leaveTimer);
          cardImage._leaveTimer = setTimeout(() => {
            cardImage.classList.remove("hover-leaving");
          }, 920);
        }
      };

      card.addEventListener("pointerenter", () => {
        card.classList.add("is-hovering");
        startTextHover();
      });

      card.addEventListener("pointerleave", () => {
        card.classList.remove("is-hovering", "is-pressing", "is-held");
        startTextExit();
      });

      card.addEventListener("pointerdown", () => card.classList.add("is-pressing"));
      card.addEventListener("pointerup", () => card.classList.remove("is-pressing"));

      card.addEventListener("click", () => {
        const href = card.dataset.href;
        if (!href) return;
        card.classList.add("is-held");
        clearTimeout(card._holdTimer);
        card._holdTimer = setTimeout(() => card.classList.remove("is-held"), 920);
        setTimeout(() => {
          if (card.dataset.external === "true") {
            window.open(href, "_blank", "noopener");
          } else {
            window.location.href = href;
          }
        }, 120);
      });
    });
  };

  // Category filter shared by the Product Design and Brand & Visual grids.
  // Returns the full card list so the caller can drive the reveal observer.
  const initWorkFilter = () => {
    const filterBtns = [...document.querySelectorAll(".filter-btn")];
    const cards = [...document.querySelectorAll(".work-card")];
    const countLabel = document.getElementById("count-label");

    const updateCount = (visible) => {
      countLabel.textContent = `${visible} project${visible !== 1 ? "s" : ""}`;
    };

    const applyFilter = (filter) => {
      let visible = 0;
      cards.forEach((card) => {
        const cats = (card.dataset.cat || "").split(" ");
        const isAi = cats.includes("ai");
        // AI-only cards live outside the normal project set:
        // hidden on "All", shown only under the "AI" tab.
        const show = filter === "ai" ? isAi : (filter === "all" ? !isAi : cats.includes(filter));
        card.dataset.hidden = show ? "false" : "true";
        if (show) visible++;
      });
      if (filter === "ai") {
        countLabel.textContent = "12 AI products";
      } else {
        updateCount(visible);
      }
    };

    filterBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        filterBtns.forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        applyFilter(btn.dataset.filter);
      });
    });

    // Initial state — hide AI-only cards and set the correct count.
    applyFilter("all");
    return cards;
  };

  window.WorkCardMotion = { pickPreset, applyPreset, revealCard, observeCards, initCardHovers, initWorkFilter };
})();
