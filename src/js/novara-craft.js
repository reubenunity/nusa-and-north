import '../styles/novara-craft.css';
import { hasNovaraMediaConsent, isNovaraMediaDialogOpen, mountNovaraMediaConsent, openNovaraLightbox, requestNovaraMediaConsent } from './novara-media-consent.js';
import { shortFilms } from './kiln-content.js';
import { mountNovaraSoundMotion } from './novara-sound-motion.js';

const soundFilm = {
  src: 'https://vimeo.com/1211692475/e42d607099',
  poster: 'https://i.vimeocdn.com/video/2181926767-e0474112a2c44effb1a3ae1c3647c111356cb7f0d754282b72b49ec3a2686a30-d_1280x720',
};
// Original sound-department copy, retained as the existing editorial draft.
const soundProcess = [
  ['01 / Strip', 'The finished picture is stripped to total silence — location audio, everything. Gone.'],
  ['02 / Rebuild', 'Every sound is put back by hand — real recorded footsteps, fabric, water, air — layered across thirteen effect lanes, twenty tracks.'],
  ['03 / Immerse', 'Score and ambience last, mixed and loudness-metered for every platform. It feels real because it is.'],
];
const instances = new WeakMap();
const make = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

export function mountNovaraCraft(host) {
  if (!host) return () => {};
  mountNovaraMediaConsent();
  instances.get(host)?.();
  const previousChildren = [...host.childNodes];
  const hadClass = host.classList.contains('novara-craft');
  host.classList.add('novara-craft');
  const controller = new AbortController();
  const { signal } = controller;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  const sound = make('section', 'nc-sound');
  sound.setAttribute('aria-label', 'Sound design');
  const soundMedia = make('div', 'nc-sound-media');
  const soundPlay = make('button', 'nc-sound-play');
  soundPlay.type = 'button';
  soundPlay.setAttribute('aria-label', 'Watch and hear Vernel Fresh, a commercial pitch with full sound design');
  const soundPoster = make('img');
  soundPoster.src = soundFilm.poster;
  soundPoster.alt = 'Vernel Fresh commercial pitch';
  soundPoster.width = 1280;
  soundPoster.height = 720;
  soundPoster.loading = 'lazy';
  soundPoster.decoding = 'async';
  soundPoster.draggable = false;
  soundPoster.addEventListener('error', () => {
    soundPoster.src = soundFilm.poster.replace('_1280x720', '_640x360');
  }, { once: true, signal });
  const soundPlayLabel = make('span', 'nc-watch', 'Watch & hear');
  const soundPlayIcon = make('span', '', '▶');
  soundPlayIcon.setAttribute('aria-hidden', 'true');
  soundPlayLabel.prepend(soundPlayIcon);
  soundPlay.append(soundPoster, soundPlayLabel);
  soundMedia.append(soundPlay, make('p', 'nc-sound-credit', 'VERNEL FRESH / COMMERCIAL PITCH'));

  const soundCopy = make('div', 'nc-sound-copy');
  const soundTitle = make('h2', 'nc-title');
  soundTitle.append(document.createTextNode('Picture it.'), document.createElement('br'), document.createTextNode('Now hear it.'));
  soundCopy.append(
    make('p', 'nc-label', 'THE SOUND DEPARTMENT'),
    soundTitle,
    make('p', 'nc-description', 'Entire soundtracks, made from scratch. Foley, sound effects, atmosphere and music, built layer by layer.'),
  );
  const details = make('details', 'nc-session');
  const summary = make('summary', '', 'Behind the mix');
  const summaryIcon = make('span', '', '+');
  summaryIcon.setAttribute('aria-hidden', 'true');
  summary.append(summaryIcon);
  const sessionImage = make('img', 'nc-session-image');
  sessionImage.src = '/stills/vernel-session.jpg';
  sessionImage.alt = 'The real Vernel Fresh multitrack sound-design session';
  sessionImage.loading = 'lazy';
  sessionImage.decoding = 'async';
  const process = make('ol', 'nc-process');
  soundProcess.forEach(([label, copy]) => {
    const step = make('li');
    step.append(make('h3', '', label), make('p', '', copy));
    process.append(step);
  });
  const audioProof = make('div', 'nc-audio-proof');
  const audio = make('audio');
  audio.controls = true;
  audio.preload = 'none';
  audio.src = '/audio/sfx-layer.mp3';
  audio.setAttribute('aria-label', 'Sound effects layer from a separate production');
  audioProof.append(
    make('p', 'nc-label', 'HEAR THE SFX LAYER ALONE'),
    audio,
    make('p', 'nc-audio-note', 'No voiceover, no music. From a separate production.'),
  );
  details.append(summary, sessionImage, process, audioProof);
  soundCopy.append(details);
  sound.append(soundMedia, soundCopy);

  // Exact effective social scene from cinema.js, cinema.css and preview.css.
  const social = make('section', 'nc-social');
  social.setAttribute('aria-label', 'Social and web films');
  const stage = make('div', 'nc-social-stage');
  stage.setAttribute('role', 'region');
  stage.setAttribute('aria-label', 'Short form films. Scroll to move along the phones.');
  const pearl = make('div', 'nc-social-pearl');
  pearl.setAttribute('aria-hidden', 'true');
  const content = make('div', 'nc-social-content');
  const socialTitle = make('h2', 'nc-social-title');
  socialTitle.append(document.createTextNode('SMALL SCREEN.'), document.createElement('br'), make('span', '', 'BIG FEELING.'));
  const viewport = make('div', 'nc-viewport');
  viewport.setAttribute('aria-label', 'Swipe to browse five social and web films');
  const track = make('div', 'nc-phone-track');
  const phones = shortFilms.map((film) => {
    const figure = make('figure', 'nc-phone-figure');
    const phone = make('div', 'nc-phone');
    const screen = make('button', 'nc-screen');
    screen.type = 'button';
    screen.setAttribute('aria-label', `Play reel: ${film.title}`);
    const poster = make('img');
    poster.src = film.poster;
    poster.alt = '';
    poster.width = film.type === 'WEB PRODUCT FILM' ? 480 : 405;
    poster.height = film.type === 'WEB PRODUCT FILM' ? 600 : 720;
    poster.loading = 'lazy';
    poster.decoding = 'async';
    poster.draggable = false;
    const play = make('span', 'nc-phone-play', '▶');
    play.setAttribute('aria-hidden', 'true');
    screen.append(poster, play);
    const island = make('i', 'nc-island');
    island.setAttribute('aria-hidden', 'true');
    phone.append(screen, island);
    const caption = make('figcaption', 'nc-phone-caption');
    caption.append(document.createTextNode(film.title), make('em', 'nc-phone-kind', film.type));
    figure.append(phone, caption);
    track.append(figure);
    return { film, figure, phone, screen, preview: null };
  });
  viewport.append(track);
  content.append(
    make('p', 'nc-social-label', 'SHORT FORM · SOCIAL & WEB'),
    socialTitle,
    viewport,
    make('p', 'nc-social-note', 'REELS FOR SOCIAL · PRODUCT FILMS FOR WEB · ALL CUT FOR THUMBS'),
  );
  const controls = make('div', 'nc-controls');
  const motionToggle = make('button', 'nc-motion');
  motionToggle.type = 'button';
  const previous = make('button', 'nc-arrow', '←');
  previous.type = 'button';
  previous.setAttribute('aria-label', 'Previous social film');
  const next = make('button', 'nc-arrow', '→');
  next.type = 'button';
  next.setAttribute('aria-label', 'Next social film');
  controls.append(motionToggle, previous, next);
  stage.append(pearl, content, controls);
  social.append(stage);
  host.replaceChildren(sound, social);
  const destroySoundMotion = mountNovaraSoundMotion(sound);

  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  const coarse = window.matchMedia('(pointer: coarse)');
  let desktop = false;
  let layoutWidth = window.innerWidth;
  let arcContext = null;
  let arcTrigger = null;
  let visible = false;
  let motionEnabled = !reduced.matches && !navigator.connection?.saveData;
  let modalOpen = false;
  let audioPlaying = false;
  let frame = 0;
  let settleTimer = 0;
  let resizeTimer = 0;
  let drag = null;
  let suppressClickUntil = 0;
  const powerTimers = [];

  function clearPreview(item) {
    item.figure.classList.remove('has-preview');
    item.preview?.remove();
    item.preview = null;
  }

  function clearPreviews() { phones.forEach(clearPreview); }

  function syncPreviews() {
    clearTimeout(settleTimer);
    settleTimer = 0;
    if (!hasNovaraMediaConsent() || isNovaraMediaDialogOpen() || !visible || document.hidden || !motionEnabled || modalOpen || audioPlaying || drag?.active || signal.aborted) {
      clearPreviews();
      return;
    }
    const bounds = desktop ? null : viewport.getBoundingClientRect();
    phones.forEach((item) => {
      const rect = desktop ? null : item.screen.getBoundingClientRect();
      const wanted = desktop || (rect.right > bounds.left - bounds.width * .1 && rect.left < bounds.right + bounds.width * .1);
      if (!wanted) { clearPreview(item); return; }
      if (item.preview) return;
      const match = item.film.src.match(/vimeo\.com\/(\d+)(?:\/([a-z0-9]+))?/i);
      if (!match) return;
      const iframe = make('iframe', `nc-preview${item.film.type === 'WEB PRODUCT FILM' ? ' nc-preview-wide' : ''}`);
      iframe.title = `${item.film.title} — muted preview`;
      iframe.tabIndex = -1;
      iframe.setAttribute('aria-hidden', 'true');
      iframe.allow = 'autoplay';
      iframe.dataset.novaraExternalMedia = '';
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      iframe.src = `https://player.vimeo.com/video/${match[1]}?${match[2] ? `h=${match[2]}&` : ''}dnt=1&background=1&autoplay=1&loop=1&muted=1&quality=360p`;
      iframe.addEventListener('load', () => {
        if (!signal.aborted && item.preview === iframe) item.figure.classList.add('has-preview');
      }, { once: true, signal });
      item.screen.append(iframe);
      item.preview = iframe;
    });
  }

  function updateMotionButton() {
    const playing = motionEnabled && hasNovaraMediaConsent();
    motionToggle.textContent = playing ? 'Pause previews' : 'Play previews';
    motionToggle.setAttribute('aria-pressed', String(playing));
    syncPreviews();
  }

  function render() {
    frame = 0;
    if (!visible || document.hidden || signal.aborted) return;
    previous.disabled = desktop ? (arcTrigger?.progress || 0) <= .001 : viewport.scrollLeft <= 2;
    next.disabled = desktop ? (arcTrigger?.progress || 0) >= .999 : viewport.scrollLeft >= viewport.scrollWidth - viewport.clientWidth - 2;
    if (desktop) syncPreviews();
    else { clearTimeout(settleTimer); settleTimer = setTimeout(syncPreviews, 120); }
  }

  function schedule() {
    if (!frame && visible && !document.hidden && !signal.aborted) frame = requestAnimationFrame(render);
  }

  function goToPhone(index) {
    if (!arcTrigger) return;
    const progress = Math.max(0, Math.min(phones.length - 1, index)) / (phones.length - 1);
    window.scrollTo({ top: arcTrigger.start + progress * (arcTrigger.end - arcTrigger.start), behavior: 'instant' });
  }

  function move(direction) {
    if (desktop && arcTrigger) {
      goToPhone(Math.round(arcTrigger.progress * (phones.length - 1)) + direction);
    } else {
      const distance = phones[1].figure.offsetLeft - phones[0].figure.offsetLeft;
      viewport.scrollBy({ left: direction * distance, behavior: reduced.matches ? 'instant' : 'smooth' });
    }
  }

  const canUseArc = () => window.innerWidth > 1024 && !coarse.matches && !reduced.matches && Boolean(gsap && ScrollTrigger);

  function buildArc() {
    const previousScroll = viewport.scrollLeft;
    const previousPhone = desktop && arcTrigger ? Math.round(arcTrigger.progress * (phones.length - 1)) : null;
    arcContext?.revert();
    arcContext = null;
    arcTrigger = null;
    layoutWidth = window.innerWidth;
    desktop = canUseArc();
    social.classList.toggle('nc-social-static', !desktop);
    // Keep the source composition at its original sizes whenever it fits.
    // Short laptop windows use the same natural-height rail as touch devices.
    if (desktop && content.scrollHeight > stage.clientHeight + 1) {
      desktop = false;
      social.classList.add('nc-social-static');
    }
    stage.tabIndex = desktop ? 0 : -1;
    viewport.tabIndex = desktop ? -1 : 0;
    if (desktop) {
      gsap.registerPlugin(ScrollTrigger);
      arcContext = gsap.context(() => {
        // Fade the feathered background without a moving hard crop.
        // The original content rise and phone arc below stay unchanged.
        gsap.fromTo(pearl, { opacity: 0 }, {
          opacity: 1, ease: 'power2.out',
          scrollTrigger: { trigger: social, start: 'top bottom', end: 'top top', scrub: 1 },
        });
        gsap.fromTo(content, { y: 60, opacity: 0 }, {
          y: 0, opacity: 1, ease: 'power2.out',
          scrollTrigger: { trigger: social, start: 'top 85%', end: 'top 15%', scrub: 1 },
        });
        const travel = () => Math.max(0, track.scrollWidth - window.innerWidth + window.innerWidth * .3);
        const paint = (progress) => {
          const active = progress * (phones.length - 1);
          phones.forEach(({ figure }, index) => {
            const distance = index - active;
            gsap.set(figure, {
              rotationY: Math.max(-22, Math.min(22, -distance * 12)),
              z: 210 - Math.min(150, Math.abs(distance) * 65),
              scale: .88,
              y: Math.min(35, Math.abs(distance) * 16),
            });
            figure.classList.toggle('is-featured', Math.abs(distance) < .55);
          });
        };
        const tween = gsap.fromTo(track, { x: () => window.innerWidth * .15 }, {
          x: () => window.innerWidth * .15 - travel(), ease: 'none',
          scrollTrigger: {
            trigger: social, start: 'top top', end: '+=240%', pin: stage, scrub: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => { paint(self.progress); schedule(); },
          },
        });
        arcTrigger = tween.scrollTrigger;
        paint(0);
      }, social);
    } else {
      phones.forEach(({ figure }) => figure.classList.remove('is-featured'));
      const distance = phones[1].figure.offsetLeft - phones[0].figure.offsetLeft;
      viewport.scrollLeft = previousPhone === null ? previousScroll : previousPhone * distance;
    }
    schedule();
    syncPreviews();
    queueMicrotask(() => {
      if (!signal.aborted) host.dispatchEvent(new CustomEvent('novara:layout', { bubbles: true }));
    });
  }

  function playFilm(url, trigger) {
    audio.pause();
    clearPreviews();
    openNovaraLightbox(url, trigger);
  }

  function endDrag() {
    if (!drag) return;
    const lastDrag = drag;
    drag = null;
    viewport.classList.remove('is-dragging');
    if (lastDrag.active) suppressClickUntil = performance.now() + 350;
    if (viewport.hasPointerCapture(lastDrag.id)) viewport.releasePointerCapture(lastDrag.id);
    schedule();
  }

  soundPlay.addEventListener('click', () => playFilm(soundFilm.src, soundPlay), { signal });
  phones.forEach((item, index) => {
    item.screen.addEventListener('click', () => playFilm(item.film.src, item.screen), { signal });
    item.screen.addEventListener('focus', () => {
      if (desktop && item.screen.matches(':focus-visible')) goToPhone(index);
    }, { signal });
  });
  motionToggle.addEventListener('click', async () => {
    if (!hasNovaraMediaConsent()) {
      if (!await requestNovaraMediaConsent(motionToggle) || signal.aborted) return;
      motionEnabled = true;
    } else motionEnabled = !motionEnabled;
    updateMotionButton();
  }, { signal });
  window.addEventListener('novara:media-consent', updateMotionButton, { signal });
  window.addEventListener('novara:media-dialog', (event) => {
    modalOpen = event.detail.open;
    if (modalOpen) audio.pause();
    syncPreviews();
  }, { signal });
  previous.addEventListener('click', () => move(-1), { signal });
  next.addEventListener('click', () => move(1), { signal });
  viewport.addEventListener('scroll', schedule, { passive: true, signal });
  stage.addEventListener('keydown', (event) => {
    if (event.target !== viewport && event.target !== stage) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      move(event.key === 'ArrowRight' ? 1 : -1);
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      if (desktop) goToPhone(event.key === 'Home' ? 0 : phones.length - 1);
      else viewport.scrollTo({ left: event.key === 'Home' ? 0 : viewport.scrollWidth, behavior: reduced.matches ? 'instant' : 'smooth' });
    }
  }, { signal });
  viewport.addEventListener('pointerdown', (event) => {
    if (desktop || event.pointerType === 'touch' || event.button !== 0 || !event.isPrimary) return;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, start: viewport.scrollLeft, active: false };
  }, { signal });
  window.addEventListener('pointermove', (event) => {
    if (!drag || drag.id !== event.pointerId) return;
    const x = event.clientX - drag.x;
    const y = event.clientY - drag.y;
    if (!drag.active && Math.abs(y) > Math.abs(x) && Math.abs(y) > 7) { endDrag(); return; }
    if (!drag.active && Math.abs(x) > 7) {
      drag.active = true;
      viewport.setPointerCapture(event.pointerId);
      viewport.classList.add('is-dragging');
      clearPreviews();
    }
    if (drag.active) { event.preventDefault(); viewport.scrollLeft = drag.start - x; }
  }, { passive: false, signal });
  window.addEventListener('pointerup', endDrag, { signal });
  window.addEventListener('pointercancel', endDrag, { signal });
  viewport.addEventListener('lostpointercapture', endDrag, { signal });
  viewport.addEventListener('dragstart', (event) => event.preventDefault(), { signal });
  viewport.addEventListener('click', (event) => {
    if (performance.now() < suppressClickUntil) {
      event.preventDefault(); event.stopPropagation(); suppressClickUntil = 0;
    }
  }, { capture: true, signal });
  audio.addEventListener('play', () => { audioPlaying = true; syncPreviews(); }, { signal });
  ['pause', 'ended'].forEach((event) => audio.addEventListener(event, () => { audioPlaying = false; syncPreviews(); }, { signal }));
  details.addEventListener('toggle', () => {
    if (!details.open) audio.pause();
    host.dispatchEvent(new CustomEvent('novara:layout', { bubbles: true }));
  }, { signal });
  sessionImage.addEventListener('load', () => {
    if (details.open) host.dispatchEvent(new CustomEvent('novara:layout', { bubbles: true }));
  }, { signal });
  reduced.addEventListener('change', () => {
    if (reduced.matches) motionEnabled = false;
    updateMotionButton(); buildArc();
  }, { signal });
  coarse.addEventListener('change', buildArc, { signal });
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    // Mobile browser chrome resizes the height while scrolling. CSS handles
    // that size change; rebuilding the rail would discard its browse position.
    if (window.innerWidth === layoutWidth && !canUseArc()) {
      schedule();
      return;
    }
    resizeTimer = setTimeout(buildArc, 180);
  }, { signal });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(frame); frame = 0;
      clearTimeout(settleTimer); clearPreviews(); audio.pause(); endDrag();
    } else { syncPreviews(); schedule(); }
  }, { signal });

  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) { syncPreviews(); schedule(); }
    else {
      cancelAnimationFrame(frame); frame = 0;
      clearTimeout(settleTimer); clearPreviews(); endDrag();
    }
  }, { rootMargin: '40% 0px' });
  observer.observe(stage);
  const powerObserver = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    powerObserver.disconnect();
    phones.forEach(({ figure }, index) => {
      powerTimers.push(setTimeout(() => figure.classList.add('is-on'), reduced.matches ? 0 : 200 + index * 140));
    });
  }, { threshold: .25 });
  powerObserver.observe(stage);
  const resize = new ResizeObserver(schedule);
  resize.observe(viewport);
  previous.disabled = true;
  updateMotionButton();
  buildArc();
  document.fonts?.ready.then(() => { if (!signal.aborted) buildArc(); });
  const cleanup = () => {
    controller.abort();
    observer.disconnect(); powerObserver.disconnect(); resize.disconnect();
    cancelAnimationFrame(frame);
    clearTimeout(settleTimer); clearTimeout(resizeTimer);
    powerTimers.forEach(clearTimeout);
    clearPreviews(); audio.pause(); endDrag();
    arcContext?.revert();
    destroySoundMotion();
    host.replaceChildren(...previousChildren);
    if (!hadClass) host.classList.remove('novara-craft');
    instances.delete(host);
  };
  instances.set(host, cleanup);
  return cleanup;
}
