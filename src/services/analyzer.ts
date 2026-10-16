import { BusinessLead, PageSpeedAudit, GeminiAnalysis, ProspectingDrafts, SellerProfile } from '../types';
import { calculatePreliminaryScore } from './opportunityScore';
import { generateGeminiAnalysis } from './geminiClient';
import { fetchPageSpeedAudit } from './pageSpeedClient';

export interface AuditResult {
  auditData?: PageSpeedAudit;
  auditError?: string;
  analysis?: GeminiAnalysis;
  drafts?: ProspectingDrafts;
  opportunityScore: number;
  scoreBreakdown: { label: string; points: number; type: 'positive' | 'negative' | 'neutral' }[];
}

export async function runBusinessAnalysis(
  lead: BusinessLead,
  sellerProfile: SellerProfile,
  tone: 'cercano' | 'profesional' | 'directo' = 'cercano',
  googleCloudApiKey?: string
): Promise<AuditResult> {
  const hasWebsite = lead.websiteClassification.type === 'own' && Boolean(lead.websiteUri);

  // Si no tiene web propia, marcamos oportunidad directa sin llamar a PageSpeed
  if (!hasWebsite) {
    const isSocialOnly = lead.websiteClassification.type === 'directory_or_social';

    const fallbackAnalysis: GeminiAnalysis = {
      summary: `${lead.name} es un negocio local del sector ${lead.primaryTypeDisplayName || 'servicios'} ubicado en ${lead.formattedAddress.split(',')[0]}. Actualmente carece de una web propia independiente donde captar y convertir clientes.`,
      checklist: {
        hasHttps: false,
        mobileResponsive: false,
        whatsappButton: false,
        onlineBooking: false,
        contactForm: false,
        outdatedSignals: [
          isSocialOnly
            ? `Solo dispone de perfil en ${lead.websiteClassification.platform || 'redes sociales'}, dependiendo de algoritmos externos.`
            : 'Sin presencia web registrada en Internet.',
          'No cuenta con dominio propio profesional ni cuentas de correo corporativo (@tunegocio.com.co).',
        ],
      },
      contactsFound: {
        emails: [],
        socialLinks: lead.websiteUri ? [lead.websiteUri] : [],
      },
      plainProblems: [
        'Los clientes que buscan en Google en Medellín y alrededores no encuentran una página web oficial con horarios y servicios claros.',
        'Pierde clientes frente a competidores que sí permiten pedir cotización o agendar por WhatsApp al instante desde su sitio web.',
        'Depende exclusivamente de llamadas telefónicas en horario de atención o de canales externos.',
      ],
      recommendedService: 'web_nueva',
      recommendedServiceRationale: 'Creación de una página web profesional optimizada para Google con botón directo de WhatsApp y captura de clientes en Medellín y Colombia.',
    };

    const analysis = (await generateGeminiAnalysis(lead, sellerProfile)) || fallbackAnalysis;
    const drafts = generateDrafts(lead, sellerProfile, analysis, tone);

    // Score máximo para negocios sin web
    const breakdown = [
      { label: isSocialOnly ? 'Solo perfil en redes sin web propia (+45)' : 'Negocio sin página web (+50)', points: isSocialOnly ? 45 : 50, type: 'positive' as const },
      { label: `Volumen de clientela local (${lead.userRatingCount || 0} reseñas registradas) (+25)`, points: 25, type: 'positive' as const },
      { label: `Reputación favorable (${lead.rating || 0} ★) con potencial económico (+15)`, points: 15, type: 'positive' as const },
      { label: lead.nationalPhoneNumber ? 'Teléfono directo verificado (+10)' : 'Sin teléfono (-5)', points: lead.nationalPhoneNumber ? 10 : -5, type: lead.nationalPhoneNumber ? 'positive' as const : 'negative' as const }
    ];

    const score = Math.min(98, breakdown.reduce((acc, b) => acc + b.points, 0));

    return {
      analysis,
      drafts,
      opportunityScore: score,
      scoreBreakdown: breakdown,
    };
  }

  // Con web propia: medición real con Google PageSpeed Insights (Lighthouse móvil)
  const psi = await fetchPageSpeedAudit(lead.websiteUri || '', googleCloudApiKey);
  const auditData = psi.audit;

  const fallbackAnalysis: GeminiAnalysis = {
    summary: `${lead.name} ofrece servicios de ${lead.primaryTypeDisplayName || 'atención local'} en ${lead.formattedAddress.split(',')[0]} y cuenta con sitio web propio.${
      auditData
        ? ` Su rendimiento móvil medido por Google es ${auditData.performance}/100.`
        : ''
    }`,
    checklist: {
      hasHttps: lead.websiteUri?.startsWith('https') ?? false,
      mobileResponsive: auditData ? auditData.performance >= 50 : false,
      whatsappButton: false,
      onlineBooking: false,
      contactForm: false,
      outdatedSignals: auditData && auditData.performance < 50
        ? [`Rendimiento móvil bajo según Google PageSpeed (${auditData.performance}/100).`]
        : ['Sin análisis de contenido: activa Gemini para revisar WhatsApp, reservas y formularios del sitio.'],
    },
    contactsFound: {
      emails: lead.email ? [lead.email] : [],
      socialLinks: [],
    },
    plainProblems: [
      ...(auditData && auditData.performance < 75
        ? [`La web carga lento en celulares (nota de rendimiento: ${auditData.performance}/100), lo que hace que usuarios impacientes abandonen antes de leer.`]
        : []),
      'Verifica si el sitio tiene un botón directo de WhatsApp para pedir cotización al instante.',
      'Verifica si los clientes pueden agendar citas o reservas fuera del horario de atención.',
    ],
    recommendedService: lead.primaryTypeDisplayName?.includes('dental') || lead.primaryTypeDisplayName?.includes('fisio') || lead.primaryTypeDisplayName?.includes('peluquer')
      ? 'sistema_citas'
      : auditData && auditData.performance < 45
      ? 'web_nueva'
      : 'agente_whatsapp',
    recommendedServiceRationale: `Un canal de atención automatizado ayudaría a ${lead.name} a no perder consultas fuera de horario.`,
  };

  const analysis = (await generateGeminiAnalysis(lead, sellerProfile, auditData)) || fallbackAnalysis;
  const drafts = generateDrafts(lead, sellerProfile, analysis, tone);

  // Score post-análisis basado en datos medidos (las líneas sin dato medido no suman)
  const scoreBreakdown: AuditResult['scoreBreakdown'] = [];
  if (auditData) {
    if (auditData.performance < 50) {
      scoreBreakdown.push({ label: `Rendimiento móvil deficiente (${auditData.performance}/100) (+25)`, points: 25, type: 'positive' });
    } else if (auditData.performance < 75) {
      scoreBreakdown.push({ label: `Rendimiento móvil mejorable (${auditData.performance}/100) (+12)`, points: 12, type: 'positive' });
    } else {
      scoreBreakdown.push({ label: `Buen rendimiento móvil (${auditData.performance}/100) (0)`, points: 0, type: 'neutral' });
    }
  }
  if (!analysis.checklist.whatsappButton) {
    scoreBreakdown.push({ label: 'Falta botón directo de WhatsApp (+15)', points: 15, type: 'positive' });
  }
  if (!analysis.checklist.onlineBooking) {
    scoreBreakdown.push({ label: 'Sin sistema de citas o reservas online (+15)', points: 15, type: 'positive' });
  }
  scoreBreakdown.push({ label: `Clientela activa (${lead.userRatingCount || 0} reseñas) con capacidad de inversión (+20)`, points: 20, type: 'positive' });
  scoreBreakdown.push({ label: 'Tiene dominio propio operativo (-10)', points: -10, type: 'negative' });

  const totalScore = Math.min(100, Math.max(0, scoreBreakdown.reduce((acc, b) => acc + b.points, 15)));

  return {
    auditData,
    auditError: psi.error,
    analysis,
    drafts,
    opportunityScore: totalScore,
    scoreBreakdown,
  };
}

