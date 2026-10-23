import React, { useState } from 'react';
import { 
  Settings, 
  KeyRound, 
  Zap, 
  ShieldAlert, 
  CheckCircle2, 
  RotateCcw, 
  Eye, 
  EyeOff, 
  Save, 
  User, 
  Briefcase, 
  MessageSquare, 
  Download, 
  Upload, 
  Trash2, 
  AlertTriangle,
  Info,
  Clock,
  ExternalLink
} from 'lucide-react';
import { AppQuotaSettings, SellerProfile, BusinessLead } from '../../types';
import { testGooglePlacesConnection, GooglePlacesErrorDetails } from '../../services/googlePlacesClient';
import { isGeminiConfigured } from '../../services/geminiClient';
import { loadSearchLog, loadTrackedBusinesses } from '../../services/activityLog';

interface AjustesScreenProps {
  quotaSettings: AppQuotaSettings;
  sellerProfile: SellerProfile;
  leadsCount: number;
  onUpdateQuotaSettings: (updated: AppQuotaSettings) => void;
  onUpdateSellerProfile: (updated: SellerProfile) => void;
  onImportLeads?: (leads: BusinessLead[]) => void;
  allLeads?: BusinessLead[];
}

export const AjustesScreen: React.FC<AjustesScreenProps> = ({
  quotaSettings,
  sellerProfile,
  leadsCount,
  onUpdateQuotaSettings,
  onUpdateSellerProfile,
  onImportLeads,
  allLeads = [],
}) => {
  // Estados locales para formularios
  const [apiKey, setApiKey] = useState(quotaSettings.googleCloudApiKey || '');
  const [showKey, setShowKey] = useState(false);
  const [callsLimit, setCallsLimit] = useState(quotaSettings.monthlyPlacesCallsLimit || 1000);
  const [alertThreshold, setAlertThreshold] = useState(quotaSettings.alertThreshold || 800);
  const [callsCount, setCallsCount] = useState(quotaSettings.monthlyPlacesCallsCount || 0);

  // Perfil del vendedor
  const [sellerName, setSellerName] = useState(sellerProfile.name || '');
  const [company, setCompany] = useState(sellerProfile.companyOrAgency || '');
  const [valueProp, setValueProp] = useState(sellerProfile.valueProposition || '');
  const [defaultTone, setDefaultTone] = useState<'cercano' | 'profesional' | 'directo'>(
    sellerProfile.defaultTone || 'cercano'
  );

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [keyTestResult, setKeyTestResult] = useState<{ success: boolean; message: string; details?: GooglePlacesErrorDetails } | null>(null);

  const handleTestApiKey = async () => {
    if (!apiKey.trim()) return;
    setIsTestingKey(true);
    setKeyTestResult(null);
    try {
      const res = await testGooglePlacesConnection(apiKey.trim());
      setKeyTestResult(res);
    } finally {
      setIsTestingKey(false);
    }
  };

  // Cálculos de alerta
  const isNearLimit = callsCount >= alertThreshold;
  const isOverLimit = callsCount >= callsLimit;
  const quotaPercent = Math.min(100, Math.round((callsCount / callsLimit) * 100));

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();

    onUpdateQuotaSettings({
      ...quotaSettings,
      googleCloudApiKey: apiKey.trim(),
      monthlyPlacesCallsCount: callsCount,
      monthlyPlacesCallsLimit: callsLimit,
      alertThreshold: alertThreshold,
    });

    onUpdateSellerProfile({
      ...sellerProfile,
      name: sellerName.trim(),
      companyOrAgency: company.trim(),
      valueProposition: valueProp.trim(),
      defaultTone,
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Botones de prueba de cuota
  const handleSetTestCalls = (count: number) => {
    setCallsCount(count);
    onUpdateQuotaSettings({
      ...quotaSettings,
      monthlyPlacesCallsCount: count,
    });
  };

  const handleResetCount = () => {
    setCallsCount(0);
    onUpdateQuotaSettings({
      ...quotaSettings,
      monthlyPlacesCallsCount: 0,
    });
  };

  // Exportar backup
  const handleExportBackup = () => {
    const backupData = {
      exportedAt: new Date().toISOString(),
      leads: allLeads,
      quotaSettings,
      sellerProfile,
      activityLog: loadTrackedBusinesses(),
      searchLog: loadSearchLog(),
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `radar_backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5">
            <Settings className="w-3.5 h-3.5" />
            Módulo 5: Configuración
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
          Ajustes, Control de Cuota y Perfil Comercial
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Gestiona el límite de consumo de Places API, tus credenciales seguras y el perfil con el que Gemini redactará los borradores.
        </p>
      </div>

      {/* BANNER DE ALERTA VISUAL DESTACADA (SI SUPERA EL UMBRAL) */}
      {isNearLimit && (
        <div
          className={`rounded-xl p-5 border-2 shadow-2xl transition-all animate-in fade-in duration-200 ${
            isOverLimit
              ? 'bg-rose-950/40 border-rose-500 text-rose-100 shadow-rose-950/50'
              : 'bg-amber-950/40 border-amber-500 text-amber-100 shadow-amber-950/50'
          }`}
        >
          <div className="flex items-start gap-4">
            <div
              className={`p-3 rounded-xl shrink-0 ${
                isOverLimit
                  ? 'bg-rose-900/60 text-rose-300 border border-rose-600 animate-bounce'
                  : 'bg-amber-900/60 text-amber-300 border border-amber-600 animate-pulse'
              }`}
            >
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-2 flex-1">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-base font-extrabold tracking-tight">
                  {isOverLimit
                    ? '🚫 Límite mensual de peticiones alcanzado'
                    : `⚠️ Alerta de consumo: ${callsCount} peticiones utilizadas`}
                </h3>
                <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded-md bg-black/40 border border-white/10">
                  {callsCount} / {callsLimit} ({quotaPercent}%)
                </span>
              </div>

              <p className="text-xs sm:text-sm leading-relaxed opacity-95">
                {isOverLimit
                  ? `Has alcanzado el límite total de ${callsLimit} llamadas a Google Places API. Te recomendamos detener nuevas búsquedas masivas para evitar cargos en Google Cloud Platform o reiniciar el contador si comienza un nuevo ciclo de facturación.`
                  : `Has superado el umbral de aviso configurado (${alertThreshold} de ${callsLimit} llamadas de cortesía recomendadas). Te restan únicamente ${
                      callsLimit - callsCount
                    } llamadas antes de alcanzar el tope mensual.`}
              </p>

              <div className="flex items-center gap-3 pt-1 text-xs">
                <button
                  type="button"
                  onClick={handleResetCount}
                  className="px-3 py-1.5 rounded-lg bg-black/40 hover:bg-black/60 border border-white/20 font-semibold transition-colors cursor-pointer"
                >
                  Reiniciar contador del mes a 0
                </button>
                <span className="text-[11px] opacity-80">
                  Puedes modificar el umbral de aviso más abajo.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feedback de guardado exitoso */}
      {savedSuccess && (
        <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/50 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">Cambios guardados correctamente en tu navegador.</span>
        </div>
      )}

      <form onSubmit={handleSaveAll} className="space-y-6">
        {/* BLOQUE 1: MONITOR Y CONTROL DE CUOTA */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-100">
                  Monitor de Cuota y Límite de Alerta (Places API)
                </h2>
                <p className="text-xs text-slate-400">
                  Configura cuándo debe activarse la advertencia preventiva visual (por defecto a las 800 peticiones).
                </p>
              </div>
            </div>

            <span className="font-mono font-bold text-xs text-slate-300">
              {callsCount} / {callsLimit} peticiones
            </span>
          </div>

          {/* Barra visual de progreso */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Uso mensual actual:</span>
              <span className="font-mono font-bold text-slate-200">{quotaPercent}%</span>
            </div>
            <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  isOverLimit
                    ? 'bg-rose-500'
                    : isNearLimit
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${quotaPercent}%` }}
              />
            </div>
          </div>

          {/* Campos editables de umbral y límites */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Peticiones registradas este mes:
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  value={callsCount}
                  onChange={(e) => setCallsCount(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:border-emerald-500 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={handleResetCount}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors cursor-pointer shrink-0"
                  title="Reiniciar a 0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Umbral para Alerta Visual:
              </label>
              <input
                type="number"
                min="100"
                max={callsLimit}
                value={alertThreshold}
                onChange={(e) => setAlertThreshold(Math.max(1, parseInt(e.target.value) || 800))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-amber-300 focus:border-amber-500 focus:outline-hidden font-bold"
              />
              <span className="text-[10px] text-slate-400 block">
                Avisa cuando superes esta cantidad (ej. 800)
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Límite Máximo Mensual:
              </label>
              <input
                type="number"
                min="100"
                value={callsLimit}
                onChange={(e) => setCallsLimit(Math.max(1, parseInt(e.target.value) || 1000))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:border-emerald-500 focus:outline-hidden"
              />
              <span className="text-[10px] text-slate-400 block">
                Límite de cortesía o tope de seguridad (1.000)
              </span>
            </div>
          </div>

          {/* Atajos para probar la alerta visual */}
          <div className="pt-2 flex flex-wrap items-center gap-2 text-xs border-t border-slate-800/80">
            <span className="text-slate-400 text-[11px] font-medium mr-1">Probar comportamiento de la alerta:</span>
            <button
              type="button"
              onClick={() => handleSetTestCalls(820)}
              className="px-2.5 py-1 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold cursor-pointer"
            >
              Simular 820 llamadas (activar alerta)
            </button>
            <button
              type="button"
              onClick={() => handleSetTestCalls(1010)}
              className="px-2.5 py-1 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold cursor-pointer"
            >
              Simular 1.010 llamadas (límite superado)
            </button>
            <button
              type="button"
              onClick={() => handleSetTestCalls(14)}
              className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
            >
              Restablecer a 14 llamadas (normal)
            </button>
          </div>
        </div>

        {/* BLOQUE 2: CLAVES DE GOOGLE CLOUD */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-100">
                  Clave de Google Cloud (Places & PageSpeed)
                </h2>
                <p className="text-xs text-slate-400">
                  Tu clave se guarda exclusivamente en este navegador (localStorage) y nunca se envía a servidores de terceros.
                </p>
              </div>
            </div>

            <a
              href="https://console.cloud.google.com/google/maps-apis/credentials"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-colors"
            >
              <span>Abrir Google Cloud Console</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="space-y-1.5 max-w-2xl">
            <label className="text-xs font-semibold text-slate-300 block">
              Google Cloud API Key:
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs font-mono text-slate-100 focus:border-emerald-500 focus:outline-hidden pr-10"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                title={showKey ? 'Ocultar clave' : 'Mostrar clave'}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Si se deja vacío, la aplicación continuará funcionando en modo demostración inteligente para Medellín y Colombia.
            </p>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleTestApiKey}
                disabled={isTestingKey || !apiKey.trim()}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isTestingKey ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    <span>Verificando conexión en Google Cloud...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    <span>Probar conexión con Google Places API</span>
                  </>
                )}
              </button>
            </div>

            {keyTestResult && (
              <div
                className={`p-3.5 rounded-xl text-xs space-y-2 border animate-in fade-in ${
                  keyTestResult.success
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                    : 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {keyTestResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-2 flex-1">
                    <p className="font-semibold">{keyTestResult.message}</p>

                    {keyTestResult.details?.reason === 'API_KEY_SERVICE_BLOCKED' && (
                      <div className="p-2.5 rounded-lg bg-amber-950/60 border border-amber-500/30 text-[11px] text-amber-200/95 space-y-1">
                        <p className="font-bold text-amber-100">Cómo desbloquear la clave en 30 segundos:</p>
                        <ol className="list-decimal list-inside space-y-0.5 pl-0.5 text-amber-200/90">
                          <li>Abre el enlace de abajo hacia <strong>Credenciales</strong>.</li>
                          <li>Haz clic en tu Clave de API.</li>
                          <li>En <strong>«Restricciones de API»</strong>, selecciona <strong>«No restringir clave»</strong> (o agrega <em>«Places API (New)»</em>).</li>
                          <li>Guarda los cambios y pulsa nuevamente en <strong>«Probar conexión»</strong>.</li>
                        </ol>
                      </div>
                    )}

                    {keyTestResult.details?.enableUrl && (
                      <div className="pt-1">
                        <a
                          href={keyTestResult.details.enableUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold border border-amber-500/40 transition-colors"
                        >
                          <span>
                            {keyTestResult.details.reason === 'API_KEY_SERVICE_BLOCKED'
                              ? 'Abrir Credenciales en Google Cloud'
                              : 'Habilitar Places API (New) en Google Cloud Console'}
                          </span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* GUÍA PASO A PASO PARA OBTENER LA CLAVE GRATUITA */}
          <div className="mt-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <Info className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>¿Cómo obtener tu clave gratuita con $200 USD de crédito mensual?</span>
            </div>

            <ol className="text-xs text-slate-400 space-y-2 list-decimal list-inside pl-1 leading-relaxed">
              <li>
                <strong className="text-slate-200">Inicia sesión</strong> con tu cuenta de Google en{' '}
                <a
                  href="https://console.cloud.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 underline hover:text-emerald-300 inline-flex items-center gap-0.5"
                >
                  console.cloud.google.com <ExternalLink className="w-3 h-3" />
                </a>.
              </li>
              <li>
                <strong className="text-slate-200">Crea un proyecto nuevo</strong> (ejemplo: <em className="text-slate-300">"Radar Prospeccion Medellín"</em>).
              </li>
              <li>
                <strong className="text-slate-200">Habilita las APIs</strong> en el menú lateral <em>"APIs y servicios &gt; Biblioteca"</em>:
                <ul className="list-disc list-inside pl-4 mt-1 space-y-0.5 text-slate-300">
                  <li><span className="font-semibold text-emerald-300">Places API (New)</span> (para buscar negocios en Google Maps).</li>
                  <li><span className="font-semibold text-emerald-300">PageSpeed Insights API</span> (gratuita, para auditar velocidad web).</li>
                </ul>
              </li>
              <li>
                <strong className="text-slate-200">Crea tu credencial:</strong> Ve a <em>"APIs y servicios &gt; Credenciales"</em>, haz clic en <span className="text-emerald-400 font-semibold">+ Crear credenciales &gt; Clave de API</span>.
              </li>
              <li>
                <strong className="text-slate-200">(Recomendado) Restringe la clave:</strong> En los ajustes de la clave, limita su uso únicamente a las dos APIs anteriores.
              </li>
              <li>
                Copia la clave que empieza por <code className="bg-slate-900 px-1.5 py-0.5 rounded text-emerald-300 font-mono text-[11px]">AIzaSy...</code>, pégala en el campo de arriba y haz clic en <strong className="text-slate-200">"Guardar todos los ajustes"</strong>.
              </li>
            </ol>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span>Google Cloud otorga <strong>$200 USD gratuitos cada mes</strong> para uso de Google Maps Platform.</span>
              <span className="text-emerald-400 font-medium">100% configurable sin cargos imprevistos</span>
            </div>
          </div>
        </div>

        {/* BLOQUE 3: PERFIL DE VENDEDOR COMERCIAL */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Mi Perfil Comercial de Prospección
              </h2>
              <p className="text-xs text-slate-400">
                Gemini utiliza estos datos para personalizar automáticamente los guiones de llamada, mensajes de WhatsApp y correos electrónicos.
              </p>
            </div>
          </div>

          {isGeminiConfigured() ? (
            <div className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Gemini está activo: los análisis y borradores se generan con IA real, incluyendo lectura del sitio web del negocio cuando aplica.</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Gemini no está configurado (falta <code className="bg-slate-900 px-1 rounded">GEMINI_API_KEY</code> en tu archivo .env). Se están usando análisis y guiones simulados en su lugar.</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Tu nombre o el de la persona que contacta:
              </label>
              <input
                type="text"
                value={sellerName}
                onChange={(e) => setSellerName(e.target.value)}
                placeholder="Ej. Carlos Mendoza"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:border-emerald-500 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Nombre de tu agencia o estudio digital:
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Ej. Estudio Impulso Digital"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:border-emerald-500 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Tu propuesta de valor principal (gancho de venta):
              </label>
              <textarea
                rows={2}
                value={valueProp}
                onChange={(e) => setValueProp(e.target.value)}
                placeholder="Ej. Ayudamos a negocios locales de Medellín y Colombia a digitalizarse para no perder clientes los fines de semana y automatizar sus reservas y cotizaciones por WhatsApp..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-100 focus:border-emerald-500 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Tono predeterminado de redacción:
              </label>
              <select
                value={defaultTone}
                onChange={(e) => setDefaultTone(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:border-emerald-500 focus:outline-hidden capitalize"
              >
                <option value="cercano">Cercano (amable y conversacional)</option>
                <option value="profesional">Profesional (formal y corporativo)</option>
                <option value="directo">Directo (enfoque ágil orientado a números)</option>
              </select>
            </div>
          </div>
        </div>

        {/* BOTÓN PRINCIPAL DE GUARDAR */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/40 transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Guardar todos los ajustes</span>
          </button>
        </div>
      </form>

      {/* BLOQUE 4: COPIAS DE SEGURIDAD Y DATOS LOCALES */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <Download className="w-4 h-4 text-emerald-400" />
          Copia de Seguridad y Datos Locales
        </h3>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-950 border border-slate-800 rounded-lg p-4">
          <div>
            <span className="text-xs font-bold text-slate-200 block">
              Exportar copia de seguridad ({leadsCount} leads guardados)
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Descarga un archivo JSON completo con todas las fichas, notas, auditorías, historial de prospección y ajustes de la aplicación.
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportBackup}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold shrink-0 transition-colors cursor-pointer flex items-center gap-1.5 border border-slate-700"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Descargar JSON</span>
          </button>
        </div>
      </div>
    </div>
  );
};
