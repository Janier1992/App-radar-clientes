import { BusinessLead } from '../types';
import { classifyWebsite, calculatePreliminaryScore } from './opportunityScore';

// Mapeo exhaustivo de nichos en español a tipos admitidos por Places API (New) (Table A de Google Places)
// https://developers.google.com/maps/documentation/places/web-service/place-types
export const NICHE_PRIMARY_TYPES: Record<string, string[]> = {
  'talleres mecánicos': ['car_repair', 'auto_repair'],
  'taller': ['car_repair'],
  'mecanica': ['car_repair'],
  'serviteca': ['car_repair', 'tire_shop'],
  'clínicas dentales': ['dentist', 'dental_clinic'],
  'clinica dental': ['dentist', 'dental_clinic'],
  'odontologia': ['dentist', 'dental_clinic'],
  'odontologo': ['dentist', 'dental_clinic'],
  'fisioterapeutas': ['physiotherapist', 'physical_therapy_clinic'],
  'fisioterapia': ['physiotherapist', 'physical_therapy_clinic'],
  'peluquerías': ['hair_salon', 'barber_shop'],
  'peluqueria': ['hair_salon', 'barber_shop'],
  'barberia': ['barber_shop'],
  'centros de estética': ['beauty_salon', 'spa', 'skin_care_clinic'],
  'clinica de estetica': ['beauty_salon', 'spa', 'skin_care_clinic'],
  'estetica': ['beauty_salon', 'spa', 'skin_care_clinic'],
  'spa': ['spa', 'beauty_salon'],
  'restaurantes': ['restaurant'],
  'restaurante': ['restaurant'],
  'cafeterias': ['cafe', 'coffee_shop'],
  'cafe': ['cafe', 'coffee_shop'],
  'gimnasios': ['gym', 'fitness_center'],
  'gimnasio': ['gym', 'fitness_center'],
  'academias': ['school', 'educational_institution', 'language_school'],
  'inmobiliarias': ['real_estate_agency'],
  'inmobiliaria': ['real_estate_agency'],
  'reformas': ['general_contractor', 'home_improvement_store', 'painter'],
  'remodelaciones': ['general_contractor', 'home_improvement_store'],
  'veterinarios': ['veterinary_care'],
  'veterinarias': ['veterinary_care'],
  'autoescuelas': ['driving_school'],
  'escuelas de conduccion': ['driving_school'],
  'ópticas': ['optician', 'optometrist'],
  'optica': ['optician', 'optometrist'],
  'gestorías': ['accounting', 'tax_preparation_service'],
  'asesorías contables': ['accounting', 'tax_preparation_service'],
  'abogados': ['law_firm', 'lawyer'],
  'ferreterías': ['hardware_store'],
  'ferreteria': ['hardware_store'],
  'panaderías': ['bakery'],
  'panaderia': ['bakery'],
  'pastelería': ['bakery'],
  'lavanderías': ['laundry'],
  'lavanderia': ['laundry'],
  'tiendas de mascotas': ['pet_store'],
  'tienda de mascotas': ['pet_store'],
  'jardines infantiles': ['preschool', 'child_care_agency'],
  'jardin infantil': ['preschool', 'child_care_agency'],
  'guarderia': ['child_care_agency', 'preschool'],
};

// Palabras clave negativas para evitar contaminación cruzada entre nichos incompatibles
export const NICHE_NEGATIVE_KEYWORDS: Record<string, string[]> = {
  'estetica': ['mecanic', 'taller', 'repuesto', 'frenos', 'motor', 'latoneria', 'suspension', 'serviteca', 'llantas', 'automotriz', 'lavado de autos'],
  'belleza': ['mecanic', 'taller', 'repuesto', 'frenos', 'motor', 'latoneria', 'suspension', 'serviteca', 'llantas', 'automotriz'],
  'spa': ['mecanic', 'taller', 'repuesto', 'frenos', 'motor', 'latoneria', 'serviteca', 'automotriz'],
  'dental': ['mecanic', 'taller', 'repuesto', 'frenos', 'motor', 'latoneria', 'serviteca', 'automotriz'],
  'odontolog': ['mecanic', 'taller', 'repuesto', 'frenos', 'motor', 'latoneria', 'serviteca', 'automotriz'],
  'taller': ['estetic', 'spa', 'odontolog', 'dental', 'unas', 'peluquer', 'peinado', 'depilacion', 'cejas', 'pestañas'],
  'mecanic': ['estetic', 'spa', 'odontolog', 'dental', 'unas', 'peluquer', 'peinado', 'depilacion'],
  'restaurante': ['mecanic', 'taller', 'odontolog', 'dental', 'estetic'],
  'fisioterapia': ['mecanic', 'taller', 'repuesto', 'automotriz'],
  'ferreteria': ['restaurante', 'estetic', 'odontolog', 'dental', 'peluquer'],
  'panaderia': ['mecanic', 'taller', 'odontolog', 'dental', 'estetic', 'ferreteria'],
  'lavanderia': ['mecanic', 'taller', 'autos', 'carros', 'vehiculo', 'automotriz'],
  'mascotas': ['mecanic', 'taller', 'odontolog', 'dental', 'estetic humana'],
  'jardin': ['mecanic', 'taller', 'repuesto', 'automotriz'],
};

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Obtiene el primaryType admitido por Google Places API si coincide con el nicho
 */
export function getIncludedPrimaryTypes(niche: string): string[] | undefined {
  const norm = normalizeText(niche.trim());
  for (const [key, types] of Object.entries(NICHE_PRIMARY_TYPES)) {
    if (norm.includes(normalizeText(key)) || normalizeText(key).includes(norm)) {
      return types;
    }
  }
  return undefined;
}

/**
 * Verifica si un negocio contiene palabras clave negativas en su nombre o tipo que delaten
 * que pertenece a un nicho completamente ajeno (por ejemplo taller mecánico al buscar clínica de estética).
 */
export function isContaminatedBusiness(niche: string, businessName: string, primaryType?: string, types?: string[]): boolean {
  const normNiche = normalizeText(niche);
  const normName = normalizeText(businessName);
  const normType = normalizeText(primaryType || '');
  const normTypesJoined = normalizeText((types || []).join(' '));

  for (const [nicheKey, negativeWords] of Object.entries(NICHE_NEGATIVE_KEYWORDS)) {
    if (normNiche.includes(nicheKey)) {
      for (const badWord of negativeWords) {
        if (normName.includes(badWord) || normType.includes(badWord) || normTypesJoined.includes(badWord)) {
          return true;
        }
      }
    }
  }

  return false;
}
