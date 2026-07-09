/* AOC deep FX — « La Plongée »: one continuous dive from the sunlit
 * surface into the deep Atlantic.
 *
 * A single vanilla-canvas engine that turns a dark section into a living
 * body of water:
 *   · caustics  — the dancing net of light on a pool floor, a low-res
 *     procedural buffer (shared across every field) upscaled soft.
 *   · godrays   — volumetric light shafts slanting down from the surface,
 *     drawn from one baked, feathered sprite and gently swaying.
 *   · the cursor is a source of light — a glow tracks a fine pointer and
 *     pointerdown sends a ring of light rippling out.
 *   · particulate — fine motes and thin bubble-rings drifting up.
 *   · descent   — as the page scrolls, the hero light dims and the water
 *     deepens: you are diving.
 *   · [data-magnet] — buttons lean a few px toward a fine pointer.
 *
 * Served as a static 'self' file so the strict `script-src 'self'` CSP
 * holds. Same house rules as the CSS layer:
 *   · prefers-reduced-motion → the whole file is a no-op (live-toggled)
 *   · work pauses when every field is offscreen or the tab is hidden
 *   · re-scans on astro:page-load, tears down on astro:before-swap
 */
(function () {
  'use strict';
  if (window.__aocDeepFX) return; // one engine per window
  window.__aocDeepFX = true;

  var REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)');
  var FINE = window.matchMedia('(pointer: fine)');
  var DPR_CAP = 2;
  var TAU = Math.PI * 2;

  // Sine lookup table — lets the caustic buffer refresh every frame (smooth
  // motion on high-refresh displays) without the cost of per-pixel Math.sin.
  var LUT_N = 4096;
  var LUT_MASK = LUT_N - 1;
  var LUT_K = LUT_N / TAU;
  var SINLUT = new Float32Array(LUT_N);
  for (var _l = 0; _l < LUT_N; _l++) SINLUT[_l] = Math.sin((_l / LUT_N) * TAU);
  function fsin(x) {
    // `& LUT_MASK` wraps any (incl. negative) phase into 0…LUT_N-1
    return SINLUT[((x * LUT_K) | 0) & LUT_MASK];
  }

  var fields = [];
  var magnets = [];
  var rafId = 0;
  var lastT = 0;
  var mx = -1e4; // viewport pointer, for magnets
  var my = -1e4;
  var descent = 0; // 0 at the surface … 1 deep, driven by scroll

  function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }
  function easeOut(x) {
    return 1 - Math.pow(1 - x, 3);
  }
  function parseHex(str, fallback) {
    var h = String(str || fallback).replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var v = parseInt(h, 16);
    if (isNaN(v)) return fallback;
    return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
  }

  /* ---------------------------------------------------------------- *
   * Shared caustic buffer — one small procedural field, upscaled soft
   * and re-used (with each section's own tint/intensity) by every canvas.
   * The heavy per-pixel loop runs at ~36fps; compositing is every frame.
   * ---------------------------------------------------------------- */
  var CAUS_W = 176;
  var CAUS_H = 104;
  var causCanvas = null;
  var causCtx = null;
  var causImg = null;
  var causReady = false;

  function ensureCaustics() {
    if (causCanvas) return;
    causCanvas = document.createElement('canvas');
    causCanvas.width = CAUS_W;
    causCanvas.height = CAUS_H;
    causCtx = causCanvas.getContext('2d');
    causImg = causCtx.createImageData(CAUS_W, CAUS_H);
  }

  // Sum-of-sines with a light domain warp; soft, broad ridges of light along
  // the field's zero-crossings — a calm read of the interference pattern that
  // paints caustics on a pool floor. Kept broad (not thin veins) so it flows
  // smoothly instead of crawling when upscaled, and a fixed aqua tint so the
  // additive light glows cyan rather than blowing out to white.
  function renderCaustics(t) {
    var d = causImg.data;
    var i = 0;
    for (var y = 0; y < CAUS_H; y++) {
      var v = y / CAUS_H;
      var warpB = 0.7 * fsin(v * 6.5 - t * 0.28);
      var fall = 0.45 + 0.55 * (1 - v); // brighter near the surface (top)
      for (var x = 0; x < CAUS_W; x++) {
        var u = x / CAUS_W;
        var wx = u * 5.4 + 0.7 * fsin(v * 6.0 + t * 0.32);
        var wy = v * 5.4 + warpB;
        var s = fsin(wx + t * 0.6) + fsin(wy - t * 0.5) + fsin((wx + wy) * 0.7 + t * 0.4);
        var a = Math.abs(s) * 0.5;
        var c = a < 1 ? 1 - a : 0;
        c = c * c; // soft, broad ridges (not thin veins)
        c *= fall;
        d[i] = 96; // fixed aqua tint — stays cyan under additive blending
        d[i + 1] = 194;
        d[i + 2] = 236;
        d[i + 3] = c * 232; // A carries the intensity
        i += 4;
      }
    }
    causCtx.putImageData(causImg, 0, 0);
    causReady = true;
  }

  /* ---------------------------------------------------------------- *
   * Baked sprites — a feathered light-shaft and a soft radial glow.
   * Drawing pre-blurred sprites keeps godrays and the cursor light soft
   * without a per-frame blur filter.
   * ---------------------------------------------------------------- */
  var shaftSprite = null;
  var glowSprite = null;

  function bakeSprites() {
    if (shaftSprite) return;
    // Light shaft: bright at the surface, fading down, feathered at the sides.
    var sw = 64;
    var sh = 512;
    shaftSprite = document.createElement('canvas');
    shaftSprite.width = sw;
    shaftSprite.height = sh;
    var sc = shaftSprite.getContext('2d');
    var vg = sc.createLinearGradient(0, 0, 0, sh);
    vg.addColorStop(0, 'rgba(206,238,255,0.85)');
    vg.addColorStop(0.45, 'rgba(150,214,246,0.26)');
    vg.addColorStop(1, 'rgba(140,206,240,0)');
    sc.fillStyle = vg;
    sc.fillRect(0, 0, sw, sh);
    sc.globalCompositeOperation = 'destination-in';
    var hg = sc.createLinearGradient(0, 0, sw, 0);
    hg.addColorStop(0, 'rgba(0,0,0,0)');
    hg.addColorStop(0.5, 'rgba(0,0,0,1)');
    hg.addColorStop(1, 'rgba(0,0,0,0)');
    sc.fillStyle = hg;
    sc.fillRect(0, 0, sw, sh);

    // Soft radial glow (cursor light, mote bokeh).
    var gs = 256;
    glowSprite = document.createElement('canvas');
    glowSprite.width = gs;
    glowSprite.height = gs;
    var gc = glowSprite.getContext('2d');
    var rg = gc.createRadialGradient(gs / 2, gs / 2, 0, gs / 2, gs / 2, gs / 2);
    rg.addColorStop(0, 'rgba(198,246,255,0.85)');
    rg.addColorStop(0.34, 'rgba(126,216,255,0.28)');
    rg.addColorStop(1, 'rgba(126,216,255,0)');
    gc.fillStyle = rg;
    gc.fillRect(0, 0, gs, gs);
  }

  /* ---------------------------------------------------------------- *
   * Fields — a section rendered as a body of water
   * ---------------------------------------------------------------- */
  function makeRing(f, fromBottom) {
    var r = 3 + Math.pow(Math.random(), 1.7) * 18;
    return {
      fx: 0.03 + Math.random() * 0.94,
      y: fromBottom ? f.h + r * 2 + Math.random() * f.h * 0.2 : Math.random() * f.h,
      r: r,
      rise: 6 + r * 0.8 + Math.random() * 6,
      swayA: 5 + Math.random() * 13,
      swayF: 0.25 + Math.random() * 0.5,
      ph: Math.random() * TAU,
      a: 0.24 + (r / 21) * 0.5,
      lw: 1 + Math.random() * 0.6,
    };
  }
  function makeMote(f, fromBottom) {
    return {
      fx: Math.random(),
      y: fromBottom ? f.h + 4 : Math.random() * f.h,
      r: 0.8 + Math.random() * 1.6,
      rise: 4 + Math.random() * 8,
      swayA: 3 + Math.random() * 7,
      swayF: 0.2 + Math.random() * 0.4,
      ph: Math.random() * TAU,
      a: 0.16 + Math.random() * 0.24,
    };
  }
  function makeRays(f) {
    var n = Math.round(clamp(f.w / 320, 3, 7));
    var rays = [];
    for (var i = 0; i < n; i++) {
      rays.push({
        x: (i + 0.5) / n + (Math.random() - 0.5) * 0.12,
        a: 0.04 + Math.random() * 0.06,
        sp: 0.05 + Math.random() * 0.12,
        ph: Math.random() * TAU,
        tilt: -0.32 + Math.random() * 0.22, // lean from vertical
        wsc: 0.7 + Math.random() * 0.9,
        len: 0.85 + Math.random() * 0.35,
      });
    }
    return rays;
  }

  function initField(canvas) {
    canvas.dataset.fxReady = '1';
    var ctx = canvas.getContext('2d');
    if (!ctx) return;
    ensureCaustics();
    bakeSprites();
    var f = {
      canvas: canvas,
      ctx: ctx,
      host: canvas.parentElement,
      rgb: parseHex(canvas.dataset.deepColor, [231, 252, 255]),
      intensity: parseFloat(canvas.dataset.deep) || 1,
      rays: canvas.dataset.deepRays === '1',
      surface: canvas.dataset.deepSurface === '1',
      depthReact: canvas.dataset.deepDepth === '1',
      rings: [],
      motes: [],
      ripples: [],
      rayList: [],
      w: 0,
      h: 0,
      px: -1e4, // pointer in canvas space
      py: -1e4,
      glow: 0, // eases 0→1 while the pointer is over the field
      intro: 0, // light floods in on first appearance
      visible: false,
      dead: false,
      handlers: [],
      ro: null,
      io: null,
      resizeTimer: 0,
    };

    function size() {
      var w = canvas.clientWidth;
      var h = canvas.clientHeight;
      if (!w || !h) return;
      f.w = w;
      f.h = h;
      var dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var area = clamp((w * h) / (1440 * 640), 0.32, 1.4);
      var nr = Math.round(f.intensity * 11 * area);
      var nm = Math.round(f.intensity * 46 * area);
      while (f.rings.length < nr) f.rings.push(makeRing(f, false));
      f.rings.length = Math.min(f.rings.length, nr);
      while (f.motes.length < nm) f.motes.push(makeMote(f, false));
      f.motes.length = Math.min(f.motes.length, nm);
      f.rayList = f.rays ? makeRays(f) : [];
    }
    size();

    f.ro = new ResizeObserver(function () {
      clearTimeout(f.resizeTimer);
      f.resizeTimer = setTimeout(function () {
        if (!f.dead) {
          size();
          kick();
        }
      }, 160);
    });
    f.ro.observe(f.host);

    f.io = new IntersectionObserver(
      function (entries) {
        f.visible = entries[entries.length - 1].isIntersecting;
        if (f.visible) kick();
      },
      { rootMargin: '80px' },
    );
    f.io.observe(canvas);

    function on(type, fn) {
      f.host.addEventListener(type, fn, { passive: true });
      f.handlers.push([type, fn]);
    }
    on('pointermove', function (e) {
      var rect = canvas.getBoundingClientRect();
      f.px = e.clientX - rect.left;
      f.py = e.clientY - rect.top;
      kick();
    });
    on('pointerleave', function () {
      f.px = -1e4;
      f.py = -1e4;
    });
    on('pointerdown', function (e) {
      var rect = canvas.getBoundingClientRect();
      f.ripples.push({ x: e.clientX - rect.left, y: e.clientY - rect.top, t: 0 });
      if (f.ripples.length > 5) f.ripples.shift();
      kick();
    });

    fields.push(f);
  }

  function stepField(f, t, dt) {
    var ctx = f.ctx;
    var w = f.w;
    var h = f.h;
    ctx.clearRect(0, 0, w, h);

    var dep = f.depthReact ? descent : 0;
    if (f.intro < 1) f.intro = Math.min(1, f.intro + dt / 1.2);
    var light = f.intensity * (1 - 0.82 * dep) * easeOut(f.intro);

    // Cursor glow eases in/out with pointer presence
    var wantGlow = FINE.matches && f.px > -1e3 ? 1 : 0;
    f.glow += (wantGlow - f.glow) * Math.min(1, dt * 6);

    ctx.globalCompositeOperation = 'lighter';

    // 1) Godrays from the surface
    if (f.rays && shaftSprite) {
      for (var r = 0; r < f.rayList.length; r++) {
        var ray = f.rayList[r];
        var sway = Math.sin(t * ray.sp + ray.ph);
        ctx.save();
        ctx.translate((ray.x + sway * 0.035) * w, -h * 0.06);
        ctx.rotate(ray.tilt + sway * 0.05);
        var rw = w * 0.17 * ray.wsc;
        var rh = h * 1.15 * ray.len;
        ctx.globalAlpha = light * ray.a * (0.72 + 0.28 * Math.sin(t * 0.5 + ray.ph));
        ctx.drawImage(shaftSprite, -rw / 2, 0, rw, rh);
        ctx.restore();
      }
    }

    // 2) Caustics — a soft base wash plus one larger, slower parallax layer
    if (causReady) {
      ctx.imageSmoothingEnabled = true;
      ctx.globalAlpha = light * 0.8;
      ctx.drawImage(causCanvas, 0, 0, CAUS_W, CAUS_H, 0, 0, w, h);
      var ox = fsin(t * 0.07) * w * 0.05;
      ctx.globalAlpha = light * 0.28;
      ctx.drawImage(causCanvas, 0, 0, CAUS_W, CAUS_H, ox - w * 0.1, -h * 0.06, w * 1.2, h * 1.16);
    }

    // 3) Cursor light
    if (f.glow > 0.01 && glowSprite) {
      var gr = 300;
      ctx.globalAlpha = 0.55 * f.intensity * (1 - 0.55 * dep) * f.glow;
      ctx.drawImage(glowSprite, f.px - gr / 2, f.py - gr / 2, gr, gr);
    }

    // 4) Ripples of light from pointerdown
    for (var p = f.ripples.length - 1; p >= 0; p--) {
      var rp = f.ripples[p];
      rp.t += dt;
      var life = rp.t / 1.15;
      if (life >= 1) {
        f.ripples.splice(p, 1);
        continue;
      }
      var rad = easeOut(life) * Math.max(w, h) * 0.5;
      var fade = (1 - life) * (1 - life);
      ctx.globalAlpha = 0.5 * fade * f.intensity;
      ctx.strokeStyle = 'rgba(' + f.rgb[0] + ',' + f.rgb[1] + ',' + f.rgb[2] + ',1)';
      ctx.lineWidth = 2.4 * fade + 0.4;
      ctx.beginPath();
      ctx.arc(rp.x, rp.y, rad, 0, TAU);
      ctx.stroke();
      ctx.globalAlpha = 0.28 * fade * f.intensity;
      ctx.beginPath();
      ctx.arc(rp.x, rp.y, rad * 0.68, 0, TAU);
      ctx.stroke();
    }

    // 5) Motes — fine particulate rising in the current
    var glowRGB = 'rgba(' + f.rgb[0] + ',' + f.rgb[1] + ',' + f.rgb[2] + ',';
    for (var i = 0; i < f.motes.length; i++) {
      var m = f.motes[i];
      m.y -= m.rise * dt;
      if (m.y < -4) {
        f.motes[i] = makeMote(f, true);
        continue;
      }
      var mxp = m.fx * w + Math.sin(t * m.swayF + m.ph) * m.swayA;
      ctx.globalAlpha = light * m.a;
      ctx.fillStyle = glowRGB + '1)';
      ctx.beginPath();
      ctx.arc(mxp, m.y, m.r, 0, TAU);
      ctx.fill();
    }

    // 6) Thin bubble-rings in the foreground
    ctx.strokeStyle = glowRGB + '1)';
    for (var j = 0; j < f.rings.length; j++) {
      var g = f.rings[j];
      g.y -= g.rise * dt;
      if (g.y < -g.r * 2) {
        f.rings[j] = makeRing(f, true);
        continue;
      }
      var gx = g.fx * w + Math.sin(t * g.swayF + g.ph) * g.swayA;
      ctx.globalAlpha = light * g.a * (0.78 + 0.22 * Math.sin(t * 0.8 + g.ph * 2));
      ctx.lineWidth = g.lw;
      ctx.beginPath();
      ctx.arc(gx, g.y, g.r, 0, TAU);
      ctx.stroke();
    }

    // 7) Depth — deepen the water as the dive continues
    if (dep > 0.001) {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = dep * 0.5;
      ctx.fillStyle = '#06182e';
      ctx.fillRect(0, 0, w, h);
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  /* ---------------------------------------------------------------- *
   * Magnets — buttons lean toward a nearby (fine) pointer
   * ---------------------------------------------------------------- */
  function initMagnet(el) {
    el.dataset.fxReady = '1';
    magnets.push({ el: el, x: 0, y: 0, moving: false });
  }
  function stepMagnet(m, dt) {
    var tx = 0;
    var ty = 0;
    if (FINE.matches && mx > -1e3) {
      var r = m.el.getBoundingClientRect();
      if (r.width && mx > r.left - 22 && mx < r.right + 22 && my > r.top - 22 && my < r.bottom + 22) {
        tx = clamp((mx - (r.left + r.width / 2)) * 0.22, -7, 7);
        ty = clamp((my - (r.top + r.height / 2)) * 0.3, -6, 6);
      }
    }
    var k = Math.min(1, dt * 10);
    m.x += (tx - m.x) * k;
    m.y += (ty - m.y) * k;
    if (!tx && !ty && Math.abs(m.x) < 0.05 && Math.abs(m.y) < 0.05) {
      if (m.moving) {
        m.el.style.transform = '';
        m.moving = false;
      }
      return false;
    }
    m.moving = true;
    m.el.style.transform = 'translate(' + m.x.toFixed(2) + 'px,' + m.y.toFixed(2) + 'px)';
    return true;
  }

  /* ---------------------------------------------------------------- *
   * Shared frame loop
   * ---------------------------------------------------------------- */
  function kick() {
    if (!rafId && !document.hidden) {
      lastT = performance.now();
      rafId = requestAnimationFrame(frame);
    }
  }

  function frame(now) {
    rafId = 0;
    var dt = Math.min((now - lastT) / 1000, 0.05) || 0.016;
    lastT = now;
    var t = now / 1000;
    var active = false;
    var i;

    // Descent: how far the dive has progressed down the first screen
    descent = clamp((window.pageYOffset || 0) / (window.innerHeight * 0.92), 0, 1);

    var anyVisible = false;
    for (i = 0; i < fields.length; i++) {
      if (!fields[i].dead && fields[i].visible && fields[i].w) anyVisible = true;
    }
    // Refresh the shared caustic buffer every frame so the light flows
    // smoothly (cheap thanks to the sine LUT). Slow phase = calm motion.
    if (anyVisible) renderCaustics(t * 0.5);

    for (i = 0; i < fields.length; i++) {
      if (!fields[i].dead && fields[i].visible && fields[i].w) {
        stepField(fields[i], t, dt);
        active = true;
      }
    }
    for (i = 0; i < magnets.length; i++) {
      if (stepMagnet(magnets[i], dt)) active = true;
    }

    if (active) rafId = requestAnimationFrame(frame);
  }

  /* ---------------------------------------------------------------- *
   * Wiring & teardown
   * ---------------------------------------------------------------- */
  function destroyAll() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
    fields.forEach(function (f) {
      f.dead = true;
      clearTimeout(f.resizeTimer);
      if (f.ro) f.ro.disconnect();
      if (f.io) f.io.disconnect();
      f.handlers.forEach(function (hd) {
        f.host.removeEventListener(hd[0], hd[1]);
      });
      f.ctx.clearRect(0, 0, f.w, f.h);
      delete f.canvas.dataset.fxReady;
    });
    magnets.forEach(function (m) {
      m.el.style.transform = '';
      delete m.el.dataset.fxReady;
    });
    fields.length = 0;
    magnets.length = 0;
    causReady = false;
  }

  function scan() {
    if (REDUCE.matches) return;
    document.querySelectorAll('canvas[data-deep]:not([data-fx-ready])').forEach(initField);
    document.querySelectorAll('[data-magnet]:not([data-fx-ready])').forEach(initMagnet);
    kick();
  }

  window.addEventListener(
    'pointermove',
    function (e) {
      mx = e.clientX;
      my = e.clientY;
      if (magnets.length) kick();
      // Card glint follows a fine pointer (paint-only CSS vars, no reflow)
      if (FINE.matches && e.target && e.target.closest) {
        var card = e.target.closest('.card-aoc');
        if (card) {
          var r = card.getBoundingClientRect();
          if (r.width) {
            card.style.setProperty('--gx', (((e.clientX - r.left) / r.width) * 100).toFixed(1) + '%');
            card.style.setProperty('--gy', (((e.clientY - r.top) / r.height) * 100).toFixed(1) + '%');
          }
        }
      }
    },
    { passive: true },
  );
  window.addEventListener(
    'scroll',
    function () {
      kick();
    },
    { passive: true },
  );
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) kick();
  });

  // Live OS toggle: stop everything / bring it back without a reload
  var onReduce = function () {
    if (REDUCE.matches) destroyAll();
    else scan();
  };
  if (REDUCE.addEventListener) REDUCE.addEventListener('change', onReduce);

  scan();
  document.addEventListener('astro:page-load', scan);
  document.addEventListener('astro:before-swap', destroyAll);
})();
