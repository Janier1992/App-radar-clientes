export type ScreenType = 'buscar' | 'ficha' | 'radar' | 'leads' | 'ajustes';

export interface WebsiteType {
  type: 'own' | 'directory_or_social' | 'none';
  platform?: string; // ej. Facebook, Instagram, Linktree, Páginas Amarillas
}

export type PipelineStatus = 
  | 'nuevo'
  | 'analizado'
  | 'contactado'
  | 'respondio'
  | 'reunion'
  | 'cliente'
  | 'descartado';

export interface PageSpeedAudit {
  performance: number; // 0 - 100
  seo: number;
  accessibility: number;
  bestPractices: number;
  screenshotBase64?: string;
  analyzedAt: string;
}

export interface WebChecklist {
  hasHttps: boolean;
  mobileResponsive: boolean;
  whatsappButton: boolean;
  onlineBooking: boolean;
  contactForm: boolean;
  outdatedSignals: string[];
}

export interface GeminiAnalysis {
  summary: string; // 2 frases a qué se dedica
  checklist: WebChecklist;
  contactsFound: {
    emails: string[];
    socialLinks: string[];
  };
  plainProblems: string[]; // 3-5 problemas cotidianos
  recommendedService: 'web_nueva' | 'agente_whatsapp' | 'sistema_citas';
  recommendedServiceRationale: string;
}

export interface ProspectingDrafts {
  phoneScript: string; // 30 segundos
  whatsappMessage: string;
  emailSubject: string;
  emailBody: string;
  tone: 'cercano' | 'profesional' | 'directo';
  generatedAt: string;
}

export interface BusinessLead {
  id: string;
  name: string;
  primaryTypeDisplayName?: string;
  types?: string[];
  formattedAddress: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  websiteClassification: WebsiteType;
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  businessStatus?: string;
  
  // Score de oportunidad 0 a 100
  opportunityScore: number;
  scoreBreakdown: {
    label: string;
    points: number;
    type: 'positive' | 'negative' | 'neutral';
  }[];
  isPreliminaryScore: boolean;

  // Embudo y CRM local
  pipelineStatus: PipelineStatus;
  notes?: string;
  nextActionDate?: string;
  savedAt?: string;
  updatedAt?: string;

  // Auditorías completas
  auditData?: PageSpeedAudit;
  analysis?: GeminiAnalysis;
  drafts?: ProspectingDrafts;
}

export interface SellerProfile {
  name: string;
  companyOrAgency: string;
  servicesOffered: string[];
  valueProposition: string;
  defaultTone: 'cercano' | 'profesional' | 'directo';
}

export interface AppQuotaSettings {
  googleCloudApiKey: string;
  monthlyPlacesCallsCount: number;
  monthlyPlacesCallsLimit: number;
  alertThreshold: number; // Por defecto 800 para alertar antes del límite
  lastResetMonth: string; // YYYY-MM
}

export interface SearchFilters {
  onlyWithoutWebsite: boolean;
  onlyWithPhone: boolean;
  minRating: number;
  minReviews: number;
  hideClosed: boolean;
}

export interface SearchErrorState {
  title: string;
  message: string;
  technicalDetails?: string;
  isApiKeyIssue?: boolean;
  isQuotaIssue?: boolean;
}

export const PREDEFINED_NICHES = [
  'talleres mecánicos',
  'clínicas dentales',
  'fisioterapeutas',
  'peluquerías',
  'centros de estética',
  'restaurantes',
  'gimnasios',
  'academias',
  'inmobiliarias',
  'reformas',
  'veterinarios',
  'autoescuelas',
  'ópticas',
  'gestorías',
] as const;

export type PredefinedNiche = typeof PREDEFINED_NICHES[number];

export interface NicheStat {
  category: string;
  totalFound: number;
  percentWithoutOwnWeb: number; // e.g. 65 (%)
  avgRating: number; // e.g. 4.4
  avgReviews: number; // e.g. 38
  opportunityScore: number; // 0 - 100
  opportunityRank: number; // 1, 2, 3...
  recommendedService: string; // e.g. "Agente de IA por WhatsApp"
  serviceRationale: string;
  opportunityRationale: string;
}

export interface RadarAnalysisResponse {
  zone: string;
  categories: NicheStat[];
  topRecommendations: {
    category: string;
    whyTop: string;
    serviceToSell: string;
  }[];
  executiveSummary: string;
  analyzedAt: string;
}

export interface FavoriteSearch {
  id: string;
  zone: string;
  niche: string;
  savedAt: string;
}
