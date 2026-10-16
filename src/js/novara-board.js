// Scoped Novara adaptation of the original Nusa & North departures board.
// World geometry, flight manifest and letter-settling choreography are copied
// from src/js/proof.js. The original desktop hold and replay-on-return are
// scoped to this stage; the source module and its global palette stay untouched.
const mounted = new WeakMap();

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


function drawWorldBackdrop(svg) {
  const dots = make('g', { class: 'nb-dots' }, svg);
  for (let lat = LAT_BOT + 2; lat <= LAT_TOP; lat += 3) {
    for (let lon = -178; lon <= 180; lon += 3.4) {
      if (LAND.some((p) => inPoly(lon, lat, p))) {
        make('circle', { cx: px(lon).toFixed(1), cy: py(lat).toFixed(1), r: 1.5 }, dots);
      }
    }
  }
  const stops = [...CITIES, NEXT_STOP].map((c) => ({ ...c, x: px(c.lon), y: py(c.lat) }));
  const fullD = stops.slice(0, -1).map((a, i) => arcSegment(a, stops[i + 1]).d).join(' ');
  make('path', { d: fullD, class: 'nb-route-trail' }, svg);
  stops.forEach((c) => make('circle', { cx: c.x, cy: c.y, r: 2.4, class: 'nb-bg-stop' }, svg));
}


const FLAP_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// The filmography as flights — every delivery that landed.
const BOARD_FILMS = [
  ['RADISSON BERLIN', 'DELIVERED'],
  ['RADISSON RED INNSBRUCK', 'DELIVERED'],
  ['VISIT TALLINN', 'DELIVERED'],
  ['INSTA360 LUNA ULTRA', 'DELIVERED'],
  ['RADISSON VILNIUS', 'DELIVERED'],
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
];

// These are the approved figures in the original index.html, rather than
// the superseded figures inside its unused passport/contact variants.
const TOTALS = [
  { count: 120, suffix: '+', label: 'FILMS DELIVERED' },
  { count: 17, suffix: 'M+', label: 'VIEWS ACROSS PLATFORMS' },
  { count: 16, suffix: '', label: 'COUNTRIES FILMED' },
  { count: 15, suffix: '+', label: 'BRANDS TRUSTED US' },
];

