// Deep links: nusaandnorth.com/?film=<slug> opens that film in the
// player straight away and parks the timeline with that clip under
// the playhead, so closing the player lands the visitor on the film
// in the monitor, not back at the hero.
// The /film/<slug>/ share pages (vite.config.js) redirect here.

import { scrollYForClip } from './edit.js';

export function wireFilmDeepLink() {
  const slug = new URLSearchParams(location.search).get('film');
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) return;
  const clip = document.querySelector(`.js-video-lane .clip[data-slug="${slug}"]`);
  if (!clip?.dataset.videoSrc) return;

  const park = () => {
    const edit = document.getElementById('edit');
    if (!edit) return;
    // pinned desktop timeline: scroll to where the scrub puts this
    // clip under the playhead; static/mobile timeline: scroll the
    // page to the act and the strip to the clip
    let y = scrollYForClip(clip);
    if (y == null) {
      y = edit.getBoundingClientRect().top + window.scrollY;
      const strip = edit.querySelector('.edit__timeline');
      if (strip) strip.scrollLeft = clip.offsetLeft + clip.offsetWidth / 2 - strip.clientWidth / 2;
    }
    if (window.__lenis) {
      // Lenis clamps jumps to the page height it last measured — which
      // predates the pinned acts' spacers on a fresh load
      window.__lenis.resize();
      window.__lenis.scrollTo(y, { immediate: true, force: true });
    } else {
      window.scrollTo(0, y);
    }
  };

  const go = () => {
    import('./lightbox.js').then((mod) => {
      // let the page settle its pins and measurements before jumping
      setTimeout(() => {
        park();
        mod.openLightbox(clip.dataset.videoSrc, clip);
      }, 300);
    });
  };

  if (document.readyState === 'complete') go();
  else window.addEventListener('load', go, { once: true });
}
