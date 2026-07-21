// The delivery act: a dot-matrix world chart with the actual shoot
// route flown across it — a plane arcs London → Bali, pinging each
// city as it passes while the campaign totals count up in rhythm.
// No GSAP, no pins: SVG + one rAF, so it behaves on every tier.
// GATED behind html.show-proof (?statdemo=1) until figures are real.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from './motion.js';

gsap.registerPlugin(ScrollTrigger);

const W = 1000;
const H = 430;
const LAT_TOP = 76;
const LAT_BOT = -62;
const px = (lon) => ((lon + 180) / 360) * W;
const py = (lat) => ((LAT_TOP - lat) / (LAT_TOP - LAT_BOT)) * H;

// The route: every country/city they've filmed, flown west to east.
// lx/ly are ABSOLUTE label anchor positions (viewBox coords), hand-
// placed so the dense European cluster stays legible; leader: true
// draws a hairline from the dot to the label.
const CITIES = [
  { name: 'IRELAND', lon: -6.3, lat: 53.3, lx: 470, ly: 62, anchor: 'end' },
  { name: 'UK', lon: -0.1, lat: 51.5, lx: 488, ly: 80, anchor: 'end' },
  { name: 'SPAIN', lon: -3.7, lat: 40.4, lx: 480, ly: 117, anchor: 'end' },
  { name: 'BASEL', lon: 7.6, lat: 47.6, lx: 496, ly: 98, anchor: 'end', leader: true },
  { name: 'ITALY', lon: 11.3, lat: 43.8, lx: 528, ly: 118, anchor: 'middle' },
  { name: 'ALBANIA', lon: 19.8, lat: 41.3, lx: 570, ly: 112, anchor: 'start' },
  { name: 'GREECE', lon: 23.7, lat: 38.0, lx: 578, ly: 127, anchor: 'start' },
  { name: 'AUSTRIA', lon: 16.4, lat: 48.2, lx: 562, ly: 97, anchor: 'start' },
  { name: 'PRAGUE', lon: 14.4, lat: 50.1, lx: 548, ly: 80, anchor: 'start' },
  { name: 'D\u00dcSSELDORF', lon: 6.8, lat: 51.2, lx: 462, ly: 42, anchor: 'end', leader: true },
  { name: 'FRANKFURT', lon: 8.7, lat: 50.1, lx: 512, ly: 32, anchor: 'middle', leader: true },
  { name: 'BERLIN', lon: 13.4, lat: 52.5, lx: 548, ly: 34, anchor: 'start', leader: true },
  { name: 'LITHUANIA', lon: 25.3, lat: 54.7, lx: 588, ly: 66, anchor: 'start' },
  { name: 'TALLINN', lon: 24.8, lat: 59.4, lx: 577, ly: 50, anchor: 'start' },
  { name: 'THAILAND', lon: 100.5, lat: 13.8, lx: 771, ly: 194, anchor: 'end' },
  { name: 'VIETNAM', lon: 107.6, lat: 16.5, lx: 807, ly: 178, anchor: 'start' },
  { name: 'BALI', lon: 115.2, lat: -8.7, lx: 824, ly: 280, anchor: 'start' },
  { name: 'AUSTRALIA', lon: 151.2, lat: -33.9, lx: 926, ly: 358, anchor: 'start' },
];
const NEXT_STOP = { name: 'NEXT STOP \u2014 YOURS', lon: 170, lat: -18, lx: 952, ly: 302, anchor: 'end' };

