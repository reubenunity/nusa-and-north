
// Original HorizonX code. Visual inspiration: https://saurow-reel.vercel.app
// Default artwork generated for HorizonX. HorizonX Tools License.
// Fit the complete curved frame, rather than only its flat middle, inside
// the existing stage. This runs on resize; the Horizon drawing stays intact.
export function getReelCardWidth(width, height, config) {
  const requested = Math.min(
    width * (width < 600 ? Math.max(.819999, config.cardWidth / 100) : config.cardWidth / 100),
    height * .719999 * config.aspect,
  );
  const waveLimit = height * .07 * Math.abs(config.wave);
  const rimClearance = Math.min(18, Math.max(10, height * .03));
  const edges = config.flare > 0 || config.smear > 0 || config.fringe > 0;
  const fits = (candidate) => {
    const cardHeight = candidate / config.aspect;
    const zone = edges ? Math.max(1, Math.min(width * config.edgeZone / 100, Math.max(width * .08, (width - candidate - config.gap) / 2))) : 0;
    const growth = config.flare * .9 * Math.min(1, zone / Math.max(.001, cardHeight * .499999));
    const halfHeight = cardHeight * (1 + growth) / 2;
    // The size oscillation is a cosine and the displacement a sine. Their
    // combined maximum is the hypotenuse, including the outer colour rim.
    const excursion = Math.hypot(halfHeight * waveLimit / height * .149999, waveLimit);
    return halfHeight + excursion + rimClearance <= height / 2;
  };
  if (fits(requested)) return requested;
  let low = 0, high = requested;
  for (let step = 0; step < 24; step++) {
    const candidate = (low + high) / 2;
    if (fits(candidate)) low = candidate;
    else high = candidate;
  }
  return Math.max(1, low);
}

// Resolve a point against the same warped strip coordinates used to paint it.
// Gaps and empty space above/below the curved frame deliberately return null.
export function hitTestReelFrame(x, y, geometry) {
  if (!geometry) return null;
  const { width, height, card, cardHeight, stride, origin, zone, smear, growth, wave, position, frequency, count, stripAll } = geometry;
  if (x < 0 || x >= width || y < 0 || y >= height || !count) return null;
  const striped = stripAll || x < zone || x >= width - zone;
  let u = x;
  if (striped && zone) {
    if (x < zone) u += smear * (zone - x) ** 3 / (3 * zone * zone);
    else if (x > width - zone) u -= smear * (x - width + zone) ** 3 / (3 * zone * zone);
  }
  const slot = Math.floor((u - origin) / stride);
  const local = u - origin - slot * stride;
  if (local < 0 || local >= card) return null;
  let h = cardHeight, top = (height - h) / 2;
  if (striped) {
    const distance = zone ? Math.max(0, (zone - Math.min(x, width - x)) / zone) : 0;
    const k = distance * distance;
    const phase = x / width * Math.PI * 2 * frequency + position / width * 1.50001;
    h *= (1 + k * growth) * (1 + Math.cos(phase) * Math.abs(wave) / height * .149999);
    top = (height - h) / 2 + Math.sin(phase) * wave;
  }
  if (y < top || y > top + h) return null;
  return ((slot % count) + count) % count;
}

