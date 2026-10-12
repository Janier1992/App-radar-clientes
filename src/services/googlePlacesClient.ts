import { BusinessLead } from '../types';
import { classifyWebsite, calculatePreliminaryScore } from './opportunityScore';
import { getIncludedPrimaryTypes, isContaminatedBusiness } from './nicheClassifier';

export interface GooglePlaceResult {
  id: string;
  displayName?: { text: string; languageCode?: string };
  primaryTypeDisplayName?: { text: string };
  primaryType?: string;
  types?: string[];
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  businessStatus?: string;
  location?: { latitude: number; longitude: number };
}

export interface GooglePlacesErrorDetails {
  code: number;
  status: string;
  message: string;
  reason?: 'SERVICE_DISABLED' | 'API_KEY_SERVICE_BLOCKED' | 'API_KEY_INVALID' | 'PERMISSION_DENIED' | 'OTHER';
  projectId?: string;
  enableUrl?: string;
  friendlyMessage: string;
}

export class GooglePlacesApiException extends Error {
  details: GooglePlacesErrorDetails;
  constructor(message: string, details: GooglePlacesErrorDetails) {
    super(message);
    this.name = 'GooglePlacesApiException';
    this.details = details;
  }
}

export function parsePlacesApiError(status: number, errorText: string): GooglePlacesErrorDetails {
  let code = status;
  let statusText = 'ERROR';
  let message = errorText;
  let reason: GooglePlacesErrorDetails['reason'] = 'OTHER';
  let projectId: string | undefined;

  try {
    const json = JSON.parse(errorText);
    if (json.error) {
      code = json.error.code || status;
      statusText = json.error.status || 'ERROR';
      message = json.error.message || errorText;
      const firstDetail = json.error.details?.[0];
      if (firstDetail?.reason) {
        reason = firstDetail.reason;
      }
      if (firstDetail?.metadata?.consumer) {
        projectId = firstDetail.metadata.consumer.replace('projects/', '');
      }
    }
  } catch {
    // Texto plano
  }

  if (!projectId) {
    const match = message.match(/project\s+([0-9a-zA-Z_-]+)/i);
    if (match) {
      projectId = match[1];
    }
  }

  if (message.includes('API_KEY_SERVICE_BLOCKED') || reason === 'API_KEY_SERVICE_BLOCKED') {
    reason = 'API_KEY_SERVICE_BLOCKED';
  } else if (
    message.includes('SERVICE_DISABLED') ||
    reason === 'SERVICE_DISABLED' ||
    message.includes('has not been used in project')
  ) {
    reason = 'SERVICE_DISABLED';
  } else if (code === 400 && message.toLowerCase().includes('api key not valid')) {
    reason = 'API_KEY_INVALID';
  } else if (code === 403) {
    reason = 'PERMISSION_DENIED';
  }

  let enableUrl = projectId
    ? `https://console.developers.google.com/apis/api/places.googleapis.com/overview?project=${projectId}`
    : 'https://console.cloud.google.com/apis/library/places.googleapis.com';

  let friendlyMessage = '';
  if (reason === 'SERVICE_DISABLED') {
    friendlyMessage = `La API 'Places API (New)' aún no está activada en tu proyecto de Google Cloud (${
      projectId ? `ID: ${projectId}` : 'de tu clave'
    }). Puedes activarla en 1 clic en la consola de Google Developers. Si la activaste hace unos segundos, Google Cloud tarda 1-3 minutos en propagar los permisos.`;
  } else if (reason === 'API_KEY_SERVICE_BLOCKED') {
    friendlyMessage = `¡Ya activaste la API! Sin embargo, tu clave de API tiene 'Restricciones de API' activadas que bloquean 'Places API (New)'. Para solucionarlo: en Credenciales > haz clic en tu clave > en 'Restricciones de API' elige 'No restringir clave' (o añade 'Places API (New)') y guarda los cambios.`;
    enableUrl = projectId
      ? `https://console.cloud.google.com/apis/credentials?project=${projectId}`
      : 'https://console.cloud.google.com/apis/credentials';
  } else if (reason === 'API_KEY_INVALID') {
    friendlyMessage = 'La clave de API proporcionada no es válida. Revisa que esté copiada completa desde Google Cloud Console.';
  } else {
    friendlyMessage = `Google Places API devolvió estado ${code} (${statusText}). Verifica las cuotas y permisos de tu proyecto.`;
  }

  return {
    code,
    status: statusText,
    message,
    reason,
    projectId,
    enableUrl,
    friendlyMessage,
  };
}

/**
 * Prueba la conectividad y activación de Places API (New) con una clave dada
 */
