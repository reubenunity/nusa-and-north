import { testimonials } from './novara-feedback-data.js';
import { buildOrbitDeck } from './vendor/novara-orbit-deck.js';

/** HorizonX Orbit Deck, with the supplied client quotes alongside real film stills. */
export function mountNovaraFeedback(host) {
  if (!host) return () => {};
  const saved = host.innerHTML;
  host.classList.add('novara-feedback');
  host.innerHTML = `
    <div class="mono label">· In good company / Client feedback</div>
    <div class="nf-layout">
      <div class="nf-visual">
        <div class="nf-deck od-root" tabindex="0" role="region" aria-roledescription="carousel" aria-label="Client project photographs. Drag or use arrow keys." data-draggable>
          <div class="od-stage"><div class="od-scene"></div></div>
          <span class="od-live nf-sr" aria-live="polite"></span>
        </div>
        <div class="nf-navigation"><span class="mono nf-hint">Drag to explore</span><div class="nf-dots"></div></div>
      </div>
      <div class="nf-copy">
        <div class="mono nf-count">01 / 04</div>
        <div class="nf-panels" id="novara-quotes"></div>
        <div class="nf-arrows">
          <button type="button" aria-label="Previous testimonial" aria-controls="novara-quotes">←</button>
          <button type="button" aria-label="Next testimonial" aria-controls="novara-quotes">→</button>
        </div>
        <p class="nf-announcement nf-sr" role="status" aria-live="polite" aria-atomic="true"></p>
      </div>
    </div>`;
  const scene = host.querySelector('.od-scene');
  const panels = host.querySelector('.nf-panels');
  const dots = host.querySelector('.nf-dots');
  const controller = new AbortController();
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let animation;
  testimonials.forEach((entry, i) => {
    const card = document.createElement('div');
    card.className = 'od-card';
    card.dataset.odSlide = i;
    card.dataset.odName = entry.organisation;
    const img = document.createElement('img');
    Object.assign(img, { src: entry.image, alt: entry.alt, loading: 'lazy', decoding: 'async', draggable: false, width: 1600, height: 900 });
    img.style.objectPosition = entry.position;
    img.style.setProperty('--nf-scale', entry.scale);
    const caption = document.createElement('span');
    caption.textContent = entry.location;
    card.append(img, caption);
    scene.append(card);
    const panel = document.createElement('div');
    panel.className = 'nf-panel';
    panel.innerHTML = '<blockquote></blockquote><div class="nf-person"></div><div class="nf-role"></div><div class="mono nf-brand"></div><p class="nf-context"></p>';
    panel.querySelector('blockquote').textContent = `“${entry.quote}”`;
    panel.querySelector('.nf-person').textContent = entry.name;
    panel.querySelector('.nf-role').textContent = entry.role;
    panel.querySelector('.nf-brand').textContent = entry.organisation;
    panel.querySelector('.nf-context').textContent = entry.context;
    panel.querySelector('.nf-context').hidden = !entry.context;
    panel.hidden = i !== 0;
    panels.append(panel);
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.setAttribute('aria-label', `Testimonial ${i+1}: ${entry.organisation}`);
    dot.setAttribute('aria-controls', 'novara-quotes');
    dot.setAttribute('aria-pressed', String(i === 0));
    dots.append(dot);
  });
  function show(i) {
    host.dataset.feedbackIndex = i;
    panels.querySelectorAll('.nf-panel').forEach((panel, n) => { panel.hidden = n !== i; });
    dots.querySelectorAll('button').forEach((button, n) => button.setAttribute('aria-pressed', String(i === n)));
    host.querySelector('.nf-count').textContent = `${String(i+1).padStart(2,'0')} / 04`;
    const entry = testimonials[i];
    host.querySelector('.nf-announcement').textContent = `${entry.name}, ${entry.organisation}. ${entry.quote} ${entry.context}`;
    animation?.cancel();
    if (!reduce.matches) animation = panels.children[i].animate([{opacity:0,transform:'translateY(6px)'},{opacity:1,transform:'none'}], {duration:240,easing:'ease-out'});
  }
  const deck = buildOrbitDeck(host.querySelector('.nf-deck'), { zoom: 112, spin: 0, autoplay: 0, intro: true, draggable: true, onChange: show });
  host.dataset.feedbackIndex = '0';
  host.querySelector('[aria-label="Previous testimonial"]').addEventListener('click', () => deck.go(deck.active - 1), {signal:controller.signal});
  host.querySelector('[aria-label="Next testimonial"]').addEventListener('click', () => deck.go(deck.active + 1), {signal:controller.signal});
  [...dots.children].forEach((dot, i) => dot.addEventListener('click', () => deck.go(i), {signal:controller.signal}));
  // A horizontal pad gesture can turn the deck; vertical page scroll stays native.
  let wheelAt = 0;
  host.querySelector('.nf-deck').addEventListener('wheel', event => {
    if (Math.abs(event.deltaX) < Math.abs(event.deltaY) || Math.abs(event.deltaX) < 8) return;
    event.preventDefault();
    if (performance.now() - wheelAt < 1050) return;
    wheelAt = performance.now();
    deck.go(deck.active + Math.sign(event.deltaX));
  }, {passive:false,signal:controller.signal});
  const observer = new IntersectionObserver(entries => {
    if (!entries.some(e => e.isIntersecting)) return;
    scene.querySelectorAll('img').forEach(img => img.loading='eager');
    observer.disconnect();
  }, {rootMargin:'300px'});
  observer.observe(host);
  return () => { controller.abort(); observer.disconnect(); animation?.cancel(); deck.destroy(); host.innerHTML=saved; host.classList.remove('novara-feedback'); delete host.dataset.feedbackIndex; };
}
