(() => {
  'use strict';
  const root = document.documentElement;
  const hero = document.querySelector('.hero');
  const header = document.querySelector('.site-header');
  const chapters = [...document.querySelectorAll('[data-chapter]')];
  const menu = document.querySelector('.app-menu');
  const toggle = document.querySelector('.motion-toggle');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const narrow = window.matchMedia('(max-width: 759px)');
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  let paused = false;
  let pending = false;
  // The illustrative calendar is deterministic and never reads calendar data.
  const calendar = document.querySelector('.year-calendar');
  if (calendar) {
    ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'].forEach((month, m) => {
      const block = document.createElement('div');
      block.className = 'mini-month';
      const label = document.createElement('span');
      label.textContent = month;
      block.append(label);
      for (let d = 0; d < 28; d++) {
        const day = document.createElement('i');
        day.className = 'mini-day' + ((d + m * 3) % 11 === 0 ? ' plan' : (d * 3 + m) % 7 < 2 ? ' busy' : '');
        block.append(day);
      }
      calendar.append(block);
    });
  }
  function update() {
    pending = false;
    if (reduce.matches || paused) return;
    const height = window.innerHeight;
    const headerHeight = header?.getBoundingClientRect().height || (narrow.matches ? 60 : 66);
    if (hero) {
      const rect = hero.getBoundingClientRect();
      const progress = clamp((headerHeight - rect.top) / Math.max(rect.height * .9, 1));
      hero.style.setProperty('--hero-y', `${progress * -180}px`);
      hero.style.setProperty('--hero-x', `${progress * (narrow.matches ? 32 : 95)}px`);
      hero.style.setProperty('--hero-turn', `${progress * 15}deg`);
      hero.style.setProperty('--hero-yaw', `${progress * -24}deg`);
      hero.style.setProperty('--hero-scale', String(1 + progress * .24));
    }
    chapters.forEach(chapter => {
      const rect = chapter.getBoundingClientRect();
      if (rect.bottom < -height * .2 || rect.top > height * 1.2) return;
      const visualRect = chapter.querySelector('.chapter-visual').getBoundingClientRect();
      // Desktop motion spans the actual sticky travel, rather than the entire
      // offscreen chapter. Phones animate when the artwork itself enters view.
      const progress = narrow.matches
        ? clamp((height * .95 - visualRect.top) / Math.max(height * .8 + visualRect.height * .55, 1))
        : clamp((headerHeight - rect.top) / Math.max(rect.height - height + headerHeight, 1));
      const enter = clamp((height - (narrow.matches ? visualRect.top : rect.top)) / (height * .65));
      const callout = clamp((enter - .3) / .7);
      const direction = Number(chapter.dataset.chapter) % 2 ? -1 : 1;
      chapter.style.setProperty('--p', String(progress));
      chapter.style.setProperty('--enter', String(enter));
      chapter.style.setProperty('--callout', String(callout));
      chapter.style.setProperty('--move', `${(.5 - progress) * (narrow.matches ? 80 : 130)}px`);
      chapter.style.setProperty('--sweep', `${(progress - .5) * (narrow.matches ? 44 : 145) * direction}px`);
      chapter.style.setProperty('--tilt', `${(progress - .5) * (narrow.matches ? 16 : 25) * direction}deg`);
      chapter.style.setProperty('--yaw', `${(progress - .5) * (narrow.matches ? 24 : 46) * direction}deg`);
      chapter.style.setProperty('--pitch', `${(.5 - progress) * (narrow.matches ? 12 : 18)}deg`);
    });
  }
  function schedule() {
    if (!pending) { pending = true; window.requestAnimationFrame(update); }
  }
  function preferencesChanged() {
    root.dataset.motion = reduce.matches || paused ? 'off' : 'on';
    if (toggle) {
      toggle.disabled = reduce.matches;
      toggle.textContent = reduce.matches ? 'Reduced motion enabled' : paused ? 'Resume motion' : 'Pause motion';
      toggle.setAttribute('aria-pressed', String(reduce.matches || paused));
    }
    schedule();
  }
  toggle?.addEventListener('click', () => { paused = !paused; preferencesChanged(); });
  window.addEventListener('scroll', schedule, {passive:true});
  window.addEventListener('resize', schedule, {passive:true});
  window.addEventListener('pageshow', schedule);
  reduce.addEventListener('change', preferencesChanged);
  narrow.addEventListener('change', schedule);
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(schedule);
    chapters.forEach(chapter => observer.observe(chapter));
  }
  if (document.fonts) document.fonts.ready.then(schedule);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu?.open) {
      menu.open = false;
      menu.querySelector('summary').focus();
    }
  });
  document.addEventListener('click', event => {
    if (menu?.open && !menu.contains(event.target)) menu.open = false;
  });
  preferencesChanged();
})();
