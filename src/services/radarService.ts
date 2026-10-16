import { NicheStat, RadarAnalysisResponse } from '../types';
import { searchGooglePlaces } from './googlePlacesClient';

export async function runRadarAnalysis(
  zone: string,
  categories: string[],
  googleCloudApiKey?: string
): Promise<RadarAnalysisResponse> {
  // Mapa de conocimiento de digitalización en Colombia y Medellín para los nichos
  const marketProfiles: Record<
    string,
    {
      avgTotalFound: number;
      pctNoWebRange: [number, number];
      avgRatingRange: [number, number];
      avgReviewsRange: [number, number];
      primaryService: string;
      serviceRationale: string;
      opportunityRationale: string;
      opportunityMultiplier: number;
    }
  > = {
    'talleres mecánicos': {
      avgTotalFound: 18,
      pctNoWebRange: [65, 85],
      avgRatingRange: [4.2, 4.6],
      avgReviewsRange: [25, 60],
      primaryService: 'Agente de IA por WhatsApp',
      serviceRationale: 'Los conductores en Medellín necesitan cotizaciones inmediatas de repuestos, frenos o latonería sin esperar al teléfono.',
      opportunityRationale: 'Altísimo porcentaje con webs inexistentes o páginas de Facebook abandonadas, con clientes activos y servicios de $300.000 a $2.500.000 COP.',
      opportunityMultiplier: 1.15,
    },
    'clínicas dentales': {
      avgTotalFound: 15,
      pctNoWebRange: [25, 45],
      avgRatingRange: [4.4, 4.8],
      avgReviewsRange: [35, 95],
      primaryService: 'Sistema de citas online con confirmación WhatsApp',
      serviceRationale: 'Pacientes de ortodoncia e implantes que buscan agendar fuera del horario de recepción (noches y fines de semana).',
      opportunityRationale: 'Tienen alto presupuesto para marketing y cada paciente captado genera tratamientos de varios millones de pesos.',
      opportunityMultiplier: 1.25,
    },
    'fisioterapeutas': {
      avgTotalFound: 16,
      pctNoWebRange: [45, 65],
      avgRatingRange: [4.6, 4.9],
      avgReviewsRange: [20, 50],
      primaryService: 'Sistema de reservas online y recordatorios automáticos',
      serviceRationale: 'El profesional no puede contestar el celular mientras está en sesión de terapia o rehabilitación.',
      opportunityRationale: 'El problema del "WhatsApp desatendido mientras atiendo a un paciente" es universal en el sector y causa pérdida de citas diarias.',
      opportunityMultiplier: 1.3,
    },
    'peluquerías': {
      avgTotalFound: 20,
      pctNoWebRange: [70, 90],
      avgRatingRange: [4.3, 4.7],
      avgReviewsRange: [30, 80],
      primaryService: 'Agente de WhatsApp para citas',
      serviceRationale: 'Reducir las llamadas constantes que interrumpen el corte, cepillado o colorimetría y evitar inasistencias.',
      opportunityRationale: 'Casi el 80% depende de mensajes manuales de WhatsApp sin catálogo estructurado ni confirmación automatizada.',
      opportunityMultiplier: 1.1,
    },
    'centros de estética': {
      avgTotalFound: 19,
      pctNoWebRange: [50, 75],
      avgRatingRange: [4.4, 4.8],
      avgReviewsRange: [25, 70],
      primaryService: 'Web de alta conversión con reservas directas',
      serviceRationale: 'Mostrar portafolio visual de tratamientos faciales y corporales con reserva inmediata.',
      opportunityRationale: 'Excelente margen por procedimiento y alta demanda en zonas como El Poblado, Laureles y Envigado.',
      opportunityMultiplier: 1.12,
    },
    'restaurantes': {
      avgTotalFound: 20,
      pctNoWebRange: [35, 55],
      avgRatingRange: [4.0, 4.5],
      avgReviewsRange: [80, 250],
      primaryService: 'Carta digital propia y sistema de reservas sin comisiones',
      serviceRationale: 'Evitar las altas comisiones de intermediarios y fidelizar a comensales directos por WhatsApp.',
      opportunityRationale: 'Gran volumen de clientes en Medellín, pero márgenes ajustados donde un sistema directo ahorra costos operativos.',
      opportunityMultiplier: 0.95,
    },
    'gimnasios': {
      avgTotalFound: 12,
      pctNoWebRange: [30, 50],
      avgRatingRange: [4.1, 4.6],
      avgReviewsRange: [40, 110],
      primaryService: 'Landing de captación para clase de cortesía + WhatsApp',
      serviceRationale: 'Captar el contacto del usuario para cerrarlo por WhatsApp antes de que compare con cadenas comerciales.',
      opportunityRationale: 'Mercado competitivo donde responder en menos de 5 minutos define el cierre de la mensualidad.',
      opportunityMultiplier: 1.05,
    },
    'academias': {
      avgTotalFound: 14,
      pctNoWebRange: [40, 65],
      avgRatingRange: [4.3, 4.8],
      avgReviewsRange: [15, 45],
      primaryService: 'Web moderna con formulario de prueba de nivel',
      serviceRationale: 'Captar matrículas de idiomas o cursos técnicos en temporadas de inicio de semestre.',
      opportunityRationale: 'Muchos centros educativos locales tienen páginas desactualizadas no aptas para celulares.',
      opportunityMultiplier: 1.08,
    },
    'inmobiliarias': {
      avgTotalFound: 16,
      pctNoWebRange: [20, 40],
      avgRatingRange: [4.2, 4.7],
      avgReviewsRange: [20, 65],
      primaryService: 'Agente de WhatsApp para cualificación de compradores e inquilinos',
      serviceRationale: 'Filtrar prospectos y enviar fichas técnicas de inmuebles las 24 horas.',
      opportunityRationale: 'Comisiones de corretaje significativas que justifican con facilidad la inversión en automatización digital.',
      opportunityMultiplier: 1.18,
    },
    'reformas': {
      avgTotalFound: 17,
      pctNoWebRange: [75, 92],
      avgRatingRange: [4.1, 4.6],
      avgReviewsRange: [10, 35],
      primaryService: 'Página web profesional con portafolio de remodelaciones y WhatsApp',
      serviceRationale: 'Generar confianza inmediata ante cotizaciones de remodelación de varios millones de pesos.',
      opportunityRationale: 'Máxima oportunidad de "Sin web propia". La gran mayoría solo publica en redes sociales sin respaldo profesional.',
      opportunityMultiplier: 1.28,
    },
    'ferreterías': {
      avgTotalFound: 18,
      pctNoWebRange: [75, 92],
      avgRatingRange: [4.1, 4.6],
      avgReviewsRange: [15, 45],
      primaryService: 'Catálogo digital con cotizaciones por WhatsApp',
      serviceRationale: 'Clientes y maestros de obra que piden precios y disponibilidad de materiales sin ir al local.',
      opportunityRationale: 'Negocios de barrio con enorme rotación de clientes pero casi sin presencia digital ni catálogo en línea.',
      opportunityMultiplier: 1.22,
    },
    'panaderías': {
      avgTotalFound: 20,
      pctNoWebRange: [80, 95],
      avgRatingRange: [4.3, 4.7],
      avgReviewsRange: [30, 90],
      primaryService: 'Pedidos y encargos de tortas por WhatsApp con respuestas automáticas',
      serviceRationale: 'Encargos de tortas, pasabocas y pedidos para eventos que hoy se toman a mano por llamada o chat.',
      opportunityRationale: 'Muchas reseñas y clientela fiel, pero la gran mayoría solo usa redes sociales y no tiene canal de pedidos.',
      opportunityMultiplier: 1.2,
    },
    'lavanderías': {
      avgTotalFound: 14,
      pctNoWebRange: [70, 90],
      avgRatingRange: [4.2, 4.7],
      avgReviewsRange: [12, 40],
      primaryService: 'Agente de WhatsApp para recogida, estado de pedidos y cotizaciones',
      serviceRationale: 'Clientes que quieren agendar recogida a domicilio y saber cuándo está lista su ropa sin llamar.',
      opportunityRationale: 'Servicio recurrente de alta frecuencia, con procesos manuales fáciles de automatizar.',
      opportunityMultiplier: 1.18,
    },
    'tiendas de mascotas': {
      avgTotalFound: 13,
      pctNoWebRange: [55, 80],
      avgRatingRange: [4.4, 4.8],
      avgReviewsRange: [25, 85],
      primaryService: 'Catálogo con pedidos y domicilios por WhatsApp y recordatorios de compra',
      serviceRationale: 'Compra recurrente de alimento y accesorios que se puede reactivar con recordatorios automáticos.',
      opportunityRationale: 'Clientes muy fieles y compra frecuente, con poca presencia de catálogo o domicilios organizados.',
      opportunityMultiplier: 1.12,
    },
    'jardines infantiles': {
      avgTotalFound: 12,
      pctNoWebRange: [50, 75],
      avgRatingRange: [4.3, 4.8],
      avgReviewsRange: [10, 40],
      primaryService: 'Sitio web con inscripciones y atención de padres por WhatsApp',
      serviceRationale: 'Padres que comparan jardines por internet y quieren resolver dudas y agendar visitas por chat.',
      opportunityRationale: 'Decisión de alto valor y confianza, donde una buena presencia digital marca la diferencia en las matrículas.',
      opportunityMultiplier: 1.16,
    },
    'veterinarios': {
      avgTotalFound: 11,
      pctNoWebRange: [35, 55],
      avgRatingRange: [4.5, 4.9],
      avgReviewsRange: [45, 120],
      primaryService: 'Recordatorios automatizados de vacunas y desparasitación por WhatsApp',
      serviceRationale: 'Fidelización y citas recurrentes para dueños de mascotas.',
      opportunityRationale: 'Fuerte lazo afectivo con las mascotas y alta receptividad a confirmaciones por WhatsApp.',
      opportunityMultiplier: 1.14,
    },
    'autoescuelas': {
      avgTotalFound: 13,
      pctNoWebRange: [45, 70],
      avgRatingRange: [4.2, 4.7],
      avgReviewsRange: [25, 65],
      primaryService: 'Sitio web enfocado a jóvenes con inscripción virtual y WhatsApp',
      serviceRationale: 'Público joven que prefiere cotizar licencias de conducción por chat antes que llamar.',
      opportunityRationale: 'Pérdida continua de alumnos por no contar con botón de WhatsApp visible en sus perfiles.',
      opportunityMultiplier: 1.2,
    },
    'ópticas': {
      avgTotalFound: 12,
      pctNoWebRange: [30, 50],
      avgRatingRange: [4.5, 4.9],
      avgReviewsRange: [20, 55],
      primaryService: 'Sistema de agendamiento para examen de optometría',
      serviceRationale: 'Agendar citas para que el cliente acuda al local a adquirir monturas y lentes.',
      opportunityRationale: 'Negocios con buena ubicación física pero escasa captación digital en barrios de Medellín.',
      opportunityMultiplier: 1.02,
    },
    'gestorías': {
      avgTotalFound: 15,
      pctNoWebRange: [55, 75],
      avgRatingRange: [4.2, 4.6],
      avgReviewsRange: [12, 30],
      primaryService: 'Sitio web profesional para asesorías contables y tributarias',
      serviceRationale: 'Captar pymes y profesionales independientes con necesidad de planeación tributaria.',
      opportunityRationale: 'Mercado tradicional que requiere modernizar su imagen digital para atraer emprendedores.',
      opportunityMultiplier: 1.06,
    },
    'asesorías contables': {
      avgTotalFound: 15,
      pctNoWebRange: [55, 75],
      avgRatingRange: [4.2, 4.6],
      avgReviewsRange: [12, 30],
      primaryService: 'Sitio web profesional para asesorías contables y tributarias',
      serviceRationale: 'Captar pymes y profesionales independientes en Medellín con necesidad de planeación tributaria.',
      opportunityRationale: 'Mercado tradicional que requiere modernizar su presencia digital para captar clientes comerciales.',
      opportunityMultiplier: 1.06,
    },
    'remodelaciones': {
      avgTotalFound: 17,
      pctNoWebRange: [75, 92],
      avgRatingRange: [4.1, 4.6],
      avgReviewsRange: [10, 35],
      primaryService: 'Página web profesional con portafolio de acabados y WhatsApp',
      serviceRationale: 'Generar confianza inmediata ante cotizaciones de remodelación de varios millones de pesos.',
      opportunityRationale: 'Máxima oportunidad de "Sin web propia". La gran mayoría solo publica en redes sociales sin respaldo profesional.',
      opportunityMultiplier: 1.28,
    },
    'escuelas de conducción': {
      avgTotalFound: 13,
      pctNoWebRange: [45, 70],
      avgRatingRange: [4.2, 4.7],
      avgReviewsRange: [25, 65],
      primaryService: 'Sitio web enfocado a jóvenes con inscripción virtual y WhatsApp',
      serviceRationale: 'Público joven que prefiere cotizar licencias de conducción por chat antes que llamar.',
      opportunityRationale: 'Pérdida continua de alumnos por no contar con botón de WhatsApp visible en sus perfiles.',
      opportunityMultiplier: 1.2,
    },
    'clínicas odontológicas': {
      avgTotalFound: 15,
      pctNoWebRange: [25, 45],
      avgRatingRange: [4.4, 4.8],
      avgReviewsRange: [35, 95],
      primaryService: 'Sistema de citas online con confirmación WhatsApp',
      serviceRationale: 'Pacientes de ortodoncia, diseño de sonrisa e implantes que buscan agendar fuera del horario de recepción.',
      opportunityRationale: 'Tienen alto presupuesto para marketing y cada paciente captado genera tratamientos de alto valor.',
      opportunityMultiplier: 1.25,
    },
    'veterinarias': {
      avgTotalFound: 11,
      pctNoWebRange: [35, 55],
      avgRatingRange: [4.5, 4.9],
      avgReviewsRange: [45, 120],
      primaryService: 'Recordatorios automatizados de vacunas y desparasitación por WhatsApp',
      serviceRationale: 'Fidelización y citas recurrentes para dueños de mascotas.',
      opportunityRationale: 'Fuerte lazo afectivo con las mascotas y alta receptividad a confirmaciones por WhatsApp.',
      opportunityMultiplier: 1.14,
    },
  };

  const defaultProfile = {
    avgTotalFound: 15,
    pctNoWebRange: [50, 70] as [number, number],
    avgRatingRange: [4.2, 4.6] as [number, number],
    avgReviewsRange: [20, 50] as [number, number],
    primaryService: 'Página Web y Agente de WhatsApp',
    serviceRationale: 'Captar clientes locales y automatizar respuestas rápidas.',
    opportunityRationale: 'Falta de presencia digital moderna.',
    opportunityMultiplier: 1.0,
  };

  const mid = (range: [number, number]) => (range[0] + range[1]) / 2;

  // Consulta real a Google Places por categoría (una llamada por categoría, hasta 20 negocios)
  const hasKey = Boolean(googleCloudApiKey && googleCloudApiKey.trim());
  const realStats = await Promise.all(
    categories.map(async (catName) => {
      if (!hasKey) return null;
      try {
        const leads = (await searchGooglePlaces(zone, catName, googleCloudApiKey as string)).filter(
          (l) => l.businessStatus !== 'CLOSED_PERMANENTLY'
        );
        const rated = leads.filter((l) => typeof l.rating === 'number');
        return {
          totalFound: leads.length,
          pctNoWeb: leads.length
            ? Math.round((leads.filter((l) => l.websiteClassification.type !== 'own').length / leads.length) * 100)
            : 0,
          avgRating: rated.length
            ? parseFloat((rated.reduce((acc, l) => acc + (l.rating || 0), 0) / rated.length).toFixed(1))
            : 0,
          avgReviews: leads.length
            ? Math.round(leads.reduce((acc, l) => acc + (l.userRatingCount || 0), 0) / leads.length)
            : 0,
        };
      } catch (err) {
        console.warn(`Radar: no se pudo consultar Google Places para «${catName}»:`, err);
        return null;
      }
    })
  );
  const placesCallsUsed = realStats.filter(Boolean).length;

  const calculatedCategories: NicheStat[] = categories.map((catName, index) => {
    const profile = marketProfiles[catName.toLowerCase()] || defaultProfile;
    const real = realStats[index];

    // Datos reales de Google Places, o estimación de referencia del sector si no hay clave o falló la consulta
    const totalFound = real ? real.totalFound : profile.avgTotalFound;
    const pctNoWeb = real ? real.pctNoWeb : Math.round(mid(profile.pctNoWebRange));
    const avgRating = real ? real.avgRating : parseFloat(mid(profile.avgRatingRange).toFixed(1));
    const avgReviews = real ? real.avgReviews : Math.round(mid(profile.avgReviewsRange));

    // Score calculado a partir de: % sin web, volumen de actividad (reseñas), reputación y peso del sector
    const rawScore =
      pctNoWeb * 0.45 +
      Math.min(100, avgReviews * 1.4) * 0.25 +
      (avgRating / 5) * 100 * 0.15;

    const finalScore = Math.min(
      99,
      Math.max(real && real.totalFound === 0 ? 0 : 35, Math.round(rawScore * profile.opportunityMultiplier))
    );

    return {
      category: catName,
      totalFound,
      percentWithoutOwnWeb: pctNoWeb,
      avgRating,
      avgReviews,
      opportunityScore: finalScore,
      opportunityRank: 0, // Se asigna tras ordenar
      recommendedService: profile.primaryService,
      serviceRationale: profile.serviceRationale,
      opportunityRationale: profile.opportunityRationale,
      isEstimated: !real,
    };
  });

  // Ordenar por opportunityScore de mayor a menor
  calculatedCategories.sort((a, b) => b.opportunityScore - a.opportunityScore);

  // Asignar puestos del ranking
  calculatedCategories.forEach((cat, index) => {
    cat.opportunityRank = index + 1;
  });

  // Extraer las 3 mejores recomendaciones
  const topThree = calculatedCategories.slice(0, 3).map((item) => ({
    category: item.category,
    whyTop: item.opportunityRationale,
    serviceToSell: `${item.recommendedService} — ${item.serviceRationale}`,
  }));

  const executiveSummary = `En ${zone}, los nichos con mayor puntaje de oportunidad son ${topThree
    .map((t) => `«${t.category}»`)
    .join(
      ', '
    )}. El puntaje combina el porcentaje de negocios sin web propia, la actividad de reseñas y la reputación en Google${
    placesCallsUsed < categories.length ? ' (las categorías marcadas como «Estimado» usan valores de referencia del sector)' : ''
  }.`;

  return {
    zone,
    categories: calculatedCategories,
    topRecommendations: topThree,
    executiveSummary,
    analyzedAt: new Date().toISOString(),
    placesCallsUsed,
  };
}
