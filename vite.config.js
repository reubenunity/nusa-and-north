import { defineConfig } from 'vite';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const SITE = 'https://nusaandnorth.com';

// Read the filmography straight out of index.html's timeline lane, so
// the share pages can never drift from what the site actually plays.
function readFilms(root) {
  const html = readFileSync(resolve(root, 'index.html'), 'utf8');
  const films = [];
  const re = /<div class="clip" data-title="([^"]+)" data-slug="([^"]+)" data-video-src="([^"]+)" data-poster="([^"]+)"/g;
  let m;
  while ((m = re.exec(html))) {
    films.push({ title: decodeEntities(m[1]), slug: m[2], src: m[3], poster: m[4] });
  }
  // the showreel is injected by main.js, not in the HTML
  films.push({
    title: 'Showreel',
    slug: 'showreel',
    src: 'https://vimeo.com/1161420054/949ddb9393',
    poster: 'https://i.vimeocdn.com/video/2116792164-e2a3a54c64ac92b7abea89746e8c0a7c484fd62f334632b0d54e0105dc1ebe96-d_1280x720',
  });
  return films;
}

function decodeEntities(s) {
  return s.replace(/&mdash;/g, '—').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
}

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

// One tiny page per film at /film/<slug>/ — carries the film's own
// title + poster as its link preview (WhatsApp, iMessage, LinkedIn,
// mail), then hands off to the player on the main site.
function filmPage({ title, slug, poster }) {
  const url = `${SITE}/film/${slug}/`;
  const target = `${SITE}/?film=${slug}`;
  const desc = `${title} — a film by Nusa & North. Video production for hotels, travel destinations and brands.`;
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${esc(title)} — Nusa &amp; North</title>
    <meta name="description" content="${esc(desc)}" />
    <meta name="theme-color" content="#131110" />
    <link rel="canonical" href="${url}" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <meta property="og:type" content="video.other" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(desc)}" />
    <meta property="og:site_name" content="Nusa &amp; North" />
    <meta property="og:locale" content="en_US" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${esc(poster)}" />
    <meta property="og:image:width" content="1280" />
    <meta property="og:image:height" content="720" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(title)}" />
    <meta name="twitter:description" content="${esc(desc)}" />
    <meta name="twitter:image" content="${esc(poster)}" />
    <script>location.replace(${JSON.stringify(target)});</script>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #131110; color: #fafaf6; font-family: ui-monospace, 'SF Mono', Menlo, monospace; text-align: center; padding: 24px; }
      a { color: inherit; display: inline-block; }
      img { display: block; max-width: min(720px, 100%); aspect-ratio: 16 / 9; object-fit: cover; margin: 0 auto 20px; }
      p { font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; }
      .dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #e8362b; margin-right: 8px; vertical-align: 1px; }
    </style>
  </head>
  <body>
    <a href="${target}">
      <img src="${esc(poster)}" alt="${esc(title)}" />
      <p><span class="dot"></span>${esc(title)} &mdash; play on nusaandnorth.com</p>
    </a>
  </body>
</html>
`;
}

function filmPages() {
  let root = process.cwd();
  let outDir = 'dist';
  return {
    name: 'nusa-film-pages',
    configResolved(cfg) {
      root = cfg.root;
      outDir = cfg.build.outDir;
    },
    closeBundle() {
      const films = readFilms(root);
      for (const film of films) {
        const dir = resolve(root, outDir, 'film', film.slug);
        mkdirSync(dir, { recursive: true });
        writeFileSync(resolve(dir, 'index.html'), filmPage(film));
      }
      console.log(`  film pages: ${films.length} written to ${outDir}/film/`);
    },
  };
}

export default defineConfig({
  plugins: [filmPages()],
});
