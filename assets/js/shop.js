/* Каталог: подборки, страница категории с фильтрами, карточка товара.
   Данные — window.CATALOG из catalog-data.js */
(function () {
  'use strict';

  var D = window.CATALOG;
  var page = document.body.getAttribute('data-page');
  if (!D || !page) return;

  var WA = '79885192525';
  var TG = 'https://t.me/furnityra_rostov';
  var MAX = 'https://max.ru/'; /* TODO: ссылка на профиль магазина в Max */
  var PER_PAGE = 20;
  var LISTS = { hit: 'Хиты продаж', sale: 'Акции', 'new': 'Новинки' };
  /* порядок фильтров — как в привычных каталогах фурнитуры */
  var ATTR_ORDER = ['Материал', 'Страна производитель', 'Вес', 'Цвет', 'Длина', 'Толщина', 'Ширина',
    'Диаметр', 'Высота', 'Размер', 'Узор', 'Номер цвета'];

  var cats = {};
  D.categories.forEach(function (c) { cats[c.slug] = c; });
  var byId = {};
  D.products.forEach(function (p) { byId[p.id] = p; });

  var params = new URLSearchParams(location.search);

  /* --- форматирование ---------------------------------------------------- */
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function money(n, cents) {
    return n.toLocaleString('ru-RU', { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: 2 }) + ' ₽';
  }
  function unitPrice(p) { return money(Math.round(p.opt / p.pack * 100) / 100); }
  function subOf(p) {
    var c = cats[p.cat];
    for (var i = 0; i < c.subs.length; i++) if (c.subs[i].slug === p.sub) return c.subs[i];
    return null;
  }
  function plural(n, one, few, many) {
    var m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
    return many;
  }
  /* сравнение с учётом чисел: «5 мм» раньше «10 мм» */
  var collator = new Intl.Collator('ru', { numeric: true, sensitivity: 'base' });

  /* --- разметка ---------------------------------------------------------- */
  function picture(img, alt, cls, pos, eager) {
    return '<picture><source type="image/webp" srcset="assets/img/' + img + '.webp">' +
      '<img class="' + cls + '" src="assets/img/' + img + '.jpg" alt="' + esc(alt) + '"' +
      (pos != null ? ' style="object-position:' + pos + '% 50%"' : '') +
      (eager ? '' : ' loading="lazy"') + ' decoding="async"></picture>';
  }

  function card(p) {
    return '<li class="pcard">' +
      '<a class="pcard__link" href="product.html?id=' + p.id + '">' +
        '<span class="pcard__media">' + picture(cats[p.cat].img, p.name, 'pcard__img', p.pos) + '</span>' +
        '<span class="pcard__name">' + esc(p.name) + '</span>' +
      '</a>' +
      '<p class="pcard__meta">Цена за единицу: <b>' + unitPrice(p) + '</b></p>' +
      '<p class="pcard__price"><b>' + money(p.opt) + '</b> <span class="pcard__tag">опт</span>' +
        (p.old ? ' <s>' + money(p.old) + '</s>' : '') + '</p>' +
      '<p class="pcard__retail">' + money(p.retail, true) + ' <span>розница</span></p>' +
    '</li>';
  }

  function crumbs(items) {
    return '<ol class="crumbs__list">' + items.map(function (it, i) {
      var last = i === items.length - 1;
      return '<li>' + (last ? '<span aria-current="page">' + esc(it[0]) + '</span>'
        : '<a href="' + it[1] + '">' + esc(it[0]) + '</a>') + '</li>';
    }).join('') + '</ol>';
  }

  /* значок мессенджера как у приложения */
  function appLink(id, name, href) {
    var ico = id === 'max'
      ? '<img class="app" src="assets/img/max-logo.png" width="40" height="40" alt="">'
      : '<span class="app app--' + id + '"><svg width="22" height="22" aria-hidden="true"><use href="#i-' + (id === 'tg' ? 'tg2' : 'wa') + '"></use></svg></span>';
    return '<a class="app-link app-link--lg" href="' + href + '" target="_blank" rel="noopener" aria-label="Написать в ' + name + '" title="' + name + '">' + ico + '</a>';
  }

  function byPop(a, b) { return b.pop - a.pop; }
  function $(id) { return document.getElementById(id); }

  /* ======================================================================
     Категория / подборка: подкатегории, фильтры, сортировка, страницы
     ====================================================================== */
  function initCategory() {
    var root = $('shop');
    var list = params.get('list');
    var cat = cats[params.get('c')];
    var sub = null;
    if (!LISTS[list]) list = null;
    if (!list && !cat) { notFound(root, 'Категория не найдена'); return; }
    if (cat) cat.subs.forEach(function (s) { if (s.slug === params.get('s')) sub = s; });

    var base = D.products.filter(function (p) {
      if (list) return p.flags[list];
      return p.cat === cat.slug && (!sub || p.sub === sub.slug);
    });

    var title = list ? LISTS[list] : sub ? sub.name : cat.name;
    document.title = title + ' — каталог «Рукодельницы»';
    var trail = [['Главная', './'], ['Каталог товаров', 'catalog.html']];
    if (cat) trail.push([cat.name, 'category.html?c=' + cat.slug]);
    if (sub) trail.push([sub.name, '']);
    if (list) trail.push([title, '']);
    $('crumbs').innerHTML = crumbs(trail);
    $('shop-title').textContent = title;

    /* плитки подкатегорий (или соседних подборок) */
    var tiles = $('subcats');
    /* в подгруппе плитки не нужны — сразу её товары */
    if (sub) {
      tiles.remove();
    } else if (cat) {
      tiles.innerHTML = cat.subs.map(function (s, i) {
        return '<li><a class="subcat" href="category.html?c=' + cat.slug + '&s=' + s.slug + '">' +
          '<span class="subcat__media">' + picture(cat.img, '', 'subcat__img', (i * 37) % 100, true) + '</span>' +
          '<span class="subcat__name">' + esc(s.name) + '</span></a></li>';
      }).join('');
    } else {
      tiles.classList.add('subcats--chips');
      tiles.innerHTML = Object.keys(LISTS).map(function (k) {
        var on = k === list;
        return '<li><a class="chip-link' + (on ? ' is-active' : '') + '" href="category.html?list=' + k + '"' +
          (on ? ' aria-current="page"' : '') + '>' + LISTS[k] + '</a></li>';
      }).join('');
    }

    /* --- фильтры -------------------------------------------------------- */
    var groups = {};
    base.forEach(function (p) {
      Object.keys(p.attrs).forEach(function (k) {
        (groups[k] = groups[k] || {})[p.attrs[k]] = ((groups[k] || {})[p.attrs[k]] || 0) + 1;
      });
    });
    var keys = ATTR_ORDER.filter(function (k) { return groups[k] && Object.keys(groups[k]).length > 1; });
    var hasNew = base.some(function (p) { return p.flags['new']; }) && list !== 'new';

    function range(field) {
      var v = base.map(function (p) { return p[field]; });
      return [Math.floor(Math.min.apply(null, v)), Math.ceil(Math.max.apply(null, v))];
    }
    function priceGroup(field, label, id) {
      var r = range(field);
      return '<details class="filter"><summary class="filter__head">' + label + chevron() + '</summary>' +
        '<div class="filter__body filter__range">' +
          '<label><span class="visually-hidden">' + label + ' от</span><input type="number" inputmode="numeric" min="0" data-f="' + id + 'Min" placeholder="от ' + r[0] + '"></label>' +
          '<label><span class="visually-hidden">' + label + ' до</span><input type="number" inputmode="numeric" min="0" data-f="' + id + 'Max" placeholder="до ' + r[1] + '"></label>' +
        '</div></details>';
    }
    function chevron() {
      return '<svg viewBox="0 0 432 324" aria-hidden="true"><use href="#i-chev"></use></svg>';
    }

    var form = $('filters-form');
    form.innerHTML =
      priceGroup('opt', 'Оптовая цена', 'opt') +
      priceGroup('retail', 'Розничная цена', 'ret') +
      (hasNew ? '<details class="filter"><summary class="filter__head">Новинка' + chevron() + '</summary>' +
        '<div class="filter__body"><label class="check"><input type="checkbox" data-f="new"> Только новинки</label></div></details>' : '') +
      keys.map(function (k) {
        var vals = Object.keys(groups[k]).sort(collator.compare);
        return '<details class="filter"><summary class="filter__head">' + esc(k) + chevron() + '</summary>' +
          '<div class="filter__body">' + vals.map(function (v) {
            return '<label class="check"><input type="checkbox" data-attr="' + esc(k) + '" value="' + esc(v) + '"> ' +
              esc(v) + ' <span class="check__count">' + groups[k][v] + '</span></label>';
          }).join('') + '</div></details>';
      }).join('') +
      '<div class="filters__actions">' +
        '<button class="btn btn--sm" type="submit">Применить</button>' +
        '<button class="btn btn--sm btn--ghost" type="reset">Сбросить</button>' +
      '</div>';

    var active = {};
    function readForm() {
      var f = { attrs: {} };
      [].forEach.call(form.querySelectorAll('[data-f]'), function (el) {
        var key = el.getAttribute('data-f');
        if (el.type === 'checkbox') f[key] = el.checked;
        else if (el.value !== '') f[key] = parseFloat(el.value);
      });
      [].forEach.call(form.querySelectorAll('[data-attr]:checked'), function (el) {
        var k = el.getAttribute('data-attr');
        (f.attrs[k] = f.attrs[k] || []).push(el.value);
      });
      return f;
    }
    function passes(p) {
      var f = active;
      if (f.optMin != null && p.opt < f.optMin) return false;
      if (f.optMax != null && p.opt > f.optMax) return false;
      if (f.retMin != null && p.retail < f.retMin) return false;
      if (f.retMax != null && p.retail > f.retMax) return false;
      if (f['new'] && !p.flags['new']) return false;
      for (var k in f.attrs) if (f.attrs[k].indexOf(p.attrs[k]) === -1) return false;
      return true;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      active = readForm();
      state.page = 1;
      render(true);
      if (window.matchMedia('(max-width: 1000px)').matches) setFilters(false);
    });
    form.addEventListener('reset', function () {
      setTimeout(function () { active = {}; state.page = 1; render(true); }, 0);
    });

    /* «Скрыть фильтр»: на телефоне панель по умолчанию свёрнута */
    var toggle = $('filters-toggle');
    var aside = $('filters');
    function setFilters(open) {
      aside.classList.toggle('is-hidden', !open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.lastChild.textContent = open ? 'Скрыть фильтр' : 'Показать фильтр';
    }
    setFilters(!window.matchMedia('(max-width: 1000px)').matches);
    toggle.addEventListener('click', function () { setFilters(aside.classList.contains('is-hidden')); });

    /* --- сортировка и страницы ----------------------------------------- */
    var state = {
      sort: params.get('sort') || 'pop',
      dir: params.get('dir') === 'asc' ? 1 : params.get('dir') === 'desc' ? -1 : 0,
      page: Math.max(1, parseInt(params.get('page'), 10) || 1)
    };
    var DEF_DIR = { pop: -1, name: 1, price: 1 };
    if (!DEF_DIR[state.sort]) state.sort = 'pop';
    if (!state.dir) state.dir = DEF_DIR[state.sort];

    var sortBtns = [].slice.call(document.querySelectorAll('.sortbar__btn'));
    sortBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        var key = b.getAttribute('data-sort');
        state.dir = state.sort === key ? -state.dir : DEF_DIR[key];
        state.sort = key;
        state.page = 1;
        render(false);
      });
    });

    function sorted(items) {
      var d = state.dir;
      return items.sort(function (a, b) {
        if (state.sort === 'name') return d * collator.compare(a.name, b.name);
        if (state.sort === 'price') return d * (a.opt - b.opt);
        return d * (a.pop - b.pop);
      });
    }

    function pager(total, cur) {
      if (total < 2) return '';
      var nums = [];
      for (var i = 1; i <= total; i++) {
        if (i === 1 || i === total || Math.abs(i - cur) <= 1 || (cur <= 3 && i <= 4) || (cur >= total - 2 && i >= total - 3)) nums.push(i);
        else if (nums[nums.length - 1] !== '…') nums.push('…');
      }
      var btn = function (n, label, extra) {
        return '<button class="pager__btn' + (extra || '') + '" type="button" data-page="' + n + '"' +
          (n === cur && !label ? ' aria-current="page"' : '') + (label ? ' aria-label="' + label + '"' : '') + '>';
      };
      return (cur > 1 ? btn(cur - 1, 'Предыдущая страница', ' pager__btn--arrow') + '‹</button>' : '') +
        nums.map(function (n) {
          return n === '…' ? '<span class="pager__gap">…</span>' : btn(n) + n + '</button>';
        }).join('') +
        (cur < total ? btn(cur + 1, 'Следующая страница', ' pager__btn--arrow') + '›</button>' : '');
    }

    var grid = $('products');
    var pagerEl = $('pager');
    /* вторая навигация по страницам — над товарами, как в привычных каталогах */
    var pagerTop = pagerEl.cloneNode(false);
    pagerTop.id = 'pager-top';
    pagerTop.className = 'pager pager--top';
    pagerTop.setAttribute('aria-label', 'Страницы каталога, сверху');
    grid.parentNode.insertBefore(pagerTop, grid);
    var countEl = $('shop-count');

    function onPager(e) {
      var b = e.target.closest('[data-page]');
      if (!b) return;
      state.page = parseInt(b.getAttribute('data-page'), 10);
      render(true);
    }
    pagerEl.addEventListener('click', onPager);
    pagerTop.addEventListener('click', onPager);

    function render(scroll) {
      var items = sorted(base.filter(passes));
      var pages = Math.max(1, Math.ceil(items.length / PER_PAGE));
      if (state.page > pages) state.page = pages;
      var slice = items.slice((state.page - 1) * PER_PAGE, state.page * PER_PAGE);

      grid.innerHTML = slice.length ? slice.map(card).join('')
        : '<li class="shop__empty">По выбранным фильтрам ничего не нашлось. Попробуйте сбросить часть условий или <a href="' + TG + '" target="_blank" rel="noopener">пришлите фото</a>&nbsp;— подберём.</li>';
      pagerEl.innerHTML = pagerTop.innerHTML = pager(pages, state.page);
      countEl.textContent = items.length + ' ' + plural(items.length, 'товар', 'товара', 'товаров');

      sortBtns.forEach(function (b) {
        var on = b.getAttribute('data-sort') === state.sort;
        b.classList.toggle('is-active', on);
        b.classList.toggle('is-desc', on && state.dir < 0);
        b.setAttribute('aria-pressed', String(on));
      });

      /* сортировка и страница — в адресе, чтобы «назад» и ссылка работали */
      var q = new URLSearchParams(location.search);
      q.set('sort', state.sort);
      q.set('dir', state.dir < 0 ? 'desc' : 'asc');
      if (state.page > 1) q.set('page', state.page); else q['delete']('page');
      history.replaceState(null, '', location.pathname + '?' + q.toString());

      if (scroll) {
        var top = $('shop-bar').getBoundingClientRect().top;
        if (top < 0) $('shop-bar').scrollIntoView({ block: 'start' });
      }
    }
    render(false);
  }

  /* ======================================================================
     Карточка товара
     ====================================================================== */
  function initProduct() {
    var root = $('product');
    var p = byId[params.get('id')];
    if (!p) { notFound(root, 'Товар не найден'); return; }
    var cat = cats[p.cat], sub = subOf(p);

    document.title = p.name + ' — «Рукодельница»';
    $('crumbs').innerHTML = crumbs([
      ['Главная', './'], ['Каталог товаров', 'catalog.html'],
      [cat.name, 'category.html?c=' + cat.slug],
      [sub.name, 'category.html?c=' + cat.slug + '&s=' + sub.slug],
      [p.name, '']
    ]);

    var specs = [['В упаковке', p.pack + ' ' + p.unit]]
      .concat(Object.keys(p.attrs).map(function (k) { return [k, p.attrs[k]]; }));
    var brief = Object.keys(p.attrs).slice(0, 4);
    var msg = 'Здравствуйте! Хочу заказать: ' + p.name + '.';

    root.innerHTML =
      '<h1 class="product__title">' + esc(p.name) + '</h1>' +
      '<div class="product__grid">' +
        '<div class="product__media">' + picture(cat.img, p.name, 'product__img', p.pos, true) + '</div>' +
        '<div class="product__info">' +
          '<p class="product__label">Оптовая цена</p>' +
          '<p class="product__price">' + money(p.opt) +
            (p.old ? ' <s>' + money(p.old) + '</s>' : '') +
            '<span class="hint" tabindex="0" aria-label="Об оптовой цене">i<span class="hint__text" role="tooltip">Оптовая цена действует для оптовых покупателей. Условия уточняйте у продавца.</span></span></p>' +
          '<p class="product__retail">' + money(p.retail, true) + ' <span>розница</span></p>' +
          '<p class="product__unit">Цена за единицу: <b>' + unitPrice(p) + '</b> · в упаковке ' + p.pack + ' ' + p.unit + '</p>' +
          '<details class="order-pick">' +
            '<summary class="btn btn--arrow">Оформить заказ<svg class="btn__arrow" aria-hidden="true"><use href="#i-arrow"></use></svg></summary>' +
            '<div class="order-pick__panel"><span class="order-pick__label">Написать в</span>' +
              appLink('tg', 'Telegram', TG) + appLink('max', 'Max', MAX) +
              appLink('wa', 'WhatsApp', 'https://wa.me/' + WA + '?text=' + encodeURIComponent(msg)) + '</div>' +
          '</details>' +
          '<p class="product__note">Отправьте название в мессенджер&nbsp;— подтвердим наличие и&nbsp;стоимость.</p>' +
          '<dl class="product__brief">' + brief.map(function (k) {
            return '<div><dt>' + esc(k) + '</dt><dd>' + esc(p.attrs[k]) + '</dd></div>';
          }).join('') + '</dl>' +
          '<a class="product__all" href="#specs">Все характеристики <svg viewBox="0 0 432 324" aria-hidden="true"><use href="#i-chev"></use></svg></a>' +
        '</div>' +
      '</div>' +
      '<section class="specs" id="specs"><h2 class="specs__head">Характеристики</h2>' +
        '<table class="specs__table"><tbody>' + specs.map(function (r) {
          return '<tr><th scope="row">' + esc(r[0]) + '</th><td>' + esc(r[1]) + '</td></tr>';
        }).join('') + '</tbody></table></section>';

    var similar = D.products.filter(function (q) { return q.sub === p.sub && q.cat === p.cat && q.id !== p.id; })
      .sort(byPop).slice(0, 4);
    if (similar.length) {
      $('similar').hidden = false;
      $('similar-grid').innerHTML = similar.map(card).join('');
      $('similar-more').href = 'category.html?c=' + cat.slug + '&s=' + sub.slug;
    }
  }

  function notFound(root, text) {
    document.title = text + ' — «Рукодельница»';
    var c = $('crumbs');
    if (c) c.innerHTML = crumbs([['Главная', './'], ['Каталог товаров', 'catalog.html'], [text, '']]);
    root.innerHTML = '<div class="shop__empty"><h1 class="product__title">' + text + '</h1>' +
      '<p>Возможно, ссылка устарела. <a href="catalog.html">Перейти в каталог</a></p></div>';
  }

  if (page === 'category') initCategory();
  if (page === 'product') initProduct();
})();
