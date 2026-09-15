import gsap from 'gsap';

let overlay, lastTrigger, sourceFrame, animation;
let phase = 'closed';
let savedOverflow = '';
let inertStates = [];
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function embedUrl(url) {
  const vimeo = url.match(/vimeo\.com\/(\d+)(?:\/([a-z0-9]+))?/i);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}?${vimeo[2] ? `h=${vimeo[2]}&` : ''}autoplay=1&title=0&byline=0&portrait=0`;
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/i);
  return yt ? `https://www.youtube.com/embed/${yt[1]}?autoplay=1&rel=0` : null;
}
function ensureOverlay() {
  if (overlay) return overlay;
  overlay = document.createElement('div');
  overlay.className = 'lightbox';
  overlay.inert=true;overlay.setAttribute('aria-hidden','true');
  overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','Film player');
  overlay.innerHTML = `<div class="lightbox__backdrop"></div><div class="lightbox__frame"><button class="lightbox__close" type="button" aria-label="Close player">×</button><div class="lightbox__player"></div><img class="lightbox__transition-poster" alt=""></div>`;
  document.body.append(overlay);
  overlay.querySelector('.lightbox__backdrop').addEventListener('click',closeLightbox);
  overlay.querySelector('.lightbox__close').addEventListener('click',closeLightbox);
  window.addEventListener('keydown',e=>{
    if(phase==='closed')return;
    if(e.key==='Escape')closeLightbox();
    if(e.key==='Tab'){
      const close=overlay.querySelector('button'),frame=overlay.querySelector('iframe');
      if(e.shiftKey&&document.activeElement===close){e.preventDefault();frame?.focus();}
      else if(!e.shiftKey&&document.activeElement===frame){e.preventDefault();close.focus();}
    }
  });
  return overlay;
}
function visibleRect(el) {
  if(!el?.isConnected)return null;
  const r=el.getBoundingClientRect();
  return r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth?r:null;
}
function frameTransform(rect, frame) {
  return {x:rect.left-(innerWidth-frame.offsetWidth)/2,y:rect.top-(innerHeight-frame.offsetHeight)/2,scaleX:rect.width/frame.offsetWidth,scaleY:rect.height/frame.offsetHeight};
}
export function openLightbox(watchUrl,triggerEl=null) {
  const src=embedUrl(watchUrl);if(!src||phase!=='closed')return;
  phase='opening';lastTrigger=triggerEl;
  // Timeline clips expand through the programme monitor; postcards and selected films expand themselves.
  sourceFrame=triggerEl?.classList.contains('clip')?document.querySelector('.js-monitor-media'):triggerEl;
  const origin=visibleRect(sourceFrame);
  const posterSrc=sourceFrame?.querySelector('img')?.currentSrc||sourceFrame?.dataset.poster;
  const el=ensureOverlay(),frame=el.querySelector('.lightbox__frame'),poster=el.querySelector('.lightbox__transition-poster'),player=el.querySelector('.lightbox__player');
  player.replaceChildren();poster.removeAttribute('src');
  if(posterSrc)poster.src=posterSrc;
  gsap.set(poster,{opacity:posterSrc?1:0});
  window.__lenis?.stop();savedOverflow=document.documentElement.style.overflow;document.documentElement.style.overflow='hidden';
  inertStates=[...document.body.children].filter(child=>child!==el).map(child=>[child,child.inert]);inertStates.forEach(([child])=>child.inert=true);
  el.inert=false;el.removeAttribute('aria-hidden');
  el.classList.add('is-open');gsap.set(el,{opacity:1});gsap.set(frame,{clearProps:'transform',transformOrigin:'0 0'});
  const iframe=document.createElement('iframe');iframe.title='Nusa & North film';iframe.allow='autoplay; fullscreen; picture-in-picture';iframe.allowFullscreen=true;
  let loaded=false;
  const reveal=()=>{if(loaded&&phase==='open')gsap.to(poster,{opacity:0,duration:.35});};
  iframe.addEventListener('load',()=>{loaded=true;reveal();},{once:true});iframe.src=src;player.append(iframe);
  const duration=reduced()?.01:.8;
  animation=gsap.timeline({onComplete:()=>{phase='open';reveal();}});
  animation.fromTo(el.querySelector('.lightbox__backdrop'),{opacity:0},{opacity:1,duration:duration*.8},0);
  animation.fromTo(frame,origin?frameTransform(origin,frame):{scaleX:.94,scaleY:.94,opacity:0},{x:0,y:0,scaleX:1,scaleY:1,opacity:1,duration,ease:'power3.inOut'},0);
  animation.fromTo(el.querySelector('.lightbox__close'),{opacity:0},{opacity:1,duration:.2},duration*.65);
  el.querySelector('button').focus({preventScroll:true});
}
export function closeLightbox() {
  if(phase==='closed'||phase==='closing')return;
  phase='closing';animation?.kill();
  const frame=overlay.querySelector('.lightbox__frame'),poster=overlay.querySelector('.lightbox__transition-poster');
  gsap.killTweensOf(poster);
  overlay.querySelector('.lightbox__player').replaceChildren();
  gsap.set(poster,{opacity:poster.getAttribute('src')?1:0});
  const destination=visibleRect(sourceFrame),duration=reduced()?.01:.65;
  animation=gsap.timeline({onComplete:()=>{
    overlay.inert=true;overlay.setAttribute('aria-hidden','true');
    overlay.classList.remove('is-open');gsap.set([overlay,frame,poster],{clearProps:'all'});
    inertStates.forEach(([child,state])=>child.inert=state);inertStates=[];
    document.documentElement.style.overflow=savedOverflow;window.__lenis?.start();
    lastTrigger?.focus?.({preventScroll:true});lastTrigger=null;sourceFrame=null;phase='closed';
  }});
  animation.to(overlay.querySelector('.lightbox__close'),{opacity:0,duration:.1},0);
  animation.to(frame,destination?{...frameTransform(destination,frame),duration,ease:'power3.inOut'}:{opacity:0,scaleX:.96,scaleY:.96,duration},0);
  animation.to(overlay.querySelector('.lightbox__backdrop'),{opacity:0,duration},0);
}
