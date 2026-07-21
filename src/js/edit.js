import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { config } from '../config.js';
import { timecode } from './utils.js';
import { openLightbox } from './lightbox.js';

gsap.registerPlugin(ScrollTrigger);

// Build the A1 waveform blocks to mirror the V1 clips, and the ruler ticks.
// Idempotent — clears previous generated content first.
export function populateEditChrome() {
  applyClipStrips();
  const videoLane = document.querySelector('.js-video-lane');
  const audioLane = document.querySelector('.js-audio-lane');
  const ruler = document.querySelector('.js-ruler');

  audioLane.innerHTML = '';
  gsap.utils.toArray('.js-video-lane .clip').forEach((clip) => {
    const block = document.createElement('div');
    block.className = 'audio-block';
    block.style.setProperty('--clip-w', clip.style.getPropertyValue('--clip-w'));
    const bars = Math.round(parseFloat(clip.style.getPropertyValue('--clip-w')) * 3);
    for (let i = 0; i < bars; i++) {
      const bar = document.createElement('i');
      // pseudo-waveform: smooth-ish random heights
      const h = 0.15 + Math.abs(Math.sin(i * 0.7)) * 0.55 + Math.random() * 0.3;
      bar.style.setProperty('--h', Math.min(1, h).toFixed(2));
      block.appendChild(bar);
    }
    audioLane.appendChild(block);
  });

  // ruler ticks across the full lane width
  ruler.innerHTML = '';
  const inner = document.createElement('div');
  inner.className = 'edit__ruler-inner';
  inner.style.cssText = 'position:absolute;inset:0;will-change:transform;';
  const width = videoLane.scrollWidth;
  const step = 60;
  for (let x = 0; x <= width; x += step) {
    const major = (x / step) % 5 === 0;
    const tick = document.createElement('span');
    tick.className = `edit__ruler-tick${major ? ' edit__ruler-tick--major' : ''}`;
    tick.style.left = `${x}px`;
    inner.appendChild(tick);
    if (major) {
      const label = document.createElement('span');
      label.className = 'edit__ruler-label';
      label.style.left = `${x}px`;
      label.textContent = timecode(((x / width) * config.edit.sequenceSeconds) || 0).slice(3);
      inner.appendChild(label);
    }
  }
  ruler.appendChild(inner);
  return inner;
}

// Click a clip (or the monitor) to play that film in the lightbox.
// Everything is keyboard-operable: Tab to focus, Enter/Space to play.
function wirePlayback() {
  const activate = (el, getSrc, label) => {
    if (el.dataset.playWired) return;
    el.dataset.playWired = '1';
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-label', label);
    const play = () => {
      const src = getSrc();
      if (src) openLightbox(src, el);
    };
    el.addEventListener('click', play);
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        play();
      }
    });
  };

  gsap.utils.toArray('.js-video-lane .clip').forEach((clip) => {
    activate(clip, () => clip.dataset.videoSrc, `Play ${clip.dataset.title}`);
  });

  const monitor = document.querySelector('.js-monitor-media');
  if (monitor) {
    activate(
      monitor,
      () => document.querySelector('.clip.is-active')?.dataset.videoSrc,
      'Play the film currently under the playhead'
    );
  }
}

// The ambient glow is blurred to oblivion anyway — feed it a tiny
// image instead of the full frame, so the swap never spikes a frame.
function ambientSrc(poster) {
  return poster
    .replace(/_\d+x\d+/, '_320x180')
    .replace('maxresdefault', 'mqdefault');
}

// Filmstrip thumbnails inside the clips, like a real NLE — tiny
// repeated frames of each film (demo-gated with the rest).
function applyClipStrips() {
  if (!document.documentElement.classList.contains('show-proof')) return;
  document.querySelectorAll('.js-video-lane .clip').forEach((clip) => {
    if (!clip.dataset.poster || clip.dataset.stripped) return;
    clip.dataset.stripped = '1';
    clip.style.backgroundImage = `url("${ambientSrc(clip.dataset.poster)}")`;
  });
}

// Update the program monitor (title, filename, poster, room glow)
// for the given clip element. Cheap unless the clip actually changed.
function applyMonitor(clip) {
  const monitorTitle = document.querySelector('.js-monitor-title');
  const monitorClipname = document.querySelector('.js-monitor-clipname');
  const title = clip.dataset.title;
  if (monitorTitle.textContent === title) return;

  monitorTitle.textContent = title;
  monitorClipname.textContent = clip.querySelector('.clip__name').textContent;
  gsap.fromTo(monitorTitle, { opacity: 0.2 }, { opacity: 1, duration: 0.3 });

  const posterEl = document.querySelector('.js-monitor-poster');
  const ambientEl = document.querySelector('.js-monitor-ambient');
  const poster = clip.dataset.poster;

  // crossfade the room's color field to the new film (double buffer)
  const backdrop = document.querySelector('.js-edit-backdrop');
  if (backdrop && poster && document.documentElement.classList.contains('show-proof')) {
    const [a, b] = backdrop.querySelectorAll('img');
    const front = a.classList.contains('is-front') ? a : b;
    const back = front === a ? b : a;
    back.src = ambientSrc(poster);
    back.classList.add('is-front');
    front.classList.remove('is-front');
  }
  if (poster) {
    if (posterEl) {
      posterEl.src = poster;
      posterEl.classList.add('is-on');
    }
    if (ambientEl) {
      ambientEl.src = ambientSrc(poster);
      ambientEl.classList.add('is-on');
    }
  } else {
    posterEl?.classList.remove('is-on');
    ambientEl?.classList.remove('is-on');
  }
}

