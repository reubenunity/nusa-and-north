import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from './motion.js';
import { openLightbox } from './lightbox.js';

const clip = slug => document.querySelector(`.clip[data-slug="${slug}"]`);
export function wireExperienceExtras(){
 const credits=document.createElement('section');credits.className='client-credits';credits.setAttribute('aria-label','Selected collaborations');
 const brands=[['insta360','Insta360'],['radisson','Radisson Hotels'],['four-seasons','Four Seasons'],['harpers-bazaar',"Harper’s Bazaar"],['hp','HP']];
 const brandGroup=hidden=>`<div class="brand-group" ${hidden?'aria-hidden="true"':''}>${brands.map(([file,name])=>`<div class="brand-mark brand-mark--${file}"><img src="logos/${file}.svg" alt="${hidden?'':name}" loading="lazy"></div>`).join('')}</div>`;
 credits.innerHTML=`<div class="client-arrival" aria-hidden="true"></div><header class="brand-heading"><p class="extras-kicker">SELECTED COLLABORATIONS</p><h2>Trusted with<br><em>their stories.</em></h2></header><div class="brand-window"><div class="brand-track">${brandGroup(false)}${brandGroup(true)}</div></div>`;
 document.querySelector('#selected-work').after(credits);
 const dissolve=document.createElement('div');dissolve.className='selected-dissolve';dissolve.setAttribute('aria-hidden','true');document.querySelector('.selected-stage').append(dissolve);
 wireStories();wireSwipeCues();
}
function wireStories(){
 const stories=[['radisson-red-innsbruck','HOSPITALITY','Sounds of Innsbruck','Innsbruck, Austria','A film for Radisson RED, Innsbruck.'],['visit-tallinn','DESTINATION FILM','Visit Tallinn','Tallinn, Estonia','A destination film for Visit Tallinn.'],['radisson-vilnius','HOSPITALITY','The Taste of Heritage','Vilnius, Lithuania','A film for Radisson Collection, Vilnius.'],['insta360-luna-ultra','COMMERCIAL','Luna Ultra','Insta360','A commercial film for Insta360’s Luna Ultra.']];
 const dialog=document.createElement('dialog');dialog.className='project-story';dialog.setAttribute('aria-label','Project story');dialog.setAttribute('data-lenis-prevent','');document.body.append(dialog);
 let origin,savedOverflow;const close=()=>{dialog.close();document.documentElement.style.overflow=savedOverflow;window.__lenis?.start();origin?.focus({preventScroll:true});};
 dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
 stories.forEach(([slug,category,title,place,description],i)=>{
 const card=document.querySelectorAll('.selected-card')[i],source=clip(slug),button=document.createElement('button');button.className='project-story-link';button.type='button';button.textContent='PROJECT NOTES ↗';button.setAttribute('aria-label',`Explore ${title}`);card.querySelector('.selected-tilt').append(button);
 button.addEventListener('click',()=>{
 origin=button;savedOverflow=document.documentElement.style.overflow;window.__lenis?.stop();document.documentElement.style.overflow='hidden';
 dialog.innerHTML=`<button class="story-close" type="button" aria-label="Close project story">CLOSE ×</button><div class="story-body"><p class="extras-kicker">${category} · NUSA & NORTH</p><h2>${title}</h2><img src="${source.dataset.poster}" alt="${title} film still"><div class="story-detail"><div><p class="extras-kicker">THE PROJECT</p><p>${description}</p></div><div><p class="extras-kicker">ON THE CREDITS</p><p>${place}<br>Film by Nusa & North</p></div><button class="story-watch" type="button">▶ WATCH THE FINISHED FILM</button></div></div>`;
 dialog.querySelector('.story-close').addEventListener('click',close);dialog.querySelector('.story-watch').addEventListener('click',()=>{close();openLightbox(source.dataset.videoSrc,card.querySelector('.selected-film'));});
 dialog.showModal();dialog.scrollTop=0;
 if(!prefersReducedMotion){const r=card.getBoundingClientRect();gsap.fromTo(dialog,{opacity:0,scale:.8,x:r.left+r.width/2-innerWidth/2,y:r.top+r.height/2-innerHeight/2},{opacity:1,scale:1,x:0,y:0,duration:.6,ease:'power3.inOut'});}
 });
 });
}
export function buildExperienceExtras(){
 const ctx=gsap.context(()=>{
  if(prefersReducedMotion)return;
  const transition=gsap.timeline({scrollTrigger:{trigger:'.client-credits',start:'top 140%',end:'top 25%',scrub:1.2},defaults:{ease:'none'}});
  transition.fromTo('.selected-dissolve',{opacity:0},{opacity:1,duration:.35},0)
   .fromTo('.brand-heading',{opacity:0,y:22},{opacity:1,y:0,duration:.45},.55)
   .fromTo('.brand-window',{opacity:0},{opacity:1,duration:.35},.65);
 });return ()=>ctx.revert();
}

function wireSwipeCues(){
 const sections=[['.selected-deck','SWIPE TO EXPLORE'],['.social__row','SWIPE FOR MORE FILMS'],['.edit__timeline','SWIPE TO EXPLORE THE TIMELINE'],['.recce__viewport','SWIPE TO FOLLOW THE ROUTE'],['.about__quotes','SWIPE FOR CLIENT REVIEWS']];
 sections.forEach(([selector,label])=>{
  const strip=document.querySelector(selector);if(!strip)return;
  const cue=document.createElement('p');cue.className='mobile-swipe-cue';cue.innerHTML=`<span aria-hidden="true">↔</span> ${label}`;strip.before(cue);
  let used=false;const initial=strip.scrollLeft;
  const stop=()=>{used=true;cue.classList.add('is-used');cue.classList.remove('is-demonstrating');};
  strip.addEventListener('scroll',()=>{if(!used&&Math.abs(strip.scrollLeft-initial)>12)stop();},{passive:true});
  const io=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting&&!used){cue.classList.add('is-demonstrating');io.disconnect();}});},{threshold:.8});io.observe(cue);
 });
}
