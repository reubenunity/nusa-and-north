import '../styles/novara-media-consent.css';

const STORAGE_KEY = 'nn-media-consent';
const MAX_TIMEOUT = 2_147_483_647;
let memoryChoice = null;
let memoryOnly = false;
let controller = null;
let expiryTimer = 0;
let consentDialog = null;
let playerDialog = null;
let pendingChoice = null;
let playerTrigger = null;
let scrollState = null;
let previousAllowed = false;

function readChoice() {
  let choice = memoryChoice;
  if (!memoryOnly) {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      choice = null;
      if (stored) {
        try { choice = JSON.parse(stored); } catch { /* Invalid saved choices fail closed. */ }
      }
    } catch { /* Keep this page usable when browser storage is unavailable. */ }
  }
  if (!choice || typeof choice.allowed !== 'boolean' || !Number.isFinite(choice.expires) || choice.expires <= Date.now()) {
    memoryChoice = null;
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* Storage may be disabled. */ }
    return null;
  }
  return choice;
}

export function hasNovaraMediaConsent() {
  return readChoice()?.allowed === true;
}

export function isNovaraMediaDialogOpen() {
  return Boolean(consentDialog?.open || playerDialog?.open);
}

function announceDialogs() {
  window.dispatchEvent(new CustomEvent('novara:media-dialog', {
    detail: { open: isNovaraMediaDialogOpen() },
  }));
}

function restoreFocus(trigger) {
  if (trigger?.isConnected && !trigger.closest('[inert]')) trigger.focus?.({ preventScroll: true });
}

function lockScroll() {
  if (scrollState) return;
  scrollState = {
    overflow: document.documentElement.style.overflow,
    lenisRunning: window.__lenis && !window.__lenis.isStopped,
  };
  document.documentElement.style.overflow = 'hidden';
  if (scrollState.lenisRunning) window.__lenis.stop();
}

function unlockScroll() {
  if (!scrollState || isNovaraMediaDialogOpen()) return;
  document.documentElement.style.overflow = scrollState.overflow;
  if (scrollState.lenisRunning) window.__lenis?.start();
  scrollState = null;
}

function stopExternalMedia() {
  document.querySelectorAll('[data-novara-external-media]').forEach((media) => {
    media.pause?.();
    media.removeAttribute('src');
    media.remove();
  });
  closeNovaraLightbox();
}

function scheduleExpiry(choice) {
  clearTimeout(expiryTimer);
  expiryTimer = choice ? window.setTimeout(refreshChoice, Math.min(MAX_TIMEOUT, Math.max(1, choice.expires - Date.now()))) : 0;
}

function refreshChoice() {
  const choice = readChoice();
  const allowed = choice?.allowed === true;
  if (!allowed && previousAllowed) stopExternalMedia();
  previousAllowed = allowed;
  scheduleExpiry(choice);
  window.dispatchEvent(new CustomEvent('novara:media-consent', {
    detail: { allowed, expires: choice?.expires ?? null },
  }));
}

function saveChoice(allowed) {
  const expiry = new Date();
  const day = expiry.getDate();
  expiry.setDate(1);
  expiry.setMonth(expiry.getMonth() + 6);
  const lastDay = new Date(expiry.getFullYear(), expiry.getMonth() + 1, 0).getDate();
  expiry.setDate(Math.min(day, lastDay));
  memoryChoice = { allowed, expires: expiry.getTime() };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryChoice));
    memoryOnly = false;
  } catch { memoryOnly = true; }
  if (!allowed) stopExternalMedia();
  refreshChoice();
}

function makeButton(label, className, action) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.textContent = label;
  button.addEventListener('click', action);
  return button;
}

