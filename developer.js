(() => {
  'use strict';
  const root = document.documentElement;
  const hero = document.querySelector('.hero');
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
    if (hero) {
      const rect = hero.getBoundingClientRect();
      const progress = clamp(-rect.top / Math.max(rect.height, 1));
      hero.style.setProperty('--hero-y', `${progress * -95}px`);
      hero.style.setProperty('--hero-scale', String(1 + progress * .13));
    }
    chapters.forEach(chapter => {
      const rect = chapter.getBoundingClientRect();
      if (rect.bottom < -height * .2 || rect.top > height * 1.2) return;
      const progress = clamp((height - rect.top) / Math.max(height + rect.height, 1));
      const enter = clamp((height - rect.top) / (height * .6));
      const callout = clamp((enter - .3) / .7);
      chapter.style.setProperty('--p', String(progress));
      chapter.style.setProperty('--enter', String(enter));
      chapter.style.setProperty('--callout', String(callout));
      chapter.style.setProperty('--move', `${(.5 - progress) * (narrow.matches ? 48 : 150)}px`);
      chapter.style.setProperty('--tilt', `${(progress - .5) * (narrow.matches ? 5 : 11)}deg`);
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
