// HorizonX Scroll Expand's aperture, coverage and media curves. The untouched
// export remains at /horizonx/scroll-expand.html; this adapter uses page scroll.
const mounted = new WeakMap();
const clamp = value => Math.max(0, Math.min(1, value));
const ramp = (value, start, end) => {
  const t = clamp((value - start) / (end - start || 1e-6));
  return t * t * (3 - 2 * t);
};
const aperture = progress => 1 - Math.pow(1 - clamp(progress), 2.40001);
const coverage = amount => clamp((((72 + 28 * amount) * (64 + 36 * amount)) / 10000 - .460801) / (1 - .460801));

/** Mount a native-scroll film aperture. onPlay receives the visible frame button. */
export function mountProjectScreen(host, { poster = '', preview = '', title = '', onPlay } = {}) {
  if (!host) return () => {};
  mounted.get(host)?.();
  const hadHostClass = host.classList.contains('project-screen-host');
  host.classList.add('project-screen-host');

  const track = document.createElement('div');
  track.className = 'project-screen-track';
  track.innerHTML = `
    <div class="project-screen-stage">
      <div class="project-screen-aperture"><div class="project-screen-media"></div></div>
      <button class="project-screen-play" type="button">
        <span class="project-screen-play-cue">
          <span class="project-screen-play-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="20" height="20"><path d="M8 5.5 19 12 8 18.5Z" fill="currentColor"/></svg></span>
          <span>WATCH FILM</span>
        </span>
      </button>
      <p class="project-screen-hint" aria-hidden="true">SCROLL INTO THE FILM <span>↓</span></p>
    </div>`;
  const stage = track.querySelector('.project-screen-stage');
  const frame = track.querySelector('.project-screen-aperture');
  const media = track.querySelector('.project-screen-media');
  const frameButton = track.querySelector('.project-screen-play');
  const hint = track.querySelector('.project-screen-hint');
  frameButton.setAttribute('aria-label', `Play ${title || 'the film'}`);
  frameButton.dataset.poster = poster;

  const image = document.createElement('img');
  image.className = 'project-screen-poster';
  image.src = poster;
  image.alt = '';
  image.width = 1920;
  image.height = 1080;
  image.decoding = 'async';
  image.fetchPriority = 'high';
  image.draggable = false;
  media.append(image);

  let video = null;
  if (typeof preview === 'string' && preview.trim()) {
    video = document.createElement('video');
    video.className = 'project-screen-preview';
    video.muted = true;
    video.defaultMuted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = 'none';
    video.tabIndex = -1;
    video.setAttribute('aria-hidden', 'true');
    video.setAttribute('muted', '');
    video.disablePictureInPicture = true;
    media.append(video);
  }
  host.append(track);

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const compact = matchMedia('(max-width: 800px), (max-height: 500px)');
  const connection = navigator.connection;
  const cleanups = [];
  let destroyed = false, visible = false, staticLayout = true;
  let raf = 0, resizeRaf = 0, last = 0, progress = 0, target = 0;
  let stageHeight = 0, travel = 1, trackTop = 0;
  let previewLoaded = false, previewFailed = false, previewPending = false;
  const on = (element, type, listener, options) => {
    element?.addEventListener(type, listener, options);
    cleanups.push(() => element?.removeEventListener(type, listener, options));
  };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; last = 0; };

  function apply(value) {
    progress = value;
    const a = staticLayout ? 1 : aperture(value);
    const width = 72 + 28 * a, height = 64 + 36 * a;
    const x = Math.max(0, (100 - width) / 2), y = Math.max(0, (100 - height) / 2);
    const inset = `${y}% ${x}% ${y}% ${x}%`;
    frame.style.clipPath = `inset(${inset} round 0px)`;
    // The transparent button follows the actual aperture, so the shared
    // lightbox's DOM rect is the visible image rather than the whole stage.
    frameButton.style.inset = inset;
    const m = staticLayout ? 1 : aperture((value - .179999) / .8200000000000001);
    media.style.transform = `scale(${1.07999 + (1 - 1.07999) * m})`;
    const gone = staticLayout ? 1 : ramp(coverage(a), 0, .0900001);
    hint.style.opacity = String(1 - gone);
    hint.style.transform = `translate3d(0,${10 * gone}px,0)`;
    track.dataset.screenProgress = value.toFixed(3);
  }

  function read() {
    target = staticLayout ? 1 : clamp((window.scrollY - trackTop) / travel);
  }

  function tick(now) {
    raf = 0;
    if (destroyed || staticLayout || !visible || document.hidden) { last = 0; return; }
    const elapsed = last ? Math.min(64, now - last) : 1000 / 60;
    last = now;
    // Same 100ms Horizon scrub, elapsed-time based for high refresh displays.
    const next = progress + (target - progress) * (1 - Math.exp(-elapsed / 99.999));
    const settled = Math.abs(target - next) < .000399999;
    apply(settled ? target : next);
    if (!settled) raf = requestAnimationFrame(tick);
    else last = 0;
  }

  function wake() {
    if (!raf && !destroyed && visible && !staticLayout && !document.hidden && Math.abs(target - progress) > .00001) {
      last = 0;
      raf = requestAnimationFrame(tick);
    }
  }

  function canPreview() {
    return video && !destroyed && visible && !document.hidden && !reduced.matches && !connection?.saveData && !previewFailed && !host.closest('[inert]');
  }

  function syncPreview() {
    if (!video) return;
    if (!canPreview()) { video.pause(); return; }
    if (!previewLoaded) {
      previewLoaded = true;
      video.src = preview;
      video.preload = 'metadata';
    }
    if (previewPending || !video.paused) return;
    previewPending = true;
    Promise.resolve(video.play()).catch(() => {
      // Autoplay restrictions leave the poster and the working Watch button.
    }).finally(() => {
      previewPending = false;
      if (!canPreview()) video.pause();
    });
  }

  function measure() {
    if (destroyed) return;
    const nextStatic = reduced.matches || compact.matches;
    staticLayout = nextStatic;
    track.classList.toggle('project-screen-static', staticLayout);
    track.dataset.screenMode = staticLayout ? 'static' : 'expand';
    if (staticLayout) {
      track.style.removeProperty('height');
      stop();
    } else {
      stageHeight = stage.getBoundingClientRect().height;
      // The frame expands over 0.6 viewport heights and immediately releases.
      travel = Math.max(1, window.innerHeight * .599999);
      const height = `${stageHeight + travel}px`;
      if (track.style.height !== height) track.style.height = height;
    }
    trackTop = track.getBoundingClientRect().top + window.scrollY;
    read();
    apply(target);
    syncPreview();
  }

  function resize() {
    if (destroyed || resizeRaf) return;
    resizeRaf = requestAnimationFrame(() => { resizeRaf = 0; measure(); });
  }

  on(window, 'scroll', () => {
    if (staticLayout || destroyed) return;
    read();
    if (visible) wake();
  }, { passive: true });
  on(window, 'resize', resize, { passive: true });
  on(reduced, 'change', measure);
  on(compact, 'change', measure);
  on(connection, 'change', syncPreview);
  on(document, 'visibilitychange', () => {
    if (document.hidden) stop();
    else { read(); apply(target); }
    syncPreview();
  });
  on(frameButton, 'click', () => {
    if (destroyed) return;
    video?.pause();
    onPlay?.(frameButton);
  });
  on(image, 'error', () => track.classList.add('project-screen-poster-error'));
  if (video) {
    on(video, 'playing', () => {
      if (!canPreview()) { video.pause(); return; }
      track.dataset.previewPlaying = 'true';
    });
    on(video, 'pause', () => { track.dataset.previewPlaying = 'false'; });
    on(video, 'error', () => {
      previewFailed = true;
      track.dataset.previewPlaying = 'false';
      video.pause();
    });
  }

  const intersection = new IntersectionObserver(entries => {
    if (destroyed) return;
    visible = entries[0]?.isIntersecting ?? false;
    track.dataset.screenVisible = String(visible);
    read();
    if (visible) { apply(target); wake(); }
    else { stop(); apply(target); }
    syncPreview();
  });
  intersection.observe(stage);

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(stage);
  resizeObserver.observe(document.body);
  // The shared player makes the page inert. Pause its background preview
  // while it is open and resume only when the page becomes interactive again.
  const modalObserver = video ? new MutationObserver(syncPreview) : null;
  if (modalObserver) {
    let ancestor = host;
    while (ancestor) {
      modalObserver.observe(ancestor, { attributes: true, attributeFilter: ['inert'] });
      ancestor = ancestor.parentElement;
    }
  }

  measure();

  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    stop();
    cancelAnimationFrame(resizeRaf);
    intersection.disconnect();
    resizeObserver.disconnect();
    modalObserver?.disconnect();
    cleanups.forEach(cleanup => cleanup());
    if (video) {
      video.pause();
      video.removeAttribute('src');
      video.load();
    }
    track.remove();
    if (!hadHostClass) host.classList.remove('project-screen-host');
    if (mounted.get(host) === destroy) mounted.delete(host);
  };
  mounted.set(host, destroy);
  return destroy;
}
