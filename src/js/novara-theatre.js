import '../styles/novara-theatre.css';

export const isNovaraTheatre = () => new URLSearchParams(location.search).get('atmosphere') === 'dusk';

const previewRoutes = new Set([
  '/', '/index.html', '/novara.html',
  '/portfolio', '/portfolio/', '/collection', '/collection/',
  '/novara-films.html', '/novara-films-explore.html', '/novara-films-grid.html',
  '/novara-project.html', '/project.html',
]);

// Reel Flux also navigates directly from canvas hits, so its links use this
// helper before reaching the renderer rather than relying on anchor rewriting.
export function withNovaraAtmosphere(href) {
  if (!isNovaraTheatre() || !href || href.startsWith('#')) return href;
  let url;
  try { url = new URL(href, location.href); } catch { return href; }
  if (url.origin !== location.origin || (!previewRoutes.has(url.pathname) && !/^\/film\/[^/]+\/?$/.test(url.pathname))) return href;
  url.searchParams.set('atmosphere', 'dusk');
  return `${url.pathname}${url.search}${url.hash}`;
}

export function mountNovaraTheatre() {
  if (!isNovaraTheatre()) return () => {};
  const body = document.body;
  const controller = new AbortController();
  const { signal } = controller;
  const hadClass = body.classList.contains('novara-theatre');
  body.classList.add('novara-theatre');

  const field = document.createElement('div');
  field.className = 'novara-theatre-field';
  field.setAttribute('aria-hidden', 'true');
  field.inert = true;
  let seed = 260716;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  field.innerHTML = `<svg class="nt-stars" viewBox="0 0 1440 1000" preserveAspectRatio="none" aria-hidden="true" focusable="false">
    ${Array.from({ length: 170 }, (_, i) => {
      const x = 10 + random() * 1420, y = 10 + random() * 980;
      const bright = i % 19 === 0;
      const size = bright ? 1.8 : .65 + random() * .7;
      const opacity = bright ? .65 : .18 + random() * .34;
      return `<path class="nt-star${i % 11 === 0 ? ' nt-star-twinkle' : ''}" d="M${x.toFixed(2)} ${y.toFixed(2)}h.01" fill="none" stroke="${i % 6 === 0 ? '#e9c5a2' : '#dcebf4'}" stroke-opacity="${opacity.toFixed(2)}" stroke-width="${size.toFixed(2)}" stroke-linecap="round" vector-effect="non-scaling-stroke" style="--nt-duration:${(4 + random() * 3).toFixed(2)}s;--nt-delay:-${(random() * 7).toFixed(2)}s"/>`;
    }).join('')}
  </svg>`;
  body.prepend(field);
  const syncVisibility = () => field.classList.toggle('is-visible', !document.hidden);
  document.addEventListener('visibilitychange', syncVisibility, { signal });
  syncVisibility();

  const theme = document.querySelector('meta[name="theme-color"]');
  const originalTheme = theme?.getAttribute('content');
  theme?.setAttribute('content', '#04080e');
  const changedLinks = new Map();
  function updateLink(link) {
    if (link.hasAttribute('download')) return;
    const original = link.getAttribute('href');
    const next = withNovaraAtmosphere(original);
    if (next === original) return;
    changedLinks.set(link, { original, next });
    link.setAttribute('href', next);
  }
  function updateLinks(node) {
    if (!(node instanceof Element)) return;
    if (node.matches('a[href]')) updateLink(node);
    node.querySelectorAll('a[href]').forEach(updateLink);
  }
  updateLinks(body);
  // Grid/reel switches and project selections replace links after mounting.
  // Observe only link destinations and inserted nodes, never animation styles.
  const links = new MutationObserver(records => {
    for (const record of records) {
      if (record.type === 'attributes') updateLink(record.target);
      else record.addedNodes.forEach(updateLinks);
    }
  });
  links.observe(body, { childList: true, subtree: true, attributes: true, attributeFilter: ['href'] });

  return () => {
    controller.abort();
    links.disconnect();
    changedLinks.forEach(({ original, next }, link) => {
      if (link.getAttribute('href') === next) link.setAttribute('href', original);
    });
    if (theme && originalTheme !== null) theme.setAttribute('content', originalTheme);
    field.remove();
    if (!hadClass) body.classList.remove('novara-theatre');
  };
}