// "Project saved" toast pops occasionally while the edit is on
// screen — the room feels worked-in. Demo-gated with the strips.
export function wireAutosaveToast() {
  if (!document.documentElement.classList.contains('show-proof')) return () => {};
  const stage = document.querySelector('.edit__stage');
  if (!stage || stage.querySelector('.edit__toast')) return () => {};
  const toast = document.createElement('div');
  toast.className = 'edit__toast';
  stage.appendChild(toast);
  let n = 0;
  const iv = setInterval(() => {
    const r = stage.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) return; // off screen
    n += 1;
    const tc = document.querySelector('.js-edit-timecode')?.textContent || '00:00:00:00';
    toast.textContent = `PROJECT SAVED \u2713 v${14 + n} \u00b7 ${tc}`;
    toast.classList.add('is-on');
    setTimeout(() => toast.classList.remove('is-on'), 2400);
  }, 9000);
  return () => {
    clearInterval(iv);
    toast.remove();
  };
}

// Rect-based detection for the native swipe strip (infrequent scroll
// events, not per-frame scrub) — the pinned scrub uses math instead.
function setActiveClip() {
  const playheadX = window.innerWidth / 2;
  const clips = gsap.utils.toArray('.js-video-lane .clip');
  const audioBlocks = gsap.utils.toArray('.js-audio-lane .audio-block');
  let activeIdx = -1;

  clips.forEach((clip, i) => {
    const r = clip.getBoundingClientRect();
    const on = r.left <= playheadX && r.right >= playheadX;
    clip.classList.toggle('is-active', on);
    audioBlocks[i]?.classList.toggle('is-active', on);
    if (on) activeIdx = i;
  });

  if (activeIdx >= 0) applyMonitor(clips[activeIdx]);
}

export function buildEdit() {
  const { edit } = config;

  const section = document.querySelector('.edit');
  const monitorFrame = document.querySelector('.edit__monitor-frame');
  const ruler = document.querySelector('.edit__ruler');
  const tracks = document.querySelector('.js-tracks');
  const lanes = gsap.utils.toArray('.edit__track-lane');
  const tcEl = document.querySelector('.js-edit-timecode');

  const rulerInner = populateEditChrome();
  wirePlayback();

  const videoLane = document.querySelector('.js-video-lane');
  // scrub travel: last clip's right edge ends at the playhead
  const travel = videoLane.scrollWidth - window.innerWidth / 2;

  // Precompute clip spans ONCE — the scrub then derives the active
  // clip mathematically instead of measuring 30 rects every frame
  // (that per-frame layout work was freezing the smooth scroll).
  const clipEls = gsap.utils.toArray('.js-video-lane .clip');
  const audioEls = gsap.utils.toArray('.js-audio-lane .audio-block');
  const laneBase = videoLane.getBoundingClientRect().left -
    new DOMMatrix(getComputedStyle(videoLane).transform).m41;
  const spans = clipEls.map((c) => ({
    left: laneBase + c.offsetLeft,
    right: laneBase + c.offsetLeft + c.offsetWidth,
  }));
  const playheadX = window.innerWidth / 2;
  let activeIdx = -1;

  const setActiveByProgress = (p) => {
    const x = -travel * p;
    let idx = -1;
    for (let i = 0; i < spans.length; i++) {
      if (spans[i].left + x <= playheadX && spans[i].right + x >= playheadX) {
        idx = i;
        break;
      }
    }
    if (idx === activeIdx) return;
    if (activeIdx >= 0) {
      clipEls[activeIdx].classList.remove('is-active');
      audioEls[activeIdx]?.classList.remove('is-active');
    }
    activeIdx = idx;
    if (idx < 0) return;
    clipEls[idx].classList.add('is-active');
    audioEls[idx]?.classList.add('is-active');
    applyMonitor(clipEls[idx]);
  };

  // ---- assembly: the NLE builds itself WHILE wiping into view,
  // so it arrives fully formed the moment it pins ----
  const assembleTl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: section,
      start: 'top bottom',
      end: 'top top',
      scrub: true,
    },
  });
  assembleTl.fromTo(ruler, { yPercent: -110 }, { yPercent: 0, duration: 0.5, ease: 'power2.out' }, 0.1);
  assembleTl.fromTo(
    tracks,
    { yPercent: 130, opacity: 0 },
    { yPercent: 0, opacity: 1, duration: 0.6, ease: 'power2.out' },
    0.25
  );
  assembleTl.fromTo(
    monitorFrame,
    { scale: 0.9, opacity: 0 },
    { scale: 1, opacity: 1, duration: 0.55, ease: 'power2.out' },
    0.4
  );

  // ---- pinned phase: pure scrub, clips pass under the fixed playhead ----
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: `+=${edit.scrollVh}%`,
      pin: '.edit__stage',
      scrub: true,
      onUpdate(self) {
        tcEl.textContent = timecode(self.progress * edit.sequenceSeconds);
        setActiveByProgress(self.progress);
      },
    },
  });

  tl.to([...lanes, rulerInner], { x: -travel, duration: 1 }, 0);

  return () => {
    assembleTl.scrollTrigger?.kill();
    assembleTl.kill();
    tl.scrollTrigger?.kill();
    tl.kill();
    gsap.set([ruler, tracks, monitorFrame, ...lanes, rulerInner], { clearProps: 'all' });
  };
}

// Static timeline: native horizontal swipe drives the monitor.
// Used for reduced-motion AND as the mobile timeline (swipe to browse,
// scroll on to skip — no forced 15-clip toll).
export function buildEditFallback() {
  populateEditChrome();
  wirePlayback();
  const timelineEl = document.querySelector('.edit__timeline');
  const onScroll = () => setActiveClip();
  timelineEl.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // light up the first clip immediately

  return () => {
    timelineEl.removeEventListener('scroll', onScroll);
  };
}
