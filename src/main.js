import './styles/palettes.css';
import './styles/variants.css';
import './styles/base.css';
import './styles/hero.css';
import './styles/bridge.css';
import './styles/edit.css';
import './styles/cinema.css';
import './styles/recce.css';
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
  // dev-only iteration panel — never ships in the production build
  if (import.meta.env.DEV) initDevPanel(rebuild);
} else {
  // reduced-motion / small-screen: static layout, native scrolling,
  // timeline becomes a horizontal scroller
  buildEditFallback();
  if (import.meta.env.DEV) initDevPanel(() => {});
}
