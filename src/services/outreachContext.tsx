import React, { createContext, useContext, useMemo } from 'react';
import { BusinessLead, SellerProfile, TrackedBusiness } from '../types';
import { OutreachStep, OutreachTone, buildOutreachMessage, getReservasIaPdfUrl } from './outreachMessage';
import { suggestedStep } from './outreachPlan';

interface OutreachValue {
  seller: SellerProfile;
  tracked: TrackedBusiness[];
  /** Mensaje de WhatsApp del paso que toca (o del indicado) para este negocio. */
  messageFor: (lead: BusinessLead, step?: OutreachStep, tone?: OutreachTone) => string;
  stepFor: (lead: BusinessLead) => OutreachStep;
}

const OutreachContext = createContext<OutreachValue | null>(null);

export const OutreachProvider: React.FC<{
  seller: SellerProfile;
  tracked: TrackedBusiness[];
  children: React.ReactNode;
}> = ({ seller, tracked, children }) => {
  const value = useMemo<OutreachValue>(() => {
    const stepFor = (lead: BusinessLead) => suggestedStep(tracked.find((t) => t.id === lead.id));
    return {
      seller,
      tracked,
      stepFor,
      messageFor: (lead, step, tone) =>
        buildOutreachMessage(lead, seller, tone ?? seller.defaultTone ?? 'cercano', getReservasIaPdfUrl(), step ?? stepFor(lead)),
    };
  }, [seller, tracked]);
  return <OutreachContext.Provider value={value}>{children}</OutreachContext.Provider>;
};

export function useOutreach(): OutreachValue {
  const ctx = useContext(OutreachContext);
  if (!ctx) throw new Error('useOutreach debe usarse dentro de <OutreachProvider>');
  return ctx;
}
