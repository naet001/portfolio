// Mobile menu toggle
(function () {
  var btn = document.getElementById('menu-btn');
  var menu = document.getElementById('mobile-menu');
  if (!btn || !menu) return;

  btn.addEventListener('click', function () {
    var open = menu.classList.toggle('hidden');
    btn.setAttribute('aria-expanded', String(!open));
  });

  // Close the menu when a link inside it is clicked
  menu.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') {
      menu.classList.add('hidden');
      btn.setAttribute('aria-expanded', 'false');
    }
  });
})();