// Hand-drawn coarse landmasses (lon,lat) — deliberately abstract;
// they only exist to be sampled into the dot grid.
const LAND = [
  // North & Central America
  [[-165,65],[-153,70],[-140,70],[-125,72],[-110,73],[-95,73],[-85,70],[-80,62],[-70,60],[-60,52],[-55,47],[-65,44],[-70,42],[-75,36],[-80,31],[-81,26],[-84,30],[-90,29],[-94,29],[-97,26],[-97,22],[-95,17],[-90,14],[-85,11],[-83,9],[-79,9],[-82,14],[-87,16],[-92,18],[-97,20],[-105,22],[-110,24],[-115,30],[-120,34],[-124,40],[-124,48],[-130,55],[-135,58],[-140,60],[-150,61],[-158,58],[-165,60]],
  // Greenland
  [[-45,60],[-40,65],[-32,68],[-25,71],[-30,76],[-45,78],[-55,76],[-58,72],[-52,65],[-48,61]],
  // South America
  [[-78,7],[-72,11],[-64,10],[-60,8],[-52,4],[-50,0],[-44,-3],[-37,-6],[-35,-9],[-39,-15],[-40,-22],[-48,-26],[-53,-33],[-58,-38],[-62,-41],[-65,-47],[-69,-52],[-74,-53],[-73,-46],[-71,-38],[-71,-30],[-70,-20],[-75,-15],[-79,-7],[-81,-3],[-78,2]],
  // Eurasia (Europe, Middle East, Asia in one crude sweep)
  [[-9,37],[-9,43],[-2,44],[-1,46],[-4,48],[1,50],[4,52],[8,55],[8,57],[11,59],[5,59],[5,62],[12,66],[18,69],[25,71],[33,69],[40,67],[50,69],[60,70],[70,73],[80,73],[90,75],[100,77],[110,74],[120,73],[130,72],[140,72],[150,68],[160,66],[170,66],[178,65],[178,62],[165,60],[160,56],[156,51],[150,55],[143,53],[141,48],[135,44],[130,42],[127,39],[126,35],[122,37],[120,32],[122,27],[115,22],[110,20],[108,16],[109,12],[106,9],[103,10],[104,14],[100,14],[98,10],[100,6],[103,2],[101,3],[98,8],[97,15],[94,17],[91,22],[88,21],[85,19],[82,15],[80,10],[78,8],[76,10],[72,19],[68,22],[66,25],[61,25],[57,26],[52,25],[55,22],[59,23],[58,20],[54,17],[45,13],[43,12],[39,21],[36,28],[34,28],[32,31],[35,36],[36,36],[30,36],[27,37],[26,40],[22,40],[23,37],[21,37],[19,40],[16,38],[15,40],[18,42],[13,45],[12,44],[14,40],[16,38],[12,42],[10,44],[7,43],[4,43],[3,41],[0,39],[-2,37],[-5,36]],
  // Africa
  [[-9,35],[-6,33],[-1,35],[10,37],[11,34],[19,32],[25,32],[30,31],[32,31],[34,28],[37,22],[38,18],[43,12],[48,11],[51,12],[51,10],[46,5],[41,-2],[40,-10],[36,-18],[35,-24],[32,-29],[27,-34],[20,-35],[17,-33],[15,-27],[12,-18],[13,-10],[9,-2],[9,4],[4,6],[-2,5],[-8,4],[-13,8],[-17,12],[-17,15],[-16,20],[-13,26],[-9,30]],
  // Australia
  [[113,-22],[114,-26],[115,-32],[118,-35],[124,-33],[129,-32],[132,-32],[135,-35],[138,-35],[140,-38],[146,-39],[150,-37],[153,-32],[153,-27],[151,-24],[149,-20],[146,-18],[143,-14],[142,-11],[139,-17],[136,-12],[132,-11],[129,-15],[125,-14],[122,-17],[117,-20]],
  // UK + Ireland
  [[-6,50],[-1,51],[1,52],[-2,55],[-4,58],[-7,57],[-8,54],[-10,52]],
  // Japan
  [[130,32],[133,34],[136,35],[140,36],[141,40],[142,44],[144,44],[141,38],[140,34],[135,33],[131,31]],
  // Sumatra / Java
  [[95,5],[99,2],[103,-2],[106,-6],[110,-7],[115,-8],[115,-9],[105,-7],[100,0],[95,3]],
  // Borneo
  [[109,1],[113,4],[117,6],[119,1],[116,-3],[112,-3],[109,-1]],
  // New Guinea
  [[131,-1],[136,-2],[141,-3],[146,-6],[144,-8],[138,-7],[133,-4],[130,-2]],
  // Philippines
  [[120,18],[122,16],[124,12],[125,8],[122,8],[120,12],[119,16]],
  // Madagascar
  [[44,-16],[47,-15],[50,-16],[49,-22],[45,-25],[43,-22]],
  // New Zealand
  [[167,-45],[172,-42],[174,-38],[176,-38],[174,-41],[169,-46]],
];

