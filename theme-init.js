/* Applies saved theme and language before first paint to avoid a flash of the wrong theme/direction. */
(function () {
  try {
    var s = JSON.parse(localStorage.getItem('la:v1') || '{}');
    var p = s.prefs || {};
    var theme = p.theme || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    var lang = p.lang === 'en' || p.lang === 'fr' ? p.lang : 'ar';
    var el = document.documentElement;
    el.setAttribute('data-theme', theme);
    el.setAttribute('lang', lang);
    el.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  } catch (e) { /* storage unavailable: defaults apply */ }
})();
