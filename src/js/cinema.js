import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { config } from '../config.js';
import { splitIntoChars } from './utils.js';
import { setScrollGate, clearScrollGate } from './scroll-gate.js';

gsap.registerPlugin(ScrollTrigger);

// Card titles exit like the hero headline: each character disperses
// radially from the title's center.
function disperseTitle(tl, card, exitAt, maxDim, allChars) {
  const title = card.querySelector('.cinema__card-title');
  const chars = splitIntoChars(title, 'cinema__char');
  allChars.push(...chars);

  const tr = title.getBoundingClientRect();
  const cx = tr.left + tr.width / 2;
  const cy = tr.top + tr.height / 2;

  chars.forEach((ch) => {
    const r = ch.getBoundingClientRect();
    const dx = r.left + r.width / 2 - cx;
    const dy = r.top + r.height / 2 - cy;
    const len = Math.hypot(dx, dy) || 1;
    const dist = maxDim * (0.22 + Math.random() * 0.3);

    tl.to(
      ch,
      {
        x: (dx / len) * dist,
        y: (dy / len) * dist - maxDim * 0.03,
        rotation: gsap.utils.random(-42, 42),
        opacity: 0,
        duration: 0.03,
        ease: 'power2.in',
      },
      exitAt + Math.random() * 0.012
    );
  });

  // the quieter layers (and the footage) just fade
  const rest = ['.cinema__card-index', '.cinema__card-kicker', '.cinema__card-sub', '.cinema__card-deliv', '.cinema__card-media']
    .map((s) => card.querySelector(s))
    .filter(Boolean);
  tl.to(rest, { opacity: 0, duration: 0.02, ease: 'power1.in' }, exitAt);
}

// Lights down → projector flickers up → academy leader counts down →
// trailer cards (services) → "feature presentation" → the reel.
export function buildCinema() {
  const { cinema } = config;

  const section = document.querySelector('.cinema');
  const beam = document.querySelector('.cinema__beam');
  const dust = document.querySelector('.cinema__dust');
  const bars = document.querySelector('.cinema__bars');
  const leader = document.querySelector('.cinema__leader');
  const countEl = document.querySelector('.js-cinema-count');
  const trailers = gsap.utils.toArray('.js-trailer');
  const featureCard = document.querySelector('.js-feature-card');
  const screen = document.querySelector('.js-screen');
  const intermission = document.querySelector('.js-intermission');

  const LEADER_IN = 0.045;
  const LEADER_OUT = 0.185;

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: `+=${cinema.scrollVh}%`,
      pin: '.cinema__stage',
      scrub: true,
      // settle on the nearest beat (countdown, each trailer card,
      // feature card, the reel) whenever scrolling stops
      snap: {
        snapTo: [0, 0.115, 0.26, 0.355, 0.45, 0.545, 0.655, 0.9, 1],
        duration: { min: 0.25, max: 0.7 },
        delay: 0.08,
        ease: 'power1.inOut',
      },
      onUpdate(self) {
        // leader countdown 5 → 1
        const p = self.progress;
        if (p > LEADER_IN && p < LEADER_OUT) {
          const n = 5 - Math.floor(((p - LEADER_IN) / (LEADER_OUT - LEADER_IN)) * 5);
          countEl.textContent = String(Math.max(1, n));
        }
      },
    },
  });

  // letterbox bars close in, dust drifts up; the beam waits for the feature
  tl.fromTo(bars, { opacity: 0 }, { opacity: 1, duration: 0.05, ease: 'power1.out' }, 0.0);
  tl.fromTo(dust, { opacity: 0 }, { opacity: 0.6, duration: 0.06, ease: 'power1.out' }, 0.01);

  // leader
  tl.fromTo(leader, { opacity: 0 }, { opacity: 1, duration: 0.025 }, LEADER_IN);
  tl.to(leader, { opacity: 0, duration: 0.02 }, LEADER_OUT);

  // trailer cards, projected one after another; titles disperse on exit
  const maxDim = Math.max(window.innerWidth, window.innerHeight);
  const allChars = [];
  trailers.forEach((card, i) => {
    const at = 0.21 + i * 0.095;
    tl.fromTo(
      card,
      { opacity: 0, scale: 0.965, y: 26 },
      { opacity: 1, scale: 1, y: 0, duration: 0.032, ease: 'power2.out' },
      at
    );
    disperseTitle(tl, card, at + 0.068, maxDim, allChars);
  });

  // "the feature presentation"
  tl.fromTo(
    featureCard,
    { opacity: 0, scale: 0.965 },
    { opacity: 1, scale: 1, duration: 0.03, ease: 'power2.out' },
    0.61
  );
  disperseTitle(tl, featureCard, 0.675, maxDim, allChars);

  // the reel fills the screen; beam settles dim behind it
  tl.fromTo(
    screen,
    { opacity: 0, scale: 0.92 },
    { opacity: 1, scale: 1, duration: 0.07, ease: 'power2.out' },
    0.71
  );
  // the projector beam switches on with the reel, behind the screen
  tl.fromTo(beam, { opacity: 0 }, { opacity: 0.8, duration: 0.06, ease: 'power1.out' }, 0.71);
  tl.to(dust, { opacity: 1, duration: 0.05 }, 0.71);
  tl.fromTo(intermission, { opacity: 0 }, { opacity: 1, duration: 0.04 }, 0.88);

  // pad the timeline to exactly 1 so authored positions map 1:1
  // onto pin progress (scrub distributes scroll across total duration)
  tl.set({}, {}, 1);

  // ---- hard stops: the scroll cannot blow past a card ----
  // A gate on Lenis's virtual-scroll caps each downward delta so the
  // scroll target lands exactly on the next card and stays there; the
  // wall unlocks after a short dwell, so one gesture = one beat.
  const WALLS = [0.26, 0.355, 0.45, 0.545, 0.655]; // card + feature centers
  const DWELL_MS = 350;
  let unlocked = 0;
  let dwellTimer = null;

  const gate = (data) => {
    const st = tl.scrollTrigger;
    const lenis = window.__lenis;
    if (!st || !lenis || data.deltaY <= 0) return true; // upward is free
    const dist = st.end - st.start;
    if (dist <= 0) return true;

    const target = lenis.targetScroll;
    if (target <= st.start) unlocked = 0;
    // scrolled back up past a wall: re-arm it
    while (unlocked > 0 && target < st.start + WALLS[unlocked - 1] * dist - 4) unlocked--;
    if (unlocked >= WALLS.length) return true;

    const wallY = st.start + WALLS[unlocked] * dist;
    if (target >= wallY - 1) {
      // sitting at the wall — swallow deltas until the dwell unlocks
      if (!dwellTimer) {
        dwellTimer = setTimeout(() => {
          unlocked++;
          dwellTimer = null;
        }, DWELL_MS);
      }
      data.deltaY = 0;
    } else if (target + data.deltaY > wallY) {
      // this gesture would overshoot — land exactly on the card
      data.deltaY = wallY - target;
    }
    return true;
  };
  setScrollGate(gate);

  return () => {
    clearScrollGate(gate);
    if (dwellTimer) clearTimeout(dwellTimer);
    tl.scrollTrigger?.kill();
    tl.kill();
    gsap.set([beam, dust, bars, leader, featureCard, screen, intermission, ...trailers, ...allChars], {
      clearProps: 'all',
    });
  };
}
