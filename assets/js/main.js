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
    '.faq__item', '.cblock', '.cpage__media'
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

/* Меню «Оформить заказ» и статус магазина на первом экране */
(function () {
  var btn = document.querySelector('.omenu__btn');
  var list = document.getElementById('omenu-list');
  if (btn && list) {
    var shut = function () { list.hidden = true; btn.setAttribute('aria-expanded', 'false'); };
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = list.hidden;
      list.hidden = !open;
      btn.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', function (e) { if (!list.contains(e.target)) shut(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') shut(); });
  }
  var state = document.querySelector('[data-shop-state]');
  if (!state) return;
  // пн, вт, ср, пт, сб 8–16; чт, вс 8–17; время Ростова совпадает с московским
  var close = { 0: 17, 1: 16, 2: 16, 3: 16, 4: 17, 5: 16, 6: 16 };
  var now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Moscow' }));
  var d = now.getDay(), h = now.getHours() + now.getMinutes() / 60;
  var open = h >= 8 && h < close[d];
  state.setAttribute('data-shop-state', open ? 'open' : 'closed');
  state.querySelector('[data-shop-open]').textContent = open
    ? 'Открыто до ' + close[d] + ':00'
    : (h < 8 ? 'Откроемся сегодня в 8:00' : 'Откроемся завтра в 8:00');
})();
