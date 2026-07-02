// ============================================================
// ANIMATION CONFIG — the iteration surface.
// Everything here is live-tweakable from the dev panel (press `).
// ============================================================

export const config = {
  hero: {
    // Total scroll distance for the pinned hero, in viewport-heights.
    scrollVh: 260,
    // Progress fractions (0–1) within that scroll span.
    focusStart: 0.0,   // headline blurred until here
    focusEnd: 0.35,    // headline fully sharp here
    dismantleStart: 0.48,
    dismantleEnd: 1.0,
    // Which dismantle preset + direction mode to use (see below).
    dismantlePreset: 'scatter',
    dismantleDirection: 'own', // 'own' | 'radial' | 'up' | 'down'
    startBlur: 18, // px of blur on the headline at rest
  },

  // Named dismantle presets — direction, speed, violence.
  // distance: multiplier on viewport size, rotation: max degrees,
  // stagger: seconds between elements, blur: px motion blur at exit.
  dismantlePresets: {
    drift:   { distance: 0.55, rotation: 6,  stagger: 0.10, ease: 'power1.in', blur: 0,  scale: 1.0,  jitter: 0.1 },
    scatter: { distance: 1.0,  rotation: 28, stagger: 0.05, ease: 'power2.in', blur: 5,  scale: 0.92, jitter: 0.35 },
    blast:   { distance: 1.9,  rotation: 90, stagger: 0.02, ease: 'power3.in', blur: 12, scale: 1.18, jitter: 0.6 },
  },

  bridge: {
    // Scroll distance the black slate stays pinned, in viewport-heights.
    scrollVh: 140,
    cutToIn: 0.12,   // "CUT TO:" fully visible at this progress
    titleIn: 0.30,   // "THE EDIT" fully visible
    holdUntil: 0.78, // both hold until here, then release
    // Named pacing presets for quick comparison from the dev panel.
    presets: {
      snap: { scrollVh: 90,  cutToIn: 0.08, titleIn: 0.18, holdUntil: 0.85 },
      med:  { scrollVh: 140, cutToIn: 0.12, titleIn: 0.30, holdUntil: 0.78 },
      slow: { scrollVh: 220, cutToIn: 0.18, titleIn: 0.42, holdUntil: 0.72 },
    },
  },

  edit: {
    // Scroll distance for the pinned edit section, in viewport-heights.
    scrollVh: 420,
    assembleEnd: 0.16,    // UI assembly finishes at this progress
    sequenceSeconds: 84,  // fake sequence length driving the timecode
  },
};

// Palette metadata for the dev panel.
export const palettes = [
  { key: 'a', label: 'A · PAPER' },
  { key: 'b', label: 'B · EVF DARK' },
  { key: 'c', label: 'C · SIGNAL RED' },
];
