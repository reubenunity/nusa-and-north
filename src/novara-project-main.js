import './styles/lightbox.css';
import './styles/review-project-screen.css';
import './styles/review-project-gallery.css';
import './styles/novara-project.css';
import './styles/novara-background.css';
import { films } from './js/review-films-data.js';
import { projectStories } from './js/review-project-stories.js';
import { projectStills } from './js/novara-project-stills.js';
import { mountProjectScreen } from './js/review-project-screen.js';
import { mountProjectGallery } from './js/review-project-gallery.js';
import { openNovaraLightbox as openLightbox, mountNovaraMediaConsent } from './js/novara-media-consent.js';
import { mountNovaraBackground } from './js/novara-background.js';

mountNovaraMediaConsent();
const destroyBackground = mountNovaraBackground();

const esc = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const requestedPortfolioView = new URLSearchParams(location.search).get('view');
const portfolioView = requestedPortfolioView === 'gallery' ? 'reel' : requestedPortfolioView;
const viewParam = ['reel', 'grid'].includes(portfolioView) ? `&view=${portfolioView}` : '';
const projectHref = film => `/novara-project.html?film=${encodeURIComponent(film.slug)}${viewParam}`;
const archiveHref = film => `/novara-films.html?selected=${encodeURIComponent(film.slug)}${viewParam}`;
const localHeroes = {
  'radisson-berlin': '/films/radisson-berlin/frame-06.webp',
  'radisson-red-innsbruck': '/films/radisson-red-innsbruck/hero.webp',
};
const heroFor = film => localHeroes[film.slug] || film.poster;
const splitTitle = film => {
  const [client, ...parts] = film.title.split(' — ');
  return { client, title: parts.join(' — ') || client, hasCampaign: Boolean(parts.length) };
};
const params = new URLSearchParams(location.search);
const requested = params.get('film') || location.pathname.match(/^\/film\/([^/]+)\/?$/)?.[1];
const index = requested ? films.findIndex(film => film.slug === requested) : 0;
const host = document.getElementById('project');
const controller = new AbortController();
let destroyScreen = () => {}, destroyGallery = () => {}, destroyFrameRounding = () => {};

