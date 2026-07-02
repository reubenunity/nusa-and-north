import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { config } from '../config.js';
import { splitIntoChars } from './utils.js';

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

  // the quieter lines just fade
  const rest = ['.cinema__card-index', '.cinema__card-kicker', '.cinema__card-sub']
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

  // projector warms up — one smooth rise, no flicker
  tl.fromTo(beam, { opacity: 0 }, { opacity: 0.5, duration: 0.045, ease: 'power1.out' }, 0.0);

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
  tl.to(beam, { opacity: 0.16, duration: 0.05 }, 0.71);
  tl.fromTo(intermission, { opacity: 0 }, { opacity: 1, duration: 0.04 }, 0.88);

  // pad the timeline to exactly 1 so authored positions map 1:1
  // onto pin progress (scrub distributes scroll across total duration)
  tl.set({}, {}, 1);

  return () => {
    tl.scrollTrigger?.kill();
    tl.kill();
    gsap.set([beam, leader, featureCard, screen, intermission, ...trailers, ...allChars], {
      clearProps: 'all',
    });
  };
}
