import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Globe, 
  ExternalLink, 
  Star, 
  BookmarkCheck, 
  Bookmark, 
  Printer, 
  ArrowLeft, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Calendar, 
  Copy, 
  Check, 
  RotateCw, 
  MessageSquare, 
  Mail, 
  PhoneCall, 
  ShieldAlert, 
  Zap, 
  Layers, 
  Share2, 
  Info,
  HelpCircle
} from 'lucide-react';
import { 
  BusinessLead, 
  SellerProfile, 
  PipelineStatus, 
  PageSpeedAudit, 
  GeminiAnalysis, 
  ProspectingDrafts 
} from '../../types';
import { runBusinessAnalysis, generateDrafts } from '../../services/analyzer';
import { buildWhatsAppDirectUrl } from '../../services/phoneUtils';

interface FichaNegocioProps {
  lead: BusinessLead;
  sellerProfile: SellerProfile;
  isSaved: boolean;
  onSaveLead: (lead: BusinessLead) => void;
  onUpdateLead: (updated: BusinessLead) => void;
  onBack: () => void;
  googleCloudApiKey?: string;
}

export const FichaNegocio: React.FC<FichaNegocioProps> = ({
  lead,
  sellerProfile,
  isSaved,
  onSaveLead,
  onUpdateLead,
  onBack,
  googleCloudApiKey,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedTone, setSelectedTone] = useState<'cercano' | 'profesional' | 'directo'>(
    lead.drafts?.tone || sellerProfile.defaultTone || 'cercano'
  );
  const [activeTabDraft, setActiveTabDraft] = useState<'phone' | 'whatsapp' | 'email'>('whatsapp');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [notes, setNotes] = useState(lead.notes || '');
  const [nextActionDate, setNextActionDate] = useState(lead.nextActionDate || '');
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus>(lead.pipelineStatus || 'nuevo');
  const [showScoreModal, setShowScoreModal] = useState(false);

  // Comprobar presencia web
  const hasOwnWebsite = lead.websiteClassification.type === 'own' && Boolean(lead.websiteUri);
  const isSocialWebsite = lead.websiteClassification.type === 'directory_or_social';

  // URLs directas de WhatsApp
  const whatsAppDirectDraftUrl = buildWhatsAppDirectUrl(
    lead.nationalPhoneNumber,
    lead.drafts?.whatsappMessage
  );
  const whatsAppGeneralUrl = buildWhatsAppDirectUrl(
    lead.nationalPhoneNumber,
    `Hola, me comunico con ${lead.name}. Estuve revisando su ficha en Google y me gustaría hacerles una consulta.`
  );

  // Manejo de ejecución del análisis
  const handleStartAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const result = await runBusinessAnalysis(
        lead,
        sellerProfile,
        selectedTone,
        googleCloudApiKey
      );

      const updatedLead: BusinessLead = {
        ...lead,
        auditData: result.auditData,
        analysis: result.analysis,
        drafts: result.drafts,
        opportunityScore: result.opportunityScore,
        scoreBreakdown: result.scoreBreakdown,
        isPreliminaryScore: false,
        pipelineStatus: lead.pipelineStatus === 'nuevo' ? 'analizado' : lead.pipelineStatus,
        updatedAt: new Date().toISOString(),
      };

      onUpdateLead(updatedLead);
      setPipelineStatus(updatedLead.pipelineStatus);
    } catch (err) {
      console.warn('Aviso al analizar negocio:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Regenerar borradores con otro tono
  const handleRegenerateDrafts = (newTone: 'cercano' | 'profesional' | 'directo') => {
    setSelectedTone(newTone);
    if (!lead.analysis) return;

    const newDrafts = generateDrafts(lead, sellerProfile, lead.analysis, newTone);
    const updatedLead: BusinessLead = {
      ...lead,
      drafts: newDrafts,
      updatedAt: new Date().toISOString(),
    };
    onUpdateLead(updatedLead);
  };

  // Copiar al portapapeles
  const handleCopyText = (text: string, identifier: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(identifier);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Guardar notas y fecha de próxima acción
  const handleSaveCrmDetails = () => {
    const updatedLead: BusinessLead = {
      ...lead,
      notes,
      nextActionDate,
      pipelineStatus,
      updatedAt: new Date().toISOString(),
    };
    onUpdateLead(updatedLead);
  };

  // Color de puntuación de PageSpeed
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (score >= 50) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
  };

  const getScoreProgressColor = (score: number) => {
    if (score >= 90) return 'bg-emerald-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  // Color para la puntuación de oportunidad (0 a 100)
  const getOpportunityBadge = (score: number) => {
    if (score >= 70) {
      return {
        badge: 'Oportunidad Alta',
        bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
        dot: 'bg-emerald-400',
      };
    }
    if (score >= 45) {
      return {
        badge: 'Oportunidad Media',
        bg: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
        dot: 'bg-amber-400',
      };
    }
    return {
      badge: 'Baja Oportunidad',
      bg: 'bg-slate-700/50 text-slate-300 border-slate-600',
      dot: 'bg-slate-400',
    };
  };

  const opportunityMeta = getOpportunityBadge(lead.opportunityScore);

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Barra superior de navegación y acciones */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-slate-800 print:hidden">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a resultados
        </button>

        <div className="flex items-center gap-2">
          {/* Botón Guardar en Leads */}
          <button
            type="button"
            onClick={() => onSaveLead(lead)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
              isSaved
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
                : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
            }`}
          >
            {isSaved ? (
              <>
                <BookmarkCheck className="w-4 h-4 text-emerald-400" />
                Guardado en mis leads
              </>
            ) : (
              <>
                <Bookmark className="w-4 h-4" />
                Guardar en mis leads
              </>
            )}
          </button>

          {/* Botón Exportar Ficha / Imprimir */}
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
            title="Exportar ficha completa o imprimir en PDF"
          >
            <Printer className="w-4 h-4 text-slate-300" />
            Exportar ficha (PDF)
          </button>
        </div>
      </div>

      {/* Cabecera Principal del Negocio */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3 flex-1 min-w-0">
            {/* Categoría y estado */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-slate-800 text-emerald-400 border border-slate-700">
                {lead.primaryTypeDisplayName || 'Negocio local'}
              </span>

              {lead.businessStatus && (
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700 font-mono">
                  {lead.businessStatus === 'OPERATIONAL' ? 'Abierto y activo' : lead.businessStatus}
                </span>
              )}

              {/* Distintivo de web */}
              {hasOwnWebsite ? (
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-semibold">
                  <Globe className="w-3 h-3" />
                  Web propia
                </span>
              ) : isSocialWebsite ? (
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1 font-semibold">
                  <Globe className="w-3 h-3" />
                  Solo {lead.websiteClassification.platform || 'Red social / Directorio'}
                </span>
              ) : (
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-rose-500/10 text-rose-300 border border-rose-500/30 flex items-center gap-1 font-semibold">
                  <XCircle className="w-3 h-3" />
                  Sin página web
                </span>
              )}
            </div>

            {/* Nombre del negocio */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
              {lead.name}
            </h1>

            {/* Dirección y valoraciones */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-xs sm:text-sm text-slate-300">
              <span className="flex items-center gap-1.5 text-slate-300">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                {lead.formattedAddress}
              </span>

              {lead.rating !== undefined && (
                <div className="flex items-center gap-1.5 pl-0 sm:pl-3 sm:border-l border-slate-800">
                  <div className="flex items-center text-amber-400">
                    <Star className="w-4 h-4 fill-amber-400" />
                  </div>
                  <span className="font-bold text-slate-100 font-mono">{lead.rating.toFixed(1)}</span>
                  <span className="text-slate-400">({lead.userRatingCount || 0} reseñas)</span>
                </div>
              )}
            </div>

            {/* Botones de acción directa: Llamar, Web, Google Maps */}
            <div className="pt-2 flex flex-wrap items-center gap-2.5">
              {lead.nationalPhoneNumber ? (
                <>
                  <a
                    href={`tel:${lead.nationalPhoneNumber.replace(/\s+/g, '')}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-950/40 transition-colors cursor-pointer"
                  >
                    <PhoneCall className="w-4 h-4" />
                    Llamar: {lead.nationalPhoneNumber}
                  </a>

                  {whatsAppGeneralUrl && (
                    <a
                      href={whatsAppGeneralUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-semibold shadow-md transition-colors cursor-pointer"
                      title="Abrir chat en WhatsApp"
                    >
                      <MessageSquare className="w-4 h-4 text-emerald-400" />
                      Abrir WhatsApp
                    </a>
                  )}
                </>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs font-medium border border-slate-700/60">
                  <Phone className="w-3.5 h-3.5" />
                  Sin teléfono registrado
                </span>
              )}

              {lead.websiteUri ? (
                <a
                  href={lead.websiteUri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Globe className="w-4 h-4 text-slate-400" />
                  Abrir enlace web
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800/60 text-slate-400 text-xs font-medium border border-slate-700/60">
                  <Globe className="w-3.5 h-3.5" />
                  No dispone de enlace web
                </span>
              )}

              {lead.googleMapsUri && (
                <a
                  href={lead.googleMapsUri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  Ver en Google Maps
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              )}
            </div>
          </div>

          {/* Oportunidad Comercial Gauge Badge */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 sm:w-56 shrink-0 flex flex-col items-center text-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Puntuación de Oportunidad
            </span>

            <div className="my-2 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-slate-100 font-mono">
                {lead.opportunityScore}
              </span>
              <span className="text-sm font-semibold text-slate-400">/100</span>
            </div>

            <div className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${opportunityMeta.bg}`}>
              <span className={`w-2 h-2 rounded-full ${opportunityMeta.dot}`} />
              {opportunityMeta.badge}
            </div>

            <button
              type="button"
              onClick={() => setShowScoreModal(!showScoreModal)}
              className="mt-3 text-[11px] text-emerald-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
            >
              <Info className="w-3 h-3" />
              {showScoreModal ? 'Ocultar desglose' : 'Ver por qué tiene esta nota'}
            </button>
          </div>
        </div>

        {/* Desglose de puntuación si está expandido */}
        {showScoreModal && (
          <div className="mt-5 pt-4 border-t border-slate-800 animate-in fade-in duration-150">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Desglose detallado de la puntuación (0 a 100)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {lead.scoreBreakdown.map((item, index) => (
                <div
                  key={index}
                  className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5 flex items-center justify-between"
                >
                  <span className="text-slate-300">{item.label}</span>
                  <span
                    className={`font-mono font-bold px-1.5 py-0.5 rounded-sm ${
                      item.type === 'positive'
                        ? 'text-emerald-400 bg-emerald-500/10'
                        : item.type === 'negative'
                        ? 'text-rose-400 bg-rose-500/10'
                        : 'text-slate-400 bg-slate-800'
                    }`}
                  >
                    {item.points > 0 ? `+${item.points}` : item.points}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SECCIÓN 1: Auditoría Web (PageSpeed Insights v5) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Auditoría Técnica y Velocidad en Móvil (PageSpeed Insights v5)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Evalúa métricas clave de Google Lighthouse en dispositivos móviles para justificar la necesidad de renovación web.
            </p>
          </div>

          {/* Botón de Analizar */}
          <div>
            <button
              type="button"
              disabled={isAnalyzing}
              onClick={handleStartAnalysis}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-emerald-950/40 cursor-pointer"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Analizando web (10-30 seg)...</span>
                </>
              ) : (
                <>
                  <RotateCw className="w-4 h-4" />
                  <span>{lead.auditData || lead.analysis ? 'Volver a analizar' : 'Analizar web ahora'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Caso A: Negocio sin web o solo red social */}
        {!hasOwnWebsite && (
          <div className="bg-amber-950/20 border border-amber-800/40 rounded-xl p-4 sm:p-5 flex items-start gap-3.5">
            <div className="p-2 rounded-lg bg-amber-900/40 text-amber-400 shrink-0">
              <Info className="w-5 h-5" />
            </div>
            <div className="text-xs sm:text-sm">
              <h4 className="font-bold text-amber-200">
                Oportunidad directa detectada: Negocio sin web propia
              </h4>
              <p className="text-amber-300/80 mt-1 leading-relaxed text-xs">
                Este negocio no cuenta con página web propia registrada (solo dispone de {isSocialWebsite ? lead.websiteClassification.platform || 'perfil social' : 'su ficha de Google Maps'}). No requiere llamadas a PageSpeed porque la propuesta comercial principal es evidente: **desarrollo de una web profesional de captura con botón de WhatsApp y sistema de reservas**.
              </p>
            </div>
          </div>
        )}

        {/* Caso B: Tiene web propia y ya tiene datos de PageSpeed */}
        {hasOwnWebsite && lead.auditData && (
          <div className="space-y-6 pt-2">
            {/* 4 Notas de PageSpeed */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Rendimiento', value: lead.auditData.performance, desc: 'Velocidad de carga móvil' },
                { label: 'SEO', value: lead.auditData.seo, desc: 'Posicionamiento Google' },
                { label: 'Accesibilidad', value: lead.auditData.accessibility, desc: 'Navegación usable' },
                { label: 'Buenas Prácticas', value: lead.auditData.bestPractices, desc: 'Seguridad y estándares' },
              ].map((metric) => (
                <div
                  key={metric.label}
                  className={`rounded-xl border p-3.5 text-center transition-all ${getScoreColor(
                    metric.value
                  )}`}
                >
                  <span className="text-[11px] font-semibold uppercase tracking-wider block text-slate-300">
                    {metric.label}
                  </span>
                  <div className="my-1.5 text-3xl font-extrabold font-mono">
                    {metric.value}
                  </div>
                  <div className="w-full h-1.5 bg-slate-800/80 rounded-full overflow-hidden my-1">
                    <div
                      className={`h-full ${getScoreProgressColor(metric.value)}`}
                      style={{ width: `${metric.value}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {metric.desc}
                  </span>
                </div>
              ))}
            </div>

            {/* Captura de pantalla móvil */}
            {lead.auditData.screenshotBase64 && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center gap-5">
                <div className="w-40 sm:w-48 shrink-0 rounded-lg overflow-hidden border border-slate-700 shadow-md">
                  <img
                    src={lead.auditData.screenshotBase64}
                    alt={`Captura web de ${lead.name}`}
                    className="w-full h-auto object-cover"
                  />
                </div>
                <div className="text-xs space-y-2 flex-1">
                  <h4 className="font-bold text-slate-200 text-sm">
                    Captura real obtenida por Google Lighthouse (móvil)
                  </h4>
                  <p className="text-slate-400 leading-relaxed">
                    Esta es la vista exacta que Google carga al auditar el sitio móvil de {lead.name}. Úsala como evidencia visual durante tu contacto para demostrar tiempos de carga o fallos visuales evidentes.
                  </p>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Fecha de auditoría: {new Date(lead.auditData.analyzedAt).toLocaleDateString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Si tiene web pero todavía no se ha analizado */}
        {hasOwnWebsite && !lead.auditData && !isAnalyzing && (
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-6 text-center text-slate-400 space-y-2">
            <Zap className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs sm:text-sm text-slate-300 font-medium">
              Web detectada: <span className="font-mono text-emerald-400">{lead.websiteUri}</span>
            </p>
            <p className="text-xs max-w-md mx-auto text-slate-400">
              Pulsa el botón «Analizar web ahora» para medir velocidad en móvil, capturar la pantalla y generar la auditoría de problemas con Gemini.
            </p>
          </div>
        )}
      </div>

      {/* SECCIÓN 2: Diagnóstico Profundo con Gemini */}
      {lead.analysis && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 shadow-xl space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100">
                Diagnóstico de Actividad y Oportunidades (Gemini)
              </h2>
              <p className="text-xs text-slate-400">
                Lectura comprensiva de la web y detección de cuellos de botella en la captación de clientes.
              </p>
            </div>
          </div>

          {/* Resumen a qué se dedica en 2 frases */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
              ¿A qué se dedica exactamente este negocio?
            </span>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
              {lead.analysis.summary}
            </p>
          </div>

          {/* Checklist Técnica */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Lista de comprobación técnica
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
              {[
                { label: 'Seguridad HTTPS activa', ok: lead.analysis.checklist.hasHttps },
                { label: 'Diseño adaptado a móvil (Responsive)', ok: lead.analysis.checklist.mobileResponsive },
                { label: 'Botón directo de WhatsApp', ok: lead.analysis.checklist.whatsappButton },
                { label: 'Sistema de citas o reservas online', ok: lead.analysis.checklist.onlineBooking },
                { label: 'Formulario de contacto funcional', ok: lead.analysis.checklist.contactForm },
              ].map((item, index) => (
                <div
                  key={index}
                  className="bg-slate-950/60 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between"
                >
                  <span className="text-slate-300">{item.label}</span>
                  {item.ok ? (
                    <span className="flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Sí
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-rose-400 font-semibold text-[11px]">
                      <XCircle className="w-3.5 h-3.5" /> No detectado
                    </span>
                  )}
                </div>
              ))}

              {/* Señales de web desactualizada */}
              {lead.analysis.checklist.outdatedSignals.length > 0 && (
                <div className="sm:col-span-2 lg:col-span-3 bg-amber-950/20 border border-amber-800/40 rounded-lg p-3 text-xs text-amber-200">
                  <span className="font-bold flex items-center gap-1.5 mb-1 text-amber-300">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Señales de desactualización u obsolescencia:
                  </span>
                  <ul className="list-disc list-inside space-y-0.5 text-amber-200/90 text-[11px]">
                    {lead.analysis.checklist.outdatedSignals.map((signal, idx) => (
                      <li key={idx}>{signal}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Problemas en lenguaje llano */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              Problemas cotidianos para explicar al dueño (sin tecnicismos)
            </h3>
            <div className="space-y-2">
              {lead.analysis.plainProblems.map((prob, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 text-xs text-slate-300 flex items-start gap-2.5"
                >
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 font-mono font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="leading-relaxed flex-1">{prob}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Servicio recomendado a vender */}
          <div className="bg-emerald-950/30 border border-emerald-800/50 rounded-xl p-4 text-xs sm:text-sm">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                Servicio ideal a ofrecer en tu propuesta:
              </span>
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 text-xs uppercase">
                {lead.analysis.recommendedService === 'agente_whatsapp'
                  ? 'Agente de IA para WhatsApp'
                  : lead.analysis.recommendedService === 'sistema_citas'
                  ? 'Sistema de Citas y Reservas Online'
                  : 'Página Web Nueva de Alta Conversión'}
              </span>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">
              <strong className="text-emerald-300">Por qué:</strong> {lead.analysis.recommendedServiceRationale}
            </p>
          </div>
        </div>
      )}

      {/* SECCIÓN 3: Primer Contacto y Borradores de Venta */}
      {lead.drafts && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-400" />
                Borradores Personalizados de Primer Contacto
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Redactados a partir de los fallos detectados y tu perfil de vendedor ({sellerProfile.name}).
              </p>
            </div>

            {/* Selector de tono */}
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg p-1">
              {(['cercano', 'profesional', 'directo'] as const).map((tone) => (
                <button
                  key={tone}
                  type="button"
                  onClick={() => handleRegenerateDrafts(tone)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold capitalize transition-colors cursor-pointer ${
                    selectedTone === tone
                      ? 'bg-slate-800 text-emerald-400 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tone}
                </button>
              ))}
            </div>
          </div>

          {/* Aviso ético obligatorio */}
          <div className="bg-slate-950/90 border border-slate-800/90 rounded-lg p-3 flex items-start gap-2.5 text-xs text-slate-400">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="leading-snug">
              <strong className="text-slate-300">Aviso importante:</strong> Borradores para contactar de forma personal. No envíes mensajes comerciales masivos sin consentimiento.
            </p>
          </div>

          {/* Pestañas de canal: WhatsApp / Teléfono / Email */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            {[
              { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
              { id: 'phone', label: 'Guion llamada (30s)', icon: PhoneCall },
              { id: 'email', label: 'Correo electrónico', icon: Mail },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTabDraft === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTabDraft(tab.id as any)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Contenido del borrador activo */}
          <div className="space-y-3">
            {activeTabDraft === 'whatsapp' && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2 text-xs text-slate-400">
                  <span className="font-semibold text-slate-300">Mensaje directo para WhatsApp</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyText(lead.drafts!.whatsappMessage, 'whatsapp')}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-semibold cursor-pointer transition-colors"
                    >
                      {copiedField === 'whatsapp' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedField === 'whatsapp' ? 'Copiado' : 'Copiar mensaje'}
                    </button>

                    {whatsAppDirectDraftUrl && (
                      <a
                        href={whatsAppDirectDraftUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-md shadow-emerald-950/40 transition-colors cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Enviar por WhatsApp
                        <ExternalLink className="w-3 h-3 text-emerald-200" />
                      </a>
                    )}
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 whitespace-pre-line leading-relaxed font-sans bg-slate-900/60 p-3.5 rounded-lg border border-slate-800/80">
                  {lead.drafts.whatsappMessage}
                </p>
              </div>
            )}

            {activeTabDraft === 'phone' && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-slate-300">Guion de llamada telefónica (duración estimada: 30 segundos)</span>
                  <button
                    type="button"
                    onClick={() => handleCopyText(lead.drafts!.phoneScript, 'phone')}
                    className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
                  >
                    {copiedField === 'phone' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedField === 'phone' ? 'Copiado al portapapeles' : 'Copiar guion'}
                  </button>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 whitespace-pre-line leading-relaxed italic bg-slate-900/60 p-3.5 rounded-lg border border-slate-800/80">
                  {lead.drafts.phoneScript}
                </p>
              </div>
            )}

            {activeTabDraft === 'email' && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-slate-300">Borrador de correo electrónico</span>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopyText(
                        `Asunto: ${lead.drafts!.emailSubject}\n\n${lead.drafts!.emailBody}`,
                        'email'
                      )
                    }
                    className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
                  >
                    {copiedField === 'email' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedField === 'email' ? 'Copiado al portapapeles' : 'Copiar email completo'}
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="text-xs bg-slate-900/60 p-2.5 rounded-md border border-slate-800 flex items-center gap-2">
                    <span className="font-semibold text-slate-400">Asunto:</span>
                    <span className="text-slate-200 font-medium">{lead.drafts.emailSubject}</span>
                  </div>
                  <div className="text-xs sm:text-sm text-slate-200 whitespace-pre-line leading-relaxed bg-slate-900/60 p-3.5 rounded-lg border border-slate-800 font-sans">
                    {lead.drafts.emailBody}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECCIÓN 4: Gestión del Lead en CRM (Estado, Notas y Próxima Acción) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 shadow-xl space-y-4 print:hidden">
        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <Bookmark className="w-4 h-4 text-emerald-400" />
          Seguimiento y Registro Comercial (CRM)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Selector de fase */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
              Fase del embudo:
            </label>
            <select
              value={pipelineStatus}
              onChange={(e) => setPipelineStatus(e.target.value as PipelineStatus)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-hidden capitalize"
            >
              <option value="nuevo">Nuevo</option>
              <option value="analizado">Analizado</option>
              <option value="contactado">Contactado</option>
              <option value="respondio">Respondió</option>
              <option value="reunion">Reunión fijada</option>
              <option value="cliente">Cliente cerrado 🎉</option>
              <option value="descartado">Descartado</option>
            </select>
          </div>

          {/* Fecha próxima acción */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              Fecha próxima acción / llamada:
            </label>
            <input
              type="date"
              value={nextActionDate}
              onChange={(e) => setNextActionDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-hidden"
            />
          </div>

          {/* Notas privadas */}
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
              Notas privadas de prospección:
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Hablado con Manuel (recepción), el dueño está por las mañanas de 10 a 13h. Le interesó la demo de citas online..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 focus:border-emerald-500 focus:outline-hidden placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleSaveCrmDetails}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors cursor-pointer shadow-md shadow-emerald-950/30"
          >
            Guardar cambios del lead
          </button>
        </div>
      </div>
    </div>
  );
};
