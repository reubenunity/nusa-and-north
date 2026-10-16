// Exact HorizonX Shader R shader and renderer from /horizonx/shader-r.html.
// Only the attachment lifecycle is adapted for one decorative homepage layer.
let mounted = null;

// Original procedural mesh: moving Gaussian color fields with a warped domain.
// Shared by the editor, raster/video exports and standalone web packs.
const vertex = `attribute vec2 position;void main(){gl_Position=vec4(position,0.,1.);}`;
const fragment = `
precision highp float;
uniform vec2 resolution;
uniform float time, scale, distortion, grain, contrast;
uniform vec3 white, dark, orange;
float weight(vec2 p, vec2 c, float width) { vec2 d=p-c; return exp(-dot(d,d)/width); }
float noise(vec2 p) { return fract(sin(dot(p,vec2(12.98979,78.2329)))*43758.54529); }
void main(){
  vec2 uv=gl_FragCoord.xy/resolution;
  vec2 p=(uv-.500001)*scale+.5;
  float t=time*.480001;
  p+=distortion*.120001*vec2(sin(p.y*5.+t),cos(p.x*4.-t*.799999));
  vec2 a=vec2(.439999+.25*(cos(t+1.30001)-cos(1.29999)),.88+.400001*(sin(t+1.3)-sin(1.30001)));
  vec2 b=vec2(.749999+.100001*sin(t),.159999+.599999*sin(t));
  vec2 c=vec2(.899999+.099999*sin(t),.859999-.65*sin(t));
  vec2 d=vec2(.119999+.159999*sin(t*.799999),.119999+.169999*cos(t));
  vec4 w=vec4(2.8*weight(p,c,.13)+1.40001*weight(p,vec2(-.119999,1.15),.0649999),weight(p,d,.200001),weight(p,b,.100001),weight(p,a,.0900001));
  vec3 color=(dark*w.x+orange*(w.y+w.z)+white*w.w)/dot(w,vec4(1.));
  color=(color-.5)*contrast+.499999;
  color+=(noise(gl_FragCoord.xy)-.5)*grain*.18;
  gl_FragColor=vec4(clamp(color,0.,1.),1.);
}`;

function createShaderRRenderer(canvas) {
  const gl=canvas.getContext('webgl',{alpha:false,antialias:false,powerPreference:'low-power',preserveDrawingBuffer:true});
  if(!gl) throw new Error('Shader R requires WebGL. Enable hardware acceleration and reload.');
  const shaders=[]; let program, buffer;
  const destroy=()=>{ shaders.forEach(s=>gl.deleteShader(s)); if(buffer)gl.deleteBuffer(buffer); if(program)gl.deleteProgram(program); };
  try {
    const compile=(type,source)=>{
      const shader=gl.createShader(type); shaders.push(shader); gl.shaderSource(shader,source); gl.compileShader(shader);
      if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw new Error('Shader R could not compile.');
      return shader;
    };
    program=gl.createProgram();
    gl.attachShader(program,compile(gl.VERTEX_SHADER,vertex)); gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragment)); gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('Shader R could not initialize.');
    gl.useProgram(program);
    buffer=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
    const attr=gl.getAttribLocation(program,'position'); gl.enableVertexAttribArray(attr); gl.vertexAttribPointer(attr,2,gl.FLOAT,false,0,0);
    const uniforms=Object.fromEntries(['resolution','time','scale','distortion','grain','contrast','white','dark','orange'].map(key=>[key,gl.getUniformLocation(program,key)]));
    return {
      draw(config,time,width,height){
        if(gl.isContextLost())throw new Error('The graphics context was interrupted.');
        if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
        gl.viewport(0,0,width,height);gl.useProgram(program);
        gl.uniform2f(uniforms.resolution,width,height);gl.uniform1f(uniforms.time,time*config.speed);
        for(const key of ['scale','distortion','grain','contrast'])gl.uniform1f(uniforms[key],config[key]);
        for(const key of ['white','dark','orange']){
          const hex=config[key].slice(1);gl.uniform3f(uniforms[key],parseInt(hex.slice(0,2),16)/255,parseInt(hex.slice(2,4),16)/255,parseInt(hex.slice(4,6),16)/255);
        }
        gl.drawArrays(gl.TRIANGLES,0,6);
      },destroy
    };
  }catch(error){destroy();throw error;}
}

