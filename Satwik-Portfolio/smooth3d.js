/* Smooth inertia scrolling, round animated cursor, 3D tilt, magnetic buttons,
   mouse-depth parallax, split-text 3D reveals and floating 3D shapes.
   Dependency-free. Respects reduced-motion and the "Pause motion" button. */
(() => {
  'use strict';
  const root = document.documentElement;
  const body = document.body;
  const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const fineQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const isMotionOff = () => reducedQuery.matches || root.classList.contains('motion-paused');

  /* ---------- shared state ---------- */
  const mouse = { x: innerWidth / 2, y: innerHeight / 2, seen: false };
  let loopId = 0;
  let lastFrame = 0;
  function kick() { if (!loopId) { lastFrame = performance.now(); loopId = requestAnimationFrame(loop); } }

  /* =========================================================
     1. SMOOTH SCROLL (mouse wheel, keyboard, anchor links)
     Touch devices keep their native momentum scrolling.
     ========================================================= */
  const scroller = (() => {
    let enabled = false, current = scrollY, target = scrollY, raf = 0, anim = null, last = 0, lastSet = scrollY;
    const maxScroll = () => Math.max(0, root.scrollHeight - innerHeight);
    const ease = t => (t < .5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2);

    function tick(now) {
      raf = 0;
      const dt = Math.min(now - (last || now), 50) || 16.67;
      last = now;
      if (anim) {
        const t = clamp((now - anim.start) / anim.dur, 0, 1);
        current = anim.from + (anim.to - anim.from) * ease(t);
        target = current;
        if (t >= 1) { anim = null; }
      } else {
        const k = 1 - Math.pow(1 - .1, dt / 16.67);
        current += (target - current) * k;
        if (Math.abs(target - current) < .15) current = target;
      }
      lastSet = current;
      window.scrollTo({ top: current, left: 0, behavior: 'instant' });
      if (anim || current !== target) raf = requestAnimationFrame(tick);
      else last = 0;
    }
    const start = () => { if (!raf) raf = requestAnimationFrame(tick); };

    function to(y, duration) {
      y = clamp(y, 0, maxScroll());
      if (!enabled) { window.scrollTo({ top: y, behavior: isMotionOff() ? 'auto' : 'smooth' }); return; }
      const dist = Math.abs(y - current);
      anim = { from: current, to: y, start: performance.now(), dur: duration || clamp(650 + dist * .28, 800, 1700) };
      start();
    }

    function layoutTop(el) { let top = 0; for (let n = el; n; n = n.offsetParent) top += n.offsetTop; return top; }

    function onWheel(e) {
      if (!enabled || e.ctrlKey || e.defaultPrevented) return;
      if (body.classList.contains('modal-open') || (e.target.closest && e.target.closest('dialog'))) return;
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      e.preventDefault();
      let d = e.deltaY;
      if (e.deltaMode === 1) d *= 16; else if (e.deltaMode === 2) d *= innerHeight;
      if (anim) { anim = null; target = current; }
      target = clamp(target + d, 0, maxScroll());
      start();
    }

    const skipKeys = 'input,textarea,select,button,canvas,[contenteditable="true"],summary,dialog,dialog *';
    function onKey(e) {
      if (!enabled || e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
      if (body.classList.contains('modal-open')) return;
      const t = e.target;
      if (t && t.closest && t.closest(skipKeys)) return;
      const page = innerHeight * .88;
      let handled = true;
      switch (e.key) {
        case 'ArrowDown': target = clamp((anim ? anim.to : target) + 70, 0, maxScroll()); anim = null; start(); break;
        case 'ArrowUp': target = clamp((anim ? anim.to : target) - 70, 0, maxScroll()); anim = null; start(); break;
        case 'PageDown': to((anim ? anim.to : target) + page, 700); break;
        case 'PageUp': to((anim ? anim.to : target) - page, 700); break;
        case ' ': to((anim ? anim.to : target) + (e.shiftKey ? -page : page), 700); break;
        case 'Home': to(0, 1100); break;
        case 'End': to(maxScroll(), 1100); break;
        default: handled = false;
      }
      if (handled) e.preventDefault();
    }

    function onNativeScroll() {
      const y = scrollY;
      if (raf || anim) { if (Math.abs(y - lastSet) > 3) { cancelAnimationFrame(raf); raf = 0; anim = null; current = target = y; last = 0; } return; }
      if (Math.abs(y - current) > 1.5) { current = target = y; }
    }

    function onClick(e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a || !enabled) return;
      const hash = a.getAttribute('href');
      let y = 0, el = null;
      if (hash === '#' || hash === '#top') y = 0;
      else {
        try { el = document.getElementById(decodeURIComponent(hash.slice(1))); } catch (_) {}
        if (!el) return;
        const pad = parseFloat(getComputedStyle(root).scrollPaddingTop) || 0;
        y = layoutTop(el) - pad;
      }
      e.preventDefault();
      to(Math.max(0, y));
      try { history.pushState(null, '', hash === '#' ? location.pathname + location.search : hash); } catch (_) {}
      if (el) {
        if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
        el.focus({ preventScroll: true });
      }
    }

    function sync() {
      const want = fineQuery.matches && !isMotionOff();
      if (want === enabled) return;
      enabled = want;
      root.classList.toggle('smooth-scroll', enabled);
      current = target = scrollY; anim = null;
    }

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onNativeScroll, { passive: true });
    document.addEventListener('click', onClick);
    window.addEventListener('portfolio-motion', sync);
    reducedQuery.addEventListener('change', sync);
    fineQuery.addEventListener('change', sync);
    sync();
    return { to };
  })();

  /* =========================================================
     2. ROUND ANIMATED CURSOR
     ========================================================= */
  const cursor = (() => {
    if (!fineQuery.matches) return null;
    const dot = document.createElement('div');
    const ring = document.createElement('div');
    dot.className = 'cursor-dot';
    ring.className = 'cursor-ring';
    ring.innerHTML = '<div class="cursor-core"></div><span class="cursor-label"></span>';
    dot.setAttribute('aria-hidden', 'true');
    ring.setAttribute('aria-hidden', 'true');
    body.append(ring, dot);
    const core = ring.firstElementChild;
    const label = ring.querySelector('.cursor-label');
    const interactive = 'a,button,[role="button"],summary,label,input,textarea,select';
    const st = { x: mouse.x, y: mouse.y, rx: mouse.x, ry: mouse.y, scale: 1, mode: 'default', down: false, angle: 0, stretch: 1 };
    const modes = { default: { s: 1, text: '' }, link: { s: 1.55, text: '' }, view: { s: 2.5, text: 'VIEW' }, drag: { s: 2.1, text: 'DRAG' } };

    function setMode(mode) {
      if (st.mode === mode) return;
      st.mode = mode;
      ring.dataset.mode = mode;
      label.textContent = modes[mode].text;
      kick();
    }
    function detect(el) {
      if (!el || !el.closest) return setMode('default');
      if (el.closest('.project-visual')) setMode('view');
      else if (el.closest('#sculpture')) setMode('drag');
      else if (el.closest(interactive)) setMode('link');
      else setMode('default');
    }
    function show() { root.classList.add('has-cursor'); root.classList.remove('cursor-out'); }

    window.addEventListener('pointermove', e => {
      if (e.pointerType && e.pointerType !== 'mouse') { root.classList.add('cursor-out'); return; }
      mouse.x = e.clientX; mouse.y = e.clientY;
      if (!mouse.seen) { mouse.seen = true; st.x = st.rx = e.clientX; st.y = st.ry = e.clientY; }
      show(); kick();
    }, { passive: true });
    document.addEventListener('pointerover', e => detect(e.target));
    document.addEventListener('pointerdown', () => { st.down = true; kick(); });
    window.addEventListener('pointerup', () => { st.down = false; kick(); });
    document.documentElement.addEventListener('mouseleave', () => root.classList.add('cursor-out'));
    document.documentElement.addEventListener('mouseenter', () => { if (mouse.seen) show(); });
    window.addEventListener('blur', () => { st.down = false; });
    // Re-detect what is under a still cursor after scrolling.
    let scrollTimer = 0;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => { if (mouse.seen) detect(document.elementFromPoint(mouse.x, mouse.y)); }, 110);
    }, { passive: true });

    function update(dt) {
      const off = isMotionOff();
      const follow = off ? 1 : 1 - Math.pow(1 - .2, dt / 16.67);
      const px = st.rx, py = st.ry;
      st.x = mouse.x; st.y = mouse.y;
      st.rx += (st.x - st.rx) * follow;
      st.ry += (st.y - st.ry) * follow;
      const vx = st.rx - px, vy = st.ry - py;
      const speed = Math.hypot(vx, vy);
      if (!off && speed > .4) {
        const a = Math.atan2(vy, vx);
        let d = a - st.angle; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
        st.angle += d * .35;
      }
      const wantStretch = off ? 1 : 1 + Math.min(speed * .018, .38);
      st.stretch += (wantStretch - st.stretch) * .25;
      const baseScale = modes[st.mode].s * (st.down ? .82 : 1);
      st.scale += (baseScale - st.scale) * (1 - Math.pow(1 - .18, dt / 16.67));
      dot.style.transform = `translate3d(${st.x}px,${st.y}px,0) translate(-50%,-50%) scale(${st.mode === 'view' ? 0 : st.down ? .6 : st.mode === 'link' ? 1.4 : 1})`;
      ring.style.transform = `translate3d(${st.rx}px,${st.ry}px,0)`;
      core.style.transform = `translate(-50%,-50%) rotate(${st.angle}rad) scale(${(st.scale * st.stretch).toFixed(4)},${(st.scale / st.stretch).toFixed(4)})`;
      return speed > .05 || Math.abs(st.scale - baseScale) > .004 || Math.abs(st.stretch - 1) > .004 || Math.abs(st.x - st.rx) > .1 || Math.abs(st.y - st.ry) > .1;
    }
    return { update };
  })();

  /* =========================================================
     3. 3D CARD TILT + MAGNETIC BUTTONS + HERO DEPTH + VELOCITY
     ========================================================= */
  const tiltEls = [...document.querySelectorAll('.project-card, .skill-group')].map(el => {
    const glare = document.createElement('span');
    glare.className = 'tilt-glare';
    glare.setAttribute('aria-hidden', 'true');
    el.appendChild(glare);
    el.classList.add('tilt');
    return { el, glare, rx: 0, ry: 0, s: 1, gx: 50, gy: 50, gl: 0, trx: 0, try: 0, ts: 1, tgl: 0, hover: false, rect: null };
  });
  tiltEls.forEach(item => {
    item.el.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { item.hover = true; item.rect = item.el.getBoundingClientRect(); kick(); } });
    item.el.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse' || isMotionOff()) return;
      // Use the untransformed layout box so the tilt itself never feeds back into the maths.
      const r = item.el.getBoundingClientRect();
      const px = clamp((e.clientX - r.left) / r.width, 0, 1), py = clamp((e.clientY - r.top) / r.height, 0, 1);
      item.try = (px - .5) * 12; item.trx = (.5 - py) * 10; item.ts = 1.025; item.tgl = 1;
      item.gx = px * 100; item.gy = py * 100;
      kick();
    });
    item.el.addEventListener('pointerleave', () => { item.hover = false; item.trx = 0; item.try = 0; item.ts = 1; item.tgl = 0; kick(); });
  });

  const magnets = [...document.querySelectorAll('.button, .nav-contact, .copy-email, .github-link, .social-links a, .brand, .motion-toggle')].map(el => ({ el, x: 0, y: 0, tx: 0, ty: 0 }));
  magnets.forEach(m => {
    m.el.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse' || isMotionOff()) return;
      const r = m.el.getBoundingClientRect();
      m.tx = (e.clientX - (r.left + r.width / 2)) * .28;
      m.ty = (e.clientY - (r.top + r.height / 2)) * .36;
      kick();
    });
    m.el.addEventListener('pointerleave', () => { m.tx = 0; m.ty = 0; kick(); });
  });

  const hero = document.querySelector('.hero');
  const hv = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener('pointermove', e => {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    hv.tx = (e.clientX / innerWidth - .5) * 2;
    hv.ty = (e.clientY / innerHeight - .5) * 2;
    kick();
  }, { passive: true });

  let prevY = scrollY, vel = 0;
  const shapes = [];

  function loop(now) {
    loopId = 0;
    const dt = Math.min(now - lastFrame, 50) || 16.67;
    lastFrame = now;
    const off = isMotionOff();
    let busy = false;

    if (cursor && cursor.update(dt)) busy = true;

    // Scroll velocity -> gentle 3D lean on cards.
    const y = scrollY;
    const dy = y - prevY; prevY = y;
    const wantVel = off ? 0 : clamp(dy * .22, -5, 5);
    vel += (wantVel - vel) * (1 - Math.pow(1 - .12, dt / 16.67));
    if (Math.abs(vel) < .01 && wantVel === 0) vel = 0;
    root.style.setProperty('--vel', vel.toFixed(3));
    if (vel !== 0 || dy !== 0) busy = true;

    // Card tilt.
    const k = 1 - Math.pow(1 - .14, dt / 16.67);
    tiltEls.forEach(it => {
      if (off) { it.trx = it.try = 0; it.ts = 1; it.tgl = 0; }
      const settled = Math.abs(it.trx - it.rx) < .01 && Math.abs(it.try - it.ry) < .01 && Math.abs(it.ts - it.s) < .0005 && Math.abs(it.tgl - it.gl) < .01;
      if (settled && !it.hover) { if (it.rx || it.ry || it.s !== 1) { it.rx = it.ry = 0; it.s = 1; it.gl = 0; apply(it); } return; }
      it.rx += (it.trx - it.rx) * k; it.ry += (it.try - it.ry) * k; it.s += (it.ts - it.s) * k; it.gl += (it.tgl - it.gl) * k;
      apply(it); busy = true;
    });
    function apply(it) {
      const s = it.el.style;
      s.setProperty('--tilt-rx', it.rx.toFixed(3) + 'deg');
      s.setProperty('--tilt-ry', it.ry.toFixed(3) + 'deg');
      s.setProperty('--tilt-s', it.s.toFixed(4));
      s.setProperty('--gx', it.gx.toFixed(1) + '%');
      s.setProperty('--gy', it.gy.toFixed(1) + '%');
      it.glare.style.opacity = it.gl.toFixed(3);
    }

    // Magnetic buttons (use the independent `translate` property so no transform clashes).
    magnets.forEach(m => {
      if (off) { m.tx = m.ty = 0; }
      if (Math.abs(m.tx - m.x) < .05 && Math.abs(m.ty - m.y) < .05) { if (m.x || m.y) { m.x = m.tx; m.y = m.ty; m.el.style.translate = m.x || m.y ? `${m.x}px ${m.y}px` : ''; } return; }
      m.x += (m.tx - m.x) * k; m.y += (m.ty - m.y) * k;
      m.el.style.translate = `${m.x.toFixed(2)}px ${m.y.toFixed(2)}px`;
      busy = true;
    });

    // Hero mouse-depth parallax (only while the hero is near the viewport).
    if (hero && y < innerHeight * 2.4) {
      if (off) { hv.tx = hv.ty = 0; }
      if (Math.abs(hv.tx - hv.x) > .0005 || Math.abs(hv.ty - hv.y) > .0005) {
        const hk = 1 - Math.pow(1 - .07, dt / 16.67);
        hv.x += (hv.tx - hv.x) * hk; hv.y += (hv.ty - hv.y) * hk;
        hero.style.setProperty('--mx', hv.x.toFixed(4));
        hero.style.setProperty('--my', hv.y.toFixed(4));
        busy = true;
      }
    }

    // Floating 3D shapes: scroll + mouse parallax.
    if (shapes.length) {
      const t = off ? 0 : y;
      shapes.forEach(s => {
        const oy = Math.sin(t * .0011 * s.f + s.p) * 90 * s.depth - t * .035 * s.depth;
        const ox = hv.x * -38 * s.depth;
        const oy2 = hv.y * -28 * s.depth;
        s.el.style.transform = `translate3d(${ox.toFixed(1)}px,${(oy + oy2).toFixed(1)}px,0) rotateY(${(t * .07 * s.f).toFixed(1)}deg) rotateX(${(t * .03).toFixed(1)}deg)`;
      });
    }

    if (busy) loopId = requestAnimationFrame(loop);
  }

  window.addEventListener('scroll', kick, { passive: true });
  window.addEventListener('resize', kick, { passive: true });
  window.addEventListener('portfolio-motion', kick);

  /* =========================================================
     4. SPLIT-TEXT 3D REVEALS (headings + hero name)
     ========================================================= */
  function split(el, mode, startIndex) {
    let i = startIndex || 0;
    const cls = mode === 'chars' ? 'sc' : 'sw';
    function wrap(text) {
      const frag = document.createDocumentFragment();
      const parts = mode === 'chars' ? [...text] : text.split(/(\s+)/);
      parts.forEach(p => {
        if (!p) return;
        if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
        const n = document.createElement('i');
        n.className = cls; n.style.setProperty('--i', i++); n.textContent = p; n.setAttribute('aria-hidden', 'true');
        frag.appendChild(n);
      });
      return frag;
    }
    function walk(node) {
      [...node.childNodes].forEach(c => {
        if (c.nodeType === 3) { if (c.textContent.trim() || /^\s+$/.test(c.textContent)) c.replaceWith(wrap(c.textContent)); }
        else if (c.nodeType === 1 && c.tagName !== 'BR') walk(c);
      });
    }
    const label = [...el.childNodes].map(function read(n) { return n.nodeType === 3 ? n.textContent : n.tagName === 'BR' ? ' ' : [...n.childNodes].map(read).join(''); }).join('');
    el.setAttribute('aria-label', label.replace(/\s+/g, ' ').trim());
    walk(el);
    el.classList.add('split-ready');
    return i;
  }

  const h1 = document.querySelector('.hero h1');
  if (h1) {
    const first = h1.querySelector(':scope > span:first-of-type');
    if (first) first.classList.add('h1-accent');
    split(h1, 'chars');
    h1.classList.add('split-chars');
    requestAnimationFrame(() => requestAnimationFrame(() => h1.classList.add('is-in')));
  }
  const headings = [...document.querySelectorAll('.section-heading h2, .about-intro h2, .contact-content h2')];
  headings.forEach(h => split(h, 'words'));
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } }), { threshold: .35, rootMargin: '0px 0px -6% 0px' });
    headings.forEach(h => io.observe(h));
  } else headings.forEach(h => h.classList.add('is-in'));

  /* =========================================================
     5. FLOATING 3D SHAPES BACKDROP
     ========================================================= */
  (function buildShapes() {
    const anchor = document.querySelector('.scene-backdrop');
    if (!anchor) return;
    const layer = document.createElement('div');
    layer.className = 'shapes';
    layer.setAttribute('aria-hidden', 'true');
    const cfg = [
      { t: 'cube', x: 7, y: 24, s: 74, d: 38, depth: 1.0, f: 1.0, p: 0 },
      { t: 'ring', x: 90, y: 16, s: 130, d: 30, depth: .7, f: .8, p: 1.4 },
      { t: 'cube', x: 93, y: 68, s: 52, d: 30, depth: 1.4, f: 1.3, p: 2.2 },
      { t: 'ring', x: 4, y: 74, s: 96, d: 36, depth: 1.1, f: .9, p: 3.1 },
      { t: 'cube', x: 48, y: 90, s: 40, d: 26, depth: .6, f: 1.1, p: 4.0 },
      { t: 'ring', x: 62, y: 8, s: 64, d: 24, depth: 1.5, f: 1.2, p: 5.0 }
    ];
    cfg.forEach(c => {
      const wrapEl = document.createElement('div');
      wrapEl.className = 'shape';
      wrapEl.style.cssText = `--x:${c.x}%;--y:${c.y}%;--s:${c.s}px;--d:${c.d}s`;
      wrapEl.innerHTML = c.t === 'cube'
        ? '<div class="cube"><i></i><i></i><i></i><i></i><i></i><i></i></div>'
        : '<div class="ring3d"></div>';
      layer.appendChild(wrapEl);
      shapes.push({ el: wrapEl, depth: c.depth, f: c.f, p: c.p });
    });
    anchor.after(layer);
  })();

  kick();
})();
