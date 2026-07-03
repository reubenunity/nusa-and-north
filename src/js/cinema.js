import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { config } from '../config.js';
import { splitIntoChars } from './utils.js';
import { setScrollGate, clearScrollGate } from './scroll-gate.js';

gsap.registerPlugin(ScrollTrigger);

// Beat map (fractions of the pinned span) — spread wide so nothing
// flashes past: curtains part first, then the trailer reel plays.
const CURTAIN_END = 0.16;   // curtains fully open here
const CARD_AT = [0.14, 0.27, 0.4, 0.53]; // card 1 forms AS the curtains part
const CARD_IN_DUR = 0.045;
const CARD_EXIT = 0.09;     // disperse starts this far after entrance
const FEATURE_AT = 0.66;
const SCREEN_AT = 0.78;
// walls: where the scroll physically stops (card centers + feature)
const WALLS = [0.21, 0.34, 0.47, 0.6, 0.71];

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
        duration: 0.04,
        ease: 'power2.in',
      },
      exitAt + Math.random() * 0.015
    );
  });

  // the quieter layers (and the footage) just fade
  const rest = ['.cinema__card-index', '.cinema__card-kicker', '.cinema__card-sub', '.cinema__card-deliv', '.cinema__card-media']
    .map((s) => card.querySelector(s))
    .filter(Boolean);
  tl.to(rest, { opacity: 0, duration: 0.03, ease: 'power1.in' }, exitAt);
}

export function buildCinema() {
  const { cinema } = config;

  const section = document.querySelector('.cinema');
  const beam = document.querySelector('.cinema__beam');
  const dust = document.querySelector('.cinema__dust');
  const bars = document.querySelector('.cinema__bars');
  const curtainL = document.querySelector('.js-curtain-l');
  const curtainR = document.querySelector('.js-curtain-r');
  const trailers = gsap.utils.toArray('.js-trailer');
  const featureCard = document.querySelector('.js-feature-card');
  const screen = document.querySelector('.js-screen');
  const intermission = document.querySelector('.js-intermission');

  // ---- entrance: the closed curtain wall rises over the countdown;
  // bars and dust settle in behind it ----
  const entranceTl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: section,
      start: 'top bottom',
      end: 'top top',
      scrub: true,
    },
  });
  entranceTl.fromTo(bars, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power1.out' }, 0.2);
  entranceTl.fromTo(dust, { opacity: 0 }, { opacity: 0.6, duration: 0.5, ease: 'power1.out' }, 0.4);

  // ---- the pinned act ----
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: `+=${cinema.scrollVh}%`,
      pin: '.cinema__stage',
      scrub: true,
      // (no ScrollTrigger snap — it writes scroll programmatically and
      // bypasses the wall gate; the walls below own the card pacing)
    },
  });

  // the curtains part
  tl.to(curtainL, { xPercent: -102, duration: CURTAIN_END, ease: 'power2.inOut' }, 0.005);
  tl.to(curtainR, { xPercent: 102, duration: CURTAIN_END, ease: 'power2.inOut' }, 0.005);

  // trailer cards, projected one after another; titles disperse on exit
  const maxDim = Math.max(window.innerWidth, window.innerHeight);
  const allChars = [];
  trailers.forEach((card, i) => {
    const at = CARD_AT[i];
    tl.fromTo(
      card,
      { opacity: 0, scale: 0.965, y: 26 },
      { opacity: 1, scale: 1, y: 0, duration: CARD_IN_DUR, ease: 'power2.out' },
      at
    );
    disperseTitle(tl, card, at + CARD_EXIT, maxDim, allChars);
  });

  // "the feature presentation"
  tl.fromTo(
    featureCard,
    { opacity: 0, scale: 0.965 },
    { opacity: 1, scale: 1, duration: 0.035, ease: 'power2.out' },
    FEATURE_AT
  );
  disperseTitle(tl, featureCard, FEATURE_AT + 0.07, maxDim, allChars);

  // the reel fills the screen; the projector beam ignites behind it
  tl.fromTo(
    screen,
    { opacity: 0, scale: 0.92 },
    { opacity: 1, scale: 1, duration: 0.06, ease: 'power2.out' },
    SCREEN_AT
  );
  tl.fromTo(beam, { opacity: 0 }, { opacity: 0.8, duration: 0.05, ease: 'power1.out' }, SCREEN_AT);
  tl.to(dust, { opacity: 1, duration: 0.04 }, SCREEN_AT);
  tl.fromTo(intermission, { opacity: 0 }, { opacity: 1, duration: 0.03 }, 0.92);

  // pad the timeline to exactly 1 so authored positions map 1:1
  // onto pin progress (scrub distributes scroll across total duration)
  tl.set({}, {}, 1);

  // ---- hard stops: the scroll cannot blow past a card ----
  // A gate on Lenis's virtual-scroll caps each downward delta so the
  // scroll target lands exactly on the next card and stays there; the
  // wall unlocks after a short dwell, so one gesture = one beat.
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
    entranceTl.scrollTrigger?.kill();
    entranceTl.kill();
    tl.scrollTrigger?.kill();
    tl.kill();
    gsap.set([beam, dust, bars, curtainL, curtainR, featureCard, screen, intermission, ...trailers, ...allChars], {
      clearProps: 'all',
    });
  };
}
