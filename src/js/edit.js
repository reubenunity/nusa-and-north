import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { config } from '../config.js';
import { timecode } from './utils.js';

gsap.registerPlugin(ScrollTrigger);

// Build the A1 waveform blocks to mirror the V1 clips, and the ruler ticks.
// Idempotent — clears previous generated content first.
export function populateEditChrome() {
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

function setActiveClip(monitorTitle, monitorClipname) {
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

  if (activeIdx >= 0) {
    const title = clips[activeIdx].dataset.title;
    const name = clips[activeIdx].querySelector('.clip__name').textContent;
    if (monitorTitle.textContent !== title) {
      monitorTitle.textContent = title;
      monitorClipname.textContent = name;
      gsap.fromTo(monitorTitle, { opacity: 0.2 }, { opacity: 1, duration: 0.3 });
    }
  }
}

export function buildEdit() {
  const { edit } = config;

  const section = document.querySelector('.edit');
  const monitorFrame = document.querySelector('.edit__monitor-frame');
  const ruler = document.querySelector('.edit__ruler');
  const tracks = document.querySelector('.js-tracks');
  const lanes = gsap.utils.toArray('.edit__track-lane');
  const monitorTitle = document.querySelector('.js-monitor-title');
  const monitorClipname = document.querySelector('.js-monitor-clipname');
  const tcEl = document.querySelector('.js-edit-timecode');

  const rulerInner = populateEditChrome();

  const videoLane = document.querySelector('.js-video-lane');
  // scrub travel: last clip's right edge ends at the playhead
  const travel = videoLane.scrollWidth - window.innerWidth / 2;

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

  // ---- pinned phase: scrub the clips, freeze the bay, sweep the
  // curtains closed over it, then count down on the closed house ----
  const SCRUB_END = 0.6;     // lanes stop here; the bay holds still
  const CURTAIN_AT = 0.63;   // curtains start closing
  const CURTAIN_DUR = 0.15;
  const COUNT_START = 0.82;  // countdown 5→1 across the rest
  const countVeil = document.querySelector('.edit__count-veil');
  const countCircle = document.querySelector('.edit__count-circle');
  const countEl = document.querySelector('.js-edit-count');
  const curtainL = document.querySelector('.js-edit-curtain-l');
  const curtainR = document.querySelector('.js-edit-curtain-r');

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: `+=${edit.scrollVh}%`,
      pin: '.edit__stage',
      scrub: true,
      onUpdate(self) {
        const p = self.progress;
        tcEl.textContent = timecode(
          Math.min(1, p / SCRUB_END) * edit.sequenceSeconds
        );
        setActiveClip(monitorTitle, monitorClipname);
        if (p > COUNT_START) {
          const n = 5 - Math.floor(((p - COUNT_START) / (1 - COUNT_START)) * 5);
          countEl.textContent = String(Math.max(1, n));
        }
      },
    },
  });

  tl.to([...lanes, rulerInner], { x: -travel, duration: SCRUB_END }, 0);

  // curtains sweep closed over the frozen bay
  tl.fromTo(curtainL, { xPercent: -102 }, { xPercent: 0, duration: CURTAIN_DUR, ease: 'power2.inOut' }, CURTAIN_AT);
  tl.fromTo(curtainR, { xPercent: 102 }, { xPercent: 0, duration: CURTAIN_DUR, ease: 'power2.inOut' }, CURTAIN_AT);

  // the house dims and the leader counts down on the curtain
  tl.fromTo(countVeil, { opacity: 0 }, { opacity: 0.45, duration: 0.04, ease: 'power1.out' }, 0.8);
  tl.fromTo(
    countCircle,
    { opacity: 0, scale: 0.9 },
    { opacity: 1, scale: 1, duration: 0.04, ease: 'power2.out' },
    0.8
  );
  // pad so authored positions map 1:1 onto pin progress
  tl.set({}, {}, 1);

  return () => {
    assembleTl.scrollTrigger?.kill();
    assembleTl.kill();
    tl.scrollTrigger?.kill();
    tl.kill();
    gsap.set([ruler, tracks, monitorFrame, countVeil, countCircle, curtainL, curtainR, ...lanes, rulerInner], {
      clearProps: 'all',
    });
  };
}

// Fallback for no-scrub mode: native horizontal scroll drives the monitor.
export function buildEditFallback() {
  populateEditChrome();
  const timelineEl = document.querySelector('.edit__timeline');
  const monitorTitle = document.querySelector('.js-monitor-title');
  const monitorClipname = document.querySelector('.js-monitor-clipname');
  monitorTitle.textContent = 'PROJECT 01 — COMMERCIAL';
  monitorClipname.textContent = 'project_01_commercial.mov';
  timelineEl.addEventListener(
    'scroll',
    () => setActiveClip(monitorTitle, monitorClipname),
    { passive: true }
  );
}
