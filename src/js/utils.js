// Wrap each character of an element in a span (idempotent).
// Words get nowrap wrappers so lines still break only at spaces.
export function splitIntoChars(el, charClass) {
  if (el.dataset.split) return [...el.querySelectorAll(`.${charClass}`)];
  const words = el.textContent.trim().split(/\s+/);
  el.textContent = '';
  words.forEach((word, w) => {
    if (w > 0) el.appendChild(document.createTextNode(' '));
    const wordSpan = document.createElement('span');
    wordSpan.style.cssText = 'display:inline-block;white-space:nowrap;';
    for (const ch of word) {
      const span = document.createElement('span');
      span.className = charClass;
      span.textContent = ch;
      wordSpan.appendChild(span);
    }
    el.appendChild(wordSpan);
  });
  el.dataset.split = '1';
  return [...el.querySelectorAll(`.${charClass}`)];
}

// Format seconds -> HH:MM:SS:FF timecode (25fps)
export function timecode(seconds, fps = 25) {
  const total = Math.max(0, seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = Math.floor(total % 60);
  const f = Math.floor((total % 1) * fps);
  const p = (n) => String(n).padStart(2, '0');
  return `${p(h)}:${p(m)}:${p(s)}:${p(f)}`;
}
