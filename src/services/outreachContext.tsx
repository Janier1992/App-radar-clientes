import React, { createContext, useContext, useMemo } from 'react';
import { BusinessLead, SellerProfile, TrackedBusiness } from '../types';
import { OutreachStep, OutreachTone, buildOutreachMessage, getReservasIaPdfUrl } from './outreachMessage';
import { findContactedDuplicate, suggestedStep } from './outreachPlan';
import { BlockedEntry, isBlocked } from './doNotContact';
import { QuickReplyId, buildQuickReply } from './quickReplies';
import { buildWhatsAppDirectUrl } from './phoneUtils';

export interface OutreachActions {
  /** El negocio contestó: pasa a «Respondió» y queda al tope de la cola. */
  markResponded: (lead: BusinessLead) => void;
  /** El negocio pidió no recibir más mensajes: se bloquea y se descarta. */
  markDoNotContact: (lead: BusinessLead, reason?: string) => void;
  unblock: (id: string) => void;
  /** Se abrió WhatsApp con una respuesta rápida (se confirma al volver a la app). */
  sendReply: (lead: BusinessLead, label: string) => void;
}

interface OutreachValue {
  seller: SellerProfile;
  tracked: TrackedBusiness[];
  blocked: BlockedEntry[];
  actions: OutreachActions;
  isBlockedLead: (lead: BusinessLead) => boolean;
  /** Enlace de WhatsApp con el mensaje del paso que toca; null si no hay teléfono o el negocio pidió no ser contactado. */
  waUrl: (lead: BusinessLead, step?: OutreachStep, tone?: OutreachTone) => string | null;
  replyUrl: (lead: BusinessLead, id: QuickReplyId) => string | null;
  /** Mensaje de WhatsApp del paso que toca (o del indicado) para este negocio. */
  messageFor: (lead: BusinessLead, step?: OutreachStep, tone?: OutreachTone) => string;
  stepFor: (lead: BusinessLead) => OutreachStep;
  /** Otro registro con el mismo teléfono al que ya se le escribió. */
  duplicateOf: (lead: BusinessLead) => TrackedBusiness | undefined;
}

const OutreachContext = createContext<OutreachValue | null>(null);

export const OutreachProvider: React.FC<{
  seller: SellerProfile;
  tracked: TrackedBusiness[];
  blocked: BlockedEntry[];
  actions: OutreachActions;
  children: React.ReactNode;
}> = ({ seller, tracked, blocked, actions, children }) => {
  const value = useMemo<OutreachValue>(() => {
    const stepFor = (lead: BusinessLead) => suggestedStep(tracked.find((t) => t.id === lead.id));
    const isBlockedLead = (lead: BusinessLead) => isBlocked(blocked, lead);
    const messageFor: OutreachValue['messageFor'] = (lead, step, tone) =>
      buildOutreachMessage(lead, seller, tone ?? seller.defaultTone ?? 'cercano', getReservasIaPdfUrl(), step ?? stepFor(lead));
    return {
      seller,
      tracked,
      blocked,
      actions,
      isBlockedLead,
      stepFor,
      messageFor,
      waUrl: (lead, step, tone) =>
        isBlockedLead(lead) ? null : buildWhatsAppDirectUrl(lead.nationalPhoneNumber, messageFor(lead, step, tone)),
      replyUrl: (lead, id) =>
        isBlockedLead(lead) ? null : buildWhatsAppDirectUrl(lead.nationalPhoneNumber, buildQuickReply(id, lead, seller)),
      duplicateOf: (lead) => findContactedDuplicate(lead, tracked),
    };
  }, [seller, tracked, blocked, actions]);
  return <OutreachContext.Provider value={value}>{children}</OutreachContext.Provider>;
};

export function useOutreach(): OutreachValue {
  const ctx = useContext(OutreachContext);
  if (!ctx) throw new Error('useOutreach debe usarse dentro de <OutreachProvider>');
  return ctx;
}
