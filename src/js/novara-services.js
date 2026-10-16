const services = [
  ['Film', 'Story first, from the first idea to the final cut. We create films that bring people, places and brands into focus.', 'Explore our films', '/novara-films.html'],
  ['Commercial', 'Films built around the character of a brand and the people it wants to reach. Our work spans product, lifestyle and campaign storytelling.', 'View commercial work', '/novara-project.html?film=insta360-luna-ultra'],
  ['Social', 'Short films for the small screen, from vertical reels to product films for web. The same attention to story, picture and sound, shaped for how people watch.', 'Watch our reels', '#social'],
  ['Sound design', 'We build soundtracks layer by layer: foley, effects, atmosphere and music. Small details give a scene its weight, rhythm and feeling.', 'Step into the sound department', '#sound'],
  ['Travel', 'The character of a place, through the people and moments that make it. Destination films that invite the viewer into the journey.', 'Explore Visit Tallinn', '/novara-project.html?film=visit-tallinn'],
  ['Hospitality', 'We tell the story beyond the room: the food, the people, the setting and the experience of being there. Films for hotels and resorts around the world.', 'See The Taste of Heritage', '/novara-project.html?film=radisson-berlin'],
  ['Storytelling', 'We start by finding what matters. Then we shape the images, edit and sound around that thread, so people don’t just watch — they connect.', 'Discover the stories', '/novara-films.html'],
  ['Worldwide', 'Reuben and Okta are the core duo, with the crew scaling for each production. We work wherever the story takes us.', 'Follow our locations', '#locations'],
];

export function mountNovaraServices(host) {
  if (!host) return () => {};
  const original = [...host.childNodes];
  const controller = new AbortController();
  host.setAttribute('aria-label', 'Explore what we do');
  host.classList.add('novara-services');
  const panel = document.createElement('div');
  panel.className = 'service-detail';
  panel.id = 'novara-service-detail';
  panel.hidden = true;
  const buttons = services.map(([label, copy, linkText, href], i) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', panel.id);
    button.addEventListener('click', () => {
      const expanded = button.getAttribute('aria-expanded') !== 'true';
      buttons.forEach(b => b.setAttribute('aria-expanded', 'false'));
      button.setAttribute('aria-expanded', String(expanded));
      panel.replaceChildren();
      panel.hidden = !expanded;
      if (expanded) {
        const title = document.createElement('h3'); title.textContent = label;
        const description = document.createElement('p'); description.textContent = copy;
        const link = document.createElement('a'); link.href = href; link.textContent = `${linkText} ↗`;
        panel.append(title, description, link);
        if (!matchMedia('(prefers-reduced-motion: reduce)').matches) panel.animate([{opacity:0,transform:'translateY(-6px)'},{opacity:1,transform:'none'}],{duration:240,easing:'ease-out'});
      }
      host.dispatchEvent(new CustomEvent('novara:layout', {bubbles:true}));
    }, {signal:controller.signal});
    return button;
  });
  host.replaceChildren(...buttons, panel);
  return () => { controller.abort(); host.replaceChildren(...original); host.classList.remove('novara-services'); };
}
