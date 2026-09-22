/* Хедер: фон и тень, когда страница прокручена */
(function () {
  'use strict';
  var header = document.querySelector('.site-header');
  if (!header) return;
  var stuck = false;
  function sync() {
    var next = window.scrollY > 40;
    if (next !== stuck) { stuck = next; header.classList.toggle('is-stuck', stuck); }
  }
  sync();
  window.addEventListener('scroll', sync, { passive: true });
})();

/* Плавное появление блоков при прокрутке */
(function () {
  'use strict';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var items = [].slice.call(document.querySelectorAll([
    '.section-head', '.feature', '.discounts__bar', '.help__card', '.finale__card',
    '.step', '.way', '.storefront__frame', '.page-title',
    '.cats__item', '.assortment__more', '.order__body', '.order__media', '.about__grid > *', '.review',
    '.faq__cta', '.faq__item', '.contacts__info', '.contacts__media'
  ].join(', ')));
  if (!items.length) return;

  document.documentElement.classList.add('js-anim');
  items.forEach(function (el) { el.classList.add('reveal'); });

  var pending = items.slice();
  var ticking = false;

  function show(el, stagger) {
    if (stagger) {
      var siblings = el.parentElement ? el.parentElement.children : [];
      var index = [].indexOf.call(siblings, el);
      /* соседи в одной группе появляются друг за другом */
      el.style.transitionDelay = Math.min(Math.max(index, 0), 4) * 70 + 'ms';
    }
    el.classList.add('is-visible');
  }

  function sweep() {
    ticking = false;
    var limit = window.innerHeight * 0.92;
    for (var i = pending.length - 1; i >= 0; i--) {
      var el = pending[i];
      var rect = el.getBoundingClientRect();
      /* карточки свёрнутой ленты ещё не в потоке — ждут своей очереди */
      if (!rect.width && !rect.height) continue;
      if (rect.top < limit) {
        /* если блок уже выше экрана (резкая прокрутка, переход по якорю) —
           показываем сразу, без задержки */
        show(el, rect.top > 0);
        pending.splice(i, 1);
      }
    }
  }

  function schedule() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(sweep);
  }

  sweep();
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  document.addEventListener('click', schedule);
})();

/* Бургер-меню на узких экранах */
(function () {
  'use strict';
  var btn = document.getElementById('nav-toggle');
  var nav = document.getElementById('site-nav');
  if (!btn || !nav) return;

  function setOpen(open) {
    nav.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  }

  btn.addEventListener('click', function () {
    setOpen(btn.getAttribute('aria-expanded') !== 'true');
  });

  /* закрываем после перехода по пункту, по Esc и по клику мимо меню */
  nav.addEventListener('click', function (e) {
    if (e.target.closest('.nav__link')) setOpen(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setOpen(false);
  });
  document.addEventListener('click', function (e) {
    if (!nav.contains(e.target) && !btn.contains(e.target)) setOpen(false);
  });
  window.addEventListener('resize', function () {
    if (window.innerWidth > 1250) setOpen(false);
  });
})();
