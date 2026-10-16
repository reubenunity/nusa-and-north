import '../styles/novara-slideshow.css';
import { locations } from './kiln-content.js';

// Captions are retained verbatim from the original site's Recce board.
// They remain editorial drafts, as marked in index.html.
const captions = {
  BASEL: 'lunch break on the rhine',
  LUCERNE: 'chapel bridge from above',
  FRANKFURT: 'fountain scene, one take',
  FLORENCE: 'side streets, golden light',
  PRAGUE: 'charles bridge, 5am haze',
  ALBANIA: 'the riviera title shot',
  TALLINN: 'blossoms + backlight',
  VIETNAM: 'golden hour, real life',
  BALI: 'sunrise run, low tide',
};
const imageHeights = [581, 495, 581, 581, 572, 504, 578, 503, 581];
const instances = new WeakMap();
const make = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

/** Original Nusa & North postcard board, scoped for the Novara footer. */
export function mountNovaraSlideshow(host) {
  if (!host) return () => {};
  instances.get(host)?.();
  const previousChildren = [...host.childNodes];
  const hadClass = host.classList.contains('novara-slideshow');
  host.classList.add('novara-slideshow');
  const controller = new AbortController();
  const { signal } = controller;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const header = make('header', 'ns-head');
  const kicker = make('p', 'ns-kicker', 'SCENE 05 · THE RECCE');
  const title = make('h2', 'ns-title', 'LOCATION SCOUTING');
  const note = make('p', 'ns-note', 'where to next?');
  header.append(kicker, title, note);

  const viewport = make('div', 'ns-viewport');
  viewport.tabIndex = 0;
  viewport.setAttribute('role', 'region');
  viewport.setAttribute('aria-label', 'Location postcards. Use the arrow keys or scroll horizontally to explore.');
  const track = make('ol', 'ns-track');
  track.setAttribute('aria-label', 'Nine locations and your next project');
  const pins = [];

  locations.forEach((location, index) => {
    const pin = make('li', 'ns-pin');
    const photo = make('figure', 'ns-photo');
    const tape = make('span', 'ns-tape');
    tape.setAttribute('aria-hidden', 'true');
    const image = make('img');
    image.src = location.image;
    image.alt = location.name;
    image.width = 900;
    image.height = imageHeights[index];
    image.loading = 'lazy';
    image.decoding = 'async';
    image.draggable = false;
    photo.append(tape);
    if (location.slug) {
      const film = make('a', 'ns-film');
      film.href = `/novara-project.html?film=${encodeURIComponent(location.slug)}`;
      film.draggable = false;
      film.setAttribute('aria-label', `View the ${location.name} film project`);
      const label = make('span', 'ns-film-label', 'VIEW FILM ↗');
      label.setAttribute('aria-hidden', 'true');
      film.append(image, label);
      photo.append(film);
    } else {
      photo.append(image);
    }
    photo.append(make('figcaption', 'ns-hand', captions[location.name]));
    const meta = make('div', 'ns-meta');
    meta.append(
      make('h3', '', location.name),
      make('p', 'ns-coordinates', location.coordinates),
      make('p', 'ns-association', location.association),
    );
    pin.append(photo, meta);
    pins.push({ pin, photo, meta });
    track.append(pin);
  });

  const next = make('li', 'ns-pin ns-pin-next');
  const nextPhoto = make('figure', 'ns-photo ns-photo-empty');
  const nextTape = make('span', 'ns-tape');
  nextTape.setAttribute('aria-hidden', 'true');
  nextPhoto.append(nextTape, make('div', 'ns-empty ns-hand', 'your frame here'));
  const nextMeta = make('div', 'ns-meta');
  nextMeta.append(make('h3', '', 'NEXT LOCATION: YOURS'), make('p', 'ns-coordinates', 'LAT — · LONG —'));
  const contact = make('div', 'ns-contact');
  const call = make('a', 'ns-call', 'BOOK A CALL →');
  call.href = 'https://calendly.com/nusaandnorth/30min';
  call.target = '_blank';
  call.rel = 'noopener';
  const email = make('a', 'ns-email', 'NUSAANDNORTH@GMAIL.COM');
  email.href = 'mailto:nusaandnorth@gmail.com';
  const instagram = make('a', 'ns-social', 'INSTAGRAM ↗');
  instagram.href = 'https://www.instagram.com/reubenandokta';
  instagram.target = '_blank';
  instagram.rel = 'noopener';
  contact.append(call, email, instagram);
  nextMeta.append(contact);
  next.append(nextPhoto, nextMeta);
  pins.push({ pin: next, photo: nextPhoto, meta: nextMeta });
  track.append(next);
  viewport.append(track);

  const controls = make('div', 'ns-controls');
  const hint = make('p', 'ns-hint', 'DRAG OR SWIPE TO FOLLOW THE ROUTE');
  const navigation = make('div', 'ns-navigation');
  const count = make('span', 'ns-count', '09 LOCATIONS + YOURS');
  const previous = make('button', 'ns-previous', '←');
  previous.type = 'button';
  previous.setAttribute('aria-label', 'Previous location postcards');
  const following = make('button', 'ns-next', '→');
  following.type = 'button';
  following.setAttribute('aria-label', 'Next location postcards');
  navigation.append(count, previous, following);
  controls.append(hint, navigation);
  host.replaceChildren(header, viewport, controls);

  let frame = 0;
  let visible = false;
  let measurements = [];
  let drag = null;
  let suppressClickUntil = 0;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  function render() {
    frame = 0;
    if (!visible || document.hidden || signal.aborted) return;
    const maxScroll = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    previous.disabled = viewport.scrollLeft <= 2;
    following.disabled = viewport.scrollLeft >= maxScroll - 2;
    if (reducedMotion.matches) return;
    const view = viewport.getBoundingClientRect();
    const trackLeft = track.getBoundingClientRect().left;
    let nearest = 0;
    let nearestDistance = Infinity;
    measurements.forEach((item, index) => {
      const distance = (trackLeft + item.center - (view.left + view.width / 2)) / (view.width * .6);
      const strength = Math.max(0, 1 - Math.abs(distance));
      if (Math.abs(distance) < nearestDistance) {
        nearestDistance = Math.abs(distance);
        nearest = index;
      }
      // Same arrival geometry as recce-cards.js, without global GSAP state.
      item.photo.style.transform = `perspective(1000px) translate3d(0,${-28 * strength}px,${80 * strength}px) rotateY(${clamp(distance * 14, -16, 16)}deg) rotateZ(${-clamp(distance, -2, 2) * 2}deg) scale(${.94 + .08 * strength})`;
      item.meta.style.transform = `translateY(${14 * (1 - strength)}px)`;
      item.meta.style.opacity = String(.85 + .15 * strength);
    });
    measurements.forEach((item, index) => item.pin.classList.toggle('is-arrived', index === nearest));
  }

  function schedule() {
    if (!frame && visible && !document.hidden && !signal.aborted) frame = requestAnimationFrame(render);
  }

  function measure() {
    measurements = pins.map((item) => ({ ...item, center: item.pin.offsetLeft + item.pin.offsetWidth / 2 }));
    schedule();
  }

  function move(direction) {
    const distance = pins[1].pin.offsetLeft - pins[0].pin.offsetLeft;
    viewport.scrollBy({ left: direction * distance, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
  }

  function motionChanged() {
    pins.forEach(({ pin, photo, meta }) => {
      photo.style.removeProperty('transform');
      meta.style.removeProperty('transform');
      meta.style.removeProperty('opacity');
      pin.classList.remove('is-arrived');
    });
    measure();
  }

  function endDrag() {
    if (!drag) return;
    const previousDrag = drag;
    drag = null;
    viewport.classList.remove('is-dragging');
    if (previousDrag.active) suppressClickUntil = performance.now() + 350;
    if (viewport.hasPointerCapture(previousDrag.id)) viewport.releasePointerCapture(previousDrag.id);
  }

  viewport.addEventListener('scroll', schedule, { passive: true, signal });
  previous.addEventListener('click', () => move(-1), { signal });
  following.addEventListener('click', () => move(1), { signal });
  viewport.addEventListener('keydown', (event) => {
    if (event.target !== viewport) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      move(event.key === 'ArrowRight' ? 1 : -1);
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      viewport.scrollTo({ left: event.key === 'Home' ? 0 : viewport.scrollWidth, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
    }
  }, { signal });
  viewport.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'touch' || event.button !== 0 || !event.isPrimary) return;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, start: viewport.scrollLeft, active: false };
  }, { signal });
  window.addEventListener('pointermove', (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    const x = event.clientX - drag.x;
    const y = event.clientY - drag.y;
    if (!drag.active && Math.abs(y) > Math.abs(x) && Math.abs(y) > 7) { endDrag(); return; }
    if (!drag.active && Math.abs(x) > 7) {
      drag.active = true;
      viewport.setPointerCapture(event.pointerId);
      viewport.classList.add('is-dragging');
    }
    if (drag.active) {
      event.preventDefault();
      viewport.scrollLeft = drag.start - x;
    }
  }, { passive: false, signal });
  window.addEventListener('pointerup', endDrag, { signal });
  window.addEventListener('pointercancel', endDrag, { signal });
  viewport.addEventListener('lostpointercapture', endDrag, { signal });
  viewport.addEventListener('dragstart', (event) => event.preventDefault(), { signal });
  viewport.addEventListener('click', (event) => {
    if (performance.now() < suppressClickUntil) {
      event.preventDefault();
      event.stopPropagation();
      suppressClickUntil = 0;
    }
  }, { capture: true, signal });
  reducedMotion.addEventListener('change', motionChanged, { signal });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0; endDrag(); }
    else measure();
  }, { signal });

  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) measure();
    else { cancelAnimationFrame(frame); frame = 0; endDrag(); }
  }, { rootMargin: '100px' });
  observer.observe(viewport);
  const resize = new ResizeObserver(measure);
  resize.observe(viewport);
  pins.forEach(({ pin }) => resize.observe(pin));
  previous.disabled = true;
  const cleanup = () => {
    controller.abort();
    observer.disconnect();
    resize.disconnect();
    cancelAnimationFrame(frame);
    endDrag();
    host.replaceChildren(...previousChildren);
    if (!hadClass) host.classList.remove('novara-slideshow');
    instances.delete(host);
  };
  instances.set(host, cleanup);
  return cleanup;
}
