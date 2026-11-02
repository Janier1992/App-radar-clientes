import { QueueItem } from './outreachPlan';

const STATE_KEY = 'radar_notify_state';

export const notificationsSupported = () => typeof window !== 'undefined' && 'Notification' in window;
export const notificationPermission = (): NotificationPermission | 'unsupported' =>
  notificationsSupported() ? Notification.permission : 'unsupported';

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!notificationsSupported()) return 'unsupported';
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

export interface PendingCounts {
  demos: number;
  responded: number;
  followUps: number;
  total: number;
}

export function countPending(queue: QueueItem[]): PendingCounts {
  const demos = queue.filter((q) => q.kind === 'demo').length;
  const responded = queue.filter((q) => q.kind === 'respondio').length;
  const followUps = queue.filter((q) => q.kind === 'seguimiento' || q.kind === 'accion').length;
  return { demos, responded, followUps, total: demos + responded + followUps };
}

export function describePending(c: PendingCounts): string {
  const parts = [
    c.demos > 0 && `${c.demos} ${c.demos === 1 ? 'demo próxima' : 'demos próximas'}`,
    c.responded > 0 && `${c.responded} ${c.responded === 1 ? 'negocio que respondió' : 'negocios que respondieron'}`,
    c.followUps > 0 && `${c.followUps} ${c.followUps === 1 ? 'seguimiento pendiente' : 'seguimientos pendientes'}`,
  ].filter(Boolean);
  return `Tienes ${parts.join(', ')}.`;
}

async function show(title: string, body: string) {
  const options: NotificationOptions = {
    body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: 'radar-pendientes',
    data: { url: '/?screen=leads' },
  };
  try {
    // Si no hay service worker activo, `ready` nunca se resuelve: se espera un instante y se usa la notificación directa.
    const reg = await Promise.race([navigator.serviceWorker?.ready, new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), 1500))]);
    if (reg?.showNotification) return void (await reg.showNotification(title, options));
  } catch {
    /* sin service worker: se usa la notificación directa */
  }
  new Notification(title, options);
}

/** Avisa una sola vez por día y por combinación de pendientes, y solo en horario de trabajo (8 a. m. – 7 p. m.). */
export async function notifyIfDue(queue: QueueItem[], now: Date = new Date()): Promise<boolean> {
  if (notificationPermission() !== 'granted') return false;
  const hour = now.getHours();
  if (hour < 8 || hour >= 19) return false;
  const counts = countPending(queue);
  if (counts.total === 0) return false;
  const signature = `${now.toLocaleDateString('en-CA')}|${counts.demos}-${counts.responded}-${counts.followUps}`;
  try {
    if (localStorage.getItem(STATE_KEY) === signature) return false;
    localStorage.setItem(STATE_KEY, signature);
  } catch {
    /* sin almacenamiento: puede repetirse el aviso */
  }
  await show('Radar de Clientes', describePending(counts));
  return true;
}

export async function sendTestNotification() {
  if (notificationPermission() !== 'granted') return;
  await show('Radar de Clientes', 'Así se verán tus avisos de demos y seguimientos.');
}
