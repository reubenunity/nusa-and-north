import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { config } from '../config.js';

gsap.registerPlugin(ScrollTrigger);

// The slate arrives with its text already on the card (like a real
// title card wiping in) — the pinned phase just holds, then releases.
export function buildBridge() {
  const { bridge } = config;

  const section = document.querySelector('.bridge');
  const cutTo = document.querySelector('.bridge__cut-to');
  const title = document.querySelector('.bridge__title');

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

  // hold, then release out before unpin
  tl.to(
    [cutTo, title],
    { opacity: 0, duration: 1 - bridge.holdUntil - 0.02, ease: 'power1.in' },
    bridge.holdUntil
  );

  return () => {
    tl.scrollTrigger?.kill();
    tl.kill();
    gsap.set([cutTo, title], { clearProps: 'all' });
  };
}
