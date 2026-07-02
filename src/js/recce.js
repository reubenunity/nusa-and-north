import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { config } from '../config.js';

gsap.registerPlugin(ScrollTrigger);

// The scout's board: header assembles on the wipe-in, then vertical
// scroll pans the board horizontally from pin to pin, ending on
// "NEXT LOCATION: YOURS" (the contact close).
export function buildRecce() {
  const { recce } = config;

  const section = document.querySelector('.recce');
  const track = document.querySelector('.js-recce-track');
  const headEls = gsap.utils.toArray('.js-recce-in');

  const entranceTl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: section,
      start: 'top bottom',
      end: 'top top',
      scrub: true,
    },
  });
  headEls.forEach((el, i) => {
    entranceTl.fromTo(
      el,
      { opacity: 0, y: 34 },
      { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' },
      0.3 + i * 0.08
    );
  });

  const travel = Math.max(0, track.scrollWidth - window.innerWidth);

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: `+=${recce.scrollVh}%`,
      pin: '.recce__stage',
      scrub: true,
    },
  });

  tl.to(track, { x: -travel, duration: 1 }, 0);

  return () => {
    entranceTl.scrollTrigger?.kill();
    entranceTl.kill();
    tl.scrollTrigger?.kill();
    tl.kill();
    gsap.set([track, ...headEls], { clearProps: 'all' });
  };
}
