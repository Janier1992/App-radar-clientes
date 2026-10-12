import { BusinessLead, WebsiteType } from '../types';

export function classifyWebsite(uri?: string): WebsiteType {
  if (!uri || !uri.trim()) {
    return { type: 'none' };
  }

  const clean = uri.toLowerCase();
  
  // Lista de plataformas y directorios comunes que no constituyen web propia
  const socialAndDirectories: { pattern: RegExp; platform: string }[] = [
    { pattern: /(?:facebook\.com|fb\.com|fb\.me)/, platform: 'Facebook' },
    { pattern: /(?:instagram\.com|instagr\.am)/, platform: 'Instagram' },
    { pattern: /(?:linktr\.ee|linktree)/, platform: 'Linktree' },
    { pattern: /(?:tiktok\.com)/, platform: 'TikTok' },
    { pattern: /(?:paginasamarillas\.com|paginasamarillas)/, platform: 'Páginas Amarillas' },
    { pattern: /(?:olx\.com|olx)/, platform: 'OLX' },
    { pattern: /(?:mercadolibre\.com)/, platform: 'Mercado Libre' },
    { pattern: /(?:fincaraiz\.com)/, platform: 'Finca Raíz' },
    { pattern: /(?:ciencuadras\.com)/, platform: 'Ciencuadras' },
    { pattern: /(?:doctoralia\.co|doctoralia)/, platform: 'Doctoralia' },
    { pattern: /(?:civico\.com)/, platform: 'Cívico' },
    { pattern: /(?:tripadvisor\.)/, platform: 'TripAdvisor' },
    { pattern: /(?:yelp\.)/, platform: 'Yelp' },
  ];

  for (const item of socialAndDirectories) {
    if (item.pattern.test(clean)) {
      return {
        type: 'directory_or_social',
        platform: item.platform,
      };
    }
  }

  return { type: 'own' };
}

export function calculatePreliminaryScore(lead: {
  websiteType: WebsiteType;
  rating?: number;
  userRatingCount?: number;
  hasPhone: boolean;
}): {
  score: number;
  breakdown: { label: string; points: number; type: 'positive' | 'negative' | 'neutral' }[];
} {
  let score = 20; // Puntuación base
  const breakdown: { label: string; points: number; type: 'positive' | 'negative' | 'neutral' }[] = [
    { label: 'Base de prospección comercial', points: 20, type: 'neutral' }
  ];

  // 1. Presencia Web
  if (lead.websiteType.type === 'none') {
    score += 40;
    breakdown.push({ label: 'Sin página web registrada (+40)', points: 40, type: 'positive' });
  } else if (lead.websiteType.type === 'directory_or_social') {
    score += 30;
    breakdown.push({
      label: `Solo perfil en ${lead.websiteType.platform || 'red social/directorio'} sin web propia (+30)`,
      points: 30,
      type: 'positive'
    });
  } else {
    // Tiene web propia
    score -= 10;
    breakdown.push({ label: 'Cuenta con web propia registrada (-10)', points: -10, type: 'negative' });
  }

  // 2. Actividad y clientela (Reseñas)
  const reviews = lead.userRatingCount || 0;
  if (reviews >= 30) {
    score += 20;
    breakdown.push({ label: `Negocio con alto flujo (>30 reseñas: ${reviews}) (+20)`, points: 20, type: 'positive' });
  } else if (reviews >= 10) {
    score += 10;
    breakdown.push({ label: `Actividad consolidada (10-30 reseñas: ${reviews}) (+10)`, points: 10, type: 'positive' });
  } else if (reviews > 0 && reviews < 5) {
    score -= 10;
    breakdown.push({ label: `Pocas reseñas (<5 reseñas: ${reviews}) (-10)`, points: -10, type: 'negative' });
  }

  // 3. Reputación (Rating)
  const rating = lead.rating || 0;
  if (rating >= 4.2) {
    score += 15;
    breakdown.push({ label: `Excelente valoración (${rating} ★: clientes satisfechos con presupuesto) (+15)`, points: 15, type: 'positive' });
  } else if (rating >= 3.8) {
    score += 5;
    breakdown.push({ label: `Buena valoración (${rating} ★) (+5)`, points: 5, type: 'positive' });
  }

  // 4. Contacto telefónico
  if (lead.hasPhone) {
    score += 10;
    breakdown.push({ label: 'Teléfono directo disponible para prospección (+10)', points: 10, type: 'positive' });
  }

  // Acotar entre 0 y 100
  const normalizedScore = Math.max(0, Math.min(100, Math.round(score)));

  return {
    score: normalizedScore,
    breakdown,
  };
}
