import { BusinessLead, SellerProfile } from '../types';
import type { OutreachStep, OutreachTone } from './outreachMessage';
import { getOutreachSettings, getTiendlyUrl, getTiendlyVideoUrl } from './outreachSettings';

/**
 * Textos para ofrecer Tiendly (app para tiendas de barrio: ventas, inventario, fiados, tareas y asistente de IA).
 * Solo afirman lo que la demostración del producto muestra; el precio sale de Ajustes y el enlace se agrega solo si se configuró.
 */

const tiendlyUrl = () => getTiendlyUrl();
const offerText = () => getOutreachSettings().tiendlyOffer.trim().replace(/[.\s]+$/, '');

const WHAT =
  'Tiendly es una app para llevar las ventas, el inventario, los fiados y las tareas de la tienda desde el celular, con un asistente de IA que ayuda a tomar decisiones.';

const videoUrl = () => getTiendlyVideoUrl();
/**
 * Primero el enlace de la app y después el del video: WhatsApp arma la vista previa con el PRIMER enlace,
 * y debe verse la imagen de Tiendly, no la de esta aplicación.
 */
const linkLines = (intro: string): string[] => [
  ...(tiendlyUrl() ? ['', `🔗 ${intro}\n${tiendlyUrl()}`] : []),
  ...(videoUrl() ? ['', `🎥 Y si prefieren verlo primero en un video:\n${videoUrl()}`] : []),
];
const offerLines = (): string[] => (offerText() ? ['', `💡 ${offerText()}.`] : []);

const senderOf = (seller: SellerProfile) => {
  const name = (seller.name || 'Synflow').trim();
  const agency = (seller.companyOrAgency || '').trim();
  return agency && !agency.toLowerCase().includes(name.toLowerCase()) ? `*${name}* de *${agency}*` : `*${name}*`;
};

