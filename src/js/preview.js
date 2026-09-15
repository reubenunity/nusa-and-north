import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { openLightbox } from './lightbox.js';
import { prefersReducedMotion } from './motion.js';

gsap.registerPlugin(ScrollTrigger);

const selections = [
  ['radisson-red-innsbruck', 'INNSBRUCK', 'Radisson RED · Sounds of Innsbruck', 'HOSPITALITY'],
  ['visit-tallinn', 'TALLINN', 'Visit Tallinn', 'DESTINATION FILM'],
  ['radisson-vilnius', 'VILNIUS', 'Radisson Collection · The Taste of Heritage', 'HOSPITALITY'],
  ['insta360-luna-ultra', 'LUNA ULTRA', 'Insta360 · Luna Ultra', 'COMMERCIAL'],
];
const section = document.createElement('section');
section.id = 'selected-work';
section.className = 'selected-work';
section.setAttribute('aria-label', 'Selected films');
section.innerHTML = `
  <div class="selected-stage">
    <div class="selected-atmosphere" aria-hidden="true"></div>
    <header class="selected-header"><div><p class="selected-kicker">SCENE 01B · SELECTED FILMS</p><h2>IN THE<br><span>FRAME.</span></h2></div><a class="selected-skip" href="#edit">ALL FILMS ↗</a></header>
    <div class="selected-space"><div class="selected-deck"></div></div>
    <footer class="selected-footer"><div class="selected-pagination" aria-label="Choose a featured film"></div><span class="selected-hint">SCROLL TO EXPLORE</span><span class="selected-count" aria-hidden="true">01 / 04</span></footer>
    <div class="selected-progress" aria-hidden="true"><i></i></div>
  </div>`;
const deck = section.querySelector('.selected-deck');
const atmosphere = section.querySelector('.selected-atmosphere');
const pagination = section.querySelector('.selected-pagination');
selections.forEach(([slug, display, title, category], index) => {
  const source = document.querySelector(`.clip[data-slug="${slug}"]`);
  const card = document.createElement('article');
  card.className = 'selected-card';
  card.innerHTML = `<div class="selected-tilt">
    <div class="selected-card-top"><span>${category}</span><span>0${index + 1} — N&N</span></div>
    <button class="selected-film" type="button" aria-label="Watch ${source.dataset.title}"><img src="${source.dataset.poster}" alt="" loading="lazy"><span class="selected-shine" aria-hidden="true"></span><span class="selected-play"><span aria-hidden="true">▶</span> WATCH FILM</span></button>
    <div class="selected-card-bottom"><h3>${display}</h3><p>${title}</p></div>
  </div>`;
  card.querySelector('button').addEventListener('click', e => openLightbox(source.dataset.videoSrc, e.currentTarget));
  deck.append(card);
  const backdrop = document.createElement('img'); backdrop.src = source.dataset.poster; backdrop.alt = ''; backdrop.loading = 'lazy'; atmosphere.append(backdrop);
  const dot = document.createElement('button');dot.type = 'button';dot.textContent = `0${index + 1}`;dot.setAttribute('aria-label',`Show ${title}`);pagination.append(dot);
});
document.querySelector('.hero').after(section);

