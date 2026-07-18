import './styles/palettes.css';
import './styles/variants.css';
import './styles/base.css';
import './styles/hero.css';
import './styles/bridge.css';
import './styles/edit.css';
import './styles/cinema.css';
import './styles/recce.css';
import './styles/lightbox.css';
import './styles/fallbacks.css';
import './styles/dev-panel.css';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

import { fullExperience, applyMotionClass, watchViewport, prefersReducedMotion } from './js/motion.js';
import { applyGate } from './js/scroll-gate.js';
import { buildHero } from './js/hero.js';
import { buildBridge } from './js/bridge.js';
import { buildEdit, buildEditFallback } from './js/edit.js';
import { buildCinema } from './js/cinema.js';
import { buildRecce } from './js/recce.js';
import { initDevPanel } from './js/dev-panel.js';

gsap.registerPlugin(ScrollTrigger);
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
  teardowns = [buildHero(), buildBridge(), buildEdit(), buildCinema(), buildRecce()];
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
      if (Math.abs(window.innerWidth - lastW) > 2 || Math.abs(window.innerHeight - lastH) > 2) {
        lastW = window.innerWidth;
        lastH = window.innerHeight;
        rebuild();
      }
    }, 300);
  });

  // dev-only iteration panel — never ships in the production build
  if (import.meta.env.DEV) initDevPanel(rebuild);
} else {
  // reduced-motion / small-screen: static layout, native scrolling,
  // timeline becomes a horizontal scroller
  buildEditFallback();

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
