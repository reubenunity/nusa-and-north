import './styles/palettes.css';
import './styles/base.css';
import './styles/hero.css';
import './styles/bridge.css';
import './styles/edit.css';
import './styles/outro.css';
import './styles/fallbacks.css';
import './styles/dev-panel.css';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

import { fullExperience, applyMotionClass } from './js/motion.js';
import { buildHero } from './js/hero.js';
import { buildBridge } from './js/bridge.js';
import { buildEdit, buildEditFallback } from './js/edit.js';
import { initDevPanel } from './js/dev-panel.js';

gsap.registerPlugin(ScrollTrigger);
applyMotionClass();

let teardowns = [];

function build() {
  teardowns = [buildHero(), buildBridge(), buildEdit()];
  ScrollTrigger.refresh();
}

function rebuild() {
  teardowns.forEach((kill) => kill());
  build();
}

if (fullExperience) {
  // Lenis smooth scroll driving GSAP's ticker
  const lenis = new Lenis({ lerp: 0.11 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  build();
  initDevPanel(rebuild);
} else {
  // reduced-motion / small-screen: static layout, native scrolling,
  // timeline becomes a horizontal scroller
  buildEditFallback();
  initDevPanel(() => {});
}
