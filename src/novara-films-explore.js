import './styles/novara-films-explore.css';
import './styles/novara-background.css';
import './styles/novara-portfolio-light.css';
import { films } from './js/review-films-data.js';
import { projectStills } from './js/review-project-stills.js';
import { createReelFlux } from './js/vendor/reel-flux.js';
import { mountNovaraBackground } from './js/novara-background.js';
import { mountNovaraMediaConsent } from './js/novara-media-consent.js';
import { isNovaraTheatre, mountNovaraTheatre, withNovaraAtmosphere } from './js/novara-theatre.js';

mountNovaraMediaConsent();

if (['#shorts', '#sound', '#locations'].includes(location.hash)) {
  location.replace(withNovaraAtmosphere(`/novara-films-grid.html${location.hash}`));
}
const host = document.getElementById('portfolio');
const switches = [...document.querySelectorAll('[data-portfolio-view]')];
const hint = document.querySelector('.portfolio-hint');
const status = document.querySelector('.portfolio-status');
const controller = new AbortController();
const { signal } = controller;
const destroyBackground = isNovaraTheatre() ? () => {} : mountNovaraBackground({ surface: 'light' });
const destroyTheatre = mountNovaraTheatre();
const preferenceKey = 'nn-portfolio-view';
const primaryFrames = { 'radisson-berlin': 5, 'radisson-red-innsbruck': 4 };
const params = new URLSearchParams(location.search);
let remembered = null;
try { remembered = localStorage.getItem(preferenceKey); } catch {}
let view = params.get('view') || remembered || 'reel';
if (view === 'gallery' || !['reel', 'grid'].includes(view)) view = 'reel';
let engine = null;
let renderController = new AbortController();
let returnFrame = 0;
let currentSlug = params.get('selected') || films[0].slug;
const make = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};
const projectURL = film => withNovaraAtmosphere(`/novara-project.html?film=${encodeURIComponent(film.slug)}&view=${view}`);
const imageFor = film => projectStills[film.slug]?.[primaryFrames[film.slug] ?? 0]?.src || film.poster;
function titleFor(film) {
  const [client, ...campaign] = film.title.split(' — ');
  return { client: campaign.length ? client : 'Nusa & North', title: campaign.join(' — ') || client };
}
function projectCard(film, index) {
  const cardSignal = renderController.signal;
  const link = make('a', 'portfolio-grid-card portfolio-card');
  link.href = projectURL(film);
  link.id = `film-${film.slug}`;
  link.dataset.slug = film.slug;
  link.setAttribute('aria-label', `View project: ${film.title}`);
  const frame = make('span', 'portfolio-grid-image');
  const image = make('img');
  const still = projectStills[film.slug]?.[primaryFrames[film.slug] ?? 0];
  image.src = still?.src || film.poster;
  image.alt = still?.alt || `Film still from ${film.title}`;
  image.loading = index < 5 ? 'eager' : 'lazy';
  image.decoding = 'async';
  image.draggable = false;
  image.addEventListener('error', () => {
    if (image.getAttribute('src') !== film.poster) image.src = film.poster;
    else { image.hidden = true; link.classList.add('has-image-error'); }
  }, { signal: cardSignal });
  frame.append(image);
  const caption = make('span', 'portfolio-grid-caption');
  const copy = make('span', 'portfolio-grid-copy');
  const { client, title } = titleFor(film);
  copy.append(make('span', 'portfolio-client', client));
  copy.append(make('strong', 'portfolio-title', title));
  copy.append(make('span', 'portfolio-project-action', 'View project ↗'));
  caption.append(copy);
  link.append(frame, caption);
  link.addEventListener('pointerenter', (event) => {
    if (event.pointerType !== 'touch') currentSlug = film.slug;
  }, { signal: cardSignal });
  link.addEventListener('focus', () => { currentSlug = film.slug; }, { signal: cardSignal });
  return link;
}
function updateURL() {
  const url = new URL(location.href);
  url.searchParams.set('view', view);
  history.replaceState(null, '', url);
}
function render({ restoreFocus = false } = {}) {
  engine?.destroy();
  engine = null;
  renderController.abort();
  renderController = new AbortController();
  const cardSignal = renderController.signal;
  host.replaceChildren();
  document.body.dataset.portfolioView = view;
  switches.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.portfolioView === view)));
  hint.textContent = view === 'grid' ? 'The full collection, at a glance.' : 'Drag to explore. Click or tap a film to view the project.';
  let focusTarget = null;
  if (view === 'grid') {
    const grid = make('div', 'portfolio-grid');
    films.forEach((film, index) => grid.append(projectCard(film, index)));
    host.append(grid);
    focusTarget = document.getElementById(`film-${currentSlug}`);
  } else {
    const section = make('section', 'portfolio-reel');
    section.setAttribute('aria-label', 'Film reel');
    const root = make('div', 'rf-root portfolio-reel-stage');
    root.tabIndex = 0;
    root.setAttribute('role', 'region');
    root.setAttribute('aria-roledescription', 'carousel');
    root.setAttribute('aria-label', 'Twenty films. Drag, swipe or use Left and Right arrow keys to browse.');
    const canvas = make('canvas', 'rf-canvas');
    canvas.setAttribute('aria-hidden', 'true');
    const fallback = make('div', 'rf-fallback');
    fallback.setAttribute('aria-label', 'Film projects');
    const count = make('span', 'rf-corner rf-tr', '01 / 20');
    count.setAttribute('aria-hidden', 'true');
    const label = make('span', 'rf-corner rf-tl', 'Nusa & North / Films');
    label.setAttribute('aria-hidden', 'true');
    const previous = make('button', 'rf-step rf-prev', '←');
    previous.type = 'button';
    previous.setAttribute('aria-label', 'Previous film');
    const next = make('button', 'rf-step rf-next', '→');
    next.type = 'button';
    next.setAttribute('aria-label', 'Next film');
    const live = make('span', 'rf-live');
    live.setAttribute('aria-live', 'polite');
    live.setAttribute('aria-atomic', 'true');
    root.append(canvas, fallback, label, count, live);
    const controls = make('div', 'portfolio-reel-controls');
    controls.setAttribute('role', 'group');
    controls.setAttribute('aria-label', 'Browse films');
    controls.append(previous, next);

    const details = make('div', 'portfolio-reel-details');
    const copy = make('div', 'portfolio-reel-copy');
    const client = make('p', 'portfolio-client');
    const title = make('h2', 'portfolio-title');
    copy.append(client, title);
    const action = make('a', 'portfolio-project-action portfolio-reel-action', 'View project ↗');
    details.append(copy, action);
    const selection = make('details', 'portfolio-reel-index');
    const summary = make('summary', 'portfolio-reel-index-summary');
    const indexHeading = make('span', '', 'Film index');
    const indexCount = make('span', 'portfolio-reel-index-count', String(films.length).padStart(2, '0'));
    const indexIcon = make('span', 'portfolio-reel-index-icon', '+');
    indexIcon.setAttribute('aria-hidden', 'true');
    summary.append(indexHeading, indexCount, indexIcon);
    const indexList = make('ol', 'portfolio-reel-index-list');
    indexList.setAttribute('aria-label', 'Choose a film for the reel');
    const indexButtons = films.map((film, index) => {
      const item = make('li');
      const button = make('button', 'portfolio-reel-index-film');
      button.type = 'button';
      button.setAttribute('aria-label', `Show film: ${film.title}`);
      const number = make('span', 'portfolio-reel-index-number', String(index + 1).padStart(2, '0'));
      number.setAttribute('aria-hidden', 'true');
      button.append(number, make('span', 'portfolio-reel-index-title', film.title));
      button.addEventListener('click', () => {
        engine?.goTo?.(index, { instant: true });
        selection.open = false;
        root.focus({ preventScroll: true });
        root.scrollIntoView({ block: 'center', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
      }, { signal: cardSignal });
      item.append(button);
      indexList.append(item);
      return button;
    });
    selection.append(summary, indexList);
    selection.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || !selection.open) return;
      event.preventDefault();
      selection.open = false;
      summary.focus({ preventScroll: true });
    }, { signal: cardSignal });
    section.append(root, controls, details, selection);
    host.append(section);
    let active = -1;
    function select(index) {
      if (index === active) return;
      active = index;
      const film = films[index];
      const parts = titleFor(film);
      currentSlug = film.slug;
      client.textContent = parts.client;
      title.textContent = parts.title;
      action.href = projectURL(film);
      action.id = `film-${film.slug}`;
      action.setAttribute('aria-label', `View project: ${film.title}`);
      count.textContent = `${String(index + 1).padStart(2, '0')} / ${films.length}`;
      indexButtons.forEach((button, buttonIndex) => {
        if (buttonIndex === index) button.setAttribute('aria-current', 'true');
        else button.removeAttribute('aria-current');
      });
    }
    const selectedIndex = Math.max(0, films.findIndex(film => film.slug === currentSlug));
    select(selectedIndex);
    engine = createReelFlux(root, {
      viewportWidth: 1280, viewportHeight: 500,
      cardWidth: 42, aspect: 16 / 9, gap: 18,
      wave: 0.25, frequency: 1, smoothing: 9, sensitivity: 1, autoplay: 0,
      flare: 1, edgeZone: 26, smear: 0.799999, fringe: 0.699999,
      images: films.map(imageFor), titles: films.map(film => film.title),
      links: films.map(projectURL), onChange: select,
      previousButton: previous, nextButton: next,
      // Horizontal trackpad/wheel keeps native vertical page scrolling.
      wheel: 'horizontal', draggable: true, preview: false,
    });
    engine.goTo?.(selectedIndex, { instant: true });
    focusTarget = action;
  }
  updateURL();
  if (restoreFocus && focusTarget) {
    cancelAnimationFrame(returnFrame);
    returnFrame = requestAnimationFrame(() => {
      focusTarget.scrollIntoView({ block: 'center', behavior: 'instant' });
      focusTarget.focus({ preventScroll: true });
    });
  }
}
switches.forEach(button => button.addEventListener('click', () => {
  if (button.dataset.portfolioView === view) return;
  view = button.dataset.portfolioView;
  try { localStorage.setItem(preferenceKey, view); } catch {}
  render();
  status.textContent = `${view === 'grid' ? 'Grid' : 'Reel'} view selected.`;
  window.scrollTo({ top: 0, behavior: 'instant' });
}, { signal }));
render({ restoreFocus: Boolean(params.get('selected')) });
if (import.meta.hot) import.meta.hot.dispose(() => {
  controller.abort();
  renderController.abort();
  engine?.destroy();
  destroyBackground();
  destroyTheatre();
  cancelAnimationFrame(returnFrame);
});
