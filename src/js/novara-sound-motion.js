import '../styles/novara-sound-motion.css';

let waveId = 0;

// A small, self-contained motion treatment. The film player and the site's
// colour canvas remain owned by their existing modules.
export function mountNovaraSoundMotion(section) {
  const title = section.querySelector('.nc-title');
  const play = section.querySelector('.nc-sound-play');
  const description = section.querySelector('.nc-description');
  const details = section.querySelector('.nc-session');
  const originalTitle = [...title.childNodes];
  const controller = new AbortController();
  const { signal } = controller;
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;

  title.replaceChildren();
  ['Picture it.', 'Now hear it.'].forEach(text => {
    const line = document.createElement('span');
    line.className = 'nc-sound-line';
    const textNode = document.createElement('span');
    textNode.className = 'nc-sound-line-text';
    textNode.textContent = text;
    line.append(textNode);
    title.append(line);
  });

  const wave = document.createElement('div');
  wave.className = 'nc-sound-wave';
  wave.setAttribute('aria-hidden', 'true');
  const gradientId = `nc-wave-colour-${++waveId}`;
  // An illustrative waveform, not a live audio meter. No sound autoplays.
  const bars = Array.from({ length: 76 }, (_, i) => {
    const t = i / 75;
    const envelope = .2 + .8 * Math.sin(Math.PI * t) ** .7;
    const detail = .2 + .8 * Math.abs(Math.sin(i * 1.73) * Math.cos(i * .39));
    const height = 3 + 49 * envelope * detail;
    return `<rect class="nc-wave-bar" x="${i * 5.25}" y="${(56 - height) / 2}" width="2.5" height="${height}" rx="1.25"/>`;
  }).join('');
  wave.innerHTML = `<div class="nc-wave-scope">
    <svg viewBox="0 0 400 56" preserveAspectRatio="none" focusable="false">
      <defs><linearGradient id="${gradientId}"><stop offset="0" stop-color="#426b71"/><stop offset=".56" stop-color="#426b71"/><stop offset="1" stop-color="#b17b43"/></linearGradient></defs>
      <path class="nc-wave-baseline" d="M0 28H400"/>
      <g fill="url(#${gradientId})">${bars}</g>
    </svg>
    <i class="nc-wave-head"></i>
  </div>
  <div class="nc-wave-layers">${['Foley', 'Effects', 'Atmosphere', 'Music'].map((name, i) => `<span class="nc-wave-layer"><i></i><span>${name}</span><em>0${i + 1}</em></span>`).join('')}</div>`;
  description.after(wave);
  section.classList.add('nc-sound-scene');

  let media = null;
  if (gsap && ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const lines = title.querySelectorAll('.nc-sound-line-text');
      const waveBars = wave.querySelectorAll('.nc-wave-bar');
      const layers = wave.querySelectorAll('.nc-wave-layer');
      const head = wave.querySelector('.nc-wave-head');
      let hover = null, panel = null;
      const entrance = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } });
      entrance
        .fromTo(play, { clipPath: 'inset(24% 6% 24% 6% round 28px)', y: 35, scale: .96 },
          { clipPath: 'inset(0% 0% 0% 0% round 28px)', y: 0, scale: 1, duration: 1.15, clearProps: 'clipPath,transform' }, 0)
        .from(section.querySelector('.nc-sound-copy > .nc-label'), { y: 12, opacity: 0, duration: .6 }, .08)
        .fromTo(lines, { yPercent: 115 }, { yPercent: 0, duration: .85, stagger: .16 }, .12)
        .from(description, { y: 12, opacity: 0, duration: .7 }, .45)
        .fromTo(waveBars, { scaleY: .06, opacity: .25, svgOrigin: '0 28' },
          { scaleY: 1, opacity: 1, duration: .7, stagger: .008, ease: 'back.out(1.4)' }, .65)
        .from(layers, { opacity: 0, y: 8, duration: .45, stagger: .15 }, .85)
        .fromTo(wave.querySelectorAll('.nc-wave-layer > i'), { scaleX: 0 },
          { scaleX: 1, duration: .65, stagger: .15, transformOrigin: 'left center' }, .85)
        .from(details, { opacity: 0, y: 10, duration: .65 }, .65)
        .from(section.querySelector('.nc-sound-credit'), { opacity: 0, duration: .6 }, .7)
        .fromTo(head, { left: '0%', opacity: 0 }, { opacity: .7, duration: .2 }, 1.1)
        .to(head, { left: '100%', duration: 1.6, ease: 'none' }, 1.1)
        .to(head, { opacity: 0, duration: .25 }, 2.55);

      // A one-shot sequence, with ordinary page scrolling and no new pin space.
      const reveal = ScrollTrigger.create({
        trigger: section,
        start: 'top 82%',
        once: true,
        onEnter: () => entrance.play(),
        onLeave: () => entrance.progress(1),
      });
      function finishEntrance() { entrance.progress(1); }
      function pulse() {
        if (entrance.progress() < 1 || document.hidden || signal.aborted) return;
        hover?.kill();
        gsap.set(waveBars, { scaleY: 1 });
        hover = gsap.timeline();
        hover.to(waveBars, {
          scaleY: i => 1.1 + .35 * Math.abs(Math.sin(i * .8)),
          svgOrigin: '0 28', duration: .22, repeat: 1, yoyo: true,
          stagger: { each: .006, from: 'center' }, ease: 'sine.inOut',
        });
      }
      function openSession() {
        if (!details.open) return;
        panel?.progress(1).kill();
        panel = gsap.fromTo(details.querySelectorAll('.nc-session-image, .nc-process li, .nc-audio-proof'),
          { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: .5, stagger: .07, clearProps: 'transform,opacity', ease: 'power2.out' });
      }
      section.addEventListener('focusin', finishEntrance, { signal });
      play.addEventListener('pointerenter', pulse, { signal });
      play.addEventListener('focus', pulse, { signal });
      details.addEventListener('toggle', openSession, { signal });
      return () => {
        reveal.kill(); entrance.kill(); hover?.progress(1).kill(); panel?.progress(1).kill();
        section.removeEventListener('focusin', finishEntrance);
        play.removeEventListener('pointerenter', pulse);
        play.removeEventListener('focus', pulse);
        details.removeEventListener('toggle', openSession);
      };
    }, section);
  }

  return () => {
    controller.abort();
    media?.revert();
    wave.remove();
    title.replaceChildren(...originalTitle);
    section.classList.remove('nc-sound-scene');
  };
}
