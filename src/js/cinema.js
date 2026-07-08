import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { config } from '../config.js';

gsap.registerPlugin(ScrollTrigger);

// The screening room: one confident moment. The screen assembles
// while the room wipes into view, the projector beam ignites, and
// the services line + intermission settle in beneath the reel.
export function buildCinema() {
  const { cinema } = config;

  const section = document.querySelector('.cinema');
  const beam = document.querySelector('.cinema__beam');
  const dust = document.querySelector('.cinema__dust');
  const bars = document.querySelector('.cinema__bars');
  const screen = document.querySelector('.js-screen');
  const services = document.querySelector('.js-services');
  const intermission = document.querySelector('.js-intermission');

  // ---- entrance: the room assembles during the wipe-in ----
  const entranceTl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: section,
      start: 'top bottom',
      end: 'top top',
      scrub: true,
    },
  });
  entranceTl.fromTo(bars, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power1.out' }, 0.15);
  entranceTl.fromTo(
    screen,
    { opacity: 0, scale: 0.94 },
    { opacity: 1, scale: 1, duration: 0.55, ease: 'power2.out' },
    0.35
  );
  entranceTl.fromTo(dust, { opacity: 0 }, { opacity: 0.7, duration: 0.5, ease: 'power1.out' }, 0.4);

  // ---- pinned: the beam ignites and the room holds ----
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: `+=${cinema.scrollVh}%`,
      pin: '.cinema__stage',
      scrub: true,
    },
  });

  tl.fromTo(beam, { opacity: 0 }, { opacity: 0.8, duration: 0.18, ease: 'power1.out' }, 0.04);
  tl.to(dust, { opacity: 1, duration: 0.1 }, 0.08);
  tl.fromTo(services, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.12, ease: 'power2.out' }, 0.22);
  tl.fromTo(intermission, { opacity: 0 }, { opacity: 1, duration: 0.1 }, 0.42);
  // pad so authored positions map 1:1 onto pin progress
  tl.set({}, {}, 1);

  return () => {
    entranceTl.scrollTrigger?.kill();
    entranceTl.kill();
    tl.scrollTrigger?.kill();
    tl.kill();
    gsap.set([beam, dust, bars, screen, services, intermission], { clearProps: 'all' });
  };
}