export function composeTiendlyMessage(
  lead: BusinessLead,
  seller: SellerProfile,
  tone: OutreachTone,
  step: OutreachStep,
  zone: string
): string {
  const sender = senderOf(seller);
  const name = lead.name;

  if (step === 'primer_contacto') {
    const rating =
      typeof lead.rating === 'number' && typeof lead.userRatingCount === 'number' && lead.userRatingCount >= 10
        ? `${lead.rating.toFixed(1)} con ${lead.userRatingCount} reseñas en Google`
        : '';
    if (tone === 'directo') {
      return [
        `Buen día, le habla ${sender}.`,
        '',
        `¿Hoy cómo llevan las ventas, el inventario y los fiados de ${name}? ${WHAT}`,
        ...offerLines(),
        ...linkLines('Véanlo aquí:'),
        '',
        `¿Le muestro en 10 minutos cómo quedaría para ${name}? Sin compromiso.`,
      ].join('\n');
    }
    if (tone === 'profesional') {
      return [
        `Buenos días, le saluda ${sender}.`,
        '',
        `Conocimos ${name}${zone ? ` en ${zone}` : ''}${rating ? `, destacado por su calificación (${rating})` : ''}. Le contamos brevemente de Tiendly.`,
        '',
        WHAT,
        ...offerLines(),
        ...linkLines('Pueden conocerlo aquí:'),
        '',
        `Con gusto agendamos una reunión breve para mostrarle cómo se usaría en ${name}. Quedo atento.`,
      ].join('\n');
    }
    return [
      `¡Hola! 👋 Soy ${sender}.`,
      '',
      `Estuve viendo *${name}*${zone ? ` por ${zone}` : ''} en Google Maps${rating ? ` y me encantó su calificación: ⭐ ${rating}` : ''}. ¡Se nota que su gente los quiere! 👏`,
      '',
      `Les cuento de *Tiendly* 🛒: ${WHAT.replace('Tiendly es ', '')}`,
      ...offerLines(),
      ...linkLines('Conozcan Tiendly y vean cómo funciona aquí:'),
      '',
      `¿Les parece si les muestro en 10 minutos cómo quedaría para *${name}*? Sin compromiso 🙌`,
    ].join('\n');
  }

  if (step === 'seguimiento_1') {
    const value = 'llevar ventas, inventario, fiados y tareas desde el celular, con un asistente de IA.';
    if (tone === 'directo') return [`Hola, le habla ${sender}. Le escribí hace unos días sobre *${name}*.`, '', `Le resumo: Tiendly sirve para ${value}`, ...linkLines('Aquí lo pueden ver:'), '', '¿Alcanzó a revisarlo? Puedo explicárselo en 10 minutos.'].join('\n');
    if (tone === 'profesional') return [`Buenos días, le saluda nuevamente ${sender}.`, '', `Hace unos días le escribí sobre *${name}*. Le comparto lo esencial: Tiendly sirve para ${value}`, ...linkLines('Pueden verlo aquí:'), '', 'Quedo atento para resolver cualquier duda o coordinar una reunión corta.'].join('\n');
    return [`¡Hola de nuevo! 👋 Soy ${sender}. Les escribí hace unos días sobre *${name}*.`, '', `Se lo dejo cortito: Tiendly sirve para ${value}`, ...linkLines('Por si se les pasó, aquí pueden verlo:'), '', '¿Alcanzaron a revisarlo? Si prefieren, se lo explico en una llamada de 10 minutos 🙌'].join('\n');
  }

  if (step === 'seguimiento_2') {
    const benefit = 'saber en cualquier momento qué se vendió, qué se está acabando y quién les debe (fiados), sin cuadernos ni hojas sueltas.';
    if (tone === 'directo') return [`${sender}, una idea concreta para *${name}*:`, '', `Con Tiendly podrían ${benefit}`, ...offerLines(), '', 'Les armo una demo corta, sin costo. ¿Esta semana o la próxima?'].join('\n');
    if (tone === 'profesional') return [`Buenos días, le saluda ${sender}.`, '', `Para *${name}*, Tiendly permite ${benefit}`, ...offerLines(), '', 'Podemos preparar una demostración breve, sin costo ni compromiso. ¿Le queda mejor esta semana o la próxima?'].join('\n');
    return [`¡Hola! 😊 Soy ${sender} otra vez. Quería compartirles algo concreto para *${name}*:`, '', `✨ Con Tiendly podrían ${benefit}`, ...offerLines(), '', 'Si les sirve, les muestro una demo corta, sin costo ni compromiso.', '', '¿Qué día les queda mejor para verla: esta semana o la próxima?'].join('\n');
  }

  // cierre
  const url = tiendlyUrl();
  const tail = url ? ['', url] : [];
  if (tone === 'directo') return [`${sender}: no insistiré más por ahora.`, '', `Si más adelante quieren ordenar las ventas y el inventario de *${name}*, Tiendly queda disponible${url ? ' aquí:' : '.'}`, ...tail, '', 'Si prefieren que no les escriba, díganmelo y lo respeto.'].join('\n');
  if (tone === 'profesional') return [`Buenos días, le saluda ${sender}.`, '', 'Para no ser insistente, este será mi último mensaje por ahora.', '', `Si en el futuro *${name}* desea ordenar sus ventas e inventario, Tiendly sigue disponible${url ? ' aquí:' : '.'}`, ...tail, '', 'Si prefiere que no volvamos a escribirle, con gusto lo respetamos. Le deseo muchos éxitos.'].join('\n');
  return [`Hola, soy ${sender}. Para no ser insistente, este será mi último mensaje por ahora 🙂`, '', `Si más adelante quieren ordenar las ventas y el inventario de *${name}*, Tiendly sigue disponible${url ? ' aquí:' : '.'}`, ...tail, '', 'Si prefieren que no les escriba más, solo díganmelo y lo respeto. ¡Muchos éxitos! 🌟'].join('\n');
}