/** Mount the original split-flap choreography; return its teardown. */
export function mountNovaraBoard(host) {
  if (!host) return () => {};
  mounted.get(host)?.();
  const hadClass = host.classList.contains('novara-board');
  host.classList.add('novara-board');
  const stage = document.createElement('div');
  stage.className = 'nb-stage';
  stage.innerHTML = `
    <div class="nb-alt">
      <svg class="nb-bg" viewBox="0 0 1000 430" aria-hidden="true" focusable="false"></svg>
      <h2 class="nb-head">DEPARTURES — NUSA &amp; NORTH</h2>
      <div class="nb-cols" role="list" aria-label="Films delivered">
        <div class="nb-col" role="presentation"></div>
        <div class="nb-col" role="presentation"></div>
      </div>
    </div>
    <div class="nb-totals" role="list" aria-label="The delivery totals"></div>
    <p class="nb-foot">EVERY NUMBER IS A STORY THAT FOUND ITS AUDIENCE</p>`;
  host.append(stage);
  drawWorldBackdrop(stage.querySelector('.nb-bg'));

  const columns = stage.querySelectorAll('.nb-col');
  const jobs = [];
  const half = Math.ceil(BOARD_FILMS.length / 2);
  const rows = BOARD_FILMS.map(([film, status], index) => {
    const row = document.createElement('div');
    row.className = 'nb-row';
    row.setAttribute('role', 'listitem');
    row.setAttribute('aria-label', `${film} — ${status.toLowerCase()}`);
    const destination = document.createElement('span');
    destination.className = 'nb-dest';
    destination.setAttribute('aria-hidden', 'true');
    const statusElement = document.createElement('span');
    statusElement.className = 'nb-status';
    statusElement.setAttribute('aria-hidden', 'true');
    row.append(destination, statusElement);
    columns[index < half ? 0 : 1].append(row);

    const rowStart = 350 + index * 120;
    const prime = (holder, text) => {
      [...text].forEach((character, position) => {
        const tile = document.createElement('i');
        tile.className = 'nb-tile';
        const char = character === ' ' ? '\u00a0' : character;
        tile.textContent = char;
        holder.append(tile);
        jobs.push({
          tile,
          char,
          settleAt: character === ' ' ? rowStart : rowStart + 260 + position * 55 + Math.random() * 180,
          lastFlip: 0,
          done: false,
        });
      });
    };
    prime(destination, film);
    prime(statusElement, status);
    return { row, rowStart, shown: false };
  });

  const totals = TOTALS.map(total => {
    const element = document.createElement('div');
    element.className = 'nb-stat';
    element.setAttribute('role', 'listitem');
    element.setAttribute('aria-label', `${total.count}${total.suffix} ${total.label.toLowerCase()}`);
    const number = document.createElement('span');
    number.className = 'nb-num';
    number.setAttribute('aria-hidden', 'true');
    number.textContent = `${total.count}${total.suffix}`;
    const label = document.createElement('span');
    label.className = 'nb-label';
    label.setAttribute('aria-hidden', 'true');
    label.textContent = total.label;
    element.append(number, label);
    stage.querySelector('.nb-totals').append(element);
    return { ...total, number, lastValue: total.count };
  });

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const coarse = matchMedia('(pointer: coarse)');
  let destroyed = false, visible = false, eligible = false;
  let running = false, complete = false;
  let raf = 0, elapsed = 0, lastTime = 0;
  let observer = null, pin = null, resizeFrame = 0;
  const stop = () => { cancelAnimationFrame(raf); raf = 0; lastTime = 0; };

  const setCounters = progress => {
    const eased = 1 - Math.pow(1 - Math.min(1, progress), 3);
    totals.forEach(total => {
      const value = Math.round(total.count * eased);
      if (value === total.lastValue) return;
      total.number.textContent = `${value}${total.suffix}`;
      total.lastValue = value;
    });
  };

  function finish() {
    stop();
    jobs.forEach(job => { job.tile.textContent = job.char; job.done = true; });
    rows.forEach(entry => { entry.row.classList.add('is-in'); entry.shown = true; });
    setCounters(1);
    complete = true;
    stage.dataset.boardState = 'complete';
  }

  function resetShow() {
    stop();
    elapsed = 0;
    running = false;
    complete = false;
    jobs.forEach(job => {
      job.tile.textContent = '\u00a0';
      job.done = false;
      job.lastFlip = 0;
    });
    rows.forEach(entry => {
      entry.row.classList.remove('is-in');
      entry.shown = false;
    });
    totals.forEach(total => {
      total.number.textContent = '0';
      total.lastValue = null;
    });
    stage.dataset.boardState = 'waiting';
  }

  function tick(now) {
    raf = 0;
    if (destroyed || !visible || document.hidden || complete) { lastTime = 0; return; }
    elapsed += lastTime ? Math.min(100, now - lastTime) : 1000 / 60;
    lastTime = now;
    rows.forEach(entry => {
      if (!entry.shown && elapsed >= entry.rowStart) {
        entry.row.classList.add('is-in');
        entry.shown = true;
      }
    });
    let pending = false;
    for (const job of jobs) {
      if (job.done) continue;
      if (elapsed >= job.settleAt) {
        job.tile.textContent = job.char;
        job.done = true;
      } else {
        pending = true;
        // Original flutter cadence: roughly twelve glyph changes, fixed-width
        // tiles, all batched into this single shared animation frame.
        if (elapsed > job.settleAt - 700 && now - job.lastFlip > 70) {
          job.tile.textContent = FLAP_CHARS[(Math.random() * FLAP_CHARS.length) | 0];
          job.lastFlip = now;
        }
      }
    }
    setCounters(elapsed / 2400);
    if (pending || elapsed < 2400) raf = requestAnimationFrame(tick);
    else finish();
  }

  function start() {
    if (destroyed || document.hidden || !visible || complete || raf) return;
    if (reduced.matches) { finish(); return; }
    // Once underway, the original show continues below the entrance threshold.
    // Only leaving the screen resets it; returning starts the full sequence.
    if (!running && !eligible) return;
    running = true;
    stage.dataset.boardState = 'flipping';
    lastTime = 0;
    raf = requestAnimationFrame(tick);
  }

  function visibility() {
    if (document.hidden) stop();
    else start();
  }
  function motionChange() {
    if (reduced.matches) finish();
    else resetShow();
    configureEntrance();
  }

  if (reduced.matches) finish();
  else resetShow();

  function configureEntrance() {
    if (destroyed) return;
    observer?.disconnect();
    pin?.kill();
    pin = null;
    const touch = window.innerWidth < 768 || coarse.matches;
    const viewportHeight = window.innerHeight;
    const stageHeight = stage.getBoundingClientRect().height;
    // Original desktop entrance: almost the entire board is in view. On short
    // screens use 90% of the visible viewport so an oversized stage can enter.
    const enterAt = touch ? .12 : Math.min(.9, .9 * viewportHeight / Math.max(1, stageHeight));
    const scrollTrigger = window.ScrollTrigger;

    // Use Novara's already-loaded GSAP instance. The original one-viewport hold
    // gives the timed cascade room to play; touch and oversized stages flow.
    if (!touch && !reduced.matches && stageHeight <= viewportHeight + 1 && scrollTrigger) {
      pin = scrollTrigger.create({
        trigger: stage,
        start: 'top top',
        end: '+=100%',
        pin: true,
        invalidateOnRefresh: true,
      });
    }
    stage.dataset.boardPinned = String(Boolean(pin));
    if (import.meta.env.DEV) window.__novaraBoardPin = pin;

    observer = new IntersectionObserver(entries => {
      if (destroyed) return;
      entries.forEach(entry => {
        visible = entry.isIntersecting;
        eligible = visible && entry.intersectionRatio >= enterAt;
        if (reduced.matches) return;
        if (!visible) {
          if (running || complete) resetShow();
          else stop();
        } else start();
      });
    }, { threshold: [0, enterAt] });
    observer.observe(touch ? host : stage);
    // The template creates its downstream triggers before this module mounts.
    // Sort them into document order before accounting for this pin's spacer.
    scrollTrigger?.sort();
    scrollTrigger?.refresh();
  }

  const queueEntrance = () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = 0;
      configureEntrance();
    });
  };
  configureEntrance();
  document.fonts?.ready.then(() => { if (!destroyed) configureEntrance(); });
  document.addEventListener('visibilitychange', visibility);
  reduced.addEventListener('change', motionChange);
  coarse.addEventListener('change', queueEntrance);
  window.addEventListener('resize', queueEntrance);

  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    stop();
    cancelAnimationFrame(resizeFrame);
    observer?.disconnect();
    pin?.kill();
    if (import.meta.env.DEV && window.__novaraBoardPin === pin) delete window.__novaraBoardPin;
    document.removeEventListener('visibilitychange', visibility);
    reduced.removeEventListener('change', motionChange);
    coarse.removeEventListener('change', queueEntrance);
    window.removeEventListener('resize', queueEntrance);
    stage.remove();
    if (!hadClass) host.classList.remove('novara-board');
    if (mounted.get(host) === destroy) mounted.delete(host);
  };
  mounted.set(host, destroy);
  return destroy;
}