export function buildSelectedFilms(touch = false) {
  const cards = [...section.querySelectorAll('.selected-card')];
  const tilts = cards.map(c => c.querySelector('.selected-tilt'));
  const backgrounds = [...atmosphere.children];
  const dots = [...pagination.children];
  const count = section.querySelector('.selected-count');
  const hint = section.querySelector('.selected-hint');
  let timeline;
  let active = -1;
  const cleanups = [];
  const staticLayout = touch || prefersReducedMotion;
  section.classList.toggle('selected-native', staticLayout);
  hint.textContent = staticLayout ? 'SWIPE TO EXPLORE' : 'SCROLL TO EXPLORE';
  const activate = index => {
    if (index === active) return;
    active = index;
    cards.forEach((card,i) => {
      // Overlapping frames cannot steal clicks or keyboard focus.
      card.inert = !staticLayout && i !== index;
      card.classList.toggle('is-current', i === index);
      dots[i].setAttribute('aria-pressed',String(i === index));
    });
    count.textContent = `0${index+1} / ${cards.length.toString().padStart(2,'0')}`;
  };
  const ctx = gsap.context(() => {
    if (staticLayout) {
      gsap.set(backgrounds,{opacity:0});gsap.set(backgrounds[0],{opacity:.25});
      const update = () => {
        const centre = deck.getBoundingClientRect().left + deck.clientWidth / 2;
        let nearest = 0, distance = Infinity;
        cards.forEach((card,i) => {const r=card.getBoundingClientRect();const d=Math.abs(r.left+r.width/2-centre);if(d<distance){distance=d;nearest=i;}});
        activate(nearest);
        gsap.set(backgrounds, {opacity: i => i===nearest ? .25 : 0});
      };
      deck.addEventListener('scroll',update,{passive:true});cleanups.push(()=>deck.removeEventListener('scroll',update));
      dots.forEach((dot,i)=>{
        const jump=()=>deck.scrollTo({left:cards[i].offsetLeft-deck.offsetLeft,behavior:prefersReducedMotion?'instant':'smooth'});
        dot.addEventListener('click',jump);cleanups.push(()=>dot.removeEventListener('click',jump));
      });
      activate(0);
      if (!prefersReducedMotion) {
        gsap.fromTo(cards,{y:60,rotationY:-9},{y:0,rotationY:0,stagger:.12,duration:1,ease:'power3.out',scrollTrigger:{trigger:section,start:'top 75%',once:true}});
      }
      return;
    }
    gsap.set(cards,{transformPerspective:1500,transformOrigin:'50% 50%',force3D:true});
    gsap.set(cards[0],{xPercent:0,yPercent:0,z:0,rotationY:0,rotationZ:-2,opacity:1});
    cards.slice(1).forEach((card,i)=>gsap.set(card,{xPercent:36+i*24,yPercent:-7-i*5,z:-600-i*450,rotationY:-16-i*9,rotationZ:7+i*5,opacity:i===0?.55:.2}));
    gsap.set(backgrounds,{opacity:0,scale:1.1});gsap.set(backgrounds[0],{opacity:.35});
    const entrance = gsap.timeline({scrollTrigger:{trigger:section,start:'top bottom',end:'top top',scrub:1}});
    entrance.fromTo(section.querySelector('.selected-space'),{y:150,rotationX:12,scale:.78},{y:0,rotationX:0,scale:1,ease:'power2.out'},0);
    entrance.fromTo(section.querySelector('.selected-header h2'),{y:90,opacity:0},{y:0,opacity:1},.15);
    timeline = gsap.timeline({defaults:{ease:'power2.inOut'},scrollTrigger:{
      trigger:section,start:'top top',end:`+=${cards.length*105}%`,pin:section.querySelector('.selected-stage'),scrub:1,
      onUpdate:self=>activate(Math.min(cards.length-1,Math.max(0,Math.floor((self.progress*(cards.length*1.3-.6)+.225)/1.3))))
    }});
    const length=cards.length*1.3-.6;
    timeline.to(cards[0],{rotationZ:0,z:90,duration:.55},0);
    for(let i=1;i<cards.length;i++){
      const at=.65+(i-1)*1.3;
      timeline.to(cards[i-1],{xPercent:-125,yPercent:15,z:400,rotationY:32,rotationZ:-12,opacity:0,duration:.85},at)
       .to(cards[i],{xPercent:0,yPercent:0,z:0,rotationY:0,rotationZ:i%2?1.5:-1.5,opacity:1,duration:.85},at)
       .to(backgrounds[i-1],{opacity:0,duration:.6},at+.1).to(backgrounds[i],{opacity:.35,duration:.6},at+.1)
       .to(cards[i],{rotationZ:0,z:90,duration:.45},at+.85);
      if(cards[i+1])timeline.to(cards[i+1],{xPercent:36,yPercent:-7,z:-600,rotationY:-16,rotationZ:7,opacity:.55,duration:.85},at);
    }
    timeline.to(section.querySelector('.selected-header h2'),{y:-45,opacity:.35,duration:length,ease:'none'},0)
      .to(section.querySelector('.selected-progress i'),{scaleX:1,duration:length,ease:'none'},0);
    activate(0);
    dots.forEach((dot,i)=>{
      const jump=()=>{
        const st=timeline.scrollTrigger;const progress=(i===0?.3:1.65+(i-1)*1.3)/length;
        const y=st.start+(st.end-st.start)*progress;
        if(window.__lenis){window.__lenis.resize();window.__lenis.scrollTo(y,{duration:1.25,force:true});}
        else window.scrollTo({top:y,behavior:'smooth'});
      };
      dot.addEventListener('click',jump);cleanups.push(()=>dot.removeEventListener('click',jump));
    });
    tilts.forEach((tilt,i)=>{
      const x=gsap.quickTo(tilt,'rotationX',{duration:.7,ease:'power3.out'});
      const y=gsap.quickTo(tilt,'rotationY',{duration:.7,ease:'power3.out'});
      const move=e=>{const r=cards[i].getBoundingClientRect();x(-(e.clientY-r.top-r.height/2)/r.height*7);y((e.clientX-r.left-r.width/2)/r.width*9);};
      const reset=()=>{x(0);y(0);};
      cards[i].addEventListener('pointermove',move);cards[i].addEventListener('pointerleave',reset);
      cleanups.push(()=>{cards[i].removeEventListener('pointermove',move);cards[i].removeEventListener('pointerleave',reset);x.tween.kill();y.tween.kill();});
    });
  },section);
  const skip=section.querySelector('.selected-skip');
  const onSkip=e=>{
    e.preventDefault();const target=document.querySelector('#edit');
    const y=target.getBoundingClientRect().top+window.scrollY;
    if(window.__lenis){window.__lenis.resize();window.__lenis.scrollTo(y,{duration:1.4,force:true});}else target.scrollIntoView();
  };
  skip.addEventListener('click',onSkip);
  return ()=>{cleanups.forEach(fn=>fn());skip.removeEventListener('click',onSkip);ctx.revert();cards.forEach(c=>{c.inert=false;});};
}
