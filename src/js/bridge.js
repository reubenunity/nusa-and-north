import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { config } from '../config.js';

gsap.registerPlugin(ScrollTrigger);

// Phase 1: the slate arrives with its text on the card and holds.
// Phase 2: the slate lifts and the production notes (about + quotes)
// build in — kicker, headline lines, body, credits, then each quote.
// The edit section wipes over the finished card, so no exit needed.
export function buildBridge() {
  const { bridge } = config;

  const section = document.querySelector('.bridge');
  const cutTo = document.querySelector('.bridge__cut-to');
  const title = document.querySelector('.bridge__title');
  const aboutEls = gsap.utils.toArray('.js-about-in');
  const quotes = gsap.utils.toArray('.js-quote');

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

  // slate holds, then lifts away
  tl.to(cutTo, { opacity: 0, y: -30, duration: 0.08, ease: 'power1.in' }, bridge.slateHold);
  tl.to(
    title,
    { opacity: 0, y: -60, scale: 0.97, duration: 0.1, ease: 'power1.in' },
    bridge.slateHold + 0.02
  );

  // about column builds in
  aboutEls.forEach((el, i) => {
    tl.fromTo(
      el,
      { opacity: 0, y: 46 },
      { opacity: 1, y: 0, duration: 0.1, ease: 'power2.out' },
      bridge.notesIn + i * 0.035
    );
  });

  // critic quotes stamp in one by one
  quotes.forEach((el, i) => {
    tl.fromTo(
      el,
      { opacity: 0, y: 40, rotation: 1.6, scale: 0.97 },
      { opacity: 1, y: 0, rotation: 0, scale: 1, duration: 0.12, ease: 'power2.out' },
      bridge.quotesIn + i * 0.07
    );
  });

  return () => {
    tl.scrollTrigger?.kill();
    tl.kill();
    gsap.set([cutTo, title, ...aboutEls, ...quotes], { clearProps: 'all' });
  };
}
