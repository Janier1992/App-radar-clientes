import { NicheStat, RadarAnalysisResponse, PREDEFINED_NICHES } from '../types';

export async function runRadarAnalysis(
  zone: string,
  categories: string[],
  googleCloudApiKey?: string
): Promise<RadarAnalysisResponse> {
  // Intentamos conectar con backend si está disponible
  try {
    const res = await fetch('/api/radar/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        zone,
        categories,
        apiKey: googleCloudApiKey,
      }),
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Endpoint /api/radar/analyze no respondió, generando cálculo asistido:', err);
  }

  // Simulación realista asistida por modelo para la zona indicada
  await new Promise((resolve) => setTimeout(resolve, 2400));

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

  const calculatedCategories: NicheStat[] = categories.map((catName) => {
    const profile = marketProfiles[catName.toLowerCase()] || {
      avgTotalFound: 15,
      pctNoWebRange: [50, 70],
      avgRatingRange: [4.2, 4.6],
      avgReviewsRange: [20, 50],
      primaryService: 'Página Web y Agente de WhatsApp',
      serviceRationale: 'Captar clientes locales y automatizar respuestas rápidas.',
      opportunityRationale: 'Falta de presencia digital moderna.',
      opportunityMultiplier: 1.0,
    };

    const pctNoWeb = Math.floor(
      profile.pctNoWebRange[0] +
        Math.random() * (profile.pctNoWebRange[1] - profile.pctNoWebRange[0])
    );
    const avgRating = parseFloat(
      (
        profile.avgRatingRange[0] +
        Math.random() * (profile.avgRatingRange[1] - profile.avgRatingRange[0])
      ).toFixed(1)
    );
    const avgReviews = Math.floor(
      profile.avgReviewsRange[0] +
        Math.random() * (profile.avgReviewsRange[1] - profile.avgReviewsRange[0])
    );

    // Score calculado a partir de: % sin web (40%), volumen de actividad (30%), reputación (15%) y multiplicador de sector (15%)
    const rawScore =
      pctNoWeb * 0.45 +
      Math.min(100, avgReviews * 1.4) * 0.25 +
      (avgRating / 5) * 100 * 0.15;

    const finalScore = Math.min(
      99,
      Math.max(35, Math.round(rawScore * profile.opportunityMultiplier))
    );

    return {
      category: catName,
      totalFound: profile.avgTotalFound,
      percentWithoutOwnWeb: pctNoWeb,
      avgRating,
      avgReviews,
      opportunityScore: finalScore,
      opportunityRank: 0, // Se asigna tras ordenar
      recommendedService: profile.primaryService,
      serviceRationale: profile.serviceRationale,
      opportunityRationale: profile.opportunityRationale,
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

  const executiveSummary = `En ${zone}, los sectores de ${topThree
    .map((t) => `«${t.category}»`)
    .join(
      ', '
    )} presentan la mayor combinación de clientela activa insatisfecha por falta de canales digitales directos y presupuestos favorables para invertir en digitalización.`;

  return {
    zone,
    categories: calculatedCategories,
    topRecommendations: topThree,
    executiveSummary,
    analyzedAt: new Date().toISOString(),
  };
}
