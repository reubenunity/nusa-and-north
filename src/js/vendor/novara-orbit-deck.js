
// Original HorizonX code. Default artwork generated for HorizonX. HorizonX Tools License.
/**
 * Orbit Deck engine: three cards on a shallow 3D arc. The centre card faces
 * the reader, the side cards lean in from behind it, and every step brings the
 * right card to the centre while the left one wraps around behind the deck.
 *
 * The motion is the reference recording's, measured frame by frame: each
 * card follows its own fitted curve, so a step is a pure function of the time
 * `tau` since it started. Autoplay, the dots and the keyboard play that
 * function forward (or mirrored, for a step back); a drag scrubs `tau`
 * directly and the release plays the rest of it from wherever the hand let go.
 *
 * Everything here is plain DOM and CSS transforms. This file is inlined
 * verbatim into the HTML export, so it must stay free of imports.
 */

const SLIDE_COUNT = 4;
const START_SLIDE = 0;
const SLIDE_DUR = 0.963001;
// Stage px a drag travels for one full step: the distance between two slots.
const DRAG_SPAN = 323.5;
// The stage is laid out in the reference's px; this is the part of it the
// deck and the pill occupy, and the point that sits at the root's centre.
const FIT_W = 760;
const FIT_H = 450;
const STAGE_CX = 360;
const STAGE_CY = 288;

function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (u) => ((ax * u + bx) * u + cx) * u;
  const sy = (u) => ((ay * u + by) * u + cy) * u;
  const dx = (u) => (3 * ax * u + 2 * bx) * u + cx;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let u = x;
    for (let i = 0; i < 8; i++) {
      const e = sx(u) - x, d = dx(u);
      if (Math.abs(e) < 1e-6 || Math.abs(d) < 1e-6) break;
      u -= e / d;
    }
    if (u < 0 || u > 1 || Math.abs(sx(u) - x) > 1e-4) {
      let lo = 0, hi = 1;
      u = x;
      for (let i = 0; i < 40; i++) {
        if (sx(u) < x) lo = u;
        else hi = u;
        u = (lo + hi) / 2;
      }
    }
    return sy(u);
  };
}

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const lerp = (a, b, k) => a + (b - a) * k;
const table = (pts) => (t) => {
  if (t <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    if (t <= pts[i][0]) {
      const [t0, v0] = pts[i - 1], [t1, v1] = pts[i];
      return v0 + ((v1 - v0) * (t - t0)) / (t1 - t0);
    }
  }
  return pts[pts.length - 1][1];
};

// Slots, in stage px, under a 1400px perspective centred on the centre card.
const P = 1400, X = 323.499, Y = 3.39999, Z = -788, R = 31;
const CENTER = { x: 0, y: 0, z: 0, r: 0 };
const LEFT = { x: -X, y: Y, z: Z, r: R };
const RIGHT = { x: X, y: Y, z: Z, r: -R };
// Screen px to world px for an x-only shift of a side card, at its outer edge.
const EDGE_SCALE = P / (P - (Z + 150 * Math.sin((R * Math.PI) / 180)));
const world = (screenPx) => screenPx / EDGE_SCALE;
const lerpPose = (a, b, k) => ({ x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), z: lerp(a.z, b.z, k), r: lerp(a.r, b.r, k) });
const shift = (p, dx) => ({ ...p, x: p.x + dx });
const mirror = (p) => ({ x: -p.x, y: p.y, z: p.z, r: -p.r });
const poseCss = (p) =>
  `translate3d(${p.x.toFixed(3)}px,${p.y.toFixed(3)}px,${p.z.toFixed(3)}px) rotateY(${p.r.toFixed(4)}deg)`;

const slideEase = bezier(0.210001, 0, 0.139999, 1);
// The incoming card starts a touch later and overtakes the outgoing one.
const incomingEase = bezier(0.459, 0, 0, 0.948999);
const outgoingEase = bezier(0.285, 0, 0.125999, 0.879999);
const INCOMING_LEAD = 0.0179999, INCOMING_DUR = 0.892999;
const OUTGOING_LEAD = 0.0150001, OUTGOING_DUR = 0.861001;

