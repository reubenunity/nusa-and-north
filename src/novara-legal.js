import { mountNovaraMediaConsent } from './js/novara-media-consent.js';

const destroyMediaConsent = mountNovaraMediaConsent();
document.querySelectorAll('[data-media-settings]').forEach(button => { button.hidden = false; });
document.querySelectorAll('.legal-settings-fallback').forEach(element => { element.hidden = true; });

const nav = [...document.querySelectorAll('.legal-nav a')];
function syncCurrentSection() {
  const target = location.hash || '#privacy';
  nav.forEach(link => {
    if (link.hash === target) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}
syncCurrentSection();
window.addEventListener('hashchange', syncCurrentSection);
document.querySelector('[data-legal-year]').textContent = new Date().getFullYear();

if (import.meta.hot) import.meta.hot.dispose(() => {
  window.removeEventListener('hashchange', syncCurrentSection);
  destroyMediaConsent?.();
});
