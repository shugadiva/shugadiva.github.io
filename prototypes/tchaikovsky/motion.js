// Движение киоска, правки #18 и #6. Подключается после kiosk.js и сценария страницы.
// Пункты списка Дианы помечены номерами. Анимации через Web Animations API, только scale, translate и opacity.
(function () {
  var stage = document.querySelector('.stage');
  if (!stage) return;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var EASE = {
    standard: 'cubic-bezier(0.2, 0, 0, 1)',
    exit: 'cubic-bezier(0.4, 0, 1, 1)',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
  };
  function k() { return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--k')) || 1; }
  function visible(el) { return !!el && getComputedStyle(el).display !== 'none'; }
  function rand(a, b) { return a + Math.random() * (b - a); }

  // 1. tap · круг в точке касания · scale 0 → 1, opacity 40% → 0 · 400 мс · standard
  stage.addEventListener('pointerdown', function (e) {
    if (reduced) return;
    var r = stage.getBoundingClientRect(), s = k();
    var dot = document.createElement('span');
    dot.className = 'tap';
    dot.style.left = (e.clientX - r.left) / s + 'px';
    dot.style.top = (e.clientY - r.top) / s + 'px';
    stage.appendChild(dot);
    dot.addEventListener('animationend', function () { dot.remove(); });
  });

  // 5. вход экрана · translateY 24 → 0, opacity 0 → 100% · 250 мс, задержка 60 мс между карточками · standard
  function stagger(root) {
    if (reduced) return;
    var items = root.querySelectorAll('.answer-card, .topic-card, .card');
    Array.prototype.forEach.call(items, function (el, i) {
      el.animate([{ translate: '0 24px', opacity: 0 }, { translate: '0 0', opacity: 1 }],
        { duration: 250, delay: 120 + i * 60, easing: EASE.standard, fill: 'backwards' });
    });
  }

  // 4. переход между экранами: вход opacity 0 → 100%, сцена scale 1.04 → 1 · 400 мс · standard
  function enter(root) {
    if (reduced) return;
    root.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400, easing: EASE.standard });
    root.querySelectorAll('.layer.cover, .layer.final__bg, .game__bg').forEach(function (l) {
      if (!visible(l)) return;
      l.animate([{ scale: 1.04 }, { scale: 1 }], { duration: 400, easing: EASE.standard });
    });
    stagger(root);
    if (root.classList.contains('screen--final')) finale(root);
  }
  //    выход opacity → 0 · 150 мс · exit: при переходе на другую страницу
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href]');
    if (!a || reduced || e.defaultPrevented || a.target) return;
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#') return;
    e.preventDefault();
    stage.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, easing: EASE.exit, fill: 'forwards' })
      .finished.then(function () { location.href = href; });
  });

  // 8. блёстки на заставках, стартовом экране и финалах; на финалах гуще
  function sparkles(root, count) {
    if (reduced || root.querySelector(':scope > .sparkles')) return;
    var box = document.createElement('div');
    box.className = 'sparkles';
    box.setAttribute('aria-hidden', 'true');
    for (var i = 0; i < count; i++) {
      var s = document.createElement('span');
      s.className = 'sparkle';
      s.style.left = rand(2, 98) + '%';
      s.style.top = rand(15, 95) + '%';
      s.style.setProperty('--size', Math.round(rand(6, 14)) + 'px');
      var d = rand(3, 5);
      s.style.setProperty('--d', d.toFixed(2) + 's');
      s.style.setProperty('--delay', (-rand(0, d)).toFixed(2) + 's');
      box.appendChild(s);
    }
    // над картинкой сцены, под текстом и кнопками
    var layers = root.querySelectorAll(':scope > .layer');
    var last = layers[layers.length - 1];
    if (last) last.after(box); else root.prepend(box);
  }

  // 9. финал · заголовок scale 0.9 → 1 и opacity · 400 мс · spring + всплеск блёсток
  function finale(root) {
    var title = root.querySelector('.stack__text h2');
    if (!title) return;
    title.animate([{ scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1 }],
      { duration: 400, delay: 150, easing: EASE.spring, fill: 'backwards' });
    var r = title.getBoundingClientRect(), sr = stage.getBoundingClientRect(), s = k();
    var cx = (r.left + r.width / 2 - sr.left) / s, cy = (r.top + r.height / 2 - sr.top) / s;
    for (var i = 0; i < 18; i++) {
      var p = document.createElement('span');
      var a = (i / 18) * Math.PI * 2, dist = rand(160, 420);
      p.className = 'sparkle sparkle--burst';
      p.style.left = cx + 'px'; p.style.top = cy + 'px'; p.style.zIndex = 3;
      p.style.setProperty('--size', Math.round(rand(10, 16)) + 'px');
      p.style.setProperty('--bx', Math.cos(a) * dist + 'px');
      p.style.setProperty('--by', Math.sin(a) * dist * 0.5 + 'px');
      p.style.setProperty('--delay', (0.15 + rand(0, 0.15)).toFixed(2) + 's');
      root.appendChild(p);
      p.addEventListener('animationend', function () { this.remove(); });
    }
  }

  // 6. ответ: верный scale 1 → 1.04 → 1 · 400 мс · spring; неверный покачивание ±8 дважды · 300 мс
  new MutationObserver(function (list) {
    if (reduced) return;
    list.forEach(function (m) {
      var el = m.target, was = m.oldValue || '';
      if (el.classList.contains('is-correct') && was.indexOf('is-correct') < 0) {
        el.animate([{ scale: 1 }, { scale: 1.04 }, { scale: 1 }], { duration: 400, easing: EASE.spring });
      }
      if (el.classList.contains('is-wrong') && was.indexOf('is-wrong') < 0) {
        el.animate([{ translate: '0 0' }, { translate: '-8px 0' }, { translate: '8px 0' }, { translate: '-8px 0' }, { translate: '8px 0' }, { translate: '0 0' }],
          { duration: 300, easing: 'ease-in-out' });
      }
    });
  }).observe(stage, { subtree: true, attributes: true, attributeFilter: ['class'], attributeOldValue: true });

  // Смена экрана внутри страницы (data-screen): вход только для нового раздела,
  // смена состояния в том же разделе (ответ, повтор) меняет только фон плавной подменой.
  var screens = Array.prototype.slice.call(stage.querySelectorAll('.screen'));
  function current() { return screens.filter(visible)[0] || null; }
  function bgs() { return Array.prototype.slice.call(stage.querySelectorAll('.game__bg')).filter(visible); }
  var shown = current(), shownBg = bgs();
  new MutationObserver(function () {
    var now = current();
    if (now && now !== shown) enter(now);
    else if (!reduced) bgs().forEach(function (b) {
      if (shownBg.indexOf(b) < 0) b.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 250, easing: EASE.standard });
    });
    shown = now; shownBg = bgs();
  }).observe(stage, { attributes: true, attributeFilter: ['data-screen'] });

  // Старт страницы
  screens.forEach(function (sc) {
    if (sc.matches('.screen--final')) sparkles(sc, 32);
    else if (sc.matches('.screen--intro, .screen--topics')) sparkles(sc, 22);
  });
  if (stage.classList.contains('start')) sparkles(stage, 24);
  document.querySelectorAll('.start__poppies, .final__poppies, .final__fg').forEach(function (el, i) {
    el.classList.add('fg-sway');
    el.style.setProperty('--sway-duration', (6 + i * 1.3) + 's');
    el.style.setProperty('--sway-delay', (-i * 2.1) + 's');
  });
  if (shown) enter(shown); else enter(stage);
})();