export async function testGooglePlacesConnection(
  apiKey: string
): Promise<{ success: boolean; message: string; details?: GooglePlacesErrorDetails }> {
  if (!apiKey || !apiKey.trim()) {
    return { success: false, message: 'Ingresa una clave de API para verificar.' };
  }

  try {
    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey.trim(),
        'X-Goog-FieldMask': 'places.id,places.displayName',
      },
      body: JSON.stringify({
        textQuery: 'restaurante Medellín',
        maxResultCount: 1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      const details = parsePlacesApiError(response.status, errorText);
      console.warn('Prueba de Google Places API:', details.reason, details.friendlyMessage);
      return { success: false, message: details.friendlyMessage, details };
    }

    return {
      success: true,
      message: '¡Conexión verificada con éxito! La API "Places API (New)" está activa y responde correctamente con tu clave.',
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Error de red o conexión al verificar la clave de Google Cloud.',
    };
  }
}

/**
 * Realiza una búsqueda directa de alta precisión a Google Places API (New) mediante el endpoint searchText
 * https://places.googleapis.com/v1/places:searchText
 */
export async function searchGooglePlaces(
  zone: string,
  niche: string,
  apiKey: string
): Promise<BusinessLead[]> {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('No se ha proporcionado una API Key de Google Cloud.');
  }

  // 1. Mejorar el textQuery con desambiguación semántica precisa
  const textQuery = `${niche.trim()} en ${zone.trim()}, Colombia`;

  // 2. Intentar asignar tipos oficiales si coinciden con las categorías admitidas por Google Places
  const includedPrimaryTypes = getIncludedPrimaryTypes(niche);

  // 3. Fields según la especificación de Places API (New)
  const fieldMask = [
    'places.id',
    'places.displayName',
    'places.primaryTypeDisplayName',
    'places.primaryType',
    'places.types',
    'places.formattedAddress',
    'places.nationalPhoneNumber',
    'places.websiteUri',
    'places.rating',
    'places.userRatingCount',
    'places.googleMapsUri',
    'places.businessStatus',
    'places.location',
  ].join(',');

  const requestPayload: any = {
    textQuery,
    languageCode: 'es',
    regionCode: 'CO',
    maxResultCount: 20,
  };

  // Si encontramos tipos específicos de Google Places, filtramos para máxima precisión
  if (includedPrimaryTypes && includedPrimaryTypes.length > 0) {
    requestPayload.includedType = includedPrimaryTypes[0];
  }

  let response = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey.trim(),
      'X-Goog-FieldMask': fieldMask,
    },
    body: JSON.stringify(requestPayload),
  });

  // Solo si la API devuelve 400 Bad Request por incompatibilidad de includedType con searchText,
  // reintentamos inmediatamente sin includedType
  if (!response.ok && response.status === 400 && includedPrimaryTypes) {
    console.warn('Reintentando sin includedType para garantizar compatibilidad...');
    delete requestPayload.includedType;
    response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey.trim(),
        'X-Goog-FieldMask': fieldMask,
      },
      body: JSON.stringify(requestPayload),
    });
  }

  if (!response.ok) {
    const errorBody = await response.text();
    const details = parsePlacesApiError(response.status, errorBody);
    console.warn('Aviso en Places API:', response.status, details.reason, details.friendlyMessage);
    throw new GooglePlacesApiException(details.friendlyMessage, details);
  }

  const data = await response.json();
  const rawPlaces: GooglePlaceResult[] = data.places || [];

  // Filtrar negocios contaminados (por ejemplo si Google devolvió talleres mecánicos al buscar clínicas de estética)
  const cleanPlaces = rawPlaces.filter((p) => {
    const name = p.displayName?.text || '';
    const primaryType = p.primaryTypeDisplayName?.text || p.primaryType || '';
    const isBad = isContaminatedBusiness(niche, name, primaryType, p.types);
    return !isBad;
  });

  return cleanPlaces.map((p) => {
    const websiteClassification = classifyWebsite(p.websiteUri);
    const scoreResult = calculatePreliminaryScore({
      websiteType: websiteClassification,
      rating: p.rating,
      userRatingCount: p.userRatingCount,
      hasPhone: Boolean(p.nationalPhoneNumber),
    });

    const lead: BusinessLead = {
      id: p.id,
      name: p.displayName?.text || 'Negocio sin nombre',
      primaryTypeDisplayName: p.primaryTypeDisplayName?.text || niche,
      types: p.types,
      formattedAddress: p.formattedAddress || `${zone}, Colombia`,
      nationalPhoneNumber: p.nationalPhoneNumber,
      websiteUri: p.websiteUri,
      websiteClassification,
      rating: p.rating,
      userRatingCount: p.userRatingCount,
      googleMapsUri:
        p.googleMapsUri ||
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          p.displayName?.text || niche
        )}+${encodeURIComponent(zone)}`,
      businessStatus: p.businessStatus || 'OPERATIONAL',
      opportunityScore: scoreResult.score,
      scoreBreakdown: scoreResult.breakdown,
      isPreliminaryScore: true,
      pipelineStatus: 'nuevo',
      savedAt: new Date().toISOString(),
    };

    return lead;
  });
}