if (index < 0 || !films[index]) {
  document.title = 'Film not found — Nusa & North';
  host.innerHTML = `
    <section class="np-missing">
      <p class="np-label">OUT OF FRAME</p>
      <h1>FILM NOT<br>FOUND<span>.</span></h1>
      <a class="np-text-link" href="/novara-films.html">EXPLORE ALL FILMS <span aria-hidden="true">↗</span></a>
    </section>`;
} else {
  const film = films[index];
  const next = films[(index + 1) % films.length];
  const { client, title, hasCampaign } = splitTitle(film);
  const nextTitle = splitTitle(next);
  const story = projectStories[film.slug] || `${film.title}. A film by Nusa & North.`;
  const stills = projectStills[film.slug] || [];
  const hero = heroFor(film);
  const preview = localHeroes[film.slug] ? `/films/${film.slug}/preview.mp4` : '';
  const number = String(index + 1).padStart(2, '0');
  const total = String(films.length).padStart(2, '0');
  document.title = `${film.title} — Nusa & North`;
  document.querySelector('meta[name="description"]').content = story;
  document.querySelector('.np-archive-link').href = archiveHref(film);

  host.innerHTML = `
    <section class="np-heading" aria-labelledby="project-title">
      <div class="np-heading-meta">
        <p class="np-label"><span class="np-index">${number}</span> / ${total} — A NUSA & NORTH FILM</p>
        ${hasCampaign ? `<p class="np-label np-client">${esc(client)}</p>` : ''}
      </div>
      <h1 id="project-title"${title.length > 29 ? ' class="np-title-long"' : ''}>${esc(title)}<span class="np-period" aria-hidden="true">.</span></h1>
      <div class="np-heading-foot">
        <a class="np-text-link" href="#film">WATCH THE FILM <span aria-hidden="true">↘</span></a>
        <a class="np-label np-story-link" href="#story">THE STORY <span aria-hidden="true">↓</span></a>
        ${stills.length ? '<a class="np-label np-frames-link" href="#frames">EXPLORE THE FRAMES <span aria-hidden="true">↓</span></a>' : ''}
      </div>
    </section>

    <section id="film" class="np-screen" aria-label="Watch ${esc(film.title)}"></section>

    <section id="story" class="np-story" aria-labelledby="story-heading">
      <div class="np-story-side">
        <h2 id="story-heading" class="np-label">BEHIND THE FILM</h2>
        <span class="np-story-arrow" aria-hidden="true">↘</span>
      </div>
      <div class="np-story-content">
        <p class="np-description">${esc(story)}</p>
        <div class="np-story-bottom">
          <dl class="np-credits">
            <div><dt>PROJECT</dt><dd>${esc(client)}</dd></div>
            <div><dt>FILM BY</dt><dd>Nusa & North</dd></div>
          </dl>
          <div class="np-share">
            <button class="np-copy np-label" type="button">COPY FILM LINK <span aria-hidden="true">↗</span></button>
            <p class="np-share-status np-label" role="status" aria-live="polite"></p>
          </div>
        </div>
      </div>
    </section>

    ${stills.length ? '<div id="frames" class="np-frames"></div>' : ''}

    <section class="np-next" aria-labelledby="next-film-title">
      <div class="np-next-top"><p class="np-label">KEEP WATCHING</p><a class="np-label" href="${archiveHref(film)}">FULL PORTFOLIO <span aria-hidden="true">↗</span></a></div>
      <a class="np-next-project" href="${projectHref(next)}">
        <div class="np-next-image"><img src="${esc(heroFor(next))}" alt="${esc(next.title)} film still" loading="lazy" decoding="async" width="1280" height="720"><span class="np-next-round" aria-hidden="true">↗</span></div>
        <div class="np-next-copy">
          <p class="np-label">NEXT FILM / ${String((index + 1) % films.length + 1).padStart(2, '0')}</p>
          <h2 id="next-film-title">${esc(nextTitle.title)}<span class="np-period" aria-hidden="true">.</span></h2>
          ${nextTitle.hasCampaign ? `<p class="np-next-client np-label">${esc(nextTitle.client)}</p>` : ''}
        </div>
      </a>
    </section>`;

  destroyScreen = mountProjectScreen(host.querySelector('.np-screen'), {
    poster: hero,
    preview,
    title: film.title,
    onPlay: trigger => openLightbox(film.src, trigger),
  });
  // Keep the shared Horizon curves untouched; only round this concept's
  // changing aperture. The observer runs on its style updates, never at idle.
  const apertureFrame = host.querySelector('.project-screen-aperture');
  const roundFrame = () => {
    const clip = apertureFrame.style.clipPath;
    if (clip.includes('round 0px')) apertureFrame.style.clipPath = clip.replace('round 0px', 'round 28px');
  };
  const roundingObserver = new MutationObserver(roundFrame);
  roundingObserver.observe(apertureFrame, { attributes: true, attributeFilter: ['style'] });
  roundFrame();
  destroyFrameRounding = () => roundingObserver.disconnect();
  if (stills.length) destroyGallery = mountProjectGallery(host.querySelector('#frames'), { images: stills, title: film.title });

  host.querySelector('.np-copy').addEventListener('click', async () => {
    const status = host.querySelector('.np-share-status');
    const url = location.origin + projectHref(film);
    try {
      await navigator.clipboard.writeText(url);
      if (!controller.signal.aborted) status.textContent = 'Film link copied.';
    } catch {
      if (!controller.signal.aborted) status.textContent = url;
    }
  }, { signal: controller.signal });
}

if (import.meta.hot) import.meta.hot.dispose(() => {
  controller.abort();
  destroyBackground();
  destroyFrameRounding();
  destroyScreen();
  destroyGallery();
});