const CONFIG = Object.freeze({
  viewportWidth: 1920,
  viewportHeight: 1080,
  fixedFrame: true,
  white: '#ffffff',
  dark: '#101010',
  orange: '#e8362b',
  scale: 1,
  distortion: .650001,
  grain: .399999,
  contrast: 1.08001,
  speed: 1,
  animate: 'on',
});

const PALETTES = Object.freeze([
  { id: 'red', name: 'Brand red', white: '#ffffff', dark: '#101010', orange: '#e8362b' },
  { id: 'burgundy', name: 'Burgundy', white: '#f3e9dc', dark: '#100c0d', orange: '#7c2937' },
  { id: 'petrol', name: 'Petrol', white: '#edf0e9', dark: '#0b1012', orange: '#245665' },
  { id: 'amber', name: 'Amber', white: '#f5ecdc', dark: '#120e0b', orange: '#b16b34' },
  { id: 'forest', name: 'Forest green', white: '#6e927e', dark: '#08110d', orange: '#285446' },
  { id: 'amber-petrol', name: 'Amber + Petrol', white: '#dca064', dark: '#081214', orange: '#246071', swatch: 'linear-gradient(135deg, #dca064 0% 48%, #246071 52% 100%)' },
  { id: 'burgundy-copper', name: 'Burgundy + Copper', white: '#d79a6d', dark: '#10090b', orange: '#6f2334', swatch: 'linear-gradient(135deg, #6f2334 0% 48%, #d79a6d 52% 100%)' },
  { id: 'midnight-violet', name: 'Midnight + Violet', white: '#927ac2', dark: '#080b17', orange: '#243866', swatch: 'linear-gradient(135deg, #243866 0% 48%, #927ac2 52% 100%)' },
  { id: 'forest-champagne', name: 'Forest + Champagne', white: '#d4c29a', dark: '#09110d', orange: '#285446', swatch: 'linear-gradient(135deg, #285446 0% 48%, #d4c29a 52% 100%)' },
  { id: 'indigo-coral', name: 'Indigo + Coral', white: '#d77c72', dark: '#0c0b17', orange: '#34365f', swatch: 'linear-gradient(135deg, #34365f 0% 48%, #d77c72 52% 100%)' },
]);
const DEFAULT_PALETTE = 'amber-petrol';

