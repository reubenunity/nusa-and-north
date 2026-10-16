import './styles/lightbox.css';
import { films } from './js/review-films-data.js';
import { openNovaraLightbox as openLightbox, mountNovaraMediaConsent } from './js/novara-media-consent.js';
import './styles/novara-board.css';
import { mountNovaraBoard } from './js/novara-board.js';
import { mountNovaraSlideshow } from './js/novara-slideshow.js';
import { mountNovaraCraft } from './js/novara-craft.js';
import { mountNovaraFeedback } from './js/novara-feedback.js';
import './styles/novara-feedback.css';
import './styles/novara-background.css';
import { mountNovaraBackground } from './js/novara-background.js';
import { mountNovaraServices } from './js/novara-services.js';
import { mountNovaraMenu } from './js/novara-menu.js';
import './styles/novara-home-light.css';
import './styles/hero.css';
import './styles/novara-hero.css';
import { mountNovaraHero } from './js/novara-hero.js';
import { mountNovaraDusk } from './js/novara-dusk.js';

// Preserve film links shared by the previous public site.
const linkedFilm = new URLSearchParams(location.search).get('film');
if (import.meta.env.PROD && films.some(film => film.slug === linkedFilm)) {
  location.replace(`/film/${encodeURIComponent(linkedFilm)}/`);
}

mountNovaraMediaConsent();
const destroyBackground=mountNovaraBackground({ surface: 'light' });
const destroyServices=mountNovaraServices(document.querySelector('.about .tags'));
const destroyCraft=mountNovaraCraft(document.querySelector('#craft'));
const destroyFeedback=mountNovaraFeedback(document.querySelector('#feedback'));
document.querySelector('.nc-sound').id='sound';
document.querySelector('.nc-social').id='social';
const refreshLayout=()=>{
  const st=window.ScrollTrigger;
  if(!st)return;
  st.sort((a,b)=>a.trigger===b.trigger?0:(a.trigger.compareDocumentPosition(b.trigger)&Node.DOCUMENT_POSITION_FOLLOWING?-1:1));
  st.refresh();
};
document.addEventListener('novara:layout',refreshLayout);
const destroyHero=mountNovaraHero();

const destroyBoard=mountNovaraBoard(document.querySelector('#proof'));
const destroySlideshow=mountNovaraSlideshow(document.querySelector('#locations'));
const destroyDusk=mountNovaraDusk();

// Wire real content to Novara's existing controls. Its layout and scroll
// choreography stay in the original inline script in novara.html.
document.querySelectorAll('[data-film]').forEach(button=>{
  const film=films.find(f=>f.slug===button.dataset.film);
  if(film)button.addEventListener('click',()=>openLightbox(film.src,button));
});
const menu=document.querySelector('#site-menu'),open=document.querySelector('.nav-grid');
const destroyMenu=mountNovaraMenu(menu);
let savedOverflow='';
open.addEventListener('click',()=>{savedOverflow=document.documentElement.style.overflow;menu.showModal();document.documentElement.style.overflow='hidden';open.setAttribute('aria-expanded','true');});
menu.querySelector('.menu-close').addEventListener('click',()=>menu.close());
menu.addEventListener('close',()=>{document.documentElement.style.overflow=savedOverflow;open.setAttribute('aria-expanded','false');open.focus({preventScroll:true});});
menu.addEventListener('click',event=>{const r=menu.getBoundingClientRect();if(event.target===menu&&(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom))menu.close();});
menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>menu.close()));

const reduced=matchMedia('(prefers-reduced-motion: reduce)'),video=document.querySelector('.hero-media video');
let visible=false,paused=false,manual=false;
const motionButton=document.createElement('button');motionButton.className='motion-setting';menu.append(motionButton);
function syncVideo(){
  const enabled=!paused&&(!reduced.matches||manual);
  video.classList.toggle('manual-motion',manual);
  if(visible&&!document.hidden&&enabled)video.play().catch(()=>{});else video.pause();
  motionButton.textContent=enabled?'Pause background film':'Play background film';
}
motionButton.addEventListener('click',()=>{if(reduced.matches&&!manual){manual=true;paused=false;}else paused=!paused;syncVideo();});
const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;syncVideo();});observer.observe(video);
document.addEventListener('visibilitychange',syncVideo);
reduced.addEventListener('change',()=>location.reload());
syncVideo();

// The source animates a translated six-card track. Keep keyboard navigation
// in sync with the page's pinned scroll instead of clipping later links.
document.querySelectorAll('.card-link').forEach(link=>link.addEventListener('focus',()=>{
  if(innerWidth<=768||reduced.matches)return;
  const track=document.querySelector('.works-track');
  const trigger=window.ScrollTrigger?.getAll().find(t=>t.trigger===document.querySelector('.works-h')&&t.vars.pin);
  if(!trigger)return;
  const card=link.closest('.wcard'),distance=Math.max(0,track.scrollWidth-innerWidth);
  const target=Math.max(0,Math.min(distance,card.offsetLeft-(innerWidth-card.offsetWidth)/2));
  const position=trigger.start+(distance?target/distance:0)*(trigger.end-trigger.start);
  window.scrollTo({top:position,behavior:'instant'});
}));
document.fonts.ready.then(refreshLayout);
// The template owns inline ScrollTriggers while the content modules own
// their DOM. A complete dev reload keeps both lifecycles in sync on edits.
if(import.meta.hot)import.meta.hot.on('vite:beforeUpdate',({updates})=>{
  if(updates.some(update=>update.type==='js-update'&&/novara/.test(update.path)))location.reload();
});
if(import.meta.hot)import.meta.hot.dispose(()=>{observer.disconnect();destroyDusk();destroyHero();destroyBoard();destroySlideshow();destroyCraft();destroyFeedback();destroyBackground();destroyServices();destroyMenu();document.removeEventListener('novara:layout',refreshLayout);});