function ensureConsentDialog() {
  if (consentDialog) return consentDialog;
  consentDialog = document.createElement('dialog');
  consentDialog.className = 'novara-media-dialog';
  consentDialog.setAttribute('aria-labelledby', 'novara-media-title');
  consentDialog.setAttribute('aria-describedby', 'novara-media-description novara-media-memory');
  consentDialog.innerHTML = `
    <button type="button" class="nm-close" aria-label="Close media settings">×</button>
    <p class="nm-eyebrow">YOUR CHOICE</p>
    <h2 id="novara-media-title">External media</h2>
    <p id="novara-media-description">Films play through Vimeo or YouTube. Allowing external media connects your browser to these services. They receive connection details and may use cookies or similar storage.</p>
    <p id="novara-media-memory">We save your choice on this device for six months. You can change it or turn external media off at any time in Media settings.</p>
    <p class="nm-status" aria-live="polite"></p>
    <div class="nm-actions"></div>
    <a class="nm-provider-link" target="_blank" rel="noopener noreferrer" hidden></a>
    <a class="nm-privacy" href="/novara-legal.html#cookies">Read about cookies and external media</a>`;
  const settle = (allowed) => {
    if (!pendingChoice) return;
    pendingChoice.result = allowed;
    saveChoice(allowed);
    consentDialog.close();
  };
  consentDialog.querySelector('.nm-actions').append(
    makeButton('Allow external media', 'nm-choice', () => settle(true)),
    makeButton('Keep media off', 'nm-choice nm-decline', () => settle(false)),
  );
  consentDialog.querySelector('.nm-close').addEventListener('click', () => consentDialog.close());
  consentDialog.addEventListener('click', (event) => {
    if (event.target !== consentDialog) return;
    const rect = consentDialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) consentDialog.close();
  });
  consentDialog.addEventListener('close', () => {
    const pending = pendingChoice;
    pendingChoice = null;
    pending?.resolve(pending.result === true);
    restoreFocus(pending?.trigger);
    // A consented play request opens its player in the preceding promise turn.
    queueMicrotask(() => { unlockScroll(); announceDialogs(); });
  });
  document.body.append(consentDialog);
  return consentDialog;
}

function requestChoice(trigger, settings = false, source = null) {
  mountNovaraMediaConsent();
  if (pendingChoice) return pendingChoice.promise;
  const dialog = ensureConsentDialog();
  const allowed = hasNovaraMediaConsent();
  dialog.querySelector('h2').textContent = settings ? 'Media settings' : 'Allow external media to play?';
  dialog.querySelector('.nm-status').textContent = allowed ? 'External media is currently allowed.' : 'External media is currently off.';
  dialog.querySelector('.nm-decline').textContent = allowed ? 'Turn media off' : 'Keep media off';
  const directLink = dialog.querySelector('.nm-provider-link');
  directLink.hidden = !source;
  if (source) {
    directLink.href = source;
    directLink.textContent = `Watch directly on ${new URL(source, window.location.href).hostname.includes('vimeo') ? 'Vimeo' : 'YouTube'}`;
  } else directLink.removeAttribute('href');
  const promise = new Promise((resolve) => {
    pendingChoice = { resolve, trigger: trigger ?? document.activeElement, result: false };
  });
  pendingChoice.promise = promise;
  lockScroll();
  dialog.showModal();
  announceDialogs();
  // Equal actions; dismissal is available first in the native focus order.
  dialog.querySelector('.nm-close').focus({ preventScroll: true });
  return promise;
}

export function openNovaraMediaSettings(trigger = document.activeElement) {
  return requestChoice(trigger, true);
}

export function requestNovaraMediaConsent(trigger = document.activeElement) {
  mountNovaraMediaConsent();
  return hasNovaraMediaConsent() ? Promise.resolve(true) : requestChoice(trigger);
}

export function subscribeNovaraMediaConsent(listener) {
  const handler = (event) => listener(event.detail);
  window.addEventListener('novara:media-consent', handler);
  return () => window.removeEventListener('novara:media-consent', handler);
}

