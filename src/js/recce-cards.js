import gsap from 'gsap';
import { openLightbox } from './lightbox.js';
import { prefersReducedMotion } from './motion.js';

const films={LUCERNE:'radisson-lucerne',FRANKFURT:'radisson-frankfurt',FLORENCE:'radisson-florence',PRAGUE:'prague-savour-the-vibe',TALLINN:'radisson-tallinn',VIETNAM:'banyan-tree-vietnam'};
// Only connect postcards to films already present and credited in the portfolio.
export function wireRecceCards(){
  document.querySelectorAll('.recce .pin').forEach(pin=>{
    const name=pin.querySelector('h3')?.textContent.trim(),slug=films[name];
    const film=slug&&document.querySelector(`.clip[data-slug="${slug}"]`),img=pin.querySelector('.pin__photo img');
    if(!film||!img||pin.querySelector('.recce-film'))return;
    const button=document.createElement('button');button.type='button';button.className='recce-film';button.setAttribute('aria-label',`Watch ${film.dataset.title}`);
    img.before(button);button.append(img);
    const label=document.createElement('span');label.className='recce-film__play';label.textContent='▶ WATCH FILM';button.append(label);
    button.addEventListener('click',()=>openLightbox(film.dataset.videoSrc,button));
  });
}
export function createRecceDepth(track){
  const pins=[...track.querySelectorAll('.pin')].filter(p=>p.offsetWidth>0&&!p.classList.contains('pin--next'));
  const data=pins.map(pin=>({pin,center:pin.offsetLeft+pin.offsetWidth/2,photo:pin.querySelector('.pin__photo'),notes:pin.querySelector('.pin__meta'),width:pin.offsetWidth}));
  let active=-1;
  const update=(travelX=0)=>{
    if(prefersReducedMotion)return;
    const trackLeft=track.getBoundingClientRect().left;
    // Desktop supplies the pan offset; measuring the track once also supports touch scrolling.
    let nearest=-1,dist=Infinity;
    data.forEach((item,i)=>{
      const distance=(trackLeft+item.center-innerWidth/2)/(innerWidth*.6);
      const strength=Math.max(0,1-Math.abs(distance));
      if(Math.abs(distance)<dist){dist=Math.abs(distance);nearest=i;}
      gsap.set(item.photo,{rotationY:Math.max(-16,Math.min(16,distance*14)),rotationZ:-distance*2,y:-28*strength,z:80*strength,scale:.94+.08*strength,transformPerspective:1000});
      gsap.set(item.notes,{y:14*(1-strength),opacity:.5+.5*strength});
    });
    if(nearest!==active){active=nearest;data.forEach((item,i)=>item.pin.classList.toggle('is-arrived',i===nearest));}
  };
  const cleanup=()=>{gsap.set(data.flatMap(d=>[d.photo,d.notes]),{clearProps:'transform,opacity'});data.forEach(d=>d.pin.classList.remove('is-arrived'));};
  return {update,cleanup};
}
export function buildRecceTouchDepth(){
  const track=document.querySelector('.js-recce-track'),viewport=document.querySelector('.recce__viewport');
  const depth=createRecceDepth(track);const update=()=>depth.update();
  viewport.addEventListener('scroll',update,{passive:true});update();
  return ()=>{viewport.removeEventListener('scroll',update);depth.cleanup();};
}
