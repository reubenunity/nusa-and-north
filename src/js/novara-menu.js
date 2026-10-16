import '../styles/novara-menu.css';

// HorizonX Flowing Menu's edge-aware binding, adapted to the existing dialog.
// Source: https://horizonx.so/tools/flowing-menu
// Untouched export: /horizonx/flowing-menu.html
// The motion remains the original pair of counter-translated CSS layers.
export function mountNovaraMenu(menu) {
  if (!menu) return () => {};
  const controller = new AbortController();
  const { signal } = controller;
  const hover = matchMedia('(hover: hover) and (pointer: fine)');
  const rows = [...menu.querySelectorAll('.fmn-row')];

  for (const row of rows) {
    const setEdge = event => {
      const y = event?.clientY;
      if (typeof y !== 'number' || !Number.isFinite(y)) return;
      const rect = row.getBoundingClientRect();
      row.style.setProperty('--fmn-from', String(y < rect.top + rect.height / 2 ? -1 : 1));
    };
    const enter = event => {
      // Touch opens the link directly; it has no preview-only first tap.
      if (event.pointerType === 'touch' || !hover.matches) return;
      setEdge(event);
      row.classList.add('fmn-row--active');
    };
    const leave = event => {
      setEdge(event);
      row.classList.remove('fmn-row--active');
    };
    const blur = () => row.classList.remove('fmn-row--active');
    row.addEventListener('pointerenter', enter, { signal });
    row.addEventListener('pointerleave', leave, { signal });
    row.addEventListener('pointercancel', blur, { signal });
    row.addEventListener('focusin', event => {
      if (event.target.matches(':focus-visible')) row.classList.add('fmn-row--active');
    }, { signal });
    row.addEventListener('focusout', blur, { signal });
  }

  const reset = () => rows.forEach(row => {
    row.classList.remove('fmn-row--active');
    row.style.removeProperty('--fmn-from');
  });
  menu.addEventListener('close', reset, { signal });
  return () => { controller.abort(); reset(); };
}
