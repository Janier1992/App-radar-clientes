import { BusinessLead } from '../types';
import { findBusinessEmail } from './geminiClient';

const CONCURRENCY = 3;

/**
 * Busca correos para varios negocios con un máximo de llamadas simultáneas,
 * notificando cada resultado apenas esté listo para actualizar la tabla en vivo.
 * Omite los negocios que ya tienen correo o que ya fueron buscados.
 */
export async function findEmailsForLeads(
  leads: BusinessLead[],
  onResult: (leadId: string, email: string | null) => void,
  onStart?: (leadId: string) => void
): Promise<void> {
  const queue = leads.filter((l) => !l.email && !l.emailSearched);
  let next = 0;

  const worker = async () => {
    while (next < queue.length) {
      const lead = queue[next++];
      onStart?.(lead.id);
      const email = await findBusinessEmail(lead);
      onResult(lead.id, email);
    }
  };

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, worker));
}