/** Correo (texto plano, sin asteriscos) con los mismos pasos. */
export function composeTiendlyEmail(lead: BusinessLead, step: OutreachStep, greeting: string): { subject: string; lines: string[] } {
  const name = lead.name;
  const url = tiendlyUrl();
  const v = videoUrl();
  const link = [...(url ? ['', `Pueden verlo y probarlo aquí: ${url}`] : []), ...(v ? ['', `Video de cómo funciona: ${v}`] : [])];
  const offer = offerText() ? ['', `${offerText()}.`] : [];
  switch (step) {
    case 'primer_contacto':
      return { subject: `Ordenar ventas, inventario y fiados en ${name}`, lines: [greeting, '', `Conocí ${name} en Google Maps y quería contarles de Tiendly.`, '', WHAT, ...offer, ...link, '', `¿Les parece si les muestro en 10 minutos cómo quedaría para ${name}? Sin compromiso.`] };
    case 'seguimiento_1':
      return { subject: `Seguimiento: Tiendly para ${name}`, lines: [greeting, '', `Hace unos días les escribí sobre ${name}. Les resumo: Tiendly sirve para llevar ventas, inventario, fiados y tareas desde el celular, con un asistente de IA.`, ...link, '', '¿Alcanzaron a verlo? Si prefieren, se lo explico en una llamada de 10 minutos.'] };
    case 'seguimiento_2':
      return { subject: `Una idea concreta para ${name}`, lines: [greeting, '', `Con Tiendly podrían saber en cualquier momento qué se vendió, qué se está acabando y quién les debe, sin cuadernos ni hojas sueltas.`, ...offer, '', 'Si les sirve, les muestro una demo corta, sin costo ni compromiso. ¿Esta semana o la próxima?'] };
    default:
      return { subject: `Cierro el seguimiento con ${name}`, lines: [greeting, '', 'Para no ser insistente, este será mi último mensaje por ahora.', '', `Si más adelante quieren ordenar las ventas y el inventario de ${name}, Tiendly sigue disponible${url ? `: ${url}` : '.'}`, '', 'Si prefieren que no les escriba más, solo díganmelo y lo respeto. ¡Muchos éxitos!'] };
  }
}

/** Respuestas rápidas específicas de Tiendly (las demás —demo, no ahora, no me interesa— son comunes). */
export function tiendlyQuickReply(id: string, lead: BusinessLead): string | null {
  const name = lead.name;
  const url = tiendlyUrl();
  switch (id) {
    case 'precio':
      return [
        '¡Claro que sí! 😊',
        '',
        offerText() ? `${offerText()}.` : `El valor depende del plan que necesite *${name}*; se lo confirmo con números exactos.`,
        '',
        'Si les parece, en una demo de 10 minutos se los muestro con los datos de su negocio. ¿Les queda mejor hoy o mañana?',
      ].join('\n');
    case 'consultar':
      return ['¡Por supuesto, tómense el tiempo que necesiten! 🙂', '', ...(url ? ['Les dejo el enlace de Tiendly para que lo revisen juntos:', url, ''] : []), 'Si surge cualquier duda, escríbanme por aquí. ¿Les escribo en un par de días para saber cómo les fue?'].join('\n');
    case 'ya_tengo_web':
      return ['¡Perfecto, gracias por contarme! 👏', '', 'Tiendly no reemplaza su web: es para el día a día de la tienda (ventas, inventario, fiados y tareas).', '', `¿Les muestro en 10 minutos cómo se vería para *${name}*?`].join('\n');
    case 'mas_info':
      return ['¡Con gusto! Les resumo rápido:', '', `🛒 ${WHAT}`, ...offerLines(), ...linkLines('Aquí pueden verlo:'), '', '¿Cuándo les queda bien una llamada de 10 minutos para resolver dudas?'].join('\n');
    case 'no_ahora':
      return ['Gracias por responderme, lo entiendo perfectamente. No hay ningún afán 🙂', '', ...(url ? ['Les dejo el enlace de Tiendly por si más adelante lo necesitan:', url, ''] : []), '¿Les parece si les escribo de nuevo dentro de un mes? Si prefieren que no, me lo dicen y listo.'].join('\n');
    default:
      return null;
  }
}
