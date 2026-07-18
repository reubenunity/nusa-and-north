// Decides whether the full scroll-scrubbed experience runs.
// Mobile now gets the full experience too — only prefers-reduced-motion
// (or the dev override) drops to the static layout.
// Dev override via localStorage nn-motion: 'auto' | 'full' | 'static'.

export const motionOverride = localStorage.getItem('nn-motion') || 'auto';

const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

export const prefersReducedMotion = reducedMotionQuery.matches;

export const fullExperience =
  motionOverride === 'full'
    ? true
    : motionOverride === 'static'
      ? false
      : !prefersReducedMotion;

export function applyMotionClass() {
  document.documentElement.classList.toggle('no-scrub', !fullExperience);
  // "motion lite": the static experience still gets entrance life —
  // unless the visitor asked for reduced motion
  document.documentElement.classList.toggle(
    'lite-motion',
    !fullExperience && !prefersReducedMotion
  );
}

// The mode is baked in at load — reload if the reduced-motion
// preference flips mid-session.
export function watchViewport() {
  if (motionOverride !== 'auto') return;
  reducedMotionQuery.addEventListener('change', () => location.reload());
}
