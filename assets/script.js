/* ===================================
   ALTALOGIK — Main Script
   =================================== */

// ─────────────────────────────────────────────
// --- TUBES NEON BACKGROUND (hero, index.html) ---
// Three.js must be loaded via <script> in <head> before this runs.
// ─────────────────────────────────────────────

async function initTubesBackground() {
  const canvas = document.getElementById('tubes-canvas');
  if (!canvas) return;
  try {
    const module = await import('https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js');
    const TubesCursor = module.default;
    const app = TubesCursor(canvas, {
      tubes: {
        colors: ['#00E5A0', '#00AADD', '#0055CC'],
        lights: {
          intensity: 150,
          colors: ['#00E5A0', '#00AADD', '#0055CC', '#E8F4FF']
        }
      }
    });
    // Enable pointer events now that Three.js owns the canvas
    canvas.style.pointerEvents = 'auto';
    // Click anywhere in hero to randomise colours
    const heroEl = document.getElementById('hero');
    if (heroEl && app && app.tubes) {
      heroEl.addEventListener('click', () => {
        const rc = () => '#' + Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0');
        app.tubes.setColors([rc(), rc(), rc()]);
        app.tubes.setLightsColors([rc(), rc(), rc(), rc()]);
      });
    }
  } catch (e) {
    console.warn('Tubes background unavailable:', e);
    // Fallback: hero orbs remain visible, no layout breakage
  }
}

document.addEventListener('DOMContentLoaded', initTubesBackground);


