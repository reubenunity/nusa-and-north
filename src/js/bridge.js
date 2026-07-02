import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { config } from '../config.js';

gsap.registerPlugin(ScrollTrigger);

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

  // slate text in
  tl.fromTo(
    cutTo,
    { opacity: 0, letterSpacing: '1.2em' },
    { opacity: 1, letterSpacing: '0.5em', duration: bridge.cutToIn, ease: 'power2.out' },
    0.02
  );
  tl.fromTo(
    title,
    { opacity: 0, scale: 0.96 },
    {
      opacity: 1,
      scale: 1,
      duration: bridge.titleIn - bridge.cutToIn,
      ease: 'power2.out',
    },
    bridge.cutToIn
  );

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