// Intro, on the reference clock: the side cards slide out from behind the
// centre card, its grey cover fades, and the pill rises in.
const INTRO_START = 1.09301;
const INTRO_HOLD = 0.450001;
const INTRO_END = 2.0;
const introSides = bezier(0.239999, 0, 0.0199999, 1);
const introGrey = bezier(0.140001, 0, 0.0499999, 1);
const pillOpacity = table([
  [1.10001, 0], [1.13299, 0.03], [1.2, 0.159999], [1.26699, 0.379999], [1.333, 0.589999], [1.40001, 0.719999], [1.46701, 0.819999],
  [1.53301, 0.859999], [1.6, 0.900001], [1.667, 0.94], [1.73301, 0.969999], [1.79999, 1]
]);
const pillOffset = table([
  [1.1, 24], [1.133, 22], [1.19999, 19], [1.26699, 12], [1.333, 8], [1.39999, 6], [1.46701, 4], [1.53299, 3],
  [1.60001, 1.5], [1.66699, 1], [1.73299, 0]
]);

const wrapIndex = (i) => ((i % SLIDE_COUNT) + SLIDE_COUNT) % SLIDE_COUNT;

/** Which way, one step at a time, reaches `target` from `active`: 1, -1 or 0. */
function stepToward(active, target) {
  const delta = wrapIndex(target - active);
  return delta === 0 ? 0 : delta <= SLIDE_COUNT / 2 ? 1 : -1;
}

/**
 * Poses, stacking order and dot brightness for a deck resting on `active`,
 * or `tau` seconds into a step in direction `dir` (1 brings the right card to
 * the centre, -1 the left one). `inward` pulls the side cards behind the
 * centre card, in screen px, during the intro.
 */
function layout(active, dir = 0, tau = 0, inward = 0) {
  const centre = wrapIndex(active), left = wrapIndex(active - 1), right = wrapIndex(active + 1);
  const pose = Array.from({length:SLIDE_COUNT},()=>CENTER), z = Array(SLIDE_COUNT).fill(-1), dots = Array(SLIDE_COUNT).fill(0);
  if (!dir) {
    pose[centre] = CENTER;
    pose[left] = shift(LEFT, world(inward));
    pose[right] = shift(RIGHT, -world(inward));
    z[centre] = 3; z[left] = 1; z[right] = 1;
    dots[centre] = 1;
    return { pose, z, dots, centre };
  }
  const q = slideEase(tau / SLIDE_DUR);
  const incoming = dir > 0 ? right : left;
  const wrap = q < .449999 ? (dir > 0 ? left : right) : wrapIndex(active + 2 * dir);
  const flip = dir > 0 ? (p) => p : mirror;
  pose[incoming] = flip(lerpPose(RIGHT, CENTER, incomingEase((tau + INCOMING_LEAD) / INCOMING_DUR)));
  pose[centre] = flip(lerpPose(CENTER, LEFT, outgoingEase((tau + OUTGOING_LEAD) / OUTGOING_DUR)));
  pose[wrap] = flip(q < 0.449999 ? shift(LEFT, world(290 * q)) : shift(RIGHT, -world(184 * Math.pow(1 - q, 1.15))));
  z[wrap] = 0;
  z[incoming] = q > 0.499999 ? 3 : 2;
  z[centre] = q > 0.499999 ? 2 : 3;
  const u = tau - 0.140001;
  dots[centre] = Math.pow(1 - clamp01(u / 0.9), 3);
  dots[incoming] = 1 - Math.pow(1 - clamp01(u / 0.799999), 5);
  return { pose, z, dots, centre: q > 0.500001 ? incoming : centre };
}

