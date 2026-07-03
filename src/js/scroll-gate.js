// Single registration point for Lenis's `virtualScroll` option.
// A section can install a gate to inspect/modify wheel+touch deltas
// before Lenis integrates them (e.g. the cinema's card walls).

let gate = null;

export function setScrollGate(fn) {
  gate = fn;
}

export function clearScrollGate(fn) {
  if (gate === fn) gate = null;
}

// passed to `new Lenis({ virtualScroll: applyGate })`
export function applyGate(data) {
  return gate ? gate(data) : true;
}
