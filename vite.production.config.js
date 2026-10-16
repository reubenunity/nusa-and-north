import { defineConfig } from 'vite';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, copyFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { films } from './src/js/review-films-data.js';
import { projectStories } from './src/js/review-project-stories.js';

const SITE = 'https://nusaandnorth.com';
const root = process.cwd();
const output = resolve(root, 'dist');
const entries = ['novara.html', 'novara-films.html', 'novara-films-grid.html', 'novara-project.html', 'novara-legal.html'];
const routes = {
  '/novara-films-explore.html': '/portfolio/',
  '/novara-films.html': '/portfolio/',
  '/novara-films-grid.html': '/collection/',
  '/novara-project.html': '/project.html',
  '/novara-legal.html': '/legal/',
  '/novara.html': '/',
};
const escape = text => String(text).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
const replaceRoutes = text => Object.entries(routes).reduce((value, [from, to]) => value.replaceAll(from, to), text).replace(/href="\/project\.html\?film=([a-z0-9-]+)"/g, 'href="/film/$1/"');
const write = (path, text) => { const target = resolve(output, path); mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, text); };
function metadata(html, { title, description, path, image = '/og.jpg' }) {
  html = html.replace(/<meta name="robots"[^>]*>/g, '')
    .replace(/<title>.*?<\/title>/s, `<title>${escape(title)}</title>`)
    .replace(/<meta name="description"[^>]*>/g, '');
  const absoluteImage = image.startsWith('https:') ? image : SITE + image;
  return html.replace('</head>', `<meta name="description" content="${escape(description)}">
<link rel="canonical" href="${SITE}${path}">
<meta property="og:type" content="website"><meta property="og:site_name" content="Nusa &amp; North">
<meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}">
<meta property="og:url" content="${SITE}${path}"><meta property="og:image" content="${escape(absoluteImage)}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${escape(absoluteImage)}">
</head>`);
}
function redirect(path, target) {
  write(path, `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>Nusa &amp; North</title><link rel="canonical" href="${SITE}${target.split('#')[0]}"><script>location.replace(${JSON.stringify(target)}+location.search+location.hash)</script></head><body><a href="${escape(target)}">Continue to Nusa &amp; North</a></body></html>`);
}
function productionSite() {
  return {
    name: 'nusa-production-site',
    generateBundle() {
      // Explicit source inventory for deployment; business documents are never staged.
      const files = [...this.getModuleIds()].filter(id => id.startsWith(root + '/') && !id.includes('/node_modules/') && !id.includes('?')).map(id => id.slice(root.length + 1));
      mkdirSync(resolve(root, 'tmp'), { recursive: true });
      writeFileSync(resolve(root, 'tmp/production-source-files.json'), JSON.stringify([...new Set([...files, ...entries])].sort(), null, 2));
    },
    closeBundle() {
      // Keep the old source intact; production promotes the approved Novara build.
      const walk = path => readdirSync(path, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(resolve(path, e.name)) : [resolve(path, e.name)]);
      for (const file of walk(output)) {
        if (/\.(html|js|css)$/.test(file)) writeFileSync(file, replaceRoutes(readFileSync(file, 'utf8')));
      }
      const home = readFileSync(resolve(output, 'novara.html'), 'utf8');
      write('index.html', metadata(home, { title: 'Nusa & North — Film Studio', description: 'A husband-and-wife duo crafting films for hospitality, travel destinations and commercial brands — worldwide.', path: '/' }));
      write('portfolio/index.html', metadata(readFileSync(resolve(output, 'novara-films.html'), 'utf8'), { title: 'Portfolio — Nusa & North', description: 'Explore films, campaigns and stories for hospitality, travel and commercial brands by Nusa & North.', path: '/portfolio/' }));
      write('collection/index.html', metadata(readFileSync(resolve(output, 'novara-films-grid.html'), 'utf8'), { title: 'Films, Social & Sound — Nusa & North', description: 'Films, social reels, product videos and sound design by Nusa & North.', path: '/collection/' }));
      write('legal/index.html', metadata(readFileSync(resolve(output, 'novara-legal.html'), 'utf8'), { title: 'Privacy & Legal — Nusa & North', description: 'Privacy, media choices, website terms and registered business details for Nusa & North.', path: '/legal/' }));
      const project = readFileSync(resolve(output, 'novara-project.html'), 'utf8');
      write('project.html', `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>Film — Nusa &amp; North</title><script>const p=new URLSearchParams(location.search),slug=p.get('film');p.delete('film');const known=${JSON.stringify(films.map(f=>f.slug))};location.replace(known.includes(slug)?'/film/'+encodeURIComponent(slug)+'/'+(p.size?'?'+p:'')+location.hash:'/portfolio/');</script></head><body><a href="/portfolio/">Browse the portfolio</a></body></html>`);
      for (const film of films) {
        const path = `/film/${film.slug}/`;
        let page = metadata(project, { title: `${film.title} — Nusa & North`, description: projectStories[film.slug] || `${film.title}, a film by Nusa & North.`, path, image: film.poster });
        page = page.replace(/<noscript>.*?<\/noscript>/s, `<noscript><article style="padding:10vh 5vw;max-width:850px"><h1>${escape(film.title)}</h1><p>${escape(projectStories[film.slug] || '')}</p><p><a href="${escape(film.src)}">Watch the film</a></p><a href="/portfolio/">Full portfolio</a></article></noscript>`);
        write(`film/${film.slug}/index.html`, page);
      }
      // Old bookmarks remain usable, including the previous homepage player URLs.
      redirect('film/showreel/index.html', '/');
      for (const [old, target] of Object.entries(routes)) redirect(old.slice(1), target);
      write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['/', '/portfolio/', '/collection/', '/legal/', ...films.map(f => `/film/${f.slug}/`)].map(path => `<url><loc>${SITE}${path}</loc></url>`).join('')}</urlset>`);
      write('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);
      write('CNAME', 'nusaandnorth.com\n');
      // Copy approved web assets only. Provenance, exports and working documents stay local.
      const publicRoot = resolve(root, 'public');
      const allowedRoots = new Set(['brand', 'films', 'stills', 'video', 'audio', 'logos']);
      const copied = [];
      for (const file of walk(publicRoot)) {
        const relative = file.slice(publicRoot.length + 1);
        const allowed = (allowedRoots.has(relative.split('/')[0]) && /\.(webp|png|jpe?g|svg|mp4|mp3|woff2?)$/i.test(relative)) || relative.startsWith('novara/vendor/') || ['og.jpg', 'favicon.svg', 'apple-touch-icon.png', '404.html'].includes(relative);
        if (!allowed || ['stills/reuben-okta-pumpkins.png', 'stills/reuben-okta-banner.png'].includes(relative)) continue;
        const destination = resolve(output, relative); mkdirSync(dirname(destination), { recursive: true }); copyFileSync(file, destination); copied.push('public/' + relative);
      }
      writeFileSync(resolve(root, 'tmp/production-public-files.json'), JSON.stringify(copied.sort(), null, 2));
      console.log(`Production: homepage, portfolio, legal, collection and ${films.length} film pages; ${copied.length} web assets.`);
    },
  };
}
export default defineConfig({ publicDir: false, plugins: [productionSite()], build: { outDir: 'dist', rollupOptions: { input: entries.map(file => resolve(root, file)) } } });
