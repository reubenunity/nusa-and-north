// Full-screen player lightbox. Builds its DOM once, converts
// Vimeo/YouTube watch URLs into autoplaying embeds, pauses Lenis
// while open, closes on X / backdrop / Escape.

let overlay = null;

function embedUrl(watchUrl) {
  // https://vimeo.com/ID/HASH -> player.vimeo.com embed
  const vimeo = watchUrl.match(/vimeo\.com\/(\d+)(?:\/([a-z0-9]+))?/i);
  if (vimeo) {
    const h = vimeo[2] ? `h=${vimeo[2]}&` : '';
    return `https://player.vimeo.com/video/${vimeo[1]}?${h}autoplay=1&title=0&byline=0&portrait=0`;
  }
  // https://www.youtube.com/watch?v=ID -> youtube embed
  const yt = watchUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/i);
  if (yt) {
    return `https://www.youtube.com/embed/${yt[1]}?autoplay=1&rel=0`;
  }
  return null;
}

function ensureOverlay() {
  if (overlay) return overlay;
  overlay = document.createElement('div');
  overlay.className = 'lightbox';
  overlay.innerHTML = `
    <div class="lightbox__backdrop"></div>
    <div class="lightbox__frame">
      <button class="lightbox__close" type="button" aria-label="Close player">&times;</button>
      <div class="lightbox__player"></div>
    </div>`;
  document.body.appendChild(overlay);

  overlay.querySelector('.lightbox__backdrop').addEventListener('click', closeLightbox);
  overlay.querySelector('.lightbox__close').addEventListener('click', closeLightbox);
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });
  return overlay;
}

export function openLightbox(watchUrl) {
  const src = embedUrl(watchUrl);
  if (!src) return;

  const el = ensureOverlay();
  const player = el.querySelector('.lightbox__player');
  player.innerHTML = '';
  const iframe = document.createElement('iframe');
  iframe.src = src;
  iframe.allow = 'autoplay; fullscreen; picture-in-picture';
  iframe.allowFullscreen = true;
  player.appendChild(iframe);

  el.classList.add('is-open');
  window.__lenis?.stop();
}

export function closeLightbox() {
  if (!overlay || !overlay.classList.contains('is-open')) return;
  overlay.classList.remove('is-open');
  overlay.querySelector('.lightbox__player').innerHTML = ''; // stops playback
  window.__lenis?.start();
}
