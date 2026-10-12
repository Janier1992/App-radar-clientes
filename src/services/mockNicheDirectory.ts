import { BusinessLead } from '../types';

export function getMockResultsForNiche(targetZone: string, targetNiche: string): Array<Omit<BusinessLead, 'opportunityScore' | 'scoreBreakdown' | 'isPreliminaryScore' | 'pipelineStatus' | 'websiteClassification'>> {
  const normNiche = targetNiche.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // 1. Clínicas de estética, centros de belleza, spa
  if (
    normNiche.includes('estet') || 
    normNiche.includes('belleza') || 
    normNiche.includes('spa') ||
    normNiche.includes('cosmet')
  ) {
    return [
      {
        id: 'place-estetica-1',
        name: 'Clínica de Estética & Láser El Poblado',
        primaryTypeDisplayName: 'Clínica de estética y medicina estética',
        formattedAddress: `Cra. 43A #1-50, San Fernando, ${targetZone}`,
        nationalPhoneNumber: '+57 312 874 9901',
        websiteUri: undefined, // Sin web (alta oportunidad)
        rating: 4.8,
        userRatingCount: 84,
        googleMapsUri: `https://maps.google.com/?q=Clinica+Estetica+Poblado+Medellin`,
        businessStatus: 'OPERATIONAL',
      },
      {
        id: 'place-estetica-2',
        name: 'DermoEstética & Spa Laureles',
        primaryTypeDisplayName: 'Centro de estética y spa facial',
        formattedAddress: `Circular 4 #73-12, ${targetZone}`,
        nationalPhoneNumber: '+57 (604) 411 9020',
        websiteUri: 'https://instagram.com/dermoesteticalaureles',
        rating: 4.7,
        userRatingCount: 62,
        googleMapsUri: `https://maps.google.com/?q=Dermoestetica+Laureles+Medellin`,
        businessStatus: 'OPERATIONAL',
      },
      {
        id: 'place-estetica-3',
        name: 'Harmonie Medicina Estética & Rejuvenecimiento',
        primaryTypeDisplayName: 'Centro de estética avanzada',
        formattedAddress: `Calle 10A #37-45, ${targetZone}`,
        nationalPhoneNumber: '+57 320 610 4488',
        websiteUri: 'https://harmonieesteticamedellin.com',
        rating: 4.9,
        userRatingCount: 115,
        googleMapsUri: `https://maps.google.com/?q=Harmonie+Medicina+Estetica+Medellin`,
        businessStatus: 'OPERATIONAL',
      },
      {
        id: 'place-estetica-4',
        name: 'Estética Integral y Moldeo Corporal Envigado',
        primaryTypeDisplayName: 'Centro de tratamientos estéticos',
        formattedAddress: `Cra. 43A #33 Sur-28, ${targetZone}`,
        nationalPhoneNumber: '+57 301 540 2233',
        websiteUri: undefined,
        rating: 4.6,
        userRatingCount: 43,
        googleMapsUri: `https://maps.google.com/?q=Estetica+Integral+Envigado`,
        businessStatus: 'OPERATIONAL',
      },
      {
        id: 'place-estetica-5',
        name: 'BellaPiel Centro Láser y Cosmetología Belén',
        primaryTypeDisplayName: 'Cosmetología y estética facial',
        formattedAddress: `Calle 30 #75-19, ${targetZone}`,
        nationalPhoneNumber: '+57 314 789 6543',
        websiteUri: 'https://facebook.com/bellapielbelen',
        rating: 4.5,
        userRatingCount: 39,
        googleMapsUri: `https://maps.google.com/?q=BellaPiel+Estetica+Belen`,
        businessStatus: 'OPERATIONAL',
      },
    ];
  }

  // 2. Clínicas dentales, odontología
  if (normNiche.includes('dent') || normNiche.includes('odontolog')) {
    return [
      {
        id: 'place-dental-1',
        name: 'Clínica Odontológica Especialistas El Poblado',
        primaryTypeDisplayName: 'Clínica dental y ortodoncia',
        formattedAddress: `Cra. 43A #5A-113, ${targetZone}`,
        nationalPhoneNumber: '+57 310 492 8811',
        websiteUri: undefined,
        rating: 4.9,
        userRatingCount: 74,
        googleMapsUri: 'https://maps.google.com/?q=Odontologia+El+Poblado',
        businessStatus: 'OPERATIONAL',
      },
      {
        id: 'place-dental-2',
        name: 'Centro Dental Laureles Sonrisas',
        primaryTypeDisplayName: 'Odontología integral y diseño de sonrisa',
        formattedAddress: `Circular 4 #71-40, ${targetZone}`,
        nationalPhoneNumber: '+57 (604) 412 3090',
        websiteUri: 'https://instagram.com/dentallaureles',
        rating: 4.5,
        userRatingCount: 51,
        googleMapsUri: 'https://maps.google.com/?q=Dental+Laureles',
        businessStatus: 'OPERATIONAL',
      },
      {
        id: 'place-dental-3',
        name: 'Ortodoncia & Implantes Medellín',
        primaryTypeDisplayName: 'Clínica dental especializada',
        formattedAddress: `Calle 10 #42-28, ${targetZone}`,
        nationalPhoneNumber: '+57 318 703 1450',
        websiteUri: 'https://www.ortodonciamedellin.com.co',
        rating: 4.2,
        userRatingCount: 29,
        googleMapsUri: 'https://maps.google.com/?q=Ortodoncia+Medellin',
        businessStatus: 'OPERATIONAL',
      },
      {
        id: 'place-dental-4',
        name: 'Odontología y Estética Dental Envigado',
        primaryTypeDisplayName: 'Clínica odontológica',
        formattedAddress: `Calle 37 Sur #41-15, ${targetZone}`,
        nationalPhoneNumber: '+57 314 620 9944',
        websiteUri: undefined,
        rating: 4.8,
        userRatingCount: 92,
        googleMapsUri: 'https://maps.google.com/?q=Odontologia+Envigado',
        businessStatus: 'OPERATIONAL',
      },
      {
        id: 'place-dental-5',
        name: 'Sonrisas y Diseño Belén',
        primaryTypeDisplayName: 'Odontología general y estética',
        formattedAddress: `Carrera 76 #30-45, ${targetZone}`,
        nationalPhoneNumber: '+57 302 331 8765',
        websiteUri: 'https://facebook.com/sonrisasbelen',
        rating: 4.6,
        userRatingCount: 36,
        googleMapsUri: 'https://maps.google.com/?q=Sonrisas+Belen',
        businessStatus: 'OPERATIONAL',
      },
    ];
  }

  // 3. Peluquerías, barberías
  if (normNiche.includes('peluqu') || normNiche.includes('barber')) {
    return [
      {
        id: 'place-peluqueria-1',
        name: 'Salón de Belleza y Estilo Laureles',
        primaryTypeDisplayName: 'Peluquería y estilistas',
        formattedAddress: `Transversal 39B #72-10, ${targetZone}`,
        nationalPhoneNumber: '+57 311 204 5599',
        websiteUri: undefined,
        rating: 4.7,
        userRatingCount: 65,
        googleMapsUri: `https://maps.google.com/?q=Salon+Belleza+Laureles+Medellin`,
        businessStatus: 'OPERATIONAL',
      },
      {
        id: 'place-peluqueria-2',
        name: 'Studio Hair & Color El Poblado',
        primaryTypeDisplayName: 'Peluquería y colorimetría profesional',
        formattedAddress: `Cra. 35 #7-40, Provenza, ${targetZone}`,
        nationalPhoneNumber: '+57 300 891 2244',
        websiteUri: 'https://instagram.com/studiohairpoblado',
        rating: 4.8,
        userRatingCount: 92,
        googleMapsUri: `https://maps.google.com/?q=Studio+Hair+Provenza`,
        businessStatus: 'OPERATIONAL',
      },
      {
        id: 'place-peluqueria-3',
        name: 'Lord Barber Shop & Barba Envigado',
        primaryTypeDisplayName: 'Barbería tradicional',
        formattedAddress: `Calle 38 Sur #40-15, ${targetZone}`,
        nationalPhoneNumber: '+57 316 450 1199',
        websiteUri: undefined,
        rating: 4.6,
        userRatingCount: 54,
        googleMapsUri: `https://maps.google.com/?q=Barber+Shop+Envigado`,
        businessStatus: 'OPERATIONAL',
      },
    ];
  }

  // 4. Fisioterapeutas
  if (normNiche.includes('fisio') || normNiche.includes('terapia')) {
    return [
      {
        id: 'place-fisio-1',
        name: 'Centro de Rehabilitación & Fisioterapia Medellín',
        primaryTypeDisplayName: 'Clínica de fisioterapia y rehabilitación',
        formattedAddress: `Cra. 48 #10-45, El Poblado, ${targetZone}`,
        nationalPhoneNumber: '+57 315 889 0012',
        websiteUri: undefined,
        rating: 4.9,
        userRatingCount: 48,
        googleMapsUri: `https://maps.google.com/?q=Fisioterapia+El+Poblado`,
        businessStatus: 'OPERATIONAL',
      },
      {
        id: 'place-fisio-2',
        name: 'Fisiomedic Laureles Cuidado Integral',
        primaryTypeDisplayName: 'Fisioterapeuta y terapia deportiva',
        formattedAddress: `Circular 2 #70-34, ${targetZone}`,
        nationalPhoneNumber: '+57 301 234 5678',
        websiteUri: 'https://instagram.com/fisiomediclaureles',
        rating: 4.8,
        userRatingCount: 37,
        googleMapsUri: `https://maps.google.com/?q=Fisiomedic+Laureles`,
        businessStatus: 'OPERATIONAL',
      },
    ];
  }

  // 5. Restaurantes, cafeterías
  if (normNiche.includes('restaur') || normNiche.includes('comid') || normNiche.includes('cafe')) {
    return [
      {
        id: 'place-rest-1',
        name: 'Restaurante y Asados Tradición Paisa',
        primaryTypeDisplayName: 'Restaurante típico colombiano',
        formattedAddress: `Calle 10 #38-12, ${targetZone}`,
        nationalPhoneNumber: '+57 311 765 4321',
        websiteUri: undefined,
        rating: 4.7,
        userRatingCount: 145,
        googleMapsUri: 'https://maps.google.com/?q=Asados+Paisa+Medellin',
        businessStatus: 'OPERATIONAL',
      },
      {
        id: 'place-rest-2',
        name: 'Café & Bistro Laureles',
        primaryTypeDisplayName: 'Cafetería y restaurante',
        formattedAddress: `Circular 2 #70-08, ${targetZone}`,
        nationalPhoneNumber: '+57 (604) 322 1980',
        websiteUri: 'https://instagram.com/cafebistrolaureles',
        rating: 4.6,
        userRatingCount: 88,
        googleMapsUri: 'https://maps.google.com/?q=Cafe+Laureles',
        businessStatus: 'OPERATIONAL',
      },
      {
        id: 'place-rest-3',
        name: 'Sabor Criollo & Parrilla Envigado',
        primaryTypeDisplayName: 'Parrilla y carnes',
        formattedAddress: `Transversal 39 Sur #32-10, ${targetZone}`,
        nationalPhoneNumber: '+57 320 890 1234',
        websiteUri: undefined,
        rating: 4.4,
        userRatingCount: 62,
        googleMapsUri: 'https://maps.google.com/?q=Parrilla+Envigado',
        businessStatus: 'OPERATIONAL',
      },
    ];
  }

  // 6. Gimnasios, fitness
  if (normNiche.includes('gimnas') || normNiche.includes('gym') || normNiche.includes('fit')) {
    return [
      {
        id: 'place-gym-1',
        name: 'Cross Training & Fitness Club Poblado',
        primaryTypeDisplayName: 'Gimnasio y centro de acondicionamiento',
        formattedAddress: `Cra. 38 #10-22, ${targetZone}`,
        nationalPhoneNumber: '+57 312 901 2345',
        websiteUri: undefined,
        rating: 4.7,
        userRatingCount: 88,
        googleMapsUri: `https://maps.google.com/?q=Gimnasio+Poblado+Medellin`,
        businessStatus: 'OPERATIONAL',
      },
      {
        id: 'place-gym-2',
        name: 'Centro Fitness Laureles',
        primaryTypeDisplayName: 'Gimnasio y entrenamiento personalizado',
        formattedAddress: `Circular 73B #39B-15, ${targetZone}`,
        nationalPhoneNumber: '+57 (604) 414 5500',
        websiteUri: 'https://instagram.com/fitnesslaureles',
        rating: 4.5,
        userRatingCount: 64,
        googleMapsUri: `https://maps.google.com/?q=Gimnasio+Laureles`,
        businessStatus: 'OPERATIONAL',
      },
    ];
  }

  // 7. Veterinarias
  if (normNiche.includes('veterin') || normNiche.includes('mascot')) {
    return [
      {
        id: 'place-vet-1',
        name: 'Clínica Veterinaria & Urgencias Animal El Poblado',
        primaryTypeDisplayName: 'Clínica veterinaria y urgencias 24h',
        formattedAddress: `Calle 7 #43A-20, ${targetZone}`,
        nationalPhoneNumber: '+57 310 998 7766',
        websiteUri: undefined,
        rating: 4.9,
        userRatingCount: 112,
        googleMapsUri: `https://maps.google.com/?q=Veterinaria+El+Poblado`,
        businessStatus: 'OPERATIONAL',
      },
      {
        id: 'place-vet-2',
        name: 'Veterinaria & Pet Shop Huellitas Laureles',
        primaryTypeDisplayName: 'Veterinaria y peluquería canina',
        formattedAddress: `Nutibara #71-55, ${targetZone}`,
        nationalPhoneNumber: '+57 (604) 411 3344',
        websiteUri: 'https://facebook.com/huellitaslaureles',
        rating: 4.6,
        userRatingCount: 78,
        googleMapsUri: `https://maps.google.com/?q=Veterinaria+Laureles`,
        businessStatus: 'OPERATIONAL',
      },
    ];
  }

  // 8. Inmobiliarias
  if (normNiche.includes('inmobili') || normNiche.includes('finca raiz')) {
    return [
      {
        id: 'place-inmo-1',
        name: 'Inmobiliaria & Propiedad Raíz El Poblado',
        primaryTypeDisplayName: 'Agencia inmobiliaria',
        formattedAddress: `Cra. 43A #1 Sur-100, ${targetZone}`,
        nationalPhoneNumber: '+57 318 650 9090',
        websiteUri: 'https://inmobiliariaelpoblado.com.co',
        rating: 4.5,
        userRatingCount: 42,
        googleMapsUri: `https://maps.google.com/?q=Inmobiliaria+Poblado`,
        businessStatus: 'OPERATIONAL',
      },
      {
        id: 'place-inmo-2',
        name: 'Bienes Raíces Medellín & Laureles',
        primaryTypeDisplayName: 'Agencia de arrendamientos y ventas',
        formattedAddress: `Circular 3 #72-18, ${targetZone}`,
        nationalPhoneNumber: '+57 (604) 448 2020',
        websiteUri: undefined,
        rating: 4.3,
        userRatingCount: 28,
        googleMapsUri: `https://maps.google.com/?q=Inmobiliaria+Laureles`,
        businessStatus: 'OPERATIONAL',
      },
    ];
  }

  // 9. Reformas, remodelaciones
  if (normNiche.includes('reform') || normNiche.includes('remodel') || normNiche.includes('construc')) {
    return [
      {
        id: 'place-ref-1',
        name: 'Remodelaciones & Acabados Arquitectónicos Medellín',
        primaryTypeDisplayName: 'Contratista de obras y reformas de interiores',
        formattedAddress: `Cra. 43B #16-80, ${targetZone}`,
        nationalPhoneNumber: '+57 311 445 6677',
        websiteUri: undefined,
        rating: 4.8,
        userRatingCount: 34,
        googleMapsUri: `https://maps.google.com/?q=Remodelaciones+Medellin`,
        businessStatus: 'OPERATIONAL',
      },
      {
        id: 'place-ref-2',
        name: 'Diseño & Reformas Residenciales Laureles',
        primaryTypeDisplayName: 'Empresa de remodelación de cocinas y baños',
        formattedAddress: `Transversal 39 #74-20, ${targetZone}`,
        nationalPhoneNumber: '+57 320 899 4433',
        websiteUri: 'https://instagram.com/reformaslaureles',
        rating: 4.7,
        userRatingCount: 29,
        googleMapsUri: `https://maps.google.com/?q=Reformas+Laureles`,
        businessStatus: 'OPERATIONAL',
      },
    ];
  }

  // 10. Talleres mecánicos (SOLO si el usuario explícitamente buscó taller o mecánica)
  if (normNiche.includes('taller') || normNiche.includes('mecanic') || normNiche.includes('auto') || normNiche.includes('serviteca')) {
    return [
      {
        id: 'place-taller-1',
        name: 'Taller y Frenos El Poblado',
        primaryTypeDisplayName: 'Taller mecánico automotriz',
        formattedAddress: `Cra. 43A #7-50, ${targetZone}`,
        nationalPhoneNumber: '+57 312 845 9210',
        websiteUri: undefined,
        rating: 4.7,
        userRatingCount: 56,
        googleMapsUri: 'https://maps.google.com/?q=Taller+Frenos+El+Poblado',
        businessStatus: 'OPERATIONAL',
      },
      {
        id: 'place-taller-2',
        name: 'Serviteca y Mecánica Laureles',
        primaryTypeDisplayName: 'Serviteca y alineación',
        formattedAddress: `Circular 4 #73-28, ${targetZone}`,
        nationalPhoneNumber: '+57 (604) 444 8920',
        websiteUri: 'https://instagram.com/servitecalaureles',
        rating: 4.4,
        userRatingCount: 38,
        googleMapsUri: 'https://maps.google.com/?q=Serviteca+Laureles',
        businessStatus: 'OPERATIONAL',
      },
      {
        id: 'place-taller-3',
        name: 'Autos y Electromecánica Las Vegas',
        primaryTypeDisplayName: 'Servicio de electricidad del automóvil',
        formattedAddress: `Av. Las Vegas #10-125, ${targetZone}`,
        nationalPhoneNumber: '+57 320 671 4455',
        websiteUri: 'https://www.electromecanicalasvegas.com.co',
        rating: 4.1,
        userRatingCount: 22,
        googleMapsUri: 'https://maps.google.com/?q=Electromecanica+Las+Vegas',
        businessStatus: 'OPERATIONAL',
      },
    ];
  }

  // Fallback genérico: Genera negocios con el NOMBRE Y TIPO EXACTOS del nicho solicitado (NUNCA talleres)
  const capitalizedNiche = targetNiche.charAt(0).toUpperCase() + targetNiche.slice(1);
  return [
    {
      id: `place-custom-1`,
      name: `${capitalizedNiche} Premium El Poblado`,
      primaryTypeDisplayName: `${capitalizedNiche}`,
      formattedAddress: `Cra. 43A #9-20, ${targetZone}`,
      nationalPhoneNumber: '+57 310 500 1122',
      websiteUri: undefined,
      rating: 4.8,
      userRatingCount: 52,
      googleMapsUri: `https://maps.google.com/?q=${encodeURIComponent(targetNiche)}+${encodeURIComponent(targetZone)}`,
      businessStatus: 'OPERATIONAL',
    },
    {
      id: `place-custom-2`,
      name: `${capitalizedNiche} & Servicios Laureles`,
      primaryTypeDisplayName: `${capitalizedNiche}`,
      formattedAddress: `Circular 4 #72-15, ${targetZone}`,
      nationalPhoneNumber: '+57 (604) 412 8899',
      websiteUri: `https://instagram.com/${encodeURIComponent(normNiche.replace(/\s+/g, ''))}_medellin`,
      rating: 4.6,
      userRatingCount: 41,
      googleMapsUri: `https://maps.google.com/?q=${encodeURIComponent(targetNiche)}+${encodeURIComponent(targetZone)}`,
      businessStatus: 'OPERATIONAL',
    },
    {
      id: `place-custom-3`,
      name: `Centro Profesional de ${capitalizedNiche} Envigado`,
      primaryTypeDisplayName: `${capitalizedNiche}`,
      formattedAddress: `Calle 37 Sur #42-10, ${targetZone}`,
      nationalPhoneNumber: '+57 315 780 3344',
      websiteUri: `https://www.${encodeURIComponent(normNiche.replace(/\s+/g, ''))}medellin.com.co`,
      rating: 4.4,
      userRatingCount: 30,
      googleMapsUri: `https://maps.google.com/?q=${encodeURIComponent(targetNiche)}+${encodeURIComponent(targetZone)}`,
      businessStatus: 'OPERATIONAL',
    },
  ];
}
