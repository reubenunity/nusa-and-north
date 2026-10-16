import '../styles/novara-dusk.css';

// An opt-in colour study. The public homepage keeps its approved light theme.
export function mountNovaraDusk() {
  const request = new URLSearchParams(location.search).get('atmosphere');
  if (!['dusk', 'light'].includes(request)) return () => {};
  const body = document.body;
  const controller = new AbortController();
  const { signal } = controller;
  const surfaces = [...document.querySelectorAll('.works-intro, .works-h, .nc-sound, .nc-social, .values, .about, .novara-board, .novara-feedback, .cta, .footer')];
  const field = document.createElement('div');
  field.className = 'novara-dusk-field';
  field.setAttribute('aria-hidden', 'true');
  body.querySelector('.novara-shader-r').after(field);
  // Seeded, irregular stars: fixed-pixel strokes keep them delicate on mobile.
  let seed = 260716;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  field.innerHTML = `<svg class="novara-dusk-stars" viewBox="0 0 1440 1800" preserveAspectRatio="none" aria-hidden="true" focusable="false">
    ${Array.from({ length: 290 }, (_, i) => {
      const x = 12 + random() * 1416, y = random() * 1800;
      const bright = i % 15 === 0;
      const size = bright ? 2.4 : .9 + random() * .9;
      const opacity = bright ? .9 : .32 + random() * .42;
      const twinkle = i % 9 === 0;
      return `<path class="nd-star${bright ? ' nd-star-glow' : ''}${twinkle ? ' nd-star-twinkle' : ''}" d="M${x.toFixed(2)} ${y.toFixed(2)}h.01" fill="none" stroke="${i % 5 === 0 ? '#e9c5a2' : '#dcebf4'}" stroke-opacity="${opacity.toFixed(2)}" stroke-width="${size.toFixed(2)}" stroke-linecap="round" vector-effect="non-scaling-stroke" style="--twinkle-duration:${(4 + random() * 4).toFixed(2)}s;--twinkle-delay:-${(random() * 8).toFixed(2)}s"/>`;
    }).join('')}
  </svg>`;
  // A static, feathered cloud texture above the night sky. It belongs only to
  // the decorative field, so photographs, film and readable text stay clear.
  field.insertAdjacentHTML('afterbegin', `<svg class="novara-dusk-clouds" viewBox="0 0 1440 1100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
    <defs>
      <filter id="novara-cloud-wisps" x="-15%" y="-20%" width="130%" height="140%" color-interpolation-filters="sRGB">
        <feGaussianBlur in="SourceGraphic" stdDeviation="22" result="banks"/>
        <feTurbulence type="fractalNoise" baseFrequency=".006 .014" numOctaves="2" seed="17" result="texture"/>
        <feColorMatrix in="texture" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 3.4 0 -1.3" result="wisps"/>
        <feComposite in="wisps" in2="banks" operator="in"/>
        <feGaussianBlur stdDeviation="1.5"/>
      </filter>
    </defs>
    <g fill="#fff" filter="url(#novara-cloud-wisps)">
      <ellipse cx="90" cy="180" rx="400" ry="65"/>
      <ellipse cx="360" cy="150" rx="220" ry="75"/>
      <ellipse cx="630" cy="205" rx="300" ry="40"/>
      <ellipse cx="1390" cy="380" rx="390" ry="95"/>
      <ellipse cx="1120" cy="345" rx="240" ry="65"/>
      <ellipse cx="850" cy="420" rx="330" ry="38"/>
      <ellipse cx="140" cy="690" rx="420" ry="80"/>
      <ellipse cx="480" cy="655" rx="265" ry="58"/>
      <ellipse cx="780" cy="730" rx="310" ry="30"/>
    </g>
  </svg>`);
  const stars = field.querySelector('.novara-dusk-stars');
  let starsVisible = false;
  const syncStars = () => stars.classList.toggle('is-visible', starsVisible && !document.hidden);
  const starObserver = new IntersectionObserver(entries => { starsVisible = entries[0].isIntersecting; syncStars(); });
  starObserver.observe(stars);
  document.addEventListener('visibilitychange', syncStars, { signal });
  const controls = document.createElement('div');
  controls.className = 'novara-dusk-preview';
  controls.setAttribute('role', 'group');
  controls.setAttribute('aria-label', 'Compare background previews');
  controls.innerHTML = '<button type="button" data-atmosphere="light">Original</button><button type="button" data-atmosphere="dusk">Light → dark</button>';
  body.append(controls);
  surfaces.forEach(element => element.classList.add('dusk-surface'));
  let frame = 0, enabled = false, valuesMotion = null;
  // Match the alpha stops on the single full-document CSS gradient.
  const stops = [[0, 0], [.08, 0], [.3, .2], [.5, .502], [.7, .82], [1, .976]];
  const opacityAt = progress => {
    for (let i = 1; i < stops.length; i++) {
      if (progress <= stops[i][0]) {
        const [x, y] = stops[i - 1], [nextX, nextY] = stops[i];
        return y + (nextY - y) * (progress - x) / (nextX - x);
      }
    }
    return .976;
  };
  function update() {
    frame = 0;
    if (!enabled) return;
    const fieldRect = field.getBoundingClientRect();
    for (const surface of surfaces) {
      const rect = surface.getBoundingClientRect();
      // Pinned scenes follow the background beneath their visible content.
      const visibleCenter = (Math.max(0, rect.top) + Math.min(innerHeight, rect.bottom)) / 2;
      const point = rect.bottom > 0 && rect.top < innerHeight ? visibleCenter : rect.top + rect.height / 2;
      const progress = Math.max(0, Math.min(1, (point - fieldRect.top) / fieldRect.height));
      const ink = opacityAt(progress) > .43 ? 'light' : 'dark';
      if (surface.dataset.duskInk !== ink) surface.dataset.duskInk = ink;
    }
  }
  function queue() { if (!frame && enabled) frame = requestAnimationFrame(update); }
  function setMode(mode, updateURL = false) {
    cancelAnimationFrame(frame); frame = 0;
    enabled = mode === 'dusk';
    body.classList.toggle('novara-dusk', enabled);
    controls.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.atmosphere === mode)));
    valuesMotion?.revert();
    valuesMotion = null;
    // Preserve the word-by-word reveal while its foreground adapts to dusk.
    if (enabled && window.gsap && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      valuesMotion = window.gsap.context(() => {
        window.gsap.fromTo('#values-text .w', { opacity: .3 }, {
          opacity: 1, stagger: .06, ease: 'none',
          scrollTrigger: { trigger: '.values', start: 'top 72%', end: 'bottom 55%', scrub: true },
        });
      });
    }
    if (updateURL) {
      const url = new URL(location.href);
      url.searchParams.set('atmosphere', mode);
      history.replaceState(history.state, '', url);
    }
    update();
  }
  controls.addEventListener('click', event => {
    const button = event.target.closest('button[data-atmosphere]');
    if (button) setMode(button.dataset.atmosphere, true);
  }, { signal });
  window.addEventListener('scroll', queue, { signal, passive: true });
  window.addEventListener('resize', queue, { signal, passive: true });
  document.addEventListener('novara:layout', queue, { signal });
  const resize = new ResizeObserver(queue);
  resize.observe(body);
  setMode(request);
  return () => {
    controller.abort(); cancelAnimationFrame(frame); resize.disconnect(); starObserver.disconnect(); valuesMotion?.revert();
    surfaces.forEach(element => { element.classList.remove('dusk-surface'); delete element.dataset.duskInk; });
    field.remove(); controls.remove(); body.classList.remove('novara-dusk');
  };
}