function inPoly(lon, lat, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

const NS = 'http://www.w3.org/2000/svg';
function make(tag, attrs, parent) {
  const el = document.createElementNS(NS, tag);
  for (const k in attrs) el.setAttribute(k, attrs[k]);
  parent?.appendChild(el);
  return el;
}

// Great-circle-ish arc between two projected points: a quadratic
// whose control point lifts perpendicular to the chord.
function arcSegment(a, b) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.hypot(dx, dy);
  const lift = Math.min(dist * 0.18, 46);
  // lift always "upward" on screen for that flight-chart look
  const cx = mx - (dy / (dist || 1)) * lift * Math.sign(dx || 1);
  const cy = my - Math.abs(dx / (dist || 1)) * lift;
  return { d: `M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}` };
}

const DESIGN_VARIANTS = ['map', 'board', 'passport', 'contact'];

export function buildProof() {
  const section = document.querySelector('.proof');
  const svg = document.querySelector('.js-proof-map');
  if (!section || !svg || !document.documentElement.classList.contains('show-proof')) {
    return () => {};
  }
  // hard stop: pin the act so its animation delivers before the page
  // moves on — desktop only; the touch tier stays pin-free by design
  const smallScreen =
    window.innerWidth < 768 || window.matchMedia('(pointer: coarse)').matches;
  let pin = null;
  if (!smallScreen && !prefersReducedMotion) {
    pin = ScrollTrigger.create({
      trigger: '.proof__stage',
      start: 'top top',
      end: '+=130%',
      pin: true,
    });
    if (import.meta.env.DEV) window.__proofPin = pin;
  }
  const withPin = (teardown) => () => {
    pin?.kill();
    teardown();
  };

  const variant = [...document.documentElement.classList]
    .map((c) => c.replace(/^proof-/, ''))
    .find((c) => DESIGN_VARIANTS.includes(c));
  // the departures board is the chosen design — DEFAULT, no param;
  // ?proof=map|passport|contact keep the alternatives auditionable
  if (!variant || variant === 'board') return withPin(buildBoard(section));
  if (variant === 'passport') return withPin(buildPassport(section));
  if (variant === 'contact') return withPin(buildContact(section));
  svg.innerHTML = '';

  // ---- dot-matrix world ----
  const dots = make('g', { class: 'proof__dots' }, svg);
  for (let lat = LAT_BOT + 2; lat <= LAT_TOP; lat += 3) {
    for (let lon = -178; lon <= 180; lon += 3.4) {
      if (LAND.some((p) => inPoly(lon, lat, p))) {
        make('circle', { cx: px(lon).toFixed(1), cy: py(lat).toFixed(1), r: 1.5 }, dots);
      }
    }
  }

  // ---- route geometry ----
  const pts = CITIES.map((c) => ({ ...c, x: px(c.lon), y: py(c.lat) }));
  const nextPt = { ...NEXT_STOP, x: px(NEXT_STOP.lon), y: py(NEXT_STOP.lat) };
  const stops = [...pts, nextPt];

  const segs = [];
  let total = 0;
  for (let i = 0; i < stops.length - 1; i++) {
    const { d } = arcSegment(stops[i], stops[i + 1]);
    // probes stay in the svg (invisible: no stroke) — getTotalLength
    // is unreliable on detached elements in WebKit
    const probe = make('path', { d, fill: 'none' }, svg);
    const len = probe.getTotalLength();
    segs.push({ d, probe, len, start: total });
    total += len;
  }
  const cityLens = stops.map((_, i) => (i === 0 ? 0 : segs[i - 1].start + segs[i - 1].len));

  const fullD = segs.map((s) => s.d).join(' ');
  make('path', { d: fullD, class: 'proof__route-ghost' }, svg);
  const trail = make('path', { d: fullD, class: 'proof__route-trail' }, svg);
  trail.style.strokeDasharray = String(total);
  trail.style.strokeDashoffset = String(total);

  // ---- city pins + labels ----
  const cityGroups = stops.map((c, i) => {
    const isNext = i === stops.length - 1;
    const g = make('g', { class: `proof__city${isNext ? ' proof__city--next' : ''}` }, svg);
    make('circle', { cx: c.x, cy: c.y, r: isNext ? 7 : 2.6, class: 'proof__city-dot' }, g);
    if (!isNext) make('circle', { cx: c.x, cy: c.y, r: 2.6, class: 'proof__city-halo' }, g);
    if (c.leader) {
      // hairline from the dot toward its remote label
      const t = 0.82;
      make(
        'line',
        {
          x1: c.x, y1: c.y,
          x2: c.x + (c.lx - c.x) * t, y2: c.y + (c.ly - c.y) * t,
          class: 'proof__city-leader',
        },
        g
      );
    }
    const label = make(
      'text',
      { x: c.lx, y: c.ly, 'text-anchor': c.anchor || 'start', class: 'proof__city-label' },
      g
    );
    label.textContent = c.name;
    return g;
  });

  // ---- the plane ----
  const plane = make('g', { class: 'proof__plane' }, svg);
  make('path', { d: 'M8,0 L-5,4.5 L-2,0 L-5,-4.5 Z' }, plane);

  const planeAt = (len) => {
    const seg = segs.find((s) => len <= s.start + s.len) || segs[segs.length - 1];
    const local = Math.min(seg.len, Math.max(0, len - seg.start));
    const p = seg.probe.getPointAtLength(local);
    const q = seg.probe.getPointAtLength(Math.min(seg.len, local + 2));
    const angle = (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI;
    return { p, angle };
  };

  // ---- counters ----
  const stats = [...section.querySelectorAll('.js-proof-stat')];
  const setCounters = (t) => {
    stats.forEach((stat) => {
      const target = parseFloat(stat.dataset.count);
      stat.querySelector('.proof__num').textContent =
        Math.round(target * t) + (stat.dataset.suffix || '');
    });
  };

  const finish = () => {
    trail.style.strokeDashoffset = '0';
    cityGroups.forEach((g) => g.classList.add('is-on'));
    const { p, angle } = planeAt(total);
    plane.setAttribute('transform', `translate(${p.x},${p.y}) rotate(${angle})`);
    plane.classList.add('is-on');
    setCounters(1);
  };

  let raf = 0;
  const fly = () => {
    const DUR = 11000;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / DUR);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const len = total * eased;
      trail.style.strokeDashoffset = String(total - len);
      const { p, angle } = planeAt(len);
      plane.setAttribute('transform', `translate(${p.x},${p.y}) rotate(${angle})`);
      plane.classList.add('is-on');
      cityGroups.forEach((g, i) => {
        if (len >= cityLens[i] - 1) g.classList.add('is-on');
      });
      setCounters(eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  };

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        if (prefersReducedMotion) finish();
        else setTimeout(fly, 350);
      });
    },
    { threshold: 0.3 }
  );
  io.observe(section);

  return withPin(() => {
    io.disconnect();
    cancelAnimationFrame(raf);
  });
}


