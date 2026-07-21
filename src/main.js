import './styles/palettes.css';
import './styles/variants.css';
import './styles/base.css';
import './styles/hero.css';
import './styles/bridge.css';
import './styles/edit.css';
import './styles/cinema.css';
import './styles/recce.css';
import './styles/lightbox.css';
import './styles/proof.css';
import './styles/fallbacks.css';
import './styles/dev-panel.css';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

import { fullExperience, applyMotionClass, watchViewport, prefersReducedMotion } from './js/motion.js';
import { applyGate } from './js/scroll-gate.js';
import { buildHero, buildHeroLite } from './js/hero.js';
import { buildBridge } from './js/bridge.js';
import { buildEdit, buildEditFallback } from './js/edit.js';
import { buildCinema, wireReel } from './js/cinema.js';
import { buildRecce } from './js/recce.js';
import { initDevPanel } from './js/dev-panel.js';
import { buildProof } from './js/proof.js';

gsap.registerPlugin(ScrollTrigger);


// ?statdemo — client preview of the results stamps with SAMPLE numbers;
// real figures go on clips as data-stat and this block becomes moot
if (new URLSearchParams(location.search).has('statdemo')) {
  const samples = ['2.4M VIEWS · SAMPLE', '860K VIEWS · SAMPLE', '1.2M VIEWS · SAMPLE'];
  document.querySelectorAll('.js-video-lane .clip').forEach((clip, i) => {
    if (samples[i]) clip.dataset.stat = samples[i];
  });
  // the delivery report act is also part of the demo until real
  // figures are confirmed — then show-proof becomes unconditional
  document.documentElement.classList.add('show-proof');
  // &proof=blue|butter|dark — flip the act's palette for review
  const pv = new URLSearchParams(location.search).get('proof');
  if (/^[a-z]+$/.test(pv || '')) document.documentElement.classList.add(`proof-${pv}`);
  // with the Delivery on screen the recce shifts to scene 06
  const recceKicker = document.querySelector('.recce__kicker');
  if (recceKicker) recceKicker.textContent = 'SCENE 06 · THE RECCE';
}
applyMotionClass();
watchViewport();

// respect reduced motion: hold the hero on its poster frame
if (prefersReducedMotion) {
  const heroVideo = document.querySelector('.hero__media video');
  if (heroVideo) {
    heroVideo.autoplay = false;
    heroVideo.pause();
    heroVideo.addEventListener('loadeddata', () => heroVideo.pause(), { once: true });
  }
}

let teardowns = [];

function build() {
  // phones get the full scroll film too — except the production sheet,
  // whose two-column layout can't fit a pinned phone screen; it flows
  // statically with fade-up entrances instead
  // touch devices — iPads included — get the stable tier: pinned
  // scrub + per-char explosions and touch scrolling don't mix
  const smallScreen = window.innerWidth < 768 || window.matchMedia('(pointer: coarse)').matches;
  document.documentElement.classList.toggle('bridge-static', smallScreen);
  // the timeline is a swipe strip on phones — browse it or scroll past
  document.documentElement.classList.toggle('edit-static', smallScreen);
  // phones: cinematic hero intro without the fragile pinned explosion
  document.documentElement.classList.toggle('hero-static', smallScreen);
  // touch tier is fully pin-free: screening room flows, recce swipes
  document.documentElement.classList.toggle('cinema-static', smallScreen);
  document.documentElement.classList.toggle('recce-static', smallScreen);
  teardowns = [
    smallScreen ? buildHeroLite() : buildHero(),
    ...(smallScreen ? [] : [buildBridge()]),
    smallScreen ? buildEditFallback() : buildEdit(),
    // triggers must be created in DOCUMENT order or ScrollTrigger
    // mis-measures the neighbors of the delivery act's pin spacer
    ...(smallScreen ? [buildProof()] : [buildCinema(), buildProof(), buildRecce()]),
  ];
  if (smallScreen) wireReel();
  ScrollTrigger.refresh();
}

function rebuild() {
  teardowns.forEach((kill) => kill());
  build();
}

if (fullExperience) {
  // Lenis smooth scroll driving GSAP's ticker
  const lenis = new Lenis({ lerp: 0.11, virtualScroll: applyGate });
  window.__lenis = lenis; // dev handle for programmatic scrolling
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  build();

  // all scrub distances (timeline travel, explosion vectors, pin spans)
  // are measured at build time — remeasure when the window size settles
  // after a resize, or the timeline runs out of travel mid-scrub
  let lastW = window.innerWidth;
  let lastH = window.innerHeight;
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      // ignore small height-only changes (mobile URL bar show/hide)
      // or the rebuild would fire constantly mid-scroll on phones
      if (Math.abs(window.innerWidth - lastW) > 2 || Math.abs(window.innerHeight - lastH) > 150) {
        lastW = window.innerWidth;
        lastH = window.innerHeight;
        rebuild();
      }
    }, 300);
  });

  // the production sheet fades up as it enters view on touch devices
  if (window.innerWidth < 768 || window.matchMedia('(pointer: coarse)').matches) {
    const targets = document.querySelectorAll(
      '.about__main, .about__still, .quote, .cinema__screen, .recce__head, .pin, .recce__footer'
    );
    const reveal = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            reveal.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    targets.forEach((el) => {
      el.classList.add('fade-up');
      reveal.observe(el);
    });

    // nudge the horizontal strips when they first appear
    ['.edit__timeline', '.recce__viewport'].forEach((sel) => {
    const strip = document.querySelector(sel);
    if (strip) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            io.disconnect();
            setTimeout(() => {
              strip.scrollTo({ left: 140, behavior: 'smooth' });
              setTimeout(() => strip.scrollTo({ left: 0, behavior: 'smooth' }), 750);
            }, 500);
          });
        },
        { threshold: 0.4 }
      );
      io.observe(strip);
    }
    });
  }

  // dev-only iteration panel — never ships in the production build
  if (import.meta.env.DEV) {
    initDevPanel(rebuild);
    window.__ST = ScrollTrigger;
  }
} else {
  // reduced-motion / small-screen: static layout, native scrolling,
  // timeline becomes a horizontal scroller
  buildEditFallback();
  buildProof();

  // motion lite: fade sections up as they enter the viewport
  if (!prefersReducedMotion) {
    const targets = document.querySelectorAll(
      '.about__main, .about__still, .quote, .edit__monitor, .edit__timeline, .cinema__screen, .recce__head, .pin, .recce__footer'
    );
    const reveal = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            reveal.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    targets.forEach((el) => {
      el.classList.add('fade-up');
      reveal.observe(el);
    });
  }

  // nudge the horizontal strips when they first appear, so nobody
  // misses that they swipe sideways
  if (!prefersReducedMotion) {
    ['.edit__timeline', '.recce__viewport'].forEach((sel) => {
      const el = document.querySelector(sel);
      if (!el) return;
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            io.disconnect();
            setTimeout(() => {
              el.scrollTo({ left: 140, behavior: 'smooth' });
              setTimeout(() => el.scrollTo({ left: 0, behavior: 'smooth' }), 750);
            }, 500);
          });
        },
        { threshold: 0.4 }
      );
      io.observe(el);
    });
  }

  if (import.meta.env.DEV) initDevPanel(() => {});
}
