import './styles/lightbox.css';
import './styles/novara-films.css';
import './styles/novara-background.css';
import { films } from './js/review-films-data.js';
import { projectStories } from './js/review-project-stories.js';
import { projectStills } from './js/review-project-stills.js';
import { shortFilms, locations } from './js/kiln-content.js';
import { mountNovaraBackground } from './js/novara-background.js';
import { mountNovaraMediaConsent, openNovaraLightbox as openLightbox } from './js/novara-media-consent.js';
import { isNovaraTheatre, mountNovaraTheatre, withNovaraAtmosphere } from './js/novara-theatre.js';

mountNovaraMediaConsent();
const destroyBackground = isNovaraTheatre() ? () => {} : mountNovaraBackground();
const destroyTheatre = mountNovaraTheatre();

const grid = document.querySelector('#film-grid');
const search = document.querySelector('#film-search');
const form = document.querySelector('.archive-tools');
const clearButton = document.querySelector('.archive-clear');
const resetButton = document.querySelector('.archive-reset');
const resultCount = document.querySelector('.archive-results');
const emptyState = document.querySelector('.archive-empty');
const total = document.querySelector('.archive-total');
const controller = new AbortController();
const { signal } = controller;
const primaryFrameIndex = { 'radisson-berlin': 5, 'radisson-red-innsbruck': 4 };
const normalize = (value) => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const make = (tag, className, text) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
};

const cards = films.map((film, index) => {
  const item = make('li', 'archive-card');
  item.id = `film-${film.slug}`;
  const article = make('article', 'archive-project');
  const headingId = `film-title-${film.slug}`;
  const projectUrl = withNovaraAtmosphere(`/novara-project.html?film=${encodeURIComponent(film.slug)}`);
  article.setAttribute('aria-labelledby', headingId);

  const imageLink = make('a', 'archive-image');
  imageLink.href = projectUrl;
  imageLink.setAttribute('aria-label', `View project: ${film.title}`);
  const image = make('img');
  const still = projectStills[film.slug]?.[primaryFrameIndex[film.slug] ?? 0];
  image.src = still?.src || film.poster;
  image.alt = still?.alt || `Film still from ${film.title}`;
  image.width = 1280;
  image.height = 720;
  image.loading = index < 2 ? 'eager' : 'lazy';
  image.decoding = 'async';
  image.addEventListener('error', () => {
    if (still && image.getAttribute('src') !== film.poster) {
      image.src = film.poster;
    } else {
      image.hidden = true;
      imageLink.classList.add('has-image-error');
    }
  }, { signal });

  const number = make('span', 'archive-number', `${String(index + 1).padStart(2, '0')} / ${films.length}`);
  number.setAttribute('aria-hidden', 'true');
  const heading = make('h2', 'archive-film-title', film.title);
  heading.id = headingId;
  const imageArrow = make('span', 'archive-image-arrow', '↗');
  imageArrow.setAttribute('aria-hidden', 'true');
  imageLink.append(image, number, heading, imageArrow);

  const details = make('div', 'archive-details');
  const story = make('p', 'archive-story', projectStories[film.slug] || film.title);
  const projectLink = make('a', 'archive-project-link', 'View project');
  projectLink.href = projectUrl;
  projectLink.setAttribute('aria-label', `View project: ${film.title}`);
  const arrow = make('span', '', '↗');
  arrow.setAttribute('aria-hidden', 'true');
  projectLink.append(arrow);
  details.append(story, projectLink);
  article.append(imageLink, details);
  item.append(article);
  grid.append(item);
  return {
    element: item,
    projectLink,
    slug: film.slug,
    searchable: normalize(`${film.title} ${film.slug.replaceAll('-', ' ')}`),
  };
});

total.textContent = `(${films.length})`;
total.setAttribute('aria-label', `${films.length} films`);

function filterFilms() {
  const query = search.value.trim();
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  let count = 0;
  cards.forEach(({ element, searchable }) => {
    const matches = terms.every((term) => searchable.includes(term));
    element.hidden = !matches;
    if (matches) count += 1;
  });
  resultCount.textContent = query ? `${count} of ${films.length} films` : `${films.length} films`;
  clearButton.hidden = !search.value;
  emptyState.hidden = count > 0;
}

