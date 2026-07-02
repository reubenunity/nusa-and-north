// Decides whether the full scroll-scrubbed experience runs.
// Falls back to a static / native-scroll layout for
// prefers-reduced-motion and small screens.

export const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

export const isSmallScreen = window.matchMedia('(max-width: 767px)').matches;

export const fullExperience = !prefersReducedMotion && !isSmallScreen;

export function applyMotionClass() {
  document.documentElement.classList.toggle('no-scrub', !fullExperience);
}
