// Minimal hash router: "#/segment/segment?key=value".
const routes = [];
let current = null;
let onRoute = null;

export function route(pattern, view) {
  const keys = [];
  const re = new RegExp('^' + pattern.replace(/:(\w+)/g, (m, k) => { keys.push(k); return '([^/]+)'; }) + '/?$');
  routes.push({ re, keys, view });
}
export function parseHash(hash = location.hash) {
  const raw = hash.replace(/^#/, '') || '/';
  const [p, qs] = raw.split('?');
  const path = '/' + p.replace(/^\/+/, '');
  const query = Object.fromEntries(new URLSearchParams(qs || ''));
  return { path, query };
}
export function resolve(hash) {
  const { path, query } = parseHash(hash);
  for (const r of routes) {
    const m = path.match(r.re);
    if (m) {
      const params = {};
      r.keys.forEach((k, i) => { params[k] = decodeURIComponent(m[i + 1]); });
      return { view: r.view, params, query, path };
    }
  }
  return { view: null, params: {}, query, path };
}
export function startRouter(handler) {
  onRoute = handler;
  window.addEventListener('hashchange', () => run());
  run();
}
export function run() {
  current = resolve(location.hash);
  if (onRoute) onRoute(current);
}
export const currentRoute = () => current;
export function navigate(hash, { replace = false } = {}) {
  if (replace) { history.replaceState(history.state, '', hash); run(); } else location.hash = hash;
}
// Update the URL without re-rendering (e.g. switching tabs inside a view).
export function setHashSilently(hash) {
  history.replaceState(history.state, '', hash);
  current = resolve(hash);
}