function clearSearch() {
  search.value = '';
  filterFilms();
  search.focus({ preventScroll: true });
}

search.addEventListener('input', filterFilms, { signal });
search.addEventListener('search', filterFilms, { signal });
clearButton.addEventListener('click', clearSearch, { signal });
resetButton.addEventListener('click', clearSearch, { signal });
form.addEventListener('submit', (event) => event.preventDefault(), { signal });
filterFilms();

const shortTrack = document.querySelector('.archive-shorts-track');
shortFilms.forEach((film) => {
  const item = make('li', 'archive-short');
  const button = make('button', 'archive-short-play');
  button.type = 'button';
  button.setAttribute('aria-label', `Play ${film.title}`);
  const image = make('img');
  image.src = film.poster;
  image.alt = `Poster for ${film.title}`;
  image.width = 480;
  image.height = 640;
  image.loading = 'lazy';
  image.decoding = 'async';
  image.addEventListener('error', () => { image.hidden = true; }, { signal });
  const playLabel = make('span', 'archive-short-play-label', 'Play film');
  const playIcon = make('span', '', '▶');
  playIcon.setAttribute('aria-hidden', 'true');
  playLabel.prepend(playIcon);
  button.append(image, playLabel);
  button.addEventListener('click', async () => {
    if (!signal.aborted) openLightbox(film.src, button);
  }, { signal });
  const type = make('p', 'archive-short-type', film.type);
  const title = make('h3', 'archive-short-title', film.title);
  item.append(button, type, title);
  shortTrack.append(item);
});

const soundPlay = document.querySelector('.archive-sound-play');
soundPlay.addEventListener('click', async () => {
  if (!signal.aborted) openLightbox(soundPlay.dataset.video, soundPlay);
}, { signal });

const locationTrack = document.querySelector('.archive-locations-track');
locations.forEach((location) => {
  const item = make('li', 'archive-location');
  const film = location.slug ? films.find(({ slug }) => slug === location.slug) : null;
  const imageFrame = make(film ? 'a' : 'div', 'archive-location-image');
  if (film) {
    imageFrame.href = withNovaraAtmosphere(`/novara-project.html?film=${encodeURIComponent(film.slug)}`);
    imageFrame.setAttribute('aria-label', `View film: ${film.title}`);
  }
  const image = make('img');
  image.src = location.image;
  image.alt = `${location.name} location photograph`;
  image.width = 800;
  image.height = 600;
  image.loading = 'lazy';
  image.decoding = 'async';
  image.addEventListener('error', () => { image.hidden = true; }, { signal });
  imageFrame.append(image);
  const coordinates = make('p', 'archive-location-coordinates', location.coordinates);
  const title = make('h3', 'archive-location-title', location.name);
  const association = make('p', 'archive-location-association', location.association);
  item.append(imageFrame, coordinates, title, association);
  if (film) {
    const link = make('a', 'archive-location-project', 'View film');
    link.href = imageFrame.href;
    link.setAttribute('aria-label', `View film: ${film.title}`);
    const arrow = make('span', '', '↗');
    arrow.setAttribute('aria-hidden', 'true');
    link.append(arrow);
    item.append(link);
  }
  locationTrack.append(item);
});

const selectedSlug = new URLSearchParams(window.location.search).get('selected');
const selectedCard = cards.find(({ slug }) => slug === selectedSlug);
const sectionHash = ['#shorts', '#sound', '#locations'].includes(window.location.hash) ? window.location.hash : null;
const sectionTarget = sectionHash ? document.querySelector(sectionHash) : null;
let returnFrame = 0;
if (selectedCard || sectionTarget) {
  (document.fonts?.ready || Promise.resolve()).then(() => {
    if (signal.aborted) return;
    returnFrame = requestAnimationFrame(() => {
      if (selectedCard) {
        selectedCard.element.scrollIntoView({ behavior: 'instant', block: 'center' });
        selectedCard.projectLink.focus({ preventScroll: true });
      } else {
        sectionTarget.scrollIntoView({ behavior: 'instant', block: 'start' });
        document.querySelector(`${sectionHash}-title`).focus({ preventScroll: true });
      }
    });
  });
}

if (import.meta.hot) import.meta.hot.dispose(() => {
  controller.abort();
  destroyBackground();
  destroyTheatre();
  cancelAnimationFrame(returnFrame);
});