document.addEventListener('DOMContentLoaded', () => {

  // ─────────────────────────────────────────────
  // --- STAGGERED TEXT REVEAL ---
  // Runs first so it can remove .reveal-on-scroll
  // from headings before that observer is set up.
  // ─────────────────────────────────────────────

  /**
   * Splits a heading's child nodes into per-word .word-reveal spans.
   * Preserves: <br> tags, .gradient-text class on individual word spans.
   * Skips: pure-whitespace text nodes.
   */
  function splitHeadingWords(el) {
    const children = [...el.childNodes];
    el.innerHTML = '';
    let wordIdx = 0;

    children.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        const words = node.textContent.split(/\s+/).filter(w => w.length > 0);
        words.forEach(word => {
          el.appendChild(makeWordReveal(word, false, wordIdx));
          el.appendChild(document.createTextNode('\u00A0')); // non-breaking space for spacing
          wordIdx++;
        });

      } else if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.tagName === 'BR') {
          el.appendChild(document.createElement('br'));

        } else if (node.classList.contains('gradient-text')) {
          // Split gradient-text span into individual word-reveals,
          // each inner span gets gradient-text for colour continuity.
          const words = node.textContent.split(/\s+/).filter(w => w.length > 0);
          words.forEach(word => {
            el.appendChild(makeWordReveal(word, true, wordIdx));
            el.appendChild(document.createTextNode('\u00A0'));
            wordIdx++;
          });

        } else {
          // Other elements (e.g. .line-break without gradient) — clone as-is
          el.appendChild(node.cloneNode(true));
        }
      }
    });
  }

  function makeWordReveal(word, isGradient, idx) {
    const outer = document.createElement('span');
    outer.className = 'word-reveal';

    const inner = document.createElement('span');
    inner.className = 'word-inner' + (isGradient ? ' gradient-text' : '');
    inner.textContent = word;
    inner.style.transitionDelay = (idx * 0.08) + 's';

    outer.appendChild(inner);
    return outer;
  }

  // Select all h1/h2 outside navbar and mobile overlay
  const headings = document.querySelectorAll(
    'h1:not(.navbar *):not(.nav-overlay *), h2:not(.navbar *):not(.nav-overlay *)'
  );

  headings.forEach(h => {
    // If the heading itself carries reveal-on-scroll, remove it:
    // the word stagger takes over visibility control.
    if (h.classList.contains('reveal-on-scroll')) {
      h.classList.remove('reveal-on-scroll');
      h.style.opacity  = '1';
      h.style.transform = 'none';
    }

    // Neutralise any CSS keyframe animation on the element (e.g. hero-title)
    const computed = window.getComputedStyle(h);
    if (computed.animationName && computed.animationName !== 'none') {
      h.style.animation = 'none';
      h.style.opacity   = '1';
    }

    splitHeadingWords(h);
  });

  // Observe each heading; when 30% visible, reveal its words
  if (headings.length) {
    const staggerObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.querySelectorAll('.word-inner').forEach(span => {
            span.classList.add('revealed');
          });
          staggerObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    headings.forEach(h => staggerObserver.observe(h));
  }


  // ─────────────────────────────────────────────
  // --- NAVBAR SCROLL ---
  // ─────────────────────────────────────────────

  const navbar = document.querySelector('.navbar');

  function handleNavbarScroll() {
    navbar.classList.toggle('scrolled', window.scrollY > 80);
  }

  window.addEventListener('scroll', handleNavbarScroll, { passive: true });
  handleNavbarScroll();


  // ─────────────────────────────────────────────
  // --- MOBILE HAMBURGER ---
  // ─────────────────────────────────────────────

  const hamburger  = document.querySelector('.hamburger');
  const navOverlay = document.querySelector('.nav-overlay');

  if (hamburger && navOverlay) {
    hamburger.addEventListener('click', () => {
      const isOpen = navOverlay.classList.toggle('open');
      hamburger.classList.toggle('active', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    navOverlay.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navOverlay.classList.remove('open');
        hamburger.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }


  // ─────────────────────────────────────────────
  // --- HERO MOUSE PARALLAX ---
  // ─────────────────────────────────────────────

  const heroOrb = document.querySelector('.hero-orb');

  if (heroOrb) {
    let targetX = 0, targetY = 0, currentX = 0, currentY = 0;
    const factor = 0.05;

    document.addEventListener('mousemove', (e) => {
      targetX = (e.clientX - window.innerWidth  / 2) * 0.06;
      targetY = (e.clientY - window.innerHeight / 2) * 0.06;
    });

    (function animateOrb() {
      currentX += (targetX - currentX) * factor;
      currentY += (targetY - currentY) * factor;
      heroOrb.style.transform = `translate(${currentX}px, ${currentY}px)`;
      requestAnimationFrame(animateOrb);
    })();
  }


  // ─────────────────────────────────────────────
  // --- EXPANSION SECTION SCROLL ---
  // ─────────────────────────────────────────────

  const expansionSection = document.querySelector('.expansion-section');
  const expansionFrame   = document.querySelector('.expansion-frame');
  const expansionImg     = document.querySelector('.expansion-img');
  const expansionOverlay = document.querySelector('.expansion-overlay');

  if (expansionSection && expansionFrame && expansionOverlay) {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion) {
      // Static final state — no animation, all content immediately visible
      expansionFrame.style.transform    = 'scale(1)';
      expansionFrame.style.borderRadius = '0px';
      expansionFrame.style.setProperty('--frame-border-opacity', '0.4');
      if (expansionImg) expansionImg.style.transform = 'translateY(-8%)';
      expansionOverlay.style.opacity = '1';
    } else {
      let ticking = false;

      function updateExpansion() {
        const rect       = expansionSection.getBoundingClientRect();
        const scrollable = expansionSection.offsetHeight - window.innerHeight;
        const progress   = Math.max(0, Math.min(1, -rect.top / scrollable));

        // Frame: scale 0.88 → 1, border-radius 16px → 0  (linear)
        const scale  = 0.88 + 0.12 * progress;
        const radius = 16 * (1 - progress);

        // Image parallax: translateY +8% → -8%  (total travel: 16%)
        const imgY = 8 - 16 * progress;

        // Overlay: opacity 0 → 1 in the first half of the scroll progress
        const overlayOpacity = Math.min(1, progress / 0.5);

        // Gradient border: opacity 0 → 0.4  (via CSS custom property on the frame)
        const borderOpacity = progress * 0.4;

        expansionFrame.style.transform    = `scale(${scale.toFixed(4)})`;
        expansionFrame.style.borderRadius = `${radius.toFixed(2)}px`;
        expansionFrame.style.setProperty('--frame-border-opacity', borderOpacity.toFixed(3));
        if (expansionImg) expansionImg.style.transform = `translateY(${imgY.toFixed(2)}%)`;
        expansionOverlay.style.opacity = overlayOpacity.toFixed(3);

        ticking = false;
      }

      window.addEventListener('scroll', () => {
        if (!ticking) {
          requestAnimationFrame(updateExpansion);
          ticking = true;
        }
      }, { passive: true });

      updateExpansion(); // set initial state on load
    }
  }


  // ─────────────────────────────────────────────
  // --- STATS SHOWCASE — PROGRESS BAR ANIMATION ---
  // ─────────────────────────────────────────────

  const statCards = document.querySelectorAll('.stat-card[data-progress]');

  if (statCards.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const card = entry.target;
          const target = card.dataset.progress;
          const fill = card.querySelector('.stat-bar-fill');
          if (fill) fill.style.width = target + '%';
          observer.unobserve(card);
        }
      });
    }, { threshold: 0.3 });

    statCards.forEach(card => observer.observe(card));
  }


  // ─────────────────────────────────────────────
  // --- VALUES JOURNEY (chi-siamo.html) ---
  // Vertical line + alternating card reveal
  // ─────────────────────────────────────────────

  const vjSection  = document.getElementById('values-journey');
  const vjSvg      = document.getElementById('values-journey-svg');
  const vjLineMain = document.getElementById('vj-line-main');
  const vjLineGlow = document.getElementById('vj-line-glow');
  const vjGrad     = document.getElementById('vjGradient');
  const vjCards    = vjSection ? Array.from(vjSection.querySelectorAll('.value-card')) : [];

  if (vjSection && vjSvg && vjLineMain && vjCards.length === 4) {
    const isMobileVJ = () => window.matchMedia('(max-width: 768px)').matches;
    const reducedVJ  = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const NS         = 'http://www.w3.org/2000/svg';

    let vjLineLength = 0;
    let vjNodes      = [];   // <circle> elements (one per card)
    let vjConnectors = [];   // <line> elements   (one per card)
    let vjThresholds = [];   // scroll-progress value when line reaches each card
    let vjRevealed   = [false, false, false, false];

    function vjBuild() {
      // Remove previously injected nodes / connectors
      [...vjNodes, ...vjConnectors].forEach(el => el.remove());
      vjNodes = []; vjConnectors = []; vjThresholds = []; vjRevealed.fill(false);

      if (isMobileVJ() || reducedVJ) {
        // Clear any inline styles set on a previous desktop build
        vjCards.forEach(c => { c.style.opacity = ''; c.style.transform = ''; });
        return;
      }

      const sW = vjSection.offsetWidth;
      const sH = vjSection.offsetHeight;
      const cx = sW / 2; // centre x for the vertical line

      // Update gradient to span the full measured height
      if (vjGrad) {
        vjGrad.setAttribute('y1', 0);
        vjGrad.setAttribute('y2', sH);
      }

      // Position both vertical lines
      [vjLineMain, vjLineGlow].forEach(line => {
        line.setAttribute('x1', cx); line.setAttribute('y1', 0);
        line.setAttribute('x2', cx); line.setAttribute('y2', sH);
      });

      // Measure total length and initialise dash-draw at 0
      vjLineLength = vjLineMain.getTotalLength();
      [vjLineMain, vjLineGlow].forEach(line => {
        line.style.strokeDasharray  = vjLineLength;
        line.style.strokeDashoffset = vjLineLength; // fully hidden
      });

      // Snapshot section rect once (cards measured relative to it)
      const sr = vjSection.getBoundingClientRect();

      vjCards.forEach((card, i) => {
        const cr     = card.getBoundingClientRect();
        const nodeY  = cr.top + cr.height / 2 - sr.top; // relative to section
        const isLeft = card.classList.contains('value-card--left');
        const dir    = isLeft ? -1 : 1; // -1 = line goes left, +1 = right

        // Threshold: fraction of line drawn when reaching this node.
        // Cap the last card at 0.75 so fast scrollers still see it.
        const rawThr = nodeY / sH;
        vjThresholds.push(i === 3 ? Math.min(rawThr, 0.75) : rawThr);

        // ── Node circle ──
        const circle = document.createElementNS(NS, 'circle');
        circle.setAttribute('cx', cx);
        circle.setAttribute('cy', nodeY);
        circle.setAttribute('r',  6);
        circle.setAttribute('stroke',       'url(#vjGradient)');
        circle.setAttribute('stroke-width', 2);
        circle.setAttribute('fill',         '#0A1628');
        circle.style.cssText = 'opacity:0;transition:opacity 0.4s ease';
        vjSvg.appendChild(circle);
        vjNodes.push(circle);

        // ── Connector line (~40 px from node edge toward card) ──
        const connector = document.createElementNS(NS, 'line');
        connector.setAttribute('x1', cx + dir * 6);   // node edge
        connector.setAttribute('y1', nodeY);
        connector.setAttribute('x2', cx + dir * 46);  // 40 px out
        connector.setAttribute('y2', nodeY);
        connector.setAttribute('stroke',       'url(#vjGradient)');
        connector.setAttribute('stroke-width', 1.5);
        connector.setAttribute('stroke-linecap', 'round');
        connector.style.cssText = 'opacity:0;transition:opacity 0.4s ease';
        vjSvg.appendChild(connector);
        vjConnectors.push(connector);

        // ── Initial card state (hidden, offset toward its side) ──
        card.style.opacity   = 0;
        card.style.transform = `translateX(${isLeft ? -32 : 32}px)`;
      });
    }

    // Staggered delays applied when multiple cards appear in one scroll tick
    const VJ_DELAYS = [0, 50, 100, 150]; // ms per card index

    function vjRevealCard(i, delay) {
      vjRevealed[i] = true;
      if (vjNodes[i])      vjNodes[i].style.opacity      = 1;
      if (vjConnectors[i]) vjConnectors[i].style.opacity = 1;
      const card = vjCards[i];
      if (!card) return;
      card.style.transitionDelay = delay > 0 ? delay + 'ms' : '0ms';
      card.style.opacity   = 1;
      card.style.transform = 'translateX(0)';
    }

    function vjUpdate() {
      vjTicking = false; // always reset so the next scroll event can queue a new frame

      if (isMobileVJ() || reducedVJ || !vjLineLength) return;

      const sr = vjSection.getBoundingClientRect();
      const vh = window.innerHeight;

      // p: 0 = section top enters viewport bottom → 1 = section bottom leaves viewport top
      const p = Math.max(0, Math.min(1,
        (vh - sr.top) / (vjSection.offsetHeight + vh)
      ));

      // Advance the drawn line
      vjLineMain.style.strokeDashoffset = vjLineLength * (1 - p);
      vjLineGlow.style.strokeDashoffset = vjLineLength * (1 - p);

      // Collect all cards newly crossing their threshold this tick
      const toReveal = vjThresholds.reduce((acc, thr, i) => {
        if (p >= thr && !vjRevealed[i]) acc.push(i);
        return acc;
      }, []);

      // Multiple cards at once = fast scroll → stagger delays; single = immediate
      const useDelay = toReveal.length > 1;
      toReveal.forEach(i => vjRevealCard(i, useDelay ? VJ_DELAYS[i] : 0));
    }

    // ── IntersectionObserver fallback ──
    // Ensures no card stays invisible even with very fast scrolling
    const vjCardObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const idx = vjCards.indexOf(entry.target);
        if (idx === -1 || vjRevealed[idx]) return;
        if (isMobileVJ() || reducedVJ) return; // mobile: CSS handles it
        vjRevealCard(idx, 0); // individual IO trigger → no delay
        vjCardObserver.unobserve(entry.target);
      });
    }, { threshold: 0.1 });

    let vjTicking = false;
    window.addEventListener('scroll', () => {
      if (!vjTicking) { requestAnimationFrame(vjUpdate); vjTicking = true; }
    }, { passive: true });

    vjBuild();
    vjUpdate();
    vjCards.forEach(card => vjCardObserver.observe(card));
    window.addEventListener('resize', () => { vjBuild(); vjUpdate(); }, { passive: true });
  }


  // ─────────────────────────────────────────────
  // --- HORIZONTAL SCROLL — SERVIZI PAGE ---
  // ─────────────────────────────────────────────

  const hScrollOuter = document.querySelector('.h-scroll-outer');
  const hScrollTrack = document.querySelector('.h-scroll-track');
  const hScrollFill  = document.querySelector('.h-scroll-progress-fill');

  if (hScrollOuter && hScrollTrack) {
    const isMobileHS  = () => window.matchMedia('(max-width: 768px)').matches;
    const reducedHS   = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let hsCurrentX    = 0;
    let hsTargetX     = 0;
    let hsRafId       = null;
    let hsResizeTimer = null;

    function initHScroll() {
      if (isMobileHS()) {
        hScrollOuter.style.height = '';
        hScrollTrack.style.transform = '';
        hsCurrentX = 0; hsTargetX = 0;
        return;
      }
      const containerH = window.innerHeight + hScrollTrack.scrollWidth - window.innerWidth + 120;
      hScrollOuter.style.height = Math.max(containerH, window.innerHeight) + 'px';
    }

    function hsGetProgress() {
      const rect      = hScrollOuter.getBoundingClientRect();
      const scrollable = hScrollOuter.offsetHeight - window.innerHeight;
      return scrollable > 0 ? Math.max(0, Math.min(1, -rect.top / scrollable)) : 0;
    }

    function hsLoop() {
      if (isMobileHS()) { hsRafId = null; return; }

      const overflow = Math.max(0, hScrollTrack.scrollWidth - window.innerWidth);
      const progress = hsGetProgress();
      hsTargetX = overflow * progress;

      if (reducedHS) {
        hsCurrentX = hsTargetX;
      } else {
        hsCurrentX += (hsTargetX - hsCurrentX) * 0.08;
      }

      hScrollTrack.style.transform = `translateX(${-hsCurrentX.toFixed(2)}px)`;
      if (hScrollFill) hScrollFill.style.width = (progress * 100).toFixed(1) + '%';

      if (!reducedHS && Math.abs(hsTargetX - hsCurrentX) > 0.15) {
        hsRafId = requestAnimationFrame(hsLoop);
      } else {
        hsCurrentX = hsTargetX;
        hScrollTrack.style.transform = `translateX(${-hsCurrentX.toFixed(2)}px)`;
        hsRafId = null;
      }
    }

    window.addEventListener('scroll', () => {
      if (!isMobileHS() && !hsRafId) hsRafId = requestAnimationFrame(hsLoop);
    }, { passive: true });

    window.addEventListener('resize', () => {
      clearTimeout(hsResizeTimer);
      hsResizeTimer = setTimeout(() => { initHScroll(); if (!hsRafId) hsLoop(); }, 150);
    }, { passive: true });

    setTimeout(() => { initHScroll(); hsLoop(); }, 100);
  }


  // ─────────────────────────────────────────────
  // --- CS TITLE WEIGHT ANIMATION (case-study.html) ---
  // ─────────────────────────────────────────────

  const csTitleContainer = document.getElementById('cs-title-scroll-container');
  const csAnimTitle      = document.getElementById('cs-anim-title');

  if (csTitleContainer && csAnimTitle) {
    const reducedCST = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const csGradSpan = csAnimTitle.querySelector('.gradient-text');
    let cstTicking   = false;

    // Initial state — set in JS so the CSS default is overridden immediately
    csAnimTitle.style.fontWeight    = '300';
    csAnimTitle.style.letterSpacing = '0.04em';
    csAnimTitle.style.color         = 'rgba(232, 244, 255, 0.4)';
    if (csGradSpan) csGradSpan.style.opacity = '0.4';

    function cstUpdate() {
      cstTicking = false;
      if (reducedCST) {
        // Skip animation — show title fully
        csAnimTitle.style.fontWeight    = '700';
        csAnimTitle.style.letterSpacing = '-0.01em';
        csAnimTitle.style.color         = 'rgba(232, 244, 255, 1)';
        if (csGradSpan) csGradSpan.style.opacity = '1';
        return;
      }

      const rect     = csTitleContainer.getBoundingClientRect();
      const scrollable = csTitleContainer.offsetHeight - window.innerHeight;
      const p        = scrollable > 0 ? Math.max(0, Math.min(1, -rect.top / scrollable)) : 0;

      // font-weight: 300 → 800 (Space Grotesk caps at 700, so max is reached before end)
      const weight  = Math.round(300 + p * 500);
      // letter-spacing: 0.04em → -0.01em  (total range -0.05)
      const spacing = (0.04 - p * 0.05).toFixed(4);
      // color alpha: 0.4 → 1.0
      const alpha   = (0.4 + p * 0.6).toFixed(3);

      csAnimTitle.style.fontWeight    = weight;
      csAnimTitle.style.letterSpacing = spacing + 'em';
      csAnimTitle.style.color         = 'rgba(232, 244, 255, ' + alpha + ')';
      if (csGradSpan) csGradSpan.style.opacity = alpha;
    }

    window.addEventListener('scroll', () => {
      if (!cstTicking) { requestAnimationFrame(cstUpdate); cstTicking = true; }
    }, { passive: true });

    cstUpdate();
  }


  // ─────────────────────────────────────────────
  // --- PARTNER MARQUEE (partner.html) ---
  // rAF-based: measures exact first-group width so
  // the loop point is pixel-perfect regardless of gap.
  // ─────────────────────────────────────────────

  const marqueeTrack = document.querySelector('.partner-marquee-track');

  if (marqueeTrack) {
    const reducedMarquee = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!reducedMarquee) {
      const CARD_COUNT   = 8;          // cards in one group
      const PX_PER_SEC   = 50;         // scroll speed in px/s (~28s for ~1400px of content)
      let groupWidth     = 0;
      let offset         = 0;
      let lastTs         = null;
      let marqueeRafId   = null;

      function measureMarquee() {
        const cards = Array.from(marqueeTrack.querySelectorAll('.partner-card'));
        if (cards.length < CARD_COUNT) return;
        const cardW = cards[0].offsetWidth;
        const gap   = parseFloat(getComputedStyle(marqueeTrack).columnGap) || 24;
        // First group occupies: CARD_COUNT cards + CARD_COUNT gaps
        // (the gap after card 8 separates it from card 1-duplicate, same as all others)
        groupWidth = CARD_COUNT * (cardW + gap);
      }

      function stepMarquee(ts) {
        if (lastTs === null) lastTs = ts;
        const delta = ts - lastTs;
        lastTs = ts;

        offset += PX_PER_SEC * (delta / 1000);
        if (groupWidth > 0 && offset >= groupWidth) offset -= groupWidth;

        marqueeTrack.style.transform = 'translateZ(0) translateX(-' + offset.toFixed(2) + 'px)';
        marqueeRafId = requestAnimationFrame(stepMarquee);
      }

      measureMarquee();
      if (groupWidth > 0) marqueeRafId = requestAnimationFrame(stepMarquee);

      window.addEventListener('resize', () => {
        measureMarquee();
      }, { passive: true });
    }
  }


  // ─────────────────────────────────────────────
  // --- INTERSECTION OBSERVER: REVEAL ON SCROLL ---
  // Runs after stagger init so processed headings
  // are already removed from .reveal-on-scroll pool.
  // ─────────────────────────────────────────────

  const revealElements = document.querySelectorAll('.reveal-on-scroll');

  if (revealElements.length) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          el.style.transitionDelay = (el.dataset.delay || '0') + 's';
          el.classList.add('visible');
          revealObserver.unobserve(el);
        }
      });
    }, { threshold: 0.15 });

    revealElements.forEach(el => revealObserver.observe(el));
  }


  // ─────────────────────────────────────────────
  // --- COUNT-UP ANIMATION ---
  // ─────────────────────────────────────────────

  function easeOutQuart(t) { return 1 - (1 - t) ** 4; }

  function countUp(el) {
    const raw     = el.dataset.target;
    const prefix  = raw.startsWith('+') ? '+' : '';
    const suffix  = raw.endsWith('%')   ? '%' : '';
    const target  = parseFloat(raw.replace(/[^0-9.]/g, ''));
    const isFloat = raw.includes('.');

    const format = v => prefix + (isFloat ? v.toFixed(1) : Math.round(v)) + suffix;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.textContent = format(target);
      return;
    }

    const duration = 1800;
    const t0       = performance.now();

    (function tick(now) {
      const p = Math.min((now - t0) / duration, 1);
      el.textContent = format(target * easeOutQuart(p));
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }

  const statNumbers = document.querySelectorAll('.stat-number[data-target]');
  if (statNumbers.length) {
    const countObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          countUp(entry.target);
          countObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });

    statNumbers.forEach(el => countObserver.observe(el));
  }


  // ─────────────────────────────────────────────
  // --- CAROUSEL ---
  // ─────────────────────────────────────────────

  const carouselTrack  = document.querySelector('.carousel-track');
  const carouselSlides = document.querySelectorAll('.carousel-slide');
  const arrowPrev      = document.querySelector('.carousel-arrow.prev');
  const arrowNext      = document.querySelector('.carousel-arrow.next');
  const counterCurrent = document.querySelector('.cc-current');
  const counterTotal   = document.querySelector('.cc-total');

  if (carouselTrack && carouselSlides.length) {
    let current = 0;
    const total = carouselSlides.length;
    if (counterTotal) counterTotal.textContent = String(total).padStart(2, '0');

    function goTo(idx) {
      current = Math.max(0, Math.min(total - 1, idx));
      carouselSlides.forEach((s, i) => s.classList.toggle('active', i === current));

      carouselTrack.style.transform = `translateX(-${current * 100}%)`;

      if (counterCurrent) counterCurrent.textContent = String(current + 1).padStart(2, '0');
      if (arrowPrev) arrowPrev.style.opacity = current === 0         ? '0.3' : '1';
      if (arrowNext) arrowNext.style.opacity = current === total - 1 ? '0.3' : '1';
    }

    goTo(0);
    if (arrowPrev) arrowPrev.addEventListener('click', () => goTo(current - 1));
    if (arrowNext) arrowNext.addEventListener('click', () => goTo(current + 1));

    let touchX = 0;
    carouselTrack.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
    carouselTrack.addEventListener('touchend',   e => {
      const diff = touchX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) goTo(diff > 0 ? current + 1 : current - 1);
    });

    window.addEventListener('resize', () => goTo(current));
  }


  // ─────────────────────────────────────────────
  // --- MAGNETIC BUTTONS ---
  // Only active on pointer (non-touch) devices.
  // Targets: .btn-primary, .btn-dark, .carousel-arrow,
  //          .nav-link, and any <a> containing "→".
  // ─────────────────────────────────────────────

  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {

    // Collect targets
    const magneticTargets = [
      ...document.querySelectorAll('.btn-primary, .btn-dark, .carousel-arrow'),
    ];

    // nav-links (the <a> elements)
    document.querySelectorAll('.nav-link').forEach(a => magneticTargets.push(a));

    // Any <a> whose visible text contains an arrow glyph
    document.querySelectorAll('a').forEach(a => {
      if (a.textContent.includes('→') && !magneticTargets.includes(a)) {
        magneticTargets.push(a);
      }
    });

    const MAX_DIST  = 80;  // px — radius of magnetic field
    const MAX_SHIFT = 12;  // px — max translation

    magneticTargets.forEach(el => {
      let raf = null;
      let lerpX = 0, lerpY = 0;
      let targetX = 0, targetY = 0;
      let active = false;

      function lerp(a, b, t) { return a + (b - a) * t; }

      function tick() {
        lerpX = lerp(lerpX, targetX, 0.18);
        lerpY = lerp(lerpY, targetY, 0.18);
        el.style.transform = `translate(${lerpX}px, ${lerpY}px)`;

        if (Math.abs(lerpX - targetX) > 0.05 || Math.abs(lerpY - targetY) > 0.05) {
          raf = requestAnimationFrame(tick);
        } else {
          el.style.transform = `translate(${targetX}px, ${targetY}px)`;
          raf = null;
        }
      }

      el.addEventListener('mousemove', (e) => {
        const rect   = el.getBoundingClientRect();
        const cx     = rect.left + rect.width  / 2;
        const cy     = rect.top  + rect.height / 2;
        const dx     = e.clientX - cx;
        const dy     = e.clientY - cy;
        const dist   = Math.sqrt(dx * dx + dy * dy);

        if (dist < MAX_DIST) {
          const strength = (1 - dist / MAX_DIST);
          targetX = dx * strength * (MAX_SHIFT / (rect.width  / 2));
          targetY = dy * strength * (MAX_SHIFT / (rect.height / 2));
          if (!raf) raf = requestAnimationFrame(tick);
        }
      });

      el.addEventListener('mouseleave', () => {
        targetX = 0;
        targetY = 0;
        // Smooth return
        el.style.transition = 'transform 0.4s ease';
        el.style.transform  = 'translate(0,0)';
        setTimeout(() => { el.style.transition = ''; }, 420);
        if (raf) { cancelAnimationFrame(raf); raf = null; }
        lerpX = 0; lerpY = 0;
      });
    });
  }


  // ─────────────────────────────────────────────
  // --- ACTIVE NAV LINK ---
  // ─────────────────────────────────────────────

  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href') || '';
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('nav-link--active');
    }
  });


  // ─────────────────────────────────────────────
  // --- ACCORDION — SERVIZI HOME ---
  // ─────────────────────────────────────────────

  document.querySelectorAll('.accordion-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const isOpen = trigger.getAttribute('aria-expanded') === 'true';
      document.querySelectorAll('.accordion-trigger').forEach(t => {
        t.setAttribute('aria-expanded', 'false');
        t.nextElementSibling.setAttribute('hidden', '');
      });
      if (!isOpen) {
        trigger.setAttribute('aria-expanded', 'true');
        trigger.nextElementSibling.removeAttribute('hidden');
      }
    });
  });

});

// ─────────────────────────────────────────────
// --- MODAL PARTNER ---
// ─────────────────────────────────────────────

const partnerModal = document.getElementById('partner-modal');

if (partnerModal) {
  // Chiudi cliccando overlay
  partnerModal.addEventListener('click', (e) => {
    if (e.target === partnerModal) {
      partnerModal.classList.remove('open');
      document.body.style.overflow = '';
    }
  });

  // Chiudi con ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && partnerModal.classList.contains('open')) {
      partnerModal.classList.remove('open');
      document.body.style.overflow = '';
    }
  });
}

async function submitPartnerForm(e) {
  e.preventDefault();
  const form = e.target;
  const data = new FormData(form);

  try {
    const response = await fetch('https://formspree.io/f/mqeweebv', {
      method: 'POST',
      body: data,
      headers: { 'Accept': 'application/json' }
    });

    if (response.ok) {
      form.style.display = 'none';
      document.getElementById('partner-success').style.display = 'flex';
    } else {
      alert('Si è verificato un errore. Riprova o scrivici direttamente a info@altalogik.it');
    }
  } catch (error) {
    alert('Si è verificato un errore. Riprova o scrivici direttamente a info@altalogik.it');
  }
}