// ------------------------------------------------------------------
// shared bits for the design mockups
// ------------------------------------------------------------------
const STOPS_META = [
  ['DUBLIN', 'BRAND FILM'], ['LONDON', "HARPER'S BAZAAR"], ['MADRID', 'COMMERCIAL'],
  ['BASEL', 'CITY STUDY'], ['FLORENCE', 'HOTEL FILM'], ['TIRANA', 'LOCATION SCOUT'],
  ['ATHENS', 'TRAVEL FILM'], ['VIENNA', 'COMMERCIAL'], ['PRAGUE', 'CITY FILM'],
  ['D\u00dcSSELDORF', 'COMMERCIAL'], ['FRANKFURT', 'HOTEL FILM'], ['BERLIN', 'BRAND FILM'],
  ['VILNIUS', 'TRAVEL FILM'], ['TALLINN', 'HOTEL FILM'], ['BANGKOK', 'HOTEL FILM'],
  ['HUE', 'RESORT FILM'], ['BALI', 'TRAVEL DIARIES'], ['SYDNEY', 'COMMERCIAL'],
];

function onEnter(section, cb, threshold = 0.25) {
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => { if (e.isIntersecting) { io.disconnect(); cb(); } }),
    { threshold }
  );
  io.observe(section);
  return io;
}

