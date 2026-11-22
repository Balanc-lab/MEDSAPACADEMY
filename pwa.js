// Service worker registration, install prompt and connectivity state.
import { t } from './i18n.js';
import { toast } from './dom.js';

let deferredPrompt = null;
let userRequestedUpdate = false;
const subs = new Set();
export const pwa = {
  get canInstall() { return !!deferredPrompt; },
  get standalone() { return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true; },
  online: navigator.onLine,
  offlineReady: false,
  on(fn) { subs.add(fn); return () => subs.delete(fn); },
  async install() {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice.catch(() => null);
    deferredPrompt = null; emit();
    return choice && choice.outcome === 'accepted';
  }
};
const emit = () => subs.forEach((fn) => { try { fn(pwa); } catch (e) { /* ignore */ } });

export function initPWA() {
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; emit(); });
  window.addEventListener('appinstalled', () => { deferredPrompt = null; emit(); });
  window.addEventListener('online', () => { pwa.online = true; emit(); toast(t('toast.online')); });
  window.addEventListener('offline', () => { pwa.online = false; emit(); toast(t('toast.offline'), { tone: 'warn' }); });
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
  navigator.serviceWorker.register('service-worker.js').then((reg) => {
    const markReady = () => { pwa.offlineReady = true; emit(); };
    if (reg.active) markReady();
    navigator.serviceWorker.addEventListener('message', (ev) => { if (ev.data && ev.data.type === 'precached') markReady(); });
    reg.addEventListener('updatefound', () => {
      const nw = reg.installing;
      if (!nw) return;
      nw.addEventListener('statechange', () => {
        if (nw.state === 'installed' && navigator.serviceWorker.controller) {
          toast(t('update.available'), { timeout: 0, action: { label: t('update.reload'), fn: () => { userRequestedUpdate = true; nw.postMessage({ type: 'skipWaiting' }); } } });
        }
        if (nw.state === 'activated') markReady();
      });
    });
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (reloaded || !userRequestedUpdate) return; reloaded = true; location.reload(); });
  }).catch(() => { /* registration may be blocked in some embedded contexts; the app still works online */ });
}
