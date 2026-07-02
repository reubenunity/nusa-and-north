// Dev-only iteration panel. Press ` to show/hide.
// Keys: 1/2/3 palette · Q/W/E dismantle preset · A/S/D/F direction
//       Z/X/C slate pacing
import { config, palettes } from '../config.js';

const DIRECTIONS = ['own', 'radial', 'up', 'down'];
const PRESETS = ['drift', 'scatter', 'blast'];
const BRIDGE = ['snap', 'med', 'slow'];

export function setPalette(key) {
  document.documentElement.dataset.palette = key;
  localStorage.setItem('nn-palette', key);
}

export function initDevPanel(rebuild) {
  const saved = localStorage.getItem('nn-palette');
  if (saved) setPalette(saved);

  const panel = document.createElement('div');
  panel.className = 'dev-panel';
  document.body.appendChild(panel);

  const applyBridgePreset = (name) => {
    Object.assign(config.bridge, config.bridge.presets[name]);
    config.bridge.current = name;
  };
  config.bridge.current = 'med';

  function render() {
    const btnRow = (label, items, isOn, act) => `
      <div class="dev-panel__row">
        <span class="dev-panel__label">${label}</span>
        ${items
          .map(
            (it) =>
              `<button data-act="${act}" data-val="${it.key ?? it}" class="${
                isOn(it.key ?? it) ? 'is-on' : ''
              }">${it.label ?? it}</button>`
          )
          .join('')}
      </div>`;

    panel.innerHTML =
      btnRow('Palette [1/2/3]', palettes, (k) => document.documentElement.dataset.palette === k, 'palette') +
      btnRow('Dismantle [Q/W/E]', PRESETS, (k) => config.hero.dismantlePreset === k, 'preset') +
      btnRow('Direction [A/S/D/F]', DIRECTIONS, (k) => config.hero.dismantleDirection === k, 'direction') +
      btnRow('Slate pace [Z/X/C]', BRIDGE, (k) => config.bridge.current === k, 'bridge') +
      `<div class="dev-panel__hint">\` toggles panel · scroll to compare</div>`;
  }

  function act(action, val) {
    if (action === 'palette') setPalette(val);
    if (action === 'preset') { config.hero.dismantlePreset = val; rebuild(); }
    if (action === 'direction') { config.hero.dismantleDirection = val; rebuild(); }
    if (action === 'bridge') { applyBridgePreset(val); rebuild(); }
    render();
  }

  panel.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (btn) act(btn.dataset.act, btn.dataset.val);
  });

  const keymap = {
    1: ['palette', 'a'], 2: ['palette', 'b'], 3: ['palette', 'c'],
    q: ['preset', 'drift'], w: ['preset', 'scatter'], e: ['preset', 'blast'],
    a: ['direction', 'own'], s: ['direction', 'radial'], d: ['direction', 'up'], f: ['direction', 'down'],
    z: ['bridge', 'snap'], x: ['bridge', 'med'], c: ['bridge', 'slow'],
  };
  window.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === '`') { panel.classList.toggle('is-hidden'); return; }
    const m = keymap[e.key.toLowerCase()];
    if (m) act(m[0], m[1]);
  });

  render();
}
