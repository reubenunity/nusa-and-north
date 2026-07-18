// Decides whether the full scroll-scrubbed experience runs.
// Falls back to a static / native-scroll layout for
// prefers-reduced-motion and small screens.
// Dev override via localStorage nn-motion: 'auto' | 'full' | 'static'.

export const motionOverride = localStorage.getItem('nn-motion') || 'auto';

const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const smallScreenQuery = window.matchMedia('(max-width: 767px)');

export const prefersReducedMotion = reducedMotionQuery.matches;
export const isSmallScreen = smallScreenQuery.matches;

export const fullExperience =
  motionOverride === 'full'
    ? true
    : motionOverride === 'static'
      ? false
      : !prefersReducedMotion && !isSmallScreen;

export function applyMotionClass() {
  document.documentElement.classList.toggle('no-scrub', !fullExperience);
  // "motion lite": the static experience still gets entrance life —
  // unless the visitor asked for reduced motion
  document.documentElement.classList.toggle(
    'lite-motion',
    !fullExperience && !prefersReducedMotion
  );
}

// The mode is baked in at load (Lenis, pins, split text) — the cheapest
// correct response to crossing a breakpoint is a fresh load.
export function watchViewport() {
  if (motionOverride !== 'auto') return;
  reducedMotionQuery.addEventListener('change', () => location.reload());
  smallScreenQuery.addEventListener('change', () => location.reload());
}
