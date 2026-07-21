import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { config } from '../config.js';

gsap.registerPlugin(ScrollTrigger);

// The screening room: one confident moment. The screen assembles
// while the room wipes into view, the projector beam ignites, and
// the services line + intermission settle in beneath the reel.
// PLAY REEL — swap the poster for the Vimeo player. Wired separately
// so the static (touch) tier has a working reel too.
export function wireReel() {
  const reelSlot = document.querySelector('.js-reel-slot');
  const playBtn = document.querySelector('.js-play-reel');
  if (!reelSlot || !playBtn || playBtn.dataset.reelWired) return;
  playBtn.dataset.reelWired = '1';
  playBtn.addEventListener('click', () => {
    const { vimeoId, vimeoHash } = reelSlot.dataset;
    if (!vimeoId) return;
    const iframe = document.createElement('iframe');
    iframe.src = `https://player.vimeo.com/video/${vimeoId}?h=${vimeoHash}&autoplay=1&title=0&byline=0&portrait=0`;
    iframe.allow = 'autoplay; fullscreen; picture-in-picture';
    iframe.allowFullscreen = true;
    reelSlot.innerHTML = '';
    reelSlot.appendChild(iframe);
  });
}

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
  // the dolly-in: the frame keeps pushing toward the viewer for the
  // whole held beat (demo-gated with the rest of the room dressing)
  if (document.documentElement.classList.contains('show-proof')) {
    tl.fromTo(screen, { scale: 1 }, { scale: 1.045, duration: 0.92, ease: 'none' }, 0.06);
  }
  tl.fromTo(services, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.12, ease: 'power2.out' }, 0.22);
  tl.fromTo(intermission, { opacity: 0 }, { opacity: 1, duration: 0.1 }, 0.42);
  // pad so authored positions map 1:1 onto pin progress
  tl.set({}, {}, 1);

  wireReel();

  return () => {
    entranceTl.scrollTrigger?.kill();
    entranceTl.kill();
    tl.scrollTrigger?.kill();
    tl.kill();
    gsap.set([beam, dust, bars, screen, services, intermission], { clearProps: 'all' });
  };
}


// ------------------------------------------------------------------
// SCREENING-ROOM CONCEPT MOCKUPS (?cinema=village | social)
// Injected once at startup when the demo class is present; the
// original screen is hidden by CSS under these classes.
// ------------------------------------------------------------------

function clipData() {
  return [...document.querySelectorAll('.js-video-lane .clip')].map((c) => ({
    title: c.dataset.title,
    poster: c.dataset.poster,
    src: c.dataset.videoSrc,
  }));
}

function powerOnStagger(section, items, step = 90) {
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      items.forEach((el, i) => setTimeout(() => el.classList.add('is-on'), 200 + i * step));
    }),
    { threshold: 0.25 }
  );
  io.observe(section);
}

// THE VIDEO VILLAGE — the on-set monitor bank. One hero feed, a wall
// of smaller ones, every monitor a real film; click plays it.
export function buildVillage() {
  const stage = document.querySelector('.cinema__stage');
  if (!stage || stage.querySelector('.village')) return;
  const films = clipData().filter((f) => f.poster);
  if (!films.length) return;

  const wrap = document.createElement('div');
  wrap.className = 'village';
  wrap.innerHTML = `
    <p class="village__head">VIDEO VILLAGE &mdash; ALL FEEDS LIVE</p>
    <div class="village__grid js-village-grid"></div>`;
  const grid = wrap.querySelector('.js-village-grid');

  const monitors = films.map((f, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `village__mon${i === 0 ? ' village__mon--hero' : ''}`;
    b.setAttribute('aria-label', `Play ${f.title}`);
    b.innerHTML = `
      <img src="${f.poster}" alt="" loading="lazy" />
      <i class="village__scan" aria-hidden="true"></i>
      <span class="village__tc" aria-hidden="true">TC 0${(i + 1) % 10}:${String(11 + i * 3).slice(-2)}:${String(7 + i * 5).padStart(2, '0')}</span>
      ${i === 0 ? '<span class="village__rec" aria-hidden="true"></span>' : ''}
      <span class="village__label">${f.title}</span>`;
    b.addEventListener('click', () => {
      if (f.src) import('./lightbox.js').then((m) => m.openLightbox(f.src, b));
    });
    grid.appendChild(b);
    return b;
  });

  stage.appendChild(wrap);
  powerOnStagger(stage.closest('.cinema'), monitors);
}

// THE SOCIAL SCREEN — the vertical work, real reels in phone frames.
const SOCIAL_REELS = [
  {
    src: 'https://vimeo.com/1123943736/b2bba13bf5',
    poster: 'https://i.vimeocdn.com/video/2065676516-b4300baa189d4888a3ba1eed8ca0c14de7e8d89aee4b1f75301e070776b2ebd2-d_405x720',
    tag: 'FOUR SEASONS \u00b7 NAM HAI',
  },
  {
    src: 'https://vimeo.com/1139332827/877cff4ed9',
    poster: 'https://i.vimeocdn.com/video/2085946390-f20a6bd4e0d2f12c3030b970bd21c209a699fd58b7c67429f1769f566cd8bbfb-d_480x600',
    tag: 'HELLOBODY \u00b7 COCOS KISS',
  },
  {
    src: 'https://vimeo.com/1139331392/5ee587949f',
    poster: 'https://i.vimeocdn.com/video/2091333120-86f46e2ffa5aacd17a543723da08d07495b3a40c6a1ba9bc55b10e436a581711-d_480x600',
    tag: 'HELLOBODY \u00b7 COCOS GOLD',
  },
  {
    src: 'https://vimeo.com/1139331912/8e83f64171',
    poster: 'https://i.vimeocdn.com/video/2085945379-09da3793430e6c41ea71300e0992959b466a7eea75b02ab79ffeff251461011d-d_480x600',
    tag: 'HELLOBODY \u00b7 COCOS WOW',
  },
  {
    src: 'https://vimeo.com/1143266792/307333a803',
    poster: 'https://i.vimeocdn.com/video/2091389488-43bb49248177a293722a51f71d828fd1c7e8716c06f99974aed11ba03e7fe366-d_405x720',
    tag: 'PECKS ROAD \u00b7 MELBOURNE',
  },
];

export function buildSocial() {
  const stage = document.querySelector('.cinema__stage');
  if (!stage || stage.querySelector('.social')) return;

  const wrap = document.createElement('div');
  wrap.className = 'social';
  wrap.innerHTML = `
    <p class="social__head">SOCIAL CUTS &mdash; AFTER HOURS</p>
    <div class="social__row js-social-row"></div>
    <p class="social__note"><!-- DRAFT — pending sign-off -->SHORT-FORM &middot; BUILT FOR PRODUCT, WEB &amp; SOCIAL</p>`;
  const row = wrap.querySelector('.js-social-row');

  const phones = SOCIAL_REELS.map((reel) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'social__phone';
    b.setAttribute('aria-label', `Play reel: ${reel.tag}`);
    b.innerHTML = `
      <i class="social__notch" aria-hidden="true"></i>
      <img src="${reel.poster}" alt="" loading="lazy" />
      <span class="social__play" aria-hidden="true">&#9654;&#xFE0E;</span>
      <span class="social__tag">${reel.tag}</span>`;
    b.addEventListener('click', () => {
      import('./lightbox.js').then((m) => m.openLightbox(reel.src, b));
    });
    row.appendChild(b);
    return b;
  });

  stage.appendChild(wrap);
  powerOnStagger(stage.closest('.cinema'), phones, 140);
}
