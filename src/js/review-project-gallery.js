import gsap from 'gsap';

// HorizonX Gallery Reveal's selected `reveal` recipe: opposing image-mask
// translations, power1 easing and an .08-second stagger. The unmodified
// component export is retained at /horizonx/gallery-reveal.html.
const mounted = new WeakMap();
let galleryId = 0;
const clamp = value => Math.max(0, Math.min(1, value));

/** Mount a native-page-scroll still gallery. Returns an idempotent teardown. */
export function mountProjectGallery(host, { images = [], title = '' } = {}) {
  if (!host) return () => {};
  mounted.get(host)?.();
  const sources = [...new Map(images.filter(image => image && typeof image.src === 'string' && image.src.trim()).map(image => [image.src, image])).values()];
  if (!sources.length) return () => {};

  const section = document.createElement('section');
  section.className = 'project-gallery';
  const headingId = `project-gallery-heading-${++galleryId}`;
  section.setAttribute('aria-labelledby', headingId);
  section.innerHTML = `
    <div class="project-gallery-sticky">
      <header class="project-gallery-head">
        <p class="project-gallery-label"></p>
        <h2 id="${headingId}">STILLS FROM THE FILM<span>.</span></h2>
      </header>
      <div class="project-gallery-grid"></div>
      <footer class="project-gallery-foot"><span class="project-gallery-count"></span><span class="project-gallery-cue" aria-hidden="true">SCROLL TO REVEAL <span>↓</span></span></footer>
    </div>`;
  section.querySelector('.project-gallery-label').textContent = title || 'NUSA & NORTH / FRAME STUDIES';
  section.querySelector('.project-gallery-count').textContent = `${String(sources.length).padStart(2, '0')} FRAMES / ONE FILM`;
  const grid = section.querySelector('.project-gallery-grid');
  const spans = [5, 4, 6, 4, 6, 5];
  sources.forEach((image, index) => {
    const figure = document.createElement('figure');
    figure.className = 'project-gallery-frame';
    figure.style.setProperty('--gallery-span', spans[index % spans.length]);
    const item = document.createElement('div'); item.className = 'project-gallery-item';
    const inner = document.createElement('div'); inner.className = 'project-gallery-inner';
    const img = document.createElement('img');
    img.src = image.src;
    img.alt = typeof image.alt === 'string' && image.alt.trim() ? image.alt : `Frame ${index + 1} from ${title || 'the film'}`;
    img.loading = 'lazy'; img.decoding = 'async'; img.width = 1280; img.height = 720;
    const caption = document.createElement('figcaption');
    caption.textContent = String(index + 1).padStart(2, '0');
    inner.append(img); item.append(inner); figure.append(item, caption); grid.append(figure);
  });
  host.append(section);

  const items = [...section.querySelectorAll('.project-gallery-item')];
  const inners = [...section.querySelectorAll('.project-gallery-inner')];
  const sticky = section.querySelector('.project-gallery-sticky');
  const mode = matchMedia('(max-width: 850px), (max-height: 650px), (prefers-reduced-motion: reduce)');
  let timeline = null, staticLayout = true, visible = false, destroyed = false;
  let raf = 0, last = 0, progress = 1, target = 1, start = 0, end = 1;
  let resizeFrame = 0;
  const cleanups = [];
  const on = (element, name, handler, options) => { element.addEventListener(name, handler, options); cleanups.push(() => element.removeEventListener(name, handler, options)); };

  function finishFrame(value) {
    progress = value;
    timeline?.progress(value);
    section.dataset.galleryProgress = value.toFixed(3);
    section.dataset.galleryComplete = String(value >= .999);
  }
  function readTarget() { target = staticLayout ? 1 : clamp((window.scrollY - start) / Math.max(1, end - start)); }
  function tick(now) {
    raf = 0;
    if (destroyed || staticLayout || !visible || document.hidden) { last = 0; return; }
    const delta = last ? Math.min(64, now - last) : 16;
    last = now;
    // A short scrub settles quickly without leaving a permanent RAF running.
    const next = progress + (target - progress) * (1 - Math.exp(-delta / 115));
    const settled = Math.abs(next - target) < .0005;
    finishFrame(settled ? target : next);
    if (!settled) raf = requestAnimationFrame(tick);
    else last = 0;
  }
  function wake() {
    if (!raf && !destroyed && !staticLayout && visible && !document.hidden) {
      last = 0; raf = requestAnimationFrame(tick);
    }
  }
  function measure() {
    if (destroyed) return;
    const top = section.getBoundingClientRect().top + window.scrollY;
    const travel = Math.max(1, section.offsetHeight - sticky.offsetHeight);
    // Start while the section enters the page, then leave a composed hold
    // before the sticky stage releases. There is no nested scroll container.
    start = top - innerHeight * .62;
    end = top + travel * .78;
    readTarget();
    if (visible) wake();
    else finishFrame(target);
  }
  function rebuild() {
    if (destroyed) return;
    cancelAnimationFrame(raf); raf = 0; last = 0;
    timeline?.kill(); timeline = null;
    gsap.set([...items, ...inners], { clearProps: 'transform' });
    staticLayout = mode.matches || sources.length < 3 || sources.length > 6;
    section.classList.toggle('project-gallery-static', staticLayout);
    section.dataset.galleryMode = staticLayout ? 'static' : 'reveal';
    if (!staticLayout) {
      timeline = gsap.timeline({ paused: true, defaults: { ease: 'power1' } });
      timeline.fromTo(items, { yPercent: -102 }, { yPercent: 0, stagger: .08 });
      timeline.fromTo(inners, { yPercent: 102 }, { yPercent: 0, stagger: .08 }, 0);
    }
    measure(); finishFrame(target);
  }
  function resize() {
    if (resizeFrame || destroyed) return;
    resizeFrame = requestAnimationFrame(() => { resizeFrame = 0; measure(); });
  }
  function scroll() { if (!staticLayout) { readTarget(); wake(); } }
  on(window, 'scroll', scroll, { passive: true });
  on(window, 'resize', resize, { passive: true });
  on(mode, 'change', rebuild);
  on(document, 'visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(raf); raf = 0; last = 0; }
    else { measure(); wake(); }
  });
  // Image dimensions are reserved up front, so lazy loading does not shift
  // the formation or the section that follows it.
  section.querySelectorAll('img').forEach(img => {
    on(img, 'error', () => {
      const figure = img.closest('figure');
      figure.classList.add('project-gallery-image-error');
      const message = document.createElement('span'); message.className = 'project-gallery-unavailable';
      message.textContent = 'FRAME UNAVAILABLE';
      if (!figure.querySelector('.project-gallery-unavailable')) figure.querySelector('.project-gallery-inner').append(message);
    });
  });
  const observer = new IntersectionObserver(entries => {
    if (destroyed) return;
    visible = entries[0]?.isIntersecting ?? false;
    section.dataset.galleryVisible = String(visible);
    if (visible) { measure(); wake(); }
    else { cancelAnimationFrame(raf); raf = 0; last = 0; readTarget(); finishFrame(target); }
  }, { rootMargin: '80px 0px' });
  observer.observe(section);
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(section); resizeObserver.observe(sticky);
  // Late font/video layout changes above the gallery can alter its page top.
  resizeObserver.observe(document.body);
  rebuild();

  const destroy = () => {
    if (destroyed) return;
    destroyed = true; cancelAnimationFrame(raf); cancelAnimationFrame(resizeFrame);
    timeline?.kill(); observer.disconnect(); resizeObserver.disconnect(); cleanups.forEach(fn => fn());
    section.remove();
    if (mounted.get(host) === destroy) mounted.delete(host);
  };
  mounted.set(host, destroy);
  return destroy;
}
