const STORAGE_KEY = 'nn-metricool-consent-v1';
const TRACKING_HASH = '11c69be1023a2eb359e9e07e780d75b1';

// The homepage owns tracking, including landings from /film/ redirect pages.
// Development and local build previews never contact Metricool.
const productionSite = import.meta.env.PROD && location.protocol === 'https:' &&
  ['nusaandnorth.com', 'www.nusaandnorth.com'].includes(location.hostname);

export function initMetricoolConsent() {
  const banner = document.getElementById('metricool-consent');
  const settings = document.getElementById('metricool-settings');
  const notice = document.getElementById('metricool-privacy');
  const status = document.getElementById('metricool-preference');
  if (!banner || !settings || !notice || !status) return;

  const validPreference = (value) => value === 'accepted' || value === 'declined' ? value : null;
  let preference = null;
  try { preference = validPreference(localStorage.getItem(STORAGE_KEY)); } catch { /* Ask again if storage is unavailable. */ }
  let trackerScript = null;
  let pageviewSent = false;

  function updateInterface() {
    banner.hidden = preference !== null;
    settings.hidden = preference === null;
    document.body.classList.toggle('metricool-consent-open', preference === null);
    status.textContent = 'Your Metricool choice: ' +
      (preference === 'accepted' ? 'accepted.' : preference === 'declined' ? 'declined.' : 'not chosen.');
  }

  function updateTracker() {
    if (preference !== 'accepted') {
      if (trackerScript) {
        trackerScript.remove();
        trackerScript = null;
      }
      return;
    }
    if (!productionSite || pageviewSent || trackerScript) return;

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://tracker.metricool.com/resources/be.js';
    script.dataset.metricoolTracker = '';
    script.onload = () => {
      // Re-check consent: it may have been withdrawn while the script loaded.
      if (preference !== 'accepted' || trackerScript !== script || pageviewSent) return;
      if (typeof window.beTracker?.t !== 'function') return;
      pageviewSent = true;
      window.beTracker.t({ hash: TRACKING_HASH });
    };
    script.onerror = () => {
      if (trackerScript === script) trackerScript = null;
      script.remove();
    };
    trackerScript = script;
    document.head.appendChild(script);
  }

  function choose(value) {
    preference = value;
    try { localStorage.setItem(STORAGE_KEY, preference); } catch { /* The choice still applies to this page. */ }
    updateInterface();
    updateTracker();
    if (notice.open) notice.close();
    settings.focus({ preventScroll: true });
  }

  document.querySelectorAll('[data-metricool-choice]').forEach((button) => {
    button.addEventListener('click', () => choose(button.dataset.metricoolChoice));
  });
  document.querySelectorAll('[data-metricool-privacy]').forEach((button) => {
    button.addEventListener('click', () => notice.showModal());
  });
  document.getElementById('metricool-privacy-close').addEventListener('click', () => notice.close());

  // Keep other open tabs in step with a changed preference.
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY && event.key !== null) return;
    preference = validPreference(event.key === null ? null : event.newValue);
    updateInterface();
    updateTracker();
  });
  updateInterface();
  updateTracker();
}
