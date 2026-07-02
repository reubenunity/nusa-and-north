import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { config } from '../config.js';

gsap.registerPlugin(ScrollTrigger);

// Production notes page. The about column, credits, stripe, and still
// assemble WHILE the sheet wipes into view (so it never sits blank);
// the pinned phase stamps the critic quotes in and parallaxes the
// ghost watermark, then holds.
export function buildBridge() {
  const { bridge } = config;

  const section = document.querySelector('.bridge');
  const stripes = document.querySelector('.about__stripes');
  const ghost = document.querySelector('.about__ghost');
  const still = document.querySelector('.js-still');
  const aboutEls = gsap.utils.toArray('.js-about-in');
  const quotes = gsap.utils.toArray('.js-quote');

  // ---- entrance: assembles during the wipe-in ----
  const entranceTl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: section,
      start: 'top bottom',
      end: 'top top',
      scrub: true,
    },
  });

  entranceTl.fromTo(
    stripes,
    { scaleX: 0 },
    { scaleX: 1, duration: 0.55, ease: 'power2.out' },
    0.1
  );
  aboutEls.forEach((el, i) => {
    entranceTl.fromTo(
      el,
      { opacity: 0, y: 46 },
      { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' },
      0.18 + i * 0.06
    );
  });
  entranceTl.fromTo(
    still,
    { clipPath: 'inset(0 100% 0 0)', opacity: 0.4 },
    { clipPath: 'inset(0 0% 0 0)', opacity: 1, duration: 0.4, ease: 'power2.out' },
    0.3
  );

  // ---- pinned phase: quotes stamp in, ghost drifts, then hold ----
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: `+=${bridge.scrollVh}%`,
      pin: '.bridge__stage',
      scrub: true,
    },
  });

  quotes.forEach((el, i) => {
    tl.fromTo(
      el,
      { opacity: 0, y: 40, rotation: 1.6, scale: 0.97 },
      { opacity: 1, y: 0, rotation: 0, scale: 1, duration: 0.14, ease: 'power2.out' },
      bridge.quotesIn + i * 0.09
    );
  });

  tl.fromTo(ghost, { yPercent: 14 }, { yPercent: -6, duration: 1 }, 0);

  return () => {
    entranceTl.scrollTrigger?.kill();
    entranceTl.kill();
    tl.scrollTrigger?.kill();
    tl.kill();
    gsap.set([stripes, ghost, still, ...aboutEls, ...quotes], { clearProps: 'all' });
  };
}
