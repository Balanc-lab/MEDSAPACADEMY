/* GitHub Pages fallback: send unknown paths back to the app root. */
(function () {
  var parts = location.pathname.split('/').filter(Boolean);
  var base = location.hostname.endsWith('github.io') && parts.length ? '/' + parts[0] + '/' : '/';
  location.replace(base + 'index.html' + (location.hash || ''));
})();