/** Original HorizonX strip-sampling renderer. No third-party shader or engine. */
export function createReelFlux(root, initial) {
  const canvas = root.querySelector('.rf-canvas'), ctx = canvas.getContext('2d');
  const live = root.querySelector('.rf-live'), fallback = root.querySelector('.rf-fallback');
  let config = initial, width = 1, height = 1, card = 1, stride = 1;
  let images = [], sources = [], position = 0, target = 0, last = 0, frame = 0;
  let wave = 0, dragging = null, destroyed = false, visible = true, active = -1;
  let hitGeometry = null, pressed = null, hoverPoint = null;
  const listeners = [], motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mod = (n, d) => ((n % d) + d) % d;
  const listen = (el, type, fn, options) => { el.addEventListener(type, fn, options); listeners.push(() => el.removeEventListener(type, fn, options)); };
  const fallbackImages = (urls) => fallback.replaceChildren(...urls.map((src, i) => {
    const image = document.createElement('img'); image.src = src; image.alt = config.titles?.[i] || `Photo ${i + 1}`; image.draggable = false;
    if (!config.links?.[i]) { image.setAttribute('role', 'listitem'); return image; }
    const link = document.createElement('a'); link.className = 'rf-fallback-project'; link.href = config.links[i]; link.setAttribute('aria-label', `View project: ${config.titles[i]}`); link.append(image); return link;
  }));
  if (!ctx) {
    fallbackImages(config.images);
    const scroll = (direction) => fallback.scrollBy({ left: direction * root.clientWidth * .600001, behavior: motion.matches ? 'instant' : 'smooth' });
    const itemStride = () => (fallback.firstElementChild?.getBoundingClientRect().width || root.clientWidth * .32) + config.gap;
    listen(fallback, 'scroll', () => config.onChange?.(Math.max(0, Math.min(config.images.length - 1, Math.round(fallback.scrollLeft / itemStride())))), { passive: true });
    listen((config.previousButton || root.querySelector('.rf-prev')), 'click', () => scroll(-1));
    listen((config.nextButton || root.querySelector('.rf-next')), 'click', () => scroll(1));
    listen(root, 'keydown', (event) => {
      if (event.target === root && ['ArrowLeft', 'ArrowRight'].includes(event.key)) { event.preventDefault(); scroll(event.key === 'ArrowRight' ? 1 : -1); }
    });
    return {
      update(next) { config = next; fallbackImages(next.images); },
      step: scroll,
      goTo(index, { instant = false } = {}) {
        fallback.scrollTo({ left: index * itemStride(), behavior: instant || motion.matches ? 'instant' : 'smooth' });
        config.onChange?.(index);
      },
      destroy() { listeners.forEach((remove) => remove()); }
    };
  }
  const running = () => visible && !document.hidden && !destroyed;
  function pick(clientX, clientY) {
    const rect = root.getBoundingClientRect();
    const index = hitTestReelFrame((clientX - rect.left) * width / rect.width, (clientY - rect.top) * height / rect.height, hitGeometry);
    const image = index === null ? null : images[index];
    return image?.complete && image.naturalWidth ? index : null;
  }
  function updateHover() {
    const index = hoverPoint ? pick(hoverPoint.x, hoverPoint.y) : null;
    const clickable = index !== null && Boolean(config.links?.[index]);
    root.toggleAttribute('data-over-film', clickable);
    root.title = clickable ? `View project: ${config.titles?.[index] || `Film ${index + 1}`}` : '';
  }
  function wake() { if (!frame && running()) { last = performance.now(); frame = requestAnimationFrame(draw); } }
  function resize() {
    const rect = root.getBoundingClientRect(); width = Math.max(1, rect.width); height = Math.max(1, rect.height);
    const oldStride = stride;
    card = getReelCardWidth(width, height, config);
    stride = card + config.gap; position *= stride / oldStride; target *= stride / oldStride;
    // A resize can shrink the stage while the previous wave is still easing.
    const waveLimit = height * .07 * Math.abs(config.wave);
    wave = Math.max(-waveLimit, Math.min(waveLimit, wave));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.ceil(width * dpr); canvas.height = Math.ceil(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); wake();
  }
  function setImages() {
    if (JSON.stringify(sources) === JSON.stringify(config.images)) return;
    for (const image of images) { image.onload = null; image.onerror = null; }
    sources = [...config.images]; root.removeAttribute('data-ready'); fallbackImages(sources);
    images = sources.map((src) => {
      const image = new Image(); image.decoding = 'async';
      image.onload = image.onerror = () => { if (!destroyed) wake(); };
      image.src = src; return image;
    });
    position = mod(position / stride, images.length) * stride; target = position; active = -1;
  }
  function announce() {
    const next = mod(Math.round(position / stride), images.length);
    if (next !== active) { active = next; if (!config.preview) live.textContent = config.titles?.[next] ? `${config.titles[next]}, film ${next + 1} of ${images.length}` : `Photo ${next + 1} of ${images.length}`; }
  }
  function draw(now) {
    frame = 0; if (!running()) return;
    const dt = Math.min((now - last) / 1000, .0499999); last = now;
    if (!motion.matches && !dragging) target += config.autoplay * dt;
    const old = position;
    position += (target - position) * (motion.matches ? 1 : 1 - Math.exp(-config.smoothing * dt));
    const velocity = (position - old) / Math.max(dt, .001);
    const amplitude = motion.matches ? 0 : Math.max(-1, Math.min(1, velocity / 1800)) * height * .07 * config.wave;
    wave += (amplitude - wave) * (1 - Math.exp(-10 * dt)); if (motion.matches) wave = 0;
    const loop = images.length * stride;
    // Rebase to keep long-running autoplay precise without changing the picture.
    if (Math.abs(position) > loop * 50) { const cycles = Math.trunc(position / loop) * loop; position -= cycles; target -= cycles; }
    ctx.clearRect(0, 0, width, height);
    const cardHeight = card / config.aspect, origin = width / 2 - card / 2 - position;
    // Edge zones: cards flare taller, stretch into streaks and pick up a colour
    // rim as they enter and leave the stage. Layout runs in a warped space whose
    // slope 1 - smear * k shrinks toward each side, so the picture is stretched
    // there and moves faster on screen; inside the zones the warp is identity.
    const edges = config.flare > 0 || config.smear > 0 || config.fringe > 0;
    // The zone stops at the resting centre card, which stays flat like Fold
    // Carousel's; on a narrow stage only the neighbours flare.
    const zone = edges ? Math.max(1, Math.min(width * config.edgeZone / 100, Math.max(width * .08, (width - card - config.gap) / 2))) : 0;
    const smear = Math.min(.899999, config.smear), stripAll = Math.abs(wave) >= .100001;
    // A narrow zone gets a gentler flare and finer strips, so the curve cannot
    // climb in visible steps.
    const growth = config.flare * .9 * Math.min(1, zone / (cardHeight * .499999)), pitch = zone < 120 ? 1 : 2;
    hitGeometry = { width, height, card, cardHeight, stride, origin, zone, smear, growth, wave, position, frequency: config.frequency, count: images.length, stripAll };
    const bell = (x) => { const k = Math.max(0, (zone - Math.min(x, width - x)) / zone); return zone ? k * k : 0; };
    const warp = (x) => {
      if (x < zone) return x + smear * (zone - x) ** 3 / (3 * zone * zone);
      if (x > width - zone) return x - smear * (x - width + zone) ** 3 / (3 * zone * zone);
      return x;
    };
    const ready = (image) => image && image.complete && image.naturalWidth;
    const rims = []; let rim = null;
    let painted = false;
    if (!stripAll && width > 2 * zone) {
      // Rest frames need one call per card between the zones.
      ctx.save(); ctx.beginPath(); ctx.rect(zone, 0, width - 2 * zone, height); ctx.clip();
      const first = Math.floor((zone - origin) / stride) - 1, last = Math.ceil((width - zone - origin) / stride) + 1;
      for (let slot = first; slot <= last; slot++) {
        const image = images[mod(slot, images.length)]; if (!ready(image)) continue;
        const left = origin + slot * stride; if (left > width - zone || left + card < zone) continue;
        const scale = Math.max(card / image.naturalWidth, cardHeight / image.naturalHeight);
        const sw = card / scale, sh = cardHeight / scale;
        ctx.drawImage(image, (image.naturalWidth - sw) / 2, (image.naturalHeight - sh) / 2, sw, sh, left, (height - cardHeight) / 2, card, cardHeight);
        painted = true;
      }
      ctx.restore();
    }
    const strip = (from, to) => {
      for (let screenX = from; screenX < to; screenX += pitch) {
        const slice = Math.min(pitch + .499999, width - screenX), u = warp(screenX), k = bell(screenX);
        const slot = Math.floor((u - origin) / stride), x = u - origin - slot * stride;
        if (x >= card) { rim = null; continue; }
        const image = images[mod(slot, images.length)]; if (!ready(image)) { rim = null; continue; }
        const scale = Math.max(card / image.naturalWidth, cardHeight / image.naturalHeight);
        const sw = card / scale, sh = cardHeight / scale, sx = (image.naturalWidth - sw) / 2, sy = (image.naturalHeight - sh) / 2;
        const phase = screenX / width * Math.PI * 2 * config.frequency + position / width * 1.50001;
        const h = cardHeight * (1 + k * growth) * (1 + Math.cos(phase) * Math.abs(wave) / height * .149999);
        const y = (height - h) / 2 + Math.sin(phase) * wave;
        const source = Math.max(.0200001, Math.min(card - x, slice * (1 - smear * k))) / scale;
        ctx.drawImage(image, sx + x / scale, sy, source, sh, screenX, y, slice, h);
        if (config.fringe > 0 && k > 0) {
          if (!rim || rim.slot !== slot) rims.push(rim = { slot, points: [] });
          rim.points.push(screenX + slice / 2, y, y + h);
        }
        painted = true;
      }
      rim = null;
    };
    if (stripAll || width <= 2 * zone) strip(0, width);
    else { strip(0, zone); strip(Math.floor((width - zone) / 2) * 2, width); }
    // Spectral rim along the flared top and bottom edges, a cool outer line and
    // a warm inner one, faded in across each zone so it never steps per strip.
    if (rims.length) {
      const fade = (rgb) => {
        const make = (from, to) => {
          const g = ctx.createLinearGradient(from, 0, to, 0);
          g.addColorStop(0, `rgba(${rgb},0)`); g.addColorStop(.35, `rgba(${rgb},${config.fringe * .5})`); g.addColorStop(1, `rgba(${rgb},${config.fringe})`);
          return g;
        };
        return [make(zone, 0), make(width - zone, width)];
      };
      const line = (points, offset, side) => {
        ctx.beginPath();
        for (let i = 0; i < points.length; i += 3) ctx.lineTo(points[i], points[i + side] + (side === 1 ? -offset : offset));
        ctx.stroke();
      };
      ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      for (const [rgb, thickness, offset] of [['79,168,255', 3, 1.50001], ['255,179,71', 2, -1]]) {
        const [left, right] = fade(rgb); ctx.lineWidth = thickness;
        for (const { points } of rims) {
          if (points.length < 6) continue;
          ctx.strokeStyle = points[0] < zone + 2 ? left : right;
          line(points, offset, 1); line(points, offset, 2);
        }
      }
      ctx.restore();
    }
    config.onChange?.(mod(Math.round(position / stride), images.length));
    if (!dragging) updateHover();
    root.toggleAttribute('data-ready', painted);
    if (Math.abs(target - position) < .5 && !dragging) announce();
    if (dragging || Math.abs(target - position) > .0499999 || Math.abs(wave) > .0500001 || (!motion.matches && config.autoplay > 0)) wake();
  }
  function step(direction) { target = (Math.round(target / stride) + direction) * stride; wake(); }
  listen(root, 'wheel', (event) => {
    if (config.preview || config.wheel === 'off') return;
    const delta = config.wheel === 'horizontal' ? event.deltaX : Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    if (!delta) return; event.preventDefault();
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? width : 1;
    target += Math.max(-width * 2, Math.min(width * 2, delta * unit * config.sensitivity)); wake();
  }, { passive: false });
  listen(root, 'pointerdown', (event) => {
    pressed = null;
    if (config.preview || event.button !== 0 || event.target.closest('button,a,select')) return;
    const index = pick(event.clientX, event.clientY);
    if (index !== null && config.links?.[index]) {
      pressed = { id: event.pointerId, x: event.clientX, y: event.clientY, index, moved: false, threshold: event.pointerType === 'touch' ? 10 : 8 };
    }
    if (!config.draggable) return;
    // Grabbing stops residual inertia so a click stays on the image pressed.
    target = position;
    dragging = { id: event.pointerId, x: event.clientX, y: event.clientY, target, horizontal: event.pointerType !== 'touch' };
    if (dragging.horizontal) { root.setPointerCapture(event.pointerId); root.toggleAttribute('data-dragging', true); }
  });
  listen(root, 'pointermove', (event) => {
    if (pressed && event.pointerId === pressed.id && Math.hypot(event.clientX - pressed.x, event.clientY - pressed.y) > pressed.threshold) pressed.moved = true;
    if (event.pointerType !== 'touch') {
      hoverPoint = event.target.closest('button,a,select') ? null : { x: event.clientX, y: event.clientY };
      if (!dragging) updateHover();
    }
    if (!dragging || event.pointerId !== dragging.id) return;
    const dx = event.clientX - dragging.x, dy = event.clientY - dragging.y;
    if (!dragging.horizontal) {
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) { dragging = null; return; }
      if (Math.abs(dx) < 8) return;
      dragging.horizontal = true; root.setPointerCapture(event.pointerId); root.toggleAttribute('data-dragging', true);
    }
    target = dragging.target - dx * config.sensitivity; wake();
  });
  function release(event) {
    const click = pressed && event.pointerId === pressed.id && event.type === 'pointerup' && !pressed.moved && Math.hypot(event.clientX - pressed.x, event.clientY - pressed.y) <= pressed.threshold ? pressed : null;
    if (pressed?.id === event.pointerId) pressed = null;
    if (dragging && event.pointerId === dragging.id) {
      dragging = null; root.removeAttribute('data-dragging');
      if (root.hasPointerCapture(event.pointerId)) root.releasePointerCapture(event.pointerId); wake();
    }
    if (click) {
      const href = config.links[click.index];
      if (event.metaKey || event.ctrlKey || event.shiftKey) window.open(href, '_blank', 'noopener');
      else window.location.assign(href);
    }
  }
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) listen(root, type, release);
  listen(root, 'pointerleave', () => { hoverPoint = null; updateHover(); });
  listen(root, 'contextmenu', () => { pressed = null; });
  listen(root, 'keydown', (event) => {
    if (event.target !== root || config.preview) return;
    if (['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      if (event.key === 'Home') target = 0;
      else if (event.key === 'End') target = (images.length - 1) * stride;
      else step(event.key === 'ArrowRight' ? 1 : -1); wake();
    }
  });
  listen((config.previousButton || root.querySelector('.rf-prev')), 'click', () => step(-1));
  listen((config.nextButton || root.querySelector('.rf-next')), 'click', () => step(1));
  listen(motion, 'change', wake);
  listen(document, 'visibilitychange', () => { if (document.hidden) { cancelAnimationFrame(frame); frame = 0; } else wake(); });
  const observer = new ResizeObserver(resize); observer.observe(root);
  const intersection = new IntersectionObserver((entries) => {
    visible = entries.some((entry) => entry.isIntersecting);
    if (visible) wake(); else { cancelAnimationFrame(frame); frame = 0; }
  }); intersection.observe(root);
  function update(next) {
    config = next; root.toggleAttribute('data-draggable', config.draggable && !config.preview);
    root.toggleAttribute('data-preview', config.preview); root.tabIndex = config.preview ? -1 : 0;
    if (!config.draggable && dragging) { const id = dragging.id; dragging = null; root.removeAttribute('data-dragging'); if (root.hasPointerCapture(id)) root.releasePointerCapture(id); }
    setImages(); resize(); wake();
  }
  update(initial);
  return { update, step,
    goTo(index, { instant = false } = {}) {
      const next = mod(index, images.length);
      const cycle = Math.round((target / stride - next) / images.length);
      target = (next + cycle * images.length) * stride;
      if (instant) position = target;
      config.onChange?.(next); wake();
    },
    destroy() {
    destroyed = true; cancelAnimationFrame(frame); observer.disconnect(); intersection.disconnect(); listeners.forEach((remove) => remove());
    pressed = null; hoverPoint = null; root.removeAttribute('data-over-film'); root.removeAttribute('title');
    if (dragging && root.hasPointerCapture(dragging.id)) root.releasePointerCapture(dragging.id);
    images.forEach((image) => { image.onload = null; image.onerror = null; }); canvas.width = 1; canvas.height = 1;
  } };
}