export function novaraEmbedUrl(source) {
  let url;
  try { url = new URL(source, window.location.href); } catch { return null; }
  if (!['https:', 'http:'].includes(url.protocol)) return null;
  const host = url.hostname.toLowerCase();
  const segments = url.pathname.split('/').filter(Boolean);
  if (['vimeo.com', 'www.vimeo.com', 'player.vimeo.com'].includes(host)) {
    const id = segments[0] === 'video' ? segments[1] : segments[0];
    if (!/^\d+$/.test(id || '')) return null;
    const hash = url.searchParams.get('h') || (segments[0] === 'video' ? null : segments[1]);
    const embed = new URL(`https://player.vimeo.com/video/${id}`);
    if (hash && /^[a-z0-9]+$/i.test(hash)) embed.searchParams.set('h', hash);
    for (const [key, value] of Object.entries({ dnt: '1', autoplay: '1', title: '0', byline: '0', portrait: '0' })) embed.searchParams.set(key, value);
    return embed.href;
  }
  if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com', 'youtu.be'].includes(host)) {
    const id = host === 'youtu.be' ? segments[0] : url.searchParams.get('v') || (['embed', 'shorts'].includes(segments[0]) ? segments[1] : null);
    return /^[\w-]{11}$/.test(id || '') ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0` : null;
  }
  return null;
}

function ensurePlayer() {
  if (playerDialog) return playerDialog;
  playerDialog = document.createElement('dialog');
  playerDialog.className = 'novara-media-player';
  playerDialog.setAttribute('aria-label', 'Film player');
  playerDialog.innerHTML = '<button type="button" class="nm-player-close" aria-label="Close film player">Close <span aria-hidden="true">×</span></button><div class="nm-player-frame"></div>';
  playerDialog.querySelector('button').addEventListener('click', closeNovaraLightbox);
  playerDialog.addEventListener('click', (event) => { if (event.target === playerDialog) closeNovaraLightbox(); });
  playerDialog.addEventListener('close', () => {
    playerDialog.querySelector('.nm-player-frame').replaceChildren();
    const trigger = playerTrigger;
    playerTrigger = null;
    unlockScroll();
    restoreFocus(trigger);
    announceDialogs();
  });
  document.body.append(playerDialog);
  return playerDialog;
}

export function closeNovaraLightbox() {
  if (!playerDialog) return;
  playerDialog.querySelector('.nm-player-frame').replaceChildren();
  if (playerDialog.open) playerDialog.close();
}

export async function openNovaraLightbox(source, trigger = document.activeElement) {
  const src = novaraEmbedUrl(source);
  if (!src || playerDialog?.open) return false;
  mountNovaraMediaConsent();
  if (!hasNovaraMediaConsent() && !await requestChoice(trigger, false, source)) return false;
  if (!hasNovaraMediaConsent() || playerDialog?.open) return false;
  const dialog = ensurePlayer();
  playerTrigger = trigger;
  const iframe = document.createElement('iframe');
  iframe.title = 'Nusa & North film';
  iframe.dataset.novaraExternalMedia = '';
  iframe.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media';
  iframe.allowFullscreen = true;
  iframe.referrerPolicy = 'strict-origin-when-cross-origin';
  // Only assign the remote URL after the visitor has explicitly allowed media.
  iframe.src = src;
  dialog.querySelector('.nm-player-frame').replaceChildren(iframe);
  lockScroll();
  dialog.showModal();
  dialog.querySelector('button').focus({ preventScroll: true });
  announceDialogs();
  return true;
}

export function mountNovaraMediaConsent() {
  if (controller) return;
  controller = new AbortController();
  const { signal } = controller;
  document.addEventListener('click', (event) => {
    const trigger = event.target.closest?.('[data-media-settings]');
    if (!trigger) return;
    event.preventDefault();
    openNovaraMediaSettings(trigger);
  }, { signal });
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY && event.key !== null) return;
    memoryChoice = null;
    memoryOnly = false;
    refreshChoice();
  }, { signal });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refreshChoice();
  }, { signal });
  refreshChoice();
}
