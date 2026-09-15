import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from './motion.js';
import { openLightbox } from './lightbox.js';
gsap.registerPlugin(ScrollTrigger);

export function buildStudioDetails(touch=false){
 const still=document.querySelector('.about__still');
 let surface=still.querySelector('.studio-photo-surface');
 if(!surface){surface=document.createElement('div');surface.className='studio-photo-surface';while(still.firstChild)surface.append(still.firstChild);still.append(surface);}
 if(prefersReducedMotion)return ()=>{};
 const ctx=gsap.context(()=>{
  gsap.fromTo(surface,{rotationY:-18,rotationZ:-5,z:-100},{rotationY:0,rotationZ:-1,z:0,ease:'power2.out',scrollTrigger:{trigger:still,start:'top bottom',end:'center center',scrub:touch?false:1,once:touch},duration:1.2});
 },still);
 const image=surface.querySelector('img');
 const rx=gsap.quickTo(image,'rotationX',{duration:.8,ease:'power3.out'}),ry=gsap.quickTo(image,'rotationY',{duration:.8,ease:'power3.out'});
 const move=e=>{if(touch)return;const r=still.getBoundingClientRect();rx(-(e.clientY-r.top-r.height/2)/r.height*9);ry((e.clientX-r.left-r.width/2)/r.width*10);};
 const leave=()=>{rx(0);ry(0);};
 still.addEventListener('pointermove',move);still.addEventListener('pointerleave',leave);
 return ()=>{still.removeEventListener('pointermove',move);still.removeEventListener('pointerleave',leave);rx.tween.kill();ry.tween.kill();ctx.revert();gsap.set(image,{clearProps:'transform'});};
}

export function wireSoundExperience(){
 const section=document.querySelector('.sound'),stage=section.querySelector('.sound__stage');
 const old=stage.querySelector('.js-sound-play'),poster=old.querySelector('img').src,src=old.dataset.videoSrc;
 stage.querySelector('audio')?.pause();
 stage.className='sound__stage craft-stage';
 stage.innerHTML=`<header class="craft-head"><p>SCENE 03B · SOUND DESIGN</p><h2>BUILT FROM<br><span>SILENCE.</span></h2><div class="craft-intro">Entire soundtracks, made from scratch.<br>Foley. Effects. Atmosphere. Music.</div></header><div class="craft-depth"><figure class="craft-session"><img src="stills/vernel-session.jpg" alt="The Vernel Fresh sound design session"><figcaption>BEHIND THE MIX · THE REAL SESSION</figcaption></figure><figure class="craft-picture"><button type="button" aria-label="Watch and hear the finished Vernel Fresh film"><img src="${poster}" alt="Vernel Fresh commercial"><span>▶ WATCH & HEAR THE FILM</span></button><figcaption>VERNEL FRESH · COMMERCIAL PITCH</figcaption></figure></div><div class="craft-notes"><div class="craft-score" aria-label="Soundtrack layers"><p class="craft-score-label">LAYER BY LAYER · A COMPLETE SOUNDTRACK</p>${['FOLEY','SOUND EFFECTS','ATMOSPHERE','MUSIC'].map((label,i)=>`<div class="craft-track"><span>0${i+1} / ${label}</span><div class="craft-regions" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div></div>`).join('')}</div></div>`;
 stage.querySelector('button').addEventListener('click',e=>openLightbox(src,e.currentTarget));
}
export function buildSoundVisual(touch=false){
 const section=document.querySelector('.sound');
 const native=touch||innerWidth<900||prefersReducedMotion;
 section.classList.toggle('craft-native',native);
 const ctx=gsap.context(()=>{
  if(prefersReducedMotion)return;
  const picture=section.querySelector('.craft-picture'),session=section.querySelector('.craft-session'),notes=section.querySelectorAll('.craft-track');
  if(native){
   gsap.fromTo([picture,session],{y:50,rotationY:-10,opacity:.4},{y:0,rotationY:0,opacity:1,duration:1,stagger:.18,scrollTrigger:{trigger:section,start:'top 75%',once:true}});
   gsap.fromTo(notes,{x:35,opacity:0},{x:0,opacity:1,stagger:.15,duration:.65,scrollTrigger:{trigger:section.querySelector('.craft-score'),start:'top 90%',once:true}});
   return;
  }
  const tl=gsap.timeline({scrollTrigger:{trigger:section,start:'top top',end:'+=220%',pin:section.querySelector('.craft-stage'),scrub:1}});
  tl.fromTo(picture,{xPercent:12,y:15,rotationY:-8,rotationZ:-4,scale:1},{xPercent:-16,y:-30,rotationY:7,rotationZ:-7,scale:.79,duration:1.1},0)
   .fromTo(session,{xPercent:7,y:25,z:-220,rotationY:-15,rotationZ:6,opacity:.4},{xPercent:0,y:0,z:0,rotationY:0,rotationZ:2,opacity:1,duration:1.1},.1)
   .fromTo(notes,{x:100,y:25,rotationX:65,opacity:0},{x:0,y:0,rotationX:0,opacity:1,stagger:.2,duration:.4},.2);
 },section);
 return ()=>ctx.revert();
}
