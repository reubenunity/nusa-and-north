import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { config } from '../config.js';

gsap.registerPlugin(ScrollTrigger);

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

  // projector stutters awake — immediately, no dead black
  tl.fromTo(beam, { opacity: 0 }, { opacity: 0.55, duration: 0.008 }, 0.0);
  tl.to(beam, { opacity: 0.08, duration: 0.007 }, 0.012);
  tl.to(beam, { opacity: 0.7, duration: 0.008 }, 0.022);
  tl.to(beam, { opacity: 0.3, duration: 0.01 }, 0.033);
  tl.to(beam, { opacity: 0.5, duration: 0.015 }, 0.045);

  // leader
  tl.fromTo(leader, { opacity: 0 }, { opacity: 1, duration: 0.025 }, LEADER_IN);
  tl.to(leader, { opacity: 0, duration: 0.02 }, LEADER_OUT);

  // trailer cards, projected one after another
  trailers.forEach((card, i) => {
    const at = 0.21 + i * 0.095;
    tl.fromTo(
      card,
      { opacity: 0, scale: 0.965, y: 26 },
      { opacity: 1, scale: 1, y: 0, duration: 0.032, ease: 'power2.out' },
      at
    );
    tl.to(card, { opacity: 0, y: -20, duration: 0.024, ease: 'power1.in' }, at + 0.068);
  });

  // "the feature presentation"
  tl.fromTo(
    featureCard,
    { opacity: 0, scale: 0.965 },
    { opacity: 1, scale: 1, duration: 0.03, ease: 'power2.out' },
    0.61
  );
  tl.to(featureCard, { opacity: 0, duration: 0.024, ease: 'power1.in' }, 0.675);

  // the reel fills the screen; beam settles dim behind it
  tl.fromTo(
    screen,
    { opacity: 0, scale: 0.92 },
    { opacity: 1, scale: 1, duration: 0.07, ease: 'power2.out' },
    0.71
  );
  tl.to(beam, { opacity: 0.16, duration: 0.05 }, 0.71);
  tl.fromTo(intermission, { opacity: 0 }, { opacity: 1, duration: 0.04 }, 0.88);

  return () => {
    tl.scrollTrigger?.kill();
    tl.kill();
    gsap.set([beam, leader, featureCard, screen, intermission, ...trailers], {
      clearProps: 'all',
    });
  };
}