/** Add one fixed decorative canvas behind the Novara homepage; return cleanup. */
export function mountNovaraBackground({ surface = 'dark' } = {}) {
  mounted?.();
  const body = document.body;
  if (!body) return () => {};
  const layer = document.createElement('div');
  layer.className = 'novara-shader-r';
  layer.setAttribute('aria-hidden', 'true');
  layer.inert = true;
  const canvas = document.createElement('canvas');
  canvas.className = 'novara-shader-r-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.setAttribute('role', 'presentation');
  layer.append(canvas);
  body.prepend(layer);

  const lightSurface = surface === 'light';
  layer.dataset.surface = surface;
  const requestedPalette = lightSurface ? DEFAULT_PALETTE : new URLSearchParams(window.location.search).get('palette');
  let palette = PALETTES.find(option => option.id === requestedPalette) || PALETTES.find(option => option.id === DEFAULT_PALETTE);
  const configFor = palette => lightSurface
    ? { ...CONFIG, white: '#e4b580', dark: '#e8e7dd', orange: '#78a6b0', grain: .2, contrast: 1, speed: .55 }
    : { ...CONFIG, white: palette.white, dark: palette.dark, orange: palette.orange };
  let config = configFor(palette);
  layer.dataset.palette = palette.id;

  // A local concept control. It changes uniforms on the existing renderer;
  // no stored preference, canvas replacement or additional render loop.
  const colourPreview = document.createElement('div');
  colourPreview.className = 'novara-colour-preview';
  colourPreview.style.setProperty('--preview-colour', palette.swatch || palette.orange);
  colourPreview.innerHTML = `
    <button class="ncp-toggle" type="button" aria-expanded="false" aria-controls="novara-palette-panel">
      <span class="ncp-current" aria-hidden="true"></span>Colour preview
    </button>
    <div class="ncp-panel" id="novara-palette-panel" hidden>
      <fieldset>
        <legend>Background colour</legend>
        <p class="ncp-note">Temporary colour study</p>
        <div class="ncp-options">
        ${PALETTES.map(option => `
          <label class="ncp-option">
            <input type="radio" name="novara-background-palette" value="${option.id}"${option.id === palette.id ? ' checked' : ''}>
            <span class="ncp-swatch" style="--swatch: ${option.swatch || option.orange}" aria-hidden="true"></span>
            <span class="ncp-name">${option.name}</span>
            <span class="ncp-check" aria-hidden="true">✓</span>
          </label>`).join('')}
        </div>
      </fieldset>
    </div>`;
  if (!lightSurface && import.meta.env.DEV) body.append(colourPreview);
  const toggle = colourPreview.querySelector('.ncp-toggle');
  const panel = colourPreview.querySelector('.ncp-panel');
  const paletteInputs = [...colourPreview.querySelectorAll('input')];

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const hero = document.querySelector('.hero');
  const heroMedia = hero?.querySelector('.hero-media');
  const cleanups = [];
  const frameInterval = 1000 / 30;
  let renderer = null, destroyed = false, lost = false, failed = false;
  let frame = 0, refreshFrame = 0, lastDraw = 0, time = 0;
  let width = 1, height = 1, covered = false, pageHidden = false;
  const on = (target, type, listener, options) => {
    target?.addEventListener(type, listener, options);
    cleanups.push(() => target?.removeEventListener(type, listener, options));
  };
  const state = value => { if (layer.dataset.shaderState !== value) layer.dataset.shaderState = value; };
  const cancel = () => { cancelAnimationFrame(frame); frame = 0; lastDraw = 0; };

  function readSizeAndCoverage() {
    const viewportWidth = Math.max(1, window.innerWidth);
    const viewportHeight = Math.max(1, window.innerHeight);
    // One CSS pixel per rendered pixel at most; also bound very large and
    // unusually tall viewports so the background never becomes a 4K render.
    const ratio = Math.min(
      1,
      window.devicePixelRatio || 1,
      1440 / viewportWidth,
      1080 / viewportHeight,
      Math.sqrt(1200000 / (viewportWidth * viewportHeight)),
    );
    const nextWidth = Math.max(1, Math.round(viewportWidth * ratio));
    const nextHeight = Math.max(1, Math.round(viewportHeight * ratio));
    const resized = width !== nextWidth || height !== nextHeight;
    width = nextWidth;
    height = nextHeight;
    const wasCovered = covered;
    if (hero && heroMedia) {
      const rect = hero.getBoundingClientRect();
      // Both its video and reduced-motion poster are opaque full-frame media.
      covered = false; // The hero fades into the shared shader, so its lower edge stays live.
    } else covered = false;
    return { resized, coverageChanged: covered !== wasCovered };
  }

  function drawable() {
    return !destroyed && !lost && !failed && renderer && !document.hidden && !pageHidden && !covered;
  }

  function draw() {
    if (!drawable()) return false;
    try {
      renderer.draw(config, reduced.matches ? 0 : time, width, height);
      body.classList.add('novara-shader-active');
      layer.hidden = false;
      return true;
    } catch {
      // A decorative effect should never replace the site with an error.
      failed = true;
      cancel();
      layer.hidden = true;
      body.classList.remove('novara-shader-active');
      state('fallback');
      return false;
    }
  }

  function schedule() {
    if (drawable() && !reduced.matches && !frame) frame = requestAnimationFrame(tick);
  }

  function tick(now) {
    frame = 0;
    if (!drawable() || reduced.matches) { lastDraw = 0; return; }
    if (!lastDraw || now - lastDraw >= frameInterval - .5) {
      if (lastDraw) time += Math.min((now - lastDraw) / 1000, .1);
      lastDraw = now;
      if (!draw()) return;
    }
    schedule();
  }

  function refresh(force = false) {
    if (destroyed) return;
    const { resized, coverageChanged } = readSizeAndCoverage();
    if (!drawable()) {
      cancel();
      if (!failed && !lost) state(covered ? 'covered-by-hero' : 'paused');
      return;
    }
    if (reduced.matches) {
      cancel();
      if (force || resized || coverageChanged || !body.classList.contains('novara-shader-active')) draw();
      if (!failed) state('static');
      return;
    }
    if (force || resized || coverageChanged || !lastDraw) {
      if (!draw()) return;
      lastDraw = performance.now();
    }
    state('animated');
    schedule();
  }

  function queueRefresh() {
    if (destroyed || refreshFrame) return;
    refreshFrame = requestAnimationFrame(() => { refreshFrame = 0; refresh(); });
  }

  function initialize() {
    failed = false;
    try {
      renderer = createShaderRRenderer(canvas);
      refresh(true);
    } catch {
      failed = true;
      layer.hidden = true;
      body.classList.remove('novara-shader-active');
      state('fallback');
    }
  }

  function closePreview(restoreFocus = false) {
    panel.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    if (restoreFocus) toggle.focus({ preventScroll: true });
  }

  on(toggle, 'click', () => {
    if (!panel.hidden) { closePreview(); return; }
    panel.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    paletteInputs.find(input => input.checked)?.focus({ preventScroll: true });
  });
  paletteInputs.forEach(input => on(input, 'change', () => {
    if (!input.checked) return;
    palette = PALETTES.find(option => option.id === input.value);
    config = configFor(palette);
    layer.dataset.palette = palette.id;
    colourPreview.style.setProperty('--preview-colour', palette.swatch || palette.orange);
    refresh(true);
  }));
  on(colourPreview, 'keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) {
      event.preventDefault();
      closePreview(true);
    }
  });
  on(colourPreview, 'focusout', event => {
    if (event.relatedTarget && !colourPreview.contains(event.relatedTarget)) closePreview();
  });
  on(document, 'pointerdown', event => {
    if (!panel.hidden && !colourPreview.contains(event.target)) closePreview();
  });

  on(window, 'resize', queueRefresh, { passive: true });
  on(window, 'scroll', queueRefresh, { passive: true });
  on(document, 'visibilitychange', () => refresh(true));
  on(reduced, 'change', () => { cancel(); refresh(true); });
  on(window, 'pagehide', () => { pageHidden = true; cancel(); });
  on(window, 'pageshow', () => { pageHidden = false; refresh(true); });
  on(document, 'novara:layout', queueRefresh);
  on(canvas, 'webglcontextlost', event => {
    event.preventDefault();
    lost = true;
    cancel();
    layer.hidden = true;
    body.classList.remove('novara-shader-active');
    state('context-lost');
  });
  on(canvas, 'webglcontextrestored', () => {
    if (destroyed) return;
    lost = false;
    renderer?.destroy();
    renderer = null;
    initialize();
  });

  // This observer matters on mobile when the visual viewport changes without
  // a window resize; it does not create a second rendering loop.
  const resizeObserver = new ResizeObserver(queueRefresh);
  resizeObserver.observe(layer);
  initialize();

  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    cancel();
    cancelAnimationFrame(refreshFrame);
    resizeObserver.disconnect();
    cleanups.forEach(cleanup => cleanup());
    renderer?.destroy();
    renderer = null;
    layer.remove();
    colourPreview.remove();
    body.classList.remove('novara-shader-active');
    if (mounted === destroy) mounted = null;
  };
  mounted = destroy;
  return destroy;
}