/** The intro on its own clock `t` (0 = mount): side-card retraction, grey cover, pill. */
function introFrame(t) {
  const ref = INTRO_START - INTRO_HOLD + t;
  return {
    inward: 150 * (1 - introSides((ref - INTRO_START) / 0.893999)),
    grey: 1 - introGrey((ref - 1.117) / 0.869999),
    pillOpacity: pillOpacity(ref),
    pillOffset: pillOffset(ref),
    done: ref >= INTRO_END
  };
}

/**
 * Where a released drag settles. `progress` is the signed share of a step the
 * hand covered (positive toward the next card) and `velocity` the same unit
 * per second; a flick finishes the step even when it covered little ground.
 */
function settleDirection(progress, velocity = 0) {
  const projected = progress + velocity * 0.180001;
  if (projected >= 0.499999 && progress > 0) return 1;
  if (projected <= -0.499999 && progress < 0) return -1;
  return 0;
}

const hex = (value) => {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(value));
  if (!m) return [255, 255, 255];
  const h = m[1].length === 3 ? m[1].replace(/./g, (c) => c + c) : m[1];
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};
const mixColor = (a, b, k) => {
  const ca = hex(a), cb = hex(b);
  return `rgb(${ca.map((v, i) => Math.round(lerp(v, cb[i], clamp01(k)))).join(',')})`;
};

