/* Homepage-only, manual practitioner browsing. No autoplay, timers or third-party dependencies. */
(() => {
  const track = document.getElementById('home-practitioner-track');
  const controls = document.querySelector('.team-carousel-controls');
  if (!track || !controls) return;
  const previous = controls.querySelector('.team-carousel-previous');
  const next = controls.querySelector('.team-carousel-next');
  const status = controls.querySelector('.team-carousel-status');
  const cards = Array.from(track.querySelectorAll(':scope > .practitioner'));
  if (!previous || !next || !cards.length) return;

  const maximum = () => Math.max(0, track.scrollWidth - track.clientWidth);
  const cardStep = () => cards[0].getBoundingClientRect().width +
    (parseFloat(getComputedStyle(track).columnGap) || 0);
  const update = () => {
    const max = maximum();
    const viewport = track.getBoundingClientRect();
    cards.forEach(card => {
      const rect = card.getBoundingClientRect();
      const visible = Math.max(0, Math.min(rect.right, viewport.right) - Math.max(rect.left, viewport.left));
      const partial = visible > 2 && visible < rect.width * 0.92;
      card.classList.toggle('team-card-partial', partial);
    });
    previous.disabled = track.scrollLeft <= 3 || max <= 3;
    next.disabled = track.scrollLeft >= max - 3 || max <= 3;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    const step = cardStep();
    const first = step ? Math.max(0, Math.min(cards.length - 1, Math.round(track.scrollLeft / step))) : 0;
    const fullCount = step ? Math.max(1, Math.floor((track.clientWidth + gap + 0.5) / step)) : 1;
    const countText = `${first + 1}–${Math.min(cards.length, first + fullCount)} of ${cards.length}`;
    if (status && status.textContent !== countText) status.textContent = countText;
  };
  const move = (direction) => {
    if ((direction < 0 && previous.disabled) || (direction > 0 && next.disabled)) return;
    const step = cardStep();
    const current = step ? Math.round(track.scrollLeft / step) : 0;
    const destination = Math.max(0, Math.min(maximum(), (current + direction) * step));
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    track.scrollTo({left: destination, behavior: reduceMotion ? 'auto' : 'smooth'});
  };

  previous.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));
  track.addEventListener('keydown', event => {
    if (event.target !== track || !['ArrowRight', 'ArrowLeft'].includes(event.key)) return;
    event.preventDefault();
    move(event.key === 'ArrowRight' ? 1 : -1);
  });
  track.addEventListener('scroll', update, {passive:true});
  window.addEventListener('resize', update, {passive:true});
  if ('ResizeObserver' in window) new ResizeObserver(update).observe(track);
  update();
})();
