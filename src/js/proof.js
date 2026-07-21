// The delivery report: when the act scrolls into view the render
// bar fills and the campaign totals count up. No pins, no GSAP —
// one IntersectionObserver + rAF, so it behaves on every tier.
export function buildProof() {
  const section = document.querySelector('.proof');
  if (!section || !document.documentElement.classList.contains('show-proof')) {
    return () => {};
  }

  const bar = section.querySelector('.js-proof-bar');
  const stats = [...section.querySelectorAll('.js-proof-stat')];
  let raf = 0;

  const countUp = () => {
    bar?.classList.add('is-done');
    const start = performance.now();
    const dur = 1700;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      stats.forEach((stat) => {
        const target = parseFloat(stat.dataset.count);
        const num = stat.querySelector('.proof__num');
        num.textContent = Math.round(target * eased) + (stat.dataset.suffix || '');
      });
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  };

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        countUp();
      });
    },
    { threshold: 0.35 }
  );
  io.observe(section);

  return () => {
    io.disconnect();
    cancelAnimationFrame(raf);
  };
}
