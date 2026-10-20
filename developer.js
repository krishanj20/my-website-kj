(() => {
  'use strict';
  const chapters = [...document.querySelectorAll('[data-chapter]')];
  const stage = document.querySelector('.stage');
  const scenes = [...document.querySelectorAll('[data-scene]')];
  const hero = document.querySelector('.hero');
  const orbit = document.querySelector('.hero-orbits');
  const indexLabel = document.querySelector('.stage-index');
  const topicLabel = document.querySelector('.stage-topic');
  const topics = ['Research in motion', 'Software that connects', 'Following the evidence', 'The foundations', 'Ideas for everyday life'];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const narrow = window.matchMedia('(max-width: 759px)');
  const menu = document.querySelector('.app-menu');
  const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n));
  let pending = false;
  let active = -1;
  function update() {
    pending = false;
    if (!stage || !chapters.length || reduce.matches) return;
    const height = window.innerHeight;
    const heroRect = hero.getBoundingClientRect();
    const heroProgress = clamp(-heroRect.top / Math.max(heroRect.height, 1));
    orbit.style.setProperty('--hero-y', `${-heroProgress * 45}px`);
    orbit.style.setProperty('--hero-turn', `${heroProgress * 28}deg`);
    orbit.style.setProperty('--hero-opacity', `${1 - heroProgress * .45}`);
    // On phones the visual stays above the text; choose the chapter occupying
    // the reading area below it. Desktop uses the centre of the viewport.
    const focus = narrow.matches ? height * .69 : height * .5;
    const rects = chapters.map(chapter => chapter.getBoundingClientRect());
    let chosen = 0;
    for (let i = 0; i < rects.length; i++) {
      if (rects[i].top <= focus) chosen = i;
    }
    const rect = rects[chosen];
    const progress = clamp((focus - rect.top) / Math.max(rect.height, 1));
    if (chosen !== active) {
      active = chosen;
      stage.dataset.active = String(chosen);
      chapters.forEach((chapter, i) => chapter.classList.toggle('is-active', i === chosen));
      scenes.forEach((scene, i) => scene.classList.toggle('is-active', i === chosen));
      indexLabel.textContent = `${String(chosen + 1).padStart(2, '0')} / 05`;
      topicLabel.textContent = topics[chosen];
    }
    stage.style.setProperty('--draw', String(.35 + progress * .65));
    stage.style.setProperty('--travel', `${(progress - .5) * 22}px`);
    stage.style.setProperty('--opposite-travel', `${(.5 - progress) * 22}px`);
    stage.style.setProperty('--angle', `${(progress - .5) * 24}deg`);
    stage.style.setProperty('--detail-opacity', String(.45 + progress * .55));
    stage.style.setProperty('--overall', String((chosen + progress) / chapters.length));
  }
  function schedule() {
    if (!pending) {
      pending = true;
      window.requestAnimationFrame(update);
    }
  }
  function preferenceChanged() {
    document.documentElement.dataset.motion = reduce.matches ? 'off' : 'on';
    schedule();
  }
  window.addEventListener('scroll', schedule, {passive: true});
  window.addEventListener('resize', schedule, {passive: true});
  window.addEventListener('pageshow', schedule);
  reduce.addEventListener('change', preferenceChanged);
  narrow.addEventListener('change', schedule);
  if ('ResizeObserver' in window) new ResizeObserver(schedule).observe(document.querySelector('.story'));
  if (document.fonts) document.fonts.ready.then(schedule);
  // Native details keeps the Apps menu keyboard-accessible; these additions
  // make escape and outside-click dismissal behave like an ordinary menu.
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu?.open) {
      menu.open = false;
      menu.querySelector('summary').focus();
    }
  });
  document.addEventListener('click', event => {
    if (menu?.open && !menu.contains(event.target)) menu.open = false;
  });
  preferenceChanged();
})();
