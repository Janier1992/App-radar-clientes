import { useSyncExternalStore } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PwaState {
  canInstall: boolean; // el navegador permite instalar con un clic
  installed: boolean; // se está usando como app instalada
  online: boolean;
  updateReady: boolean; // hay una versión nueva descargada
  isIos: boolean; // iOS no tiene botón de instalar: hay que explicar el menú Compartir
}

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

const isIos = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

let state: PwaState = {
  canInstall: false,
  installed: typeof window !== 'undefined' ? isStandalone() : false,
  online: typeof navigator !== 'undefined' ? navigator.onLine : true,
  updateReady: false,
  isIos: typeof window !== 'undefined' ? isIos() : false,
};
const listeners = new Set<() => void>();
let deferredPrompt: BeforeInstallPromptEvent | null = null;
let waitingWorker: ServiceWorker | null = null;

const set = (patch: Partial<PwaState>) => {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
};

export function initPwa() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    set({ canInstall: true });
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    set({ canInstall: false, installed: true });
  });
  window.addEventListener('online', () => set({ online: true }));
  window.addEventListener('offline', () => set({ online: false }));

  // El service worker solo se registra en producción (en desarrollo estorba al recargar).
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      const track = (worker: ServiceWorker | null) => {
        if (!worker) return;
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            waitingWorker = worker;
            set({ updateReady: true });
          }
        });
      };
      if (reg.waiting && navigator.serviceWorker.controller) {
        waitingWorker = reg.waiting;
        set({ updateReady: true });
      }
      reg.addEventListener('updatefound', () => track(reg.installing));
      // Busca versiones nuevas al volver a la app.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') reg.update().catch(() => undefined);
      });
    } catch (err) {
      console.warn('No se pudo registrar el service worker:', err);
    }
  });
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return;
    reloading = true;
    window.location.reload();
  });
}

export async function promptInstall() {
  if (!deferredPrompt) return;
  const prompt = deferredPrompt;
  deferredPrompt = null;
  set({ canInstall: false });
  await prompt.prompt();
  await prompt.userChoice;
}

export function applyUpdate() {
  waitingWorker?.postMessage('SKIP_WAITING');
}

export const usePwa = () =>
  useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state
  );
