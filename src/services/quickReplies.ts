import { BusinessLead, SellerProfile } from '../types';
import { getReservasIaPdfUrl } from './outreachMessage';
import { applyOutreachSettings } from './outreachSettings';

export type QuickReplyId = 'agendar_demo' | 'precio' | 'consultar' | 'ya_tengo_web' | 'mas_info' | 'no_ahora' | 'no_interesa';

export interface QuickReplyOption {
  id: QuickReplyId;
  label: string; // lo que dijo el negocio
  hint: string;
}

export const QUICK_REPLIES: QuickReplyOption[] = [
  { id: 'agendar_demo', label: 'Me interesa / cuéntame más', hint: 'Proponer la demo de 10 minutos' },
  { id: 'precio', label: '¿Cuánto cuesta?', hint: 'Sin inventar cifras: llevar la conversación a la demo' },
  { id: 'consultar', label: 'Lo tengo que consultar', hint: 'Dar tiempo y dejar el PDF' },
  { id: 'ya_tengo_web', label: 'Ya tengo página web', hint: 'ReservasIA complementa su web' },
  { id: 'mas_info', label: 'Mándame información', hint: 'Resumen + presentación' },
  { id: 'no_ahora', label: 'Ahora no / más adelante', hint: 'Dejar la puerta abierta' },
  { id: 'no_interesa', label: 'No me interesa / no me escriban', hint: 'Despedida respetuosa' },
];

const senderName = (seller: SellerProfile) => (seller.name || 'Synflow').trim();

/** Respuesta lista para enviar a lo que contestó el negocio. No promete precios ni resultados concretos. */
export function buildQuickReply(
  id: QuickReplyId,
  lead: BusinessLead,
  seller: SellerProfile,
  pdfUrl: string = getReservasIaPdfUrl()
): string {
  // «No me interesa» ya lleva su propia despedida: no se le agrega firma ni datos de contacto.
  return applyOutreachSettings(composeQuickReply(id, lead, seller, pdfUrl), { signature: id !== 'no_interesa' });
}

function composeQuickReply(id: QuickReplyId, lead: BusinessLead, seller: SellerProfile, pdfUrl: string): string {
  const name = lead.name;
  const sender = senderName(seller);
  const hasOwnWeb = lead.websiteClassification?.type === 'own';

  switch (id) {
    case 'agendar_demo':
      return [
        '¡Genial, gracias por responder! 🙌',
        '',
        `Les propongo una demo de 10 minutos, por llamada o videollamada, con los datos de *${name}* en pantalla para que vean cómo quedaría.`,
        '',
        '¿Qué día y a qué hora les queda mejor esta semana?',
      ].join('\n');
    case 'precio':
      return [
        '¡Claro que sí! 😊',
        '',
        `El valor depende de lo que necesite *${name}* (landing page, ReservasIA o ambos) y del tamaño del negocio, por eso prefiero darles un número exacto y no uno al aire.`,
        'Además, tenemos condiciones especiales para los primeros clientes (Cliente Fundador).',
        '',
        'Si les parece, en una demo de 10 minutos se lo muestro con sus datos. ¿Les queda mejor hoy o mañana?',
      ].join('\n');
    case 'consultar':
      return [
        '¡Por supuesto, tómense el tiempo que necesiten! 🙂',
        '',
        'Para facilitar la conversación, les dejo la presentación para que la revisen juntos:',
        pdfUrl,
        '',
        'Si surge cualquier duda, escríbanme por aquí y se las resuelvo. ¿Les escribo en un par de días para saber cómo les fue?',
      ].join('\n');
    case 'ya_tengo_web':
      return [
        hasOwnWeb ? '¡Qué bueno que ya tengan web! 👏' : '¡Perfecto, gracias por contarme! 👏',
        '',
        'Lo que suma ReservasIA es otra cosa: atiende por WhatsApp 24/7, muestra horarios reales, agenda y confirma citas, y envía recordatorios, sin necesidad de cambiar su página.',
        '',
        `¿Les muestro en 10 minutos cómo se vería para *${name}*?`,
      ].join('\n');
    case 'mas_info':
      return [
        '¡Con gusto! Les resumo rápido:',
        '',
        '🤖 *ReservasIA* atiende por WhatsApp 24/7, muestra horarios reales, agenda y confirma solo, envía recordatorios y evita las dobles reservas.',
        hasOwnWeb ? '' : '🌐 Y si lo necesitan, una *landing page* rápida en celular con botón directo de WhatsApp.',
        '',
        'Aquí está la presentación completa:',
        pdfUrl,
        '',
        '¿Cuándo les queda bien una llamada de 10 minutos para resolver dudas?',
      ]
        .filter((line, i, arr) => !(line === '' && arr[i - 1] === ''))
        .join('\n');
    case 'no_ahora':
      return [
        'Gracias por responderme, lo entiendo perfectamente. No hay ningún afán 🙂',
        '',
        'Les dejo la presentación por si más adelante la necesitan:',
        pdfUrl,
        '',
        '¿Les parece si les escribo de nuevo dentro de un mes? Si prefieren que no, me lo dicen y listo.',
      ].join('\n');
    case 'no_interesa':
      return [
        'Gracias por avisarme, lo respeto totalmente. No les escribiré más.',
        '',
        `¡Mucho éxito con *${name}*! — ${sender}`,
      ].join('\n');
  }
}
