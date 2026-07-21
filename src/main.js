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
import './styles/sound.css';
import './styles/fallbacks.css';
import './styles/dev-panel.css';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

import { fullExperience, applyMotionClass, watchViewport, prefersReducedMotion } from './js/motion.js';
import { applyGate } from './js/scroll-gate.js';
import { buildHero, buildHeroLite } from './js/hero.js';
import { buildBridge } from './js/bridge.js';
import { buildEdit, buildEditFallback, wireAutosaveToast } from './js/edit.js';
import { buildCinema, wireReel, buildVillage, buildSocial } from './js/cinema.js';
import { buildRecce } from './js/recce.js';
import { initDevPanel } from './js/dev-panel.js';
import { buildProof } from './js/proof.js';

gsap.registerPlugin(ScrollTrigger);


// PUBLIC since 2026-07-21 ("lets flip it public") — the whole package
// ships: delivery board, short form act, recce v2, glass edit bay.
// ?proof= and ?cinema= params remain as private audition tools.
{
  document.documentElement.classList.add('show-proof');
  // &proof=blue|butter|dark — flip the act's palette for review
  const pv = new URLSearchParams(location.search).get('proof');
  if (/^[a-z]+$/.test(pv || '')) document.documentElement.classList.add(`proof-${pv}`);
  // scene numbering with the Delivery in and the screening room cut
  const cinCut = new URLSearchParams(location.search).get('cinema') === 'cut';
  const proofKicker = document.querySelector('.proof .stage-kicker');
  const recceKicker = document.querySelector('.recce__kicker');
  if (cinCut && proofKicker) proofKicker.innerHTML = 'SCENE 04 &middot; THE DELIVERY';
  if (recceKicker) recceKicker.textContent = cinCut ? 'SCENE 05 · THE RECCE' : 'SCENE 06 · THE RECCE';
  // the showreel closes the timeline — final clip on V1
  const lane = document.querySelector('.js-video-lane');
  if (lane && !lane.querySelector('[data-title="Showreel"]')) {
    const reel = document.createElement('div');
    reel.className = 'clip';
    reel.dataset.title = 'Showreel';
    reel.dataset.videoSrc = 'https://vimeo.com/1161420054/949ddb9393';
    reel.dataset.poster =
      'https://i.vimeocdn.com/video/2116792164-e2a3a54c64ac92b7abea89746e8c0a7c484fd62f334632b0d54e0105dc1ebe96-d_1280x720';
    reel.style.setProperty('--clip-w', '26');
    reel.innerHTML = '<span class="clip__name">showreel.mov</span>';
    lane.appendChild(reel);
  }
  // the cinema slot now belongs to SOCIAL CUTS by default (real
  // reels); ?cinema=cut|screen|village audition the alternatives
  const cin = new URLSearchParams(location.search).get('cinema') || 'social';
  if (/^[a-z]+$/.test(cin)) {
    document.documentElement.classList.add(`cinema-${cin}`);
    if (cin === 'village') buildVillage();
    if (cin === 'social') buildSocial();
  }
  if (cin === 'social') {
    const ck = document.querySelector('.cinema .stage-kicker');
    if (ck) ck.innerHTML = 'SCENE 04 &middot; SHORT FORM';
  }
  wireAutosaveToast();

  // the persistent CTA: on after one viewport of scroll, off while
  // the real contact pin is on screen
  {
    const chip = document.querySelector('.js-cta-chip');
    const contactPin = document.querySelector('.pin--next');
    if (chip) {
      let pinVisible = false;
      const update = () => {
        const past = (window.scrollY || 0) > window.innerHeight * 0.8;
        chip.classList.toggle('is-on', past && !pinVisible);
      };
      window.addEventListener('scroll', update, { passive: true });
      // count chip clicks as a named event in GoatCounter
      chip.addEventListener('click', () => {
        window.goatcounter?.count?.({ path: 'cta-start-a-project', title: 'CTA: Start a project', event: true });
      });
      if (contactPin) {
        const io = new IntersectionObserver(
          (entries) => entries.forEach((e) => { pinVisible = e.isIntersecting; update(); }),
          { threshold: 0.2 }
        );
        io.observe(contactPin);
      }
      update();
    }
  }

  // SCENE 03B · THE SOUND DEPARTMENT — public
  {
    // the 30s SFX-only snippet player
    const sfx = document.querySelector('.js-sfx-audio');
    const sfxBtn = document.querySelector('.js-sfx-toggle');
    const sfxFill = document.querySelector('.js-sfx-fill');
    const sfxTime = document.querySelector('.js-sfx-time');
    const sfxTrack = document.querySelector('.js-sfx-track');
    if (sfx && sfxBtn) {
      const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
      sfxBtn.addEventListener('click', () => (sfx.paused ? sfx.play() : sfx.pause()));
      sfx.addEventListener('play', () => { sfxBtn.textContent = '\u275A\u275A'; });
      sfx.addEventListener('pause', () => { sfxBtn.textContent = '\u25B6\uFE0E'; });
      sfx.addEventListener('timeupdate', () => {
        if (!sfx.duration) return;
        sfxFill.style.width = `${(sfx.currentTime / sfx.duration) * 100}%`;
        sfxTime.textContent = fmt(sfx.duration - sfx.currentTime);
      });
      sfx.addEventListener('ended', () => {
        sfxFill.style.width = '0';
        sfxTime.textContent = fmt(sfx.duration);
        sfxBtn.textContent = '\u25B6\uFE0E';
      });
      sfxTrack.addEventListener('click', (e) => {
        if (!sfx.duration) return;
        const r = sfxTrack.getBoundingClientRect();
        sfx.currentTime = ((e.clientX - r.left) / r.width) * sfx.duration;
      });
    }

    const soundPlay = document.querySelector('.js-sound-play');
    soundPlay?.addEventListener('click', () =>
      import('./js/lightbox.js').then((mod) => mod.openLightbox(soundPlay.dataset.videoSrc, soundPlay))
    );
    const wave = document.querySelector('.sound__wave');
    if (wave && !wave.childElementCount) {
      for (let i = 0; i < 48; i++) {
        const bar = document.createElement('i');
        bar.style.setProperty('--rest', (0.12 + Math.abs(Math.sin(i * 0.55)) * 0.3).toFixed(2));
        bar.style.setProperty('--peak', (0.45 + Math.abs(Math.sin(i * 0.35 + 1)) * 0.5).toFixed(2));
        bar.style.setProperty('--d', `${(i * 0.06) % 1.4}s`);
        wave.appendChild(bar);
      }
    }
  }
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
    ...(smallScreen
      ? [buildProof()]
      : [
          // ?cinema=cut hides the act entirely — pinning a
          // display:none section breaks every measurement after it
          ...(document.documentElement.classList.contains('cinema-cut') ? [] : [buildCinema()]),
          buildProof(),
          buildRecce(),
        ]),
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