function runCounters(section, dur = 1800) {
  const stats = [...section.querySelectorAll('.js-proof-stat')];
  const start = performance.now();
  let raf = 0;
  const tick = (now) => {
    const t = Math.min(1, (now - start) / dur);
    const eased = 1 - Math.pow(1 - t, 3);
    stats.forEach((stat) => {
      stat.querySelector('.proof__num').textContent =
        Math.round(parseFloat(stat.dataset.count) * eased) + (stat.dataset.suffix || '');
    });
    if (t < 1) raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}

// Paint the dot world + full route into an svg as a static backdrop.
function drawWorldBackdrop(svg) {
  const dots = make('g', { class: 'proof__dots' }, svg);
  for (let lat = LAT_BOT + 2; lat <= LAT_TOP; lat += 3) {
    for (let lon = -178; lon <= 180; lon += 3.4) {
      if (LAND.some((p) => inPoly(lon, lat, p))) {
        make('circle', { cx: px(lon).toFixed(1), cy: py(lat).toFixed(1), r: 1.5 }, dots);
      }
    }
  }
  const stops = [...CITIES, NEXT_STOP].map((c) => ({ ...c, x: px(c.lon), y: py(c.lat) }));
  const fullD = stops.slice(0, -1).map((a, i) => arcSegment(a, stops[i + 1]).d).join(' ');
  make('path', { d: fullD, class: 'proof__route-trail' }, svg);
  stops.forEach((c) => make('circle', { cx: c.x, cy: c.y, r: 2.4, class: 'proof__bg-stop' }, svg));
}

// ------------------------------------------------------------------
// MOCKUP 1 — the departures board (split-flap)
// ------------------------------------------------------------------
const FLAP_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// The filmography as flights — every delivery that landed.
const BOARD_FILMS = [
  ["HARPER'S BAZAAR UK", 'DELIVERED'],
  ['ILLUZION PHUKET', 'DELIVERED'],
  ['RADISSON FRANKFURT', 'DELIVERED'],
  ['RADISSON FLORENCE', 'DELIVERED'],
  ['RADISSON LUCERNE', 'DELIVERED'],
  ['RADISSON TALLINN', 'DELIVERED'],
  ['RADISSON ITB BERLIN', 'DELIVERED'],
  ['FOUR SEASONS BANGKOK', 'DELIVERED'],
  ['BANYAN TREE', 'DELIVERED'],
  ['ANGSANA PHUKET', 'DELIVERED'],
  ['LAGUNA LANG CO', 'DELIVERED'],
  ['LE COMPTOIR', 'DELIVERED'],
  ['SAVOUR THE VIBE PRAGUE', 'DELIVERED'],
  ['COUCHVIBES', 'DELIVERED'],
  ['THE ANANTARA EXPERIENCE', 'DELIVERED'],
  ['HP', 'DELIVERED'],
  ['HELLOBODY', 'DELIVERED'],
  ['INSTA360', 'IN POST'],
];

function buildBoard(section) {
  const alt = section.querySelector('.js-proof-alt');
  alt.innerHTML = `
    <svg class="board__bg" viewBox="0 0 1000 430" aria-hidden="true"></svg>
    <p class="board__head">DEPARTURES \u2014 NUSA &amp; NORTH</p>
    <div class="board__cols">
      <div class="board__col js-board-a"></div>
      <div class="board__col js-board-b"></div>
    </div>`;
  drawWorldBackdrop(alt.querySelector('.board__bg'));
  const colA = alt.querySelector('.js-board-a');
  const colB = alt.querySelector('.js-board-b');

  // Build every tile up front; ONE rAF loop drives all of them.
  // (One interval per tile — hundreds of timers — was thrashing
  // layout hard enough to stutter the scroll two acts away.)
  const jobs = [];
  const half = Math.ceil(BOARD_FILMS.length / 2);
  const rowEls = BOARD_FILMS.map(([film, status], i) => {
    const row = document.createElement('div');
    row.className = `board__row${status !== 'DELIVERED' ? ' board__row--boarding' : ''}`;
    const dest = document.createElement('span');
    dest.className = 'board__dest';
    const stat = document.createElement('span');
    stat.className = 'board__status';
    row.append(dest, stat);
    (i < half ? colA : colB).appendChild(row);

    const rowStart = 350 + i * 120;
    const prime = (holder, text) => {
      [...text].forEach((ch, t) => {
        const tile = document.createElement('i');
        tile.className = 'board__tile';
        tile.textContent = '\u00a0';
        holder.appendChild(tile);
        if (ch === ' ') {
          jobs.push({ tile, ch: '\u00a0', settleAt: rowStart, lastFlip: 0, done: false });
        } else {
          jobs.push({
            tile,
            ch,
            settleAt: rowStart + 260 + t * 55 + Math.random() * 180,
            lastFlip: 0,
            done: false,
          });
        }
      });
    };
    prime(dest, film);
    prime(stat, status);
    return { row, rowStart };
  });

  let raf = 0;
  let stopCounters = () => {};
  const io = onEnter(section, () => {
    if (prefersReducedMotion) {
      rowEls.forEach(({ row }) => row.classList.add('is-in'));
      jobs.forEach((job) => { job.tile.textContent = job.ch; job.done = true; });
      stopCounters = runCounters(section, 10);
      return;
    }
    const t0 = performance.now();
    rowEls.forEach(({ row, rowStart }) => setTimeout(() => row.classList.add('is-in'), rowStart));
    const tick = (now) => {
      const el = now - t0;
      let pending = false;
      for (const job of jobs) {
        if (job.done) continue;
        if (el >= job.settleAt) {
          job.tile.textContent = job.ch;
          job.done = true;
        } else {
          pending = true;
          // flutter only once it's close to landing, and gently —
          // ~12 glyph swaps per tile total, batched in this one frame
          if (el > job.settleAt - 700 && now - job.lastFlip > 70) {
            job.tile.textContent = FLAP_CHARS[(Math.random() * FLAP_CHARS.length) | 0];
            job.lastFlip = now;
          }
        }
      }
      if (pending) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    stopCounters = runCounters(section, 2400);
  }, 0.12);

  return () => {
    io.disconnect();
    cancelAnimationFrame(raf);
    stopCounters();
    alt.innerHTML = '';
  };
}

// ------------------------------------------------------------------
// MOCKUP 2 — the passport (entry stamps thud onto the page)
// ------------------------------------------------------------------
const STAMP_SHAPES = ['round', 'oval', 'rect', 'pill'];
const STAMP_TILTS = [-8, 6, -4, 11, -12, 3, 9, -6, 5, -10, 7, -3, 12, -7, 4, -11, 8, -5];
const STAMP_YEARS = ['2021', '2022', '2022', '2023', '2023', '2023', '2024', '2024', '2024',
  '2024', '2025', '2025', '2025', '2025', '2025', '2026', '2026', '2026'];

function buildPassport(section) {
  const alt = section.querySelector('.js-proof-alt');
  alt.innerHTML = '<div class="pass__spread js-pass-spread"></div><div class="pass__totals js-pass-totals"></div>';
  const spread = alt.querySelector('.js-pass-spread');
  const totalsRow = alt.querySelector('.js-pass-totals');

  const stamps = STOPS_META.map(([city], i) => {
    const el = document.createElement('div');
    const shape = STAMP_SHAPES[i % STAMP_SHAPES.length];
    const inkClass = i % 3 === 2 ? ' pass__stamp--ink' : '';
    el.className = `pass__stamp pass__stamp--${shape}${inkClass}`;
    el.style.setProperty('--tilt', `${STAMP_TILTS[i % STAMP_TILTS.length]}deg`);
    el.innerHTML = `<span class="pass__city">${city}</span><span class="pass__meta">NUSA &amp; NORTH \u00b7 ${STAMP_YEARS[i]}</span>`;
    spread.appendChild(el);
    return el;
  });

  const TOTALS = [['120+', 'FILMS'], ['40M+', 'VIEWS'], ['16', 'COUNTRIES'], ['25+', 'BRANDS']];
  const totalEls = TOTALS.map(([num, label], i) => {
    const el = document.createElement('div');
    el.className = 'pass__stamp pass__stamp--total';
    el.style.setProperty('--tilt', `${[-3, 2, -2, 3][i]}deg`);
    el.innerHTML = `<span class="pass__num">${num}</span><span class="pass__meta">${label}</span>`;
    totalsRow.appendChild(el);
    return el;
  });

  const timers = [];
  const io = onEnter(section, () => {
    stamps.forEach((el, i) => timers.push(setTimeout(() => el.classList.add('is-in'), 300 + i * 170)));
    totalEls.forEach((el, i) =>
      timers.push(setTimeout(() => el.classList.add('is-in'), 300 + stamps.length * 170 + 250 + i * 300))
    );
  });

  return () => {
    io.disconnect();
    timers.forEach(clearTimeout);
    alt.innerHTML = '';
  };
}

// ------------------------------------------------------------------
// MOCKUP 3 — the contact sheet (frames develop, grease pencil marks)
// ------------------------------------------------------------------
// pull real posters from the timeline where a clip matches the stop
const CONTACT_POSTERS = {
  LONDON: 'Bazaar', BASEL: 'Lucerne', FLORENCE: 'Florence', PRAGUE: 'Prague',
  FRANKFURT: 'Frankfurt', BERLIN: 'ITB', TALLINN: 'Tallinn', BANGKOK: 'Bangkok',
  HUE: 'Laguna', BALI: 'Anantara',
};
const CIRCLED = ['LONDON', 'FRANKFURT', 'BANGKOK', 'BALI'];

function buildContact(section) {
  const alt = section.querySelector('.js-proof-alt');
  alt.innerHTML = `
    <div class="sheet js-sheet"></div>
    <p class="sheet__tally hand js-sheet-tally">120+ films \u00b7 40M views \u00b7 16 countries \u00b7 25+ brands</p>`;
  const sheet = alt.querySelector('.js-sheet');

  const posterFor = (city) => {
    const key = CONTACT_POSTERS[city];
    if (!key) return null;
    const clip = [...document.querySelectorAll('.js-video-lane .clip')].find((c) =>
      (c.dataset.title || '').includes(key)
    );
    return clip?.dataset.poster || null;
  };

  const frames = STOPS_META.map(([city], i) => {
    const el = document.createElement('figure');
    el.className = 'sheet__frame';
    const poster = posterFor(city);
    el.innerHTML = `
      ${poster ? `<img src="${poster}" alt="" loading="lazy" />` : '<span class="sheet__blank">35MM</span>'}
      <figcaption>${String(i + 1).padStart(2, '0')} \u00b7 ${city}</figcaption>
      ${CIRCLED.includes(city) ? `
        <svg class="sheet__circle" viewBox="0 0 100 70" preserveAspectRatio="none" aria-hidden="true">
          <ellipse cx="50" cy="33" rx="44" ry="27" pathLength="100" />
        </svg>` : ''}`;
    sheet.appendChild(el);
    return el;
  });

  const timers = [];
  const io = onEnter(section, () => {
    frames.forEach((el, i) => timers.push(setTimeout(() => el.classList.add('is-in'), 250 + i * 130)));
    timers.push(
      setTimeout(() => alt.querySelector('.js-sheet-tally').classList.add('is-in'),
        250 + frames.length * 130 + 400)
    );
  });

  return () => {
    io.disconnect();
    timers.forEach(clearTimeout);
    alt.innerHTML = '';
  };
}
