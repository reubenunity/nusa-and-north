import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { config } from '../config.js';
import { timecode } from './utils.js';

gsap.registerPlugin(ScrollTrigger);

// Compute the exit vector for a HUD element under the current direction mode.
function exitVector(el, mode) {
  if (mode === 'up') return { x: 0, y: -1 };
  if (mode === 'down') return { x: 0, y: 1 };

  if (mode === 'radial') {
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2 - window.innerWidth / 2;
    const cy = r.top + r.height / 2 - window.innerHeight / 2;
    const len = Math.hypot(cx, cy) || 1;
    return { x: cx / len, y: cy / len };
  }

  // 'own' — each element's authored vector (data-vx / data-vy)
  const vx = parseFloat(el.dataset.vx ?? '0');
  const vy = parseFloat(el.dataset.vy ?? '-1');
  const len = Math.hypot(vx, vy) || 1;
  return { x: vx / len, y: vy / len };
}

// Wrap each headline character in a span (once — survives rebuilds).
// Chars are grouped into word wrappers so lines can only break at
// spaces — never mid-word.
function splitHeadline(headline) {
  if (headline.dataset.split) return;
  headline.querySelectorAll('.hero__headline-line').forEach((line) => {
    const words = line.textContent.trim().split(/\s+/);
    line.textContent = '';
    words.forEach((word, w) => {
      if (w > 0) line.appendChild(document.createTextNode(' '));
      const wordSpan = document.createElement('span');
      wordSpan.className = 'hero__word';
      for (const ch of word) {
        const span = document.createElement('span');
        span.className = 'hero__char';
        span.textContent = ch;
        wordSpan.appendChild(span);
      }
      line.appendChild(wordSpan);
    });
  });
  headline.dataset.split = '1';
}

export function buildHero() {
  const { hero, dismantlePresets } = config;
  const preset = dismantlePresets[hero.dismantlePreset];

  const section = document.querySelector('.hero');
  const headline = document.querySelector('.hero__headline-wrap');
  const hudEls = gsap.utils.toArray('[data-hud]');
  const tcEl = document.querySelector('.js-hero-timecode');
  const focusLabel = document.querySelector('.js-focus-label');
  const media = document.querySelector('.hero__media');
  const mediaActive = media && document.documentElement.dataset.hero !== 'flood';

  const headlineEl = document.querySelector('.hero__headline');
  const sub = document.querySelector('.hero__sub');
  splitHeadline(headlineEl);
  const chars = gsap.utils.toArray('.hero__char');

  // ---- the focus pull plays by itself on load, so nobody mistakes
  // the defocused frame for a loading state ----
  const focusTargets = mediaActive ? [media, headline] : [headline];
  const intro = gsap.timeline({ delay: 0.3 });
  intro.fromTo(
    focusTargets,
    { filter: `blur(${hero.startBlur}px)`, scale: 1.045 },
    {
      filter: 'blur(0px)',
      scale: 1,
      duration: 1.6,
      ease: 'power2.out',
      stagger: 0.1,
      onComplete() {
        focusLabel.textContent = 'AF · LOCKED';
      },
    }
  );

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: `+=${hero.scrollVh}%`,
      pin: '.hero__stage',
      pinSpacing: true,
      scrub: true,
      onUpdate(self) {
        tcEl.textContent = timecode(self.progress * 42);
      },
    },
  });

  // ---- phase 2: the dismantle ----
  // timings normalized so the LAST element lands exactly at pin release —
  // no dead scroll between the animation ending and the slate wiping in
  const span = hero.dismantleEnd - hero.dismantleStart;
  const flightDur = Math.max(span * 0.25, span - (hudEls.length - 1) * preset.stagger);
  const stagger = (span - flightDur) / (hudEls.length - 1);
  const maxDim = Math.max(window.innerWidth, window.innerHeight);

  // shuffle order so the teardown doesn't read top-to-bottom in DOM order
  const order = gsap.utils.shuffle([...hudEls]);

  order.forEach((el, i) => {
    const at = hero.dismantleStart + i * stagger;
    const mode = el.dataset.mode;

    if (mode === 'fade') {
      tl.to(el, { opacity: 0, duration: flightDur * 0.6, ease: 'power1.in' }, at);
      return;
    }
    if (mode === 'scale') {
      tl.to(
        el,
        { scale: 1.6, opacity: 0, duration: flightDur * 0.8, ease: preset.ease },
        at
      );
      return;
    }

    const v = exitVector(el, hero.dismantleDirection);
    const jitter = 1 + gsap.utils.random(-preset.jitter, preset.jitter);
    const dist = preset.distance * maxDim * jitter;

    tl.to(
      el,
      {
        x: v.x * dist,
        y: v.y * dist,
        rotation: gsap.utils.random(-preset.rotation, preset.rotation),
        scale: preset.scale,
        opacity: 0,
        filter: preset.blur ? `blur(${preset.blur}px)` : 'none',
        duration: flightDur,
        ease: preset.ease,
      },
      at
    );
  });

  // ---- the headline explodes with the HUD ----
  // each character flies out radially from the headline's center,
  // violence follows the active dismantle preset
  const headRect = headlineEl.getBoundingClientRect();
  const headCx = headRect.left + headRect.width / 2;
  const headCy = headRect.top + headRect.height / 2;
  const explodeStart = hero.dismantleStart + span * 0.15;
  const charDur = Math.max(0.1, span * 0.45);

  chars.forEach((ch) => {
    const r = ch.getBoundingClientRect();
    const dx = r.left + r.width / 2 - headCx;
    const dy = r.top + r.height / 2 - headCy;
    const len = Math.hypot(dx, dy) || 1;
    const dist = preset.distance * maxDim * (0.45 + Math.random() * (0.35 + preset.jitter));

    tl.to(
      ch,
      {
        x: (dx / len) * dist,
        y: (dy / len) * dist - maxDim * 0.04,
        rotation: gsap.utils.random(-preset.rotation * 2.2, preset.rotation * 2.2),
        opacity: 0,
        duration: charDur,
        ease: preset.ease,
      },
      explodeStart + Math.random() * Math.max(0, 1 - charDur - explodeStart)
    );
  });

  tl.to(sub, { opacity: 0, duration: span * 0.2, ease: 'power1.in' }, explodeStart);

  // the footage "powers down" with the HUD, handing off to the slate
  if (mediaActive) {
    tl.to(
      media,
      { opacity: 0, duration: span * 0.7, ease: 'power1.in' },
      hero.dismantleStart + span * 0.3
    );
  }

  return () => {
    intro.kill();
    tl.scrollTrigger?.kill();
    tl.kill();
    gsap.set([headline, media, sub, ...chars, ...hudEls].filter(Boolean), { clearProps: 'all' });
  };
}