export function buildOrbitDeck(root, initialConfig = {}) {
  let config = { ...initialConfig };
  const win = root.ownerDocument.defaultView;
  const stage = root.querySelector('.od-stage');
  // Cards are indexed by slide, not by DOM order: the message card is last in
  // the markup so it paints above the photos before the first frame.
  const cards = [];
  root.querySelectorAll('[data-od-slide]').forEach((card) => {
    cards[Number(card.getAttribute('data-od-slide'))] = card;
  });
  const grad = root.querySelector('.od-grad');
  const grey = root.querySelector('.od-grey');
  const pill = root.querySelector('.od-pill');
  const dots = [...root.querySelectorAll('[data-od-dot]')];
  const live = root.querySelector('.od-live');

  const reduceQuery = win.matchMedia?.('(prefers-reduced-motion: reduce)');
  const reduced = () => reduceQuery?.matches === true;

  let active = START_SLIDE;
  let target = START_SLIDE;
  // A running step: direction, time into it, and whether it plays forward
  // (toward the next card) or back to where it started.
  let step = null;
  let drag = null;
  let scale = 1;
  let introT = config.intro && !reduced() ? 0 : Infinity;
  let restFor = 0;
  // Matches the reference angle where the intro starts: 14.45°/s × (0.643 s − 2.0667 s).
  let spin = -20.57;
  let hovering = false;
  let visible = true;
  let raf = 0;
  let last = 0;

  const fit = () => {
    const w = root.clientWidth, h = root.clientHeight;
    scale = Math.max(0.0499999, Math.min(w / FIT_W, h / FIT_H) * ((config.zoom ?? 100) / 100));
    stage?.style.setProperty('--od-s', scale.toFixed(4));
  };

  function announce() {
    if (!live) return;
    const name = cards[active]?.getAttribute('data-od-name') || '';
    live.textContent = `Slide ${active + 1} of ${SLIDE_COUNT}${name ? `: ${name}` : ''}`;
  }

  function markDots() {
    dots.forEach((dot, i) => {
      if (i === target) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
  }

  function commit(dir) {
    active = wrapIndex(active + dir);
    step = null;
    restFor = 0;
    announce();
    config.onChange?.(active);
  }

  function go(index) {
    target = wrapIndex(index);
    introT = Infinity;
    restFor = 0;
    markDots();
    wake();
  }

  function render() {
    const intro = Number.isFinite(introT) ? introFrame(introT) : null;
    const dir = drag ? drag.dir : step ? step.dir : 0;
    const tau = drag ? drag.tau : step ? step.tau : 0;
    const L = layout(active, dir, tau, intro ? intro.inward : 0);
    cards.forEach((card, i) => {
      card.style.transform = poseCss(L.pose[i]);
      card.style.zIndex = String(L.z[i]);
      card.style.visibility = L.z[i] < 0 ? 'hidden' : 'visible';
      card.setAttribute('aria-hidden', String(i !== L.centre));
      card.toggleAttribute('data-od-centre', i === L.centre);
    });
    if (grey) grey.style.opacity = intro ? clamp01(intro.grey).toFixed(4) : '0';
    if (pill) {
      pill.style.opacity = intro ? intro.pillOpacity.toFixed(4) : '1';
      pill.style.translate = intro ? `0 ${intro.pillOffset.toFixed(3)}px` : '0 0';
    }
    dots.forEach((dot, i) => {
      dot.style.setProperty('--od-dot', mixColor(config.dotColor, config.activeDotColor, L.dots[i]));
    });
    if (grad) grad.style.transform = `rotate(${spin.toFixed(3)}deg)`;
  }

  function tick(now) {
    raf = 0;
    const dt = last ? Math.min(0.0499999, (now - last) / 1000) : 0;
    last = now;
    if (!reduced()) spin = (spin + (config.spin ?? 0) * dt) % 360;

    if (Number.isFinite(introT)) {
      introT += dt;
      if (introFrame(introT).done) introT = Infinity;
    }

    if (!drag) {
      if (step) {
        step.tau += step.rate * dt;
        if (step.rate > 0 && step.tau >= SLIDE_DUR) commit(step.dir);
        else if (step.rate < 0 && step.tau <= 0) step = null;
      }
      if (!step && !Number.isFinite(introT)) {
        restFor += dt;
        const autoplay = config.autoplay ?? 0;
        const paused = hovering || root.contains(root.ownerDocument.activeElement) || reduced();
        if (target === active && autoplay > 0 && !paused && restFor >= Math.max(0, autoplay - SLIDE_DUR)) {
          target = wrapIndex(active + 1);
          markDots();
        }
        const dir = stepToward(active, target);
        if (dir) step = { dir, tau: reduced() ? SLIDE_DUR : 0, rate: 1 };
      }
    }
    render();
    if (visible && (drag || step || active !== target || Number.isFinite(introT) || (config.autoplay ?? 0) > 0 || (config.spin ?? 0) > 0)) raf = win.requestAnimationFrame(tick);
  }

  function wake() {
    if (raf || !visible) return;
    last = 0;
    raf = win.requestAnimationFrame(tick);
  }

  // ---- pointer -----------------------------------------------------------

  function setProgress(f) {
    while (f >= 1) { commit(1); f -= 1; drag.base -= 1; }
    while (f <= -1) { commit(-1); f += 1; drag.base += 1; }
    drag.dir = f > 0 ? 1 : f < 0 ? -1 : 0;
    drag.tau = Math.abs(f) * SLIDE_DUR;
  }

  function onPointerDown(event) {
    if (!config.draggable || config.preview) return;
    if (event.button !== 0 || event.target.closest?.('[data-od-dot]')) return;
    introT = Infinity;
    const base = step ? (step.dir * step.tau) / SLIDE_DUR : 0;
    step = null;
    drag = { id: event.pointerId, x: event.clientX, base, dir: 0, tau: 0, moved: false, v: 0, lastX: event.clientX, lastT: event.timeStamp };
    setProgress(base);
    target = active;
    wake();
  }

  function onPointerMove(event) {
    if (!drag || event.pointerId !== drag.id) return;
    const dx = (event.clientX - drag.x) / scale;
    if (!drag.moved && Math.abs(dx) < 4) return;
    if (!drag.moved) {
      drag.moved = true;
      root.setAttribute('data-dragging', '');
      try { root.setPointerCapture(event.pointerId); } catch { /* pointer already released */ }
    }
    const dtMs = Math.max(1, event.timeStamp - drag.lastT);
    const instant = (-(event.clientX - drag.lastX) / scale / DRAG_SPAN) * (1000 / dtMs);
    drag.v = drag.v * 0.600001 + instant * 0.399999;
    drag.lastX = event.clientX;
    drag.lastT = event.timeStamp;
    setProgress(drag.base - dx / DRAG_SPAN);
    wake();
  }

  function onPointerUp(event) {
    if (!drag || event.pointerId !== drag.id) return;
    const ended = drag;
    drag = null;
    root.removeAttribute('data-dragging');
    if (!ended.moved) {
      // A tap lets a step it interrupted finish, and a tap on a side card
      // then brings that card to the centre.
      if (ended.tau > 0) step = { dir: ended.dir, tau: ended.tau, rate: 1 };
      const card = event.target.closest?.('[data-od-slide]');
      if (card) go(Number(card.getAttribute('data-od-slide')));
      else go(step ? wrapIndex(active + step.dir) : active);
      return;
    }
    const f = (ended.dir * ended.tau) / SLIDE_DUR;
    const settle = settleDirection(f, event.type === 'pointercancel' ? 0 : ended.v);
    if (settle) {
      step = { dir: settle, tau: reduced() ? SLIDE_DUR : ended.tau, rate: 1 };
      target = wrapIndex(active + settle);
    } else if (ended.tau > 0) {
      step = { dir: ended.dir, tau: reduced() ? 0 : ended.tau, rate: -1 };
      target = active;
    }
    restFor = 0;
    markDots();
    wake();
  }

  function onDotClick(event) {
    const dot = event.target.closest?.('[data-od-dot]');
    if (!dot || config.preview) return;
    event.preventDefault();
    go(Number(dot.getAttribute('data-od-dot')));
  }

  function onKey(event) {
    if (config.preview) return;
    if (event.key === 'ArrowRight') go(target + 1);
    else if (event.key === 'ArrowLeft') go(target - 1);
    else if (event.key === 'Home') go(0);
    else if (event.key === 'End') go(SLIDE_COUNT - 1);
    else return;
    event.preventDefault();
  }

  const onEnter = () => { hovering = true; };
  const onLeave = () => { hovering = false; restFor = 0; };
  const onDragStart = (event) => event.preventDefault();

  root.addEventListener('pointerdown', onPointerDown);
  root.addEventListener('pointermove', onPointerMove);
  root.addEventListener('pointerup', onPointerUp);
  root.addEventListener('pointercancel', onPointerUp);
  root.addEventListener('click', onDotClick);
  root.addEventListener('keydown', onKey);
  root.addEventListener('pointerenter', onEnter);
  root.addEventListener('pointerleave', onLeave);
  root.addEventListener('dragstart', onDragStart);

  const resize = typeof win.ResizeObserver === 'function' ? new win.ResizeObserver(fit) : null;
  resize?.observe(root);
  const io = typeof win.IntersectionObserver === 'function'
    ? new win.IntersectionObserver((entries) => {
        visible = entries.some((entry) => entry.isIntersecting) && !root.ownerDocument.hidden;
        if (visible) wake();
      })
    : null;
  io?.observe(root);
  const onVisibility = () => {
    visible = !root.ownerDocument.hidden;
    if (visible) wake();
  };
  root.ownerDocument.addEventListener('visibilitychange', onVisibility);

  fit();
  markDots();
  render();
  wake();

  return {
    setConfig(next) {
      config = { ...config, ...next };
      fit();
      render();
      wake();
    },
    go,
    get active() {
      return active;
    },
    destroy() {
      if (raf) win.cancelAnimationFrame(raf);
      raf = 0;
      visible = false;
      resize?.disconnect();
      io?.disconnect();
      root.ownerDocument.removeEventListener('visibilitychange', onVisibility);
      root.removeEventListener('pointerdown', onPointerDown);
      root.removeEventListener('pointermove', onPointerMove);
      root.removeEventListener('pointerup', onPointerUp);
      root.removeEventListener('pointercancel', onPointerUp);
      root.removeEventListener('click', onDotClick);
      root.removeEventListener('keydown', onKey);
      root.removeEventListener('pointerenter', onEnter);
      root.removeEventListener('pointerleave', onLeave);
      root.removeEventListener('dragstart', onDragStart);
    }
  };
}

