import { PageSpeedAudit } from '../types';

const PSI_ENDPOINT = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
const TIMEOUT_MS = 90_000;

export interface PageSpeedResult {
  audit?: PageSpeedAudit;
  error?: string;
}

function buildUrl(siteUrl: string, apiKey?: string): string {
  const params = new URLSearchParams({ url: siteUrl, strategy: 'mobile' });
  ['performance', 'seo', 'accessibility', 'best-practices'].forEach((c) => params.append('category', c));
  if (apiKey && apiKey.trim()) params.set('key', apiKey.trim());
  return `${PSI_ENDPOINT}?${params.toString()}`;
}

async function callPsi(url: string, signal: AbortSignal): Promise<Response> {
  return fetch(url, { signal });
}

const toScore = (value: unknown): number => {
  const n = typeof value === 'number' ? value : 0;
  return Math.round(Math.min(1, Math.max(0, n)) * 100);
};

/**
 * Mide la web con PageSpeed Insights (Lighthouse móvil) directamente desde el navegador.
 * Devuelve las notas reales, o un mensaje de error si Google no pudo medir el sitio.
 * Si la clave de Google Cloud no tiene habilitada PageSpeed Insights API, reintenta sin clave
 * (cuota anónima compartida, más limitada).
 */
export async function fetchPageSpeedAudit(siteUrl: string, apiKey?: string): Promise<PageSpeedResult> {
  const target = /^https?:\/\//i.test(siteUrl) ? siteUrl : `https://${siteUrl}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    let keyRejected = false;
    let response = await callPsi(buildUrl(target, apiKey), controller.signal);

    if ((response.status === 400 || response.status === 403) && apiKey && apiKey.trim()) {
      console.warn('PageSpeed rechazó la clave de Google Cloud; reintentando sin clave.');
      keyRejected = true;
      response = await callPsi(buildUrl(target), controller.signal);
    }

    if (!response.ok) {
      let detail = '';
      try {
        const body = await response.json();
        detail = body?.error?.message || '';
      } catch {
        // sin cuerpo JSON
      }
      if (response.status === 429 || keyRejected) {
        return {
          error: keyRejected
            ? 'Tu clave de Google Cloud no tiene habilitada «PageSpeed Insights API». Actívala en tu proyecto y permítela en las restricciones de la clave.'
            : 'Google PageSpeed alcanzó su límite de consultas. Intenta de nuevo en unos minutos o configura una clave de Google Cloud con «PageSpeed Insights API» habilitada.',
        };
      }
      return { error: `Google PageSpeed no pudo medir este sitio (${response.status}). ${detail}`.trim() };
    }

    const data = await response.json();
    const categories = data?.lighthouseResult?.categories;
    if (!categories?.performance) {
      return { error: 'Google PageSpeed no devolvió resultados para este sitio.' };
    }

    const screenshot = data?.lighthouseResult?.audits?.['final-screenshot']?.details?.data;

    return {
      audit: {
        performance: toScore(categories.performance?.score),
        seo: toScore(categories.seo?.score),
        accessibility: toScore(categories.accessibility?.score),
        bestPractices: toScore(categories['best-practices']?.score),
        screenshotBase64: typeof screenshot === 'string' ? screenshot : undefined,
        analyzedAt: new Date().toISOString(),
      },
    };
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return { error: 'Google PageSpeed tardó demasiado en responder. Intenta de nuevo.' };
    }
    return { error: 'No se pudo conectar con Google PageSpeed. Revisa tu conexión e intenta de nuevo.' };
  } finally {
    clearTimeout(timer);
  }
}