export function generateDrafts(
  lead: BusinessLead,
  seller: SellerProfile,
  analysis: GeminiAnalysis,
  tone: 'cercano' | 'profesional' | 'directo'
): ProspectingDrafts {
  const sellerName = seller.name || 'Carlos';
  const serviceText = analysis.recommendedService === 'agente_whatsapp' 
    ? 'un asistente inteligente por WhatsApp'
    : analysis.recommendedService === 'sistema_citas'
    ? 'un sistema de citas y reservas online automatizado'
    : 'una web moderna ultrarrápida adaptada al móvil';

  const contactPerson = lead.name;

  if (tone === 'cercano') {
    return {
      tone: 'cercano',
      generatedAt: new Date().toISOString(),
      phoneScript: `«Hola, buenos días. ¿Me comunicas con el encargado o dueño de ${lead.name}? Te habla ${sellerName}. Te llamo muy rápido porque estuve viendo su negocio en ${lead.formattedAddress.split(',')[0]} y las excelentes calificaciones que tienen de sus clientes. Noté un detalle: ${analysis.plainProblems[0]?.toLowerCase() || 'no cuentan con un canal directo de WhatsApp para responder cotizaciones al instante'}. Me dedico a apoyar a negocios de Medellín y Colombia a conseguir más clientes con ${serviceText}. Quería preguntarte: ¿te gustaría que te envíe un video corto de 2 minutos mostrándote cómo resolverlo sin ningún compromiso?»`,
      whatsappMessage: `¡Hola! 👋 Le escribo porque estuve conociendo el trabajo de ${lead.name} y tienen una excelente reputación en la zona. Revisando su presencia digital noté una oportunidad clave: ${analysis.plainProblems[1] || 'no tienen botón directo de WhatsApp ni reservas en línea'}. Esto les ayudaría muchísimo a no perder consultas de clientes en noches y fines de semana. Si le parece bien, ¿le comparto un ejemplo rápido de cómo quedaría para su negocio? Cordial saludo, ${sellerName}.`,
      emailSubject: `Oportunidad para ${lead.name} en la captación de clientes en ${lead.formattedAddress.split(',')[0]}`,
      emailBody: `Hola, equipo de ${lead.name}:\n\nEspero que se encuentren muy bien. Los contacto porque conozco su negocio en la zona y tienen una calificación destacada por parte de sus clientes.\n\nRevisando su presencia digital, identifiqué que ${analysis.plainProblems[0] || 'la página web actual tarda en cargar en celulares y no cuenta con reservas en línea'}.\n\nApoyo a empresas locales a implementar ${serviceText} para que no se escape ningún cliente potencial. ¿Tendrían 5 minutos esta semana para una llamada breve o prefieren que les comparta una propuesta en PDF?\n\nCordial saludo,\n${sellerName}\n${seller.companyOrAgency}`,
    };
  }

  if (tone === 'directo') {
    return {
      tone: 'directo',
      generatedAt: new Date().toISOString(),
      phoneScript: `«Buenas tardes, ¿con la persona encargada de ${lead.name}? Soy ${sellerName}. Voy directo al grano: tienen ${lead.userRatingCount || 'muchas'} calificaciones excelentes en Google, pero ${analysis.plainProblems[0]?.toLowerCase() || 'su presencia digital está perdiendo clientes por falta de velocidad en celulares'}. Diseñé una solución con ${serviceText} para solucionarlo de inmediato. ¿Con quién puedo coordinar para enviarle una demostración de 2 minutos?»`,
      whatsappMessage: `Buenas tardes, le habla ${sellerName}. Detecté 2 puntos clave donde ${lead.name} puede estar perdiendo clientes: 1) ${analysis.plainProblems[0] || 'Carga lenta en celulares'} y 2) ${analysis.plainProblems[1] || 'Sin agendamiento automático'}. Con ${serviceText} pueden solucionarlo esta misma semana. ¿Le comparto el resumen breve por aquí?`,
      emailSubject: `Oportunidad de mejora directa para ${lead.name} (${analysis.recommendedService.replace('_', ' ')})`,
      emailBody: `Estimado/a responsable de ${lead.name}:\n\nAnalizando la presencia digital de su sector en Medellín y ${lead.formattedAddress.split(',')[0]}, detecté que ${analysis.plainProblems[0]}.\n\nPara negocios con su volumen de clientes, esto puede representar perder entre 10 y 25 clientes interesados cada mes.\n\nPodemos resolverlo implementando ${serviceText}.\n\nSi cuentan con disponibilidad esta semana, les muestro la solución en 10 minutos.\n\nAtentamente,\n${sellerName}\n${seller.companyOrAgency}`,
    };
  }

  // Profesional por defecto
  return {
    tone: 'profesional',
    generatedAt: new Date().toISOString(),
    phoneScript: `«Buenos días. Mi nombre es ${sellerName}, consultor en digitalización de negocios locales. Me comunico con ${lead.name} tras realizar una revisión de su presencia digital en ${lead.formattedAddress.split(',')[0]}. Identificamos una oportunidad importante: ${analysis.plainProblems[0]?.toLowerCase() || 'facilitar el contacto inmediato y reservas a sus clientes'}. Nos especializamos en ${serviceText}. ¿Con quién podría agendar una breve conversación de 5 minutos para presentárselo?»`,
    whatsappMessage: `Estimados señores de ${lead.name}: Les saluda ${sellerName}. Tras revisar su presencia digital en ${lead.formattedAddress.split(',')[0]}, observamos que cuentan con una clientela muy favorable, pero ${analysis.plainProblems[1] || 'su sitio web carece de canal directo de WhatsApp'}. Hemos diseñado una propuesta orientada a ${serviceText}. ¿Podríamos compartirles un resumen ejecutivo? Gracias por su atención.`,
    emailSubject: `Revisión digital de ${lead.name} y propuesta de optimización`,
    emailBody: `Estimado/a responsable de ${lead.name}:\n\nMi nombre es ${sellerName}, consultor en ${seller.companyOrAgency}.\n\nRecientemente analizamos las métricas digitales de los negocios del sector ${lead.primaryTypeDisplayName || 'servicios'} en su localidad. Destacamos la sólida reputación de su empresa (${lead.rating || 4.5} ★ sobre ${lead.userRatingCount || 20} opiniones).\n\nSin embargo, su infraestructura web actual presenta las siguientes áreas de mejora:\n- ${analysis.plainProblems.slice(0, 3).join('\n- ')}\n\nNuestra propuesta consiste en integrar ${serviceText}, garantizando una atención ágil y mayor conversión de prospectos a clientes.\n\nQuedo a su entera disposición para coordinar una breve llamada informativa.\n\nAtentamente,\n${sellerName}\n${seller.companyOrAgency}`,
  };
}

