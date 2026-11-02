import React, { useState, useEffect, useMemo } from 'react';
import { Layout } from './components/layout/Layout';
import { SearchScreen } from './components/search/SearchScreen';
import { FichaNegocio } from './components/ficha/FichaNegocio';
import { RadarNichos } from './components/radar/RadarNichos';
import { MisLeads } from './components/leads/MisLeads';
import { AjustesScreen } from './components/ajustes/AjustesScreen';
import { HistorialScreen } from './components/historial/HistorialScreen';
import { OutreachActions, OutreachProvider } from './services/outreachContext';
import { PendingSendPrompt, clearPendingSend, markPendingSend } from './components/outreach/PendingSendPrompt';
import { STEP_LABELS, toneForLead } from './services/outreachMessage';
import { PIPELINE_LABELS } from './services/historyExport';
import { OutreachSettings, loadOutreachSettings, saveOutreachSettings } from './services/outreachSettings';
import { BlockedEntry, addBlocked, loadBlocked, removeBlocked, saveBlocked } from './services/doNotContact';
import { approachCount, nextActionAfter, suggestedStep } from './services/outreachPlan';
import {
  addBusinessEvent,
  addSearchEntry,
  loadSearchLog,
  loadTrackedBusinesses,
  refreshBusinessSnapshot,
  saveSearchLog,
  saveTrackedBusinesses,
} from './services/activityLog';
import {
  ScreenType,
  BusinessLead,
  SellerProfile,
  AppQuotaSettings,
  ActivityEvent,
  ActivityType,
  ApproachChannel,
  SearchLogEntry,
  TrackedBusiness,
} from './types';
import { 
  Building2, 
  Target, 
  Users, 
  Settings, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  FileText,
  Search
} from 'lucide-react';

export default function App() {
  const [activeScreen, setActiveScreen] = useState<ScreenType>(() => {
    // Los accesos directos de la app instalada abren una pantalla con ?screen=...
    const requested = new URLSearchParams(window.location.search).get('screen');
    return requested && ['buscar', 'radar', 'leads', 'historial', 'ajustes'].includes(requested)
      ? (requested as ScreenType)
      : 'buscar';
  });
  const [searchZone, setSearchZone] = useState('El Poblado, Medellín');
  const [searchNiche, setSearchNiche] = useState('talleres mecánicos');
  
  // Estados para leads y CRM
  const [savedLeads, setSavedLeads] = useState<BusinessLead[]>(() => {
    try {
      const stored = localStorage.getItem('radar_saved_leads');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Error al leer leads de localStorage:', e);
    }
    return [];
  });

  const [activeLead, setActiveLead] = useState<BusinessLead | null>(null);

  // Perfil del vendedor
  const [sellerProfile, setSellerProfile] = useState<SellerProfile>(() => {
    try {
      const stored = localStorage.getItem('radar_seller_profile');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Error al leer perfil de localStorage:', e);
    }
    return {
      name: 'Synflow',
      companyOrAgency: 'SynflowIA SaaS',
      servicesOffered: [
        'Agentes y chatbots de WhatsApp con IA que atienden 24/7',
        'Agendamiento y reservas automáticas',
        'Cotizaciones instantáneas',
        'Sitios web profesionales',
        'Herramientas de gestión de ventas, inventario y clientes'
      ],
      valueProposition: 'SynFlow IA es una agencia tecnológica de Medellín que digitaliza negocios locales en Medellín y Colombia. Ayudamos a pymes y emprendimientos a no perder clientes, especialmente los fines de semana, automatizando sus citas y cotizaciones por WhatsApp con agentes de inteligencia artificial que atienden 24/7.\n\nDiseñamos soluciones a la medida: agentes y chatbots de WhatsApp, agendamiento y reservas automáticas, cotizaciones instantáneas, sitios web profesionales y herramientas de gestión de ventas, inventario y clientes. Todo es simple de usar, está pensado para negocios de barrio y no requiere conocimientos técnicos de tu parte.\n\nNo hablamos de lo que podemos hacer: tenemos soluciones reales funcionando. Empieza con una consultoría inicial gratuita y descubre cómo la IA puede trabajar para tu negocio desde hoy.',
      defaultTone: 'cercano'
    };
  });

  // Ajustes de cuota con umbral de alerta (por defecto 800)
  const [quotaSettings, setQuotaSettings] = useState<AppQuotaSettings>(() => {
    const envKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || '';
    try {
      const stored = localStorage.getItem('radar_quota_settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (!parsed.googleCloudApiKey && envKey) {
          parsed.googleCloudApiKey = envKey;
        }
        return parsed;
      }
    } catch (e) {
      console.warn('Error al leer cuota de localStorage:', e);
    }
    return {
      googleCloudApiKey: envKey,
      monthlyPlacesCallsCount: 0,
      monthlyPlacesCallsLimit: 1000,
      alertThreshold: 800,
      lastResetMonth: new Date().toISOString().slice(0, 7)
    };
  });

  // Persistencia local
  useEffect(() => {
    try {
      localStorage.setItem('radar_saved_leads', JSON.stringify(savedLeads));
    } catch (e) {
      console.warn('Error guardando leads:', e);
    }
  }, [savedLeads]);

  useEffect(() => {
    try {
      localStorage.setItem('radar_seller_profile', JSON.stringify(sellerProfile));
    } catch (e) {
      console.warn('Error guardando perfil:', e);
    }
  }, [sellerProfile]);

  useEffect(() => {
    try {
      localStorage.setItem('radar_quota_settings', JSON.stringify(quotaSettings));
    } catch (e) {
      console.warn('Error guardando cuotas:', e);
    }
  }, [quotaSettings]);

  // Historial y trazabilidad (se guarda en el navegador, igual que los leads)
  const [trackedBusinesses, setTrackedBusinesses] = useState<TrackedBusiness[]>(loadTrackedBusinesses);
  const [searchLog, setSearchLog] = useState<SearchLogEntry[]>(loadSearchLog);

  useEffect(() => {
    saveTrackedBusinesses(trackedBusinesses);
  }, [trackedBusinesses]);

  useEffect(() => {
    saveSearchLog(searchLog);
  }, [searchLog]);

  // Ajustes editables de los mensajes (saludo, firma, duración de la demo…)
  const [outreachSettings, setOutreachSettings] = useState<OutreachSettings>(loadOutreachSettings);
  useEffect(() => {
    saveOutreachSettings(outreachSettings);
  }, [outreachSettings]);

  // Negocios que pidieron no recibir más mensajes
  const [blocked, setBlocked] = useState<BlockedEntry[]>(loadBlocked);
  useEffect(() => {
    saveBlocked(blocked);
  }, [blocked]);

  const trackActivity = (
    lead: BusinessLead,
    type: ActivityType,
    extra?: Pick<ActivityEvent, 'channel' | 'note' | 'tone' | 'step' | 'stage'>
  ) => {
    setTrackedBusinesses((prev) => addBusinessEvent(prev, lead, type, extra));
    // Al abrir WhatsApp se pregunta, al volver a la app, si el mensaje se envió de verdad.
    if (type === 'whatsapp') markPendingSend(lead);
    if (type === 'correo') markPendingSend(lead, { channel: 'correo' });
  };

  // Confirmación rápida tras WhatsApp: registra el acercamiento, avanza el embudo y deja la fecha del siguiente seguimiento.
  const confirmWhatsAppSent = (lead: BusinessLead, reply?: string, channel?: 'correo') => {
    if (reply) {
      // Una respuesta rápida no es un paso de la secuencia: solo queda en el historial.
      trackActivity(lead, 'acercamiento', { channel: channel ?? 'whatsapp', note: `Respuesta rápida: ${reply}` });
      return;
    }
    const tracked = trackedBusinesses.find((t) => t.id === lead.id);
    const step = suggestedStep(tracked);
    const count = approachCount(tracked) + 1;
    trackActivity(lead, 'acercamiento', {
      channel: channel ?? 'whatsapp',
      note: STEP_LABELS[step],
      step,
      tone: toneForLead(lead, sellerProfile),
    });
    setSavedLeads((prev) =>
      prev.map((l) =>
        l.id === lead.id
          ? {
              ...l,
              pipelineStatus: l.pipelineStatus === 'nuevo' || l.pipelineStatus === 'analizado' ? 'contactado' : l.pipelineStatus,
              nextActionDate: nextActionAfter(count, new Date()),
              updatedAt: new Date().toISOString(),
            }
          : l
      )
    );
  };

  // Acciones del embudo de respuestas (se comparten por contexto con la ficha, la cola y el historial)
  const outreachActions = useMemo<OutreachActions>(
    () => ({
      markResponded: (lead) => {
        setTrackedBusinesses((prev) => addBusinessEvent(prev, lead, 'respondio'));
        setSavedLeads((prev) => {
          const now = new Date().toISOString();
          if (!prev.some((l) => l.id === lead.id)) {
            return [...prev, { ...lead, pipelineStatus: 'respondio', savedAt: now, updatedAt: now }];
          }
          return prev.map((l) =>
            l.id === lead.id && ['nuevo', 'analizado', 'contactado'].includes(l.pipelineStatus)
              ? { ...l, pipelineStatus: 'respondio', nextActionDate: undefined, updatedAt: now }
              : l
          );
        });
      },
      markDoNotContact: (lead, reason) => {
        setBlocked((prev) => addBlocked(prev, lead, reason));
        setTrackedBusinesses((prev) => addBusinessEvent(prev, lead, 'no_contactar', { note: reason }));
        setSavedLeads((prev) =>
          prev.map((l) =>
            l.id === lead.id ? { ...l, pipelineStatus: 'descartado', nextActionDate: undefined, updatedAt: new Date().toISOString() } : l
          )
        );
        clearPendingSend(lead.id);
      },
      unblock: (id) => setBlocked((prev) => removeBlocked(prev, id)),
      sendReply: (lead, label) => {
        setTrackedBusinesses((prev) => addBusinessEvent(prev, lead, 'whatsapp'));
        markPendingSend(lead, { reply: label });
      },
    }),
    []
  );

  const handleSearchPerformed = (zone: string, niche: string, resultsCount: number) => {
    setSearchLog((prev) => addSearchEntry(prev, { zone, niche, resultsCount }));
  };

  const openFicha = (lead: BusinessLead) => {
    trackActivity(lead, 'ficha');
    setActiveLead(lead);
    setActiveScreen('ficha');
  };

  const handleSaveLead = (lead: BusinessLead) => {
    const alreadySaved = savedLeads.some((l) => l.id === lead.id);
    if (!alreadySaved) trackActivity(lead, 'guardado');
    setSavedLeads((prev) => {
      if (prev.some((l) => l.id === lead.id)) {
        return prev.filter((l) => l.id !== lead.id);
      }
      return [...prev, { ...lead, savedAt: new Date().toISOString() }];
    });
  };

  const handleUpdateLead = (updated: BusinessLead) => {
    // Cada cambio de etapa queda en el historial: es lo que alimenta el resumen de demos y cierres.
    const before = savedLeads.find((l) => l.id === updated.id);
    if (before && before.pipelineStatus !== updated.pipelineStatus) {
      trackActivity(updated, 'etapa', { stage: updated.pipelineStatus, note: `Pasó a ${PIPELINE_LABELS[updated.pipelineStatus] ?? updated.pipelineStatus}` });
    }
    setActiveLead(updated);
    setTrackedBusinesses((prev) => refreshBusinessSnapshot(prev, updated));
    setSavedLeads((prev) =>
      prev.map((l) => (l.id === updated.id ? updated : l))
    );
  };

  const handleDeleteLead = (id: string) => {
    setSavedLeads((prev) => prev.filter((l) => l.id !== id));
    if (activeLead?.id === id) {
      setActiveLead(null);
    }
  };

  const isSavedLead = (id: string) => {
    return savedLeads.some((l) => l.id === id);
  };

  return (
    <OutreachProvider seller={sellerProfile} tracked={trackedBusinesses} blocked={blocked} actions={outreachActions} settings={outreachSettings}>
    <PendingSendPrompt tracked={trackedBusinesses} onConfirm={confirmWhatsAppSent} />
    <Layout
      activeScreen={activeScreen}
      onNavigate={setActiveScreen}
      leadsCount={savedLeads.length}
      historyCount={trackedBusinesses.length}
      hasActiveBusiness={activeLead !== null}
      activeBusinessName={activeLead?.name}
      monthlyCallsCount={quotaSettings.monthlyPlacesCallsCount}
      monthlyCallsLimit={quotaSettings.monthlyPlacesCallsLimit}
      alertThreshold={quotaSettings.alertThreshold || 800}
      hasGoogleCloudKey={Boolean(quotaSettings.googleCloudApiKey || true)}
      sellerName={sellerProfile.name}
    >
      {/* Vista condicional según pantalla activa */}
      {/* La búsqueda permanece montada (oculta) al cambiar de pantalla para conservar
          resultados, filtros, vista y selección al volver desde una ficha. */}
      <div className={activeScreen === 'buscar' ? '' : 'hidden'}>
        <SearchScreen
          initialZone={searchZone}
          initialNiche={searchNiche}
          onNavigateToBusiness={openFicha}
          onNavigateToSettings={() => setActiveScreen('ajustes')}
          onSaveLead={handleSaveLead}
          isSavedLead={isSavedLead}
          onTrack={trackActivity}
          onSearchPerformed={handleSearchPerformed}
          googleCloudApiKey={quotaSettings.googleCloudApiKey}
          onIncrementQuota={() => {
            setQuotaSettings((prev) => ({
              ...prev,
              monthlyPlacesCallsCount: prev.monthlyPlacesCallsCount + 1,
            }));
          }}
        />
      </div>

      {activeScreen === 'ficha' && (
        activeLead ? (
          <FichaNegocio
            lead={activeLead}
            sellerProfile={sellerProfile}
            isSaved={isSavedLead(activeLead.id)}
            onSaveLead={handleSaveLead}
            onUpdateLead={handleUpdateLead}
            onTrack={trackActivity}
            onBack={() => setActiveScreen('buscar')}
            googleCloudApiKey={quotaSettings.googleCloudApiKey}
          />
        ) : (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 sm:p-12 text-center max-w-xl mx-auto space-y-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">
                Ningún negocio seleccionado
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
                Selecciona una empresa desde el explorador de búsqueda o desde tu lista de leads para abrir su auditoría técnica, capturas y borradores de venta.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveScreen('buscar')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-colors cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>Ir al explorador de búsqueda</span>
            </button>
          </div>
        )
      )}

      {activeScreen === 'radar' && (
        <RadarNichos
          monthlyCallsCount={quotaSettings.monthlyPlacesCallsCount}
          monthlyCallsLimit={quotaSettings.monthlyPlacesCallsLimit}
          googleCloudApiKey={quotaSettings.googleCloudApiKey}
          onIncrementQuota={(count) => {
            setQuotaSettings((prev) => ({
              ...prev,
              monthlyPlacesCallsCount: prev.monthlyPlacesCallsCount + count,
            }));
          }}
          onNavigateToSearch={(zone, niche) => {
            setSearchZone(zone);
            setSearchNiche(niche);
            setActiveScreen('buscar');
          }}
        />
      )}

      {activeScreen === 'leads' && (
        <MisLeads
          leads={savedLeads}
          onNavigateToBusiness={openFicha}
          onUpdateLead={handleUpdateLead}
          onTrack={trackActivity}
          onDeleteLead={handleDeleteLead}
          onNavigateToSearch={() => setActiveScreen('buscar')}
        />
      )}

      {activeScreen === 'historial' && (
        <HistorialScreen
          businesses={trackedBusinesses}
          searches={searchLog}
          onOpenFicha={(lead) => openFicha(savedLeads.find((l) => l.id === lead.id) ?? lead)}
          onAddApproach={(lead, channel, note) =>
            trackActivity(lead, 'acercamiento', { channel, note: note || undefined })
          }
          onDeleteBusiness={(id) => setTrackedBusinesses((prev) => prev.filter((t) => t.id !== id))}
          onClearAll={() => {
            setTrackedBusinesses([]);
            setSearchLog([]);
          }}
          onRepeatSearch={(zone, niche) => {
            setSearchZone(zone);
            setSearchNiche(niche);
            setActiveScreen('buscar');
          }}
        />
      )}

      {activeScreen === 'ajustes' && (
        <AjustesScreen
          quotaSettings={quotaSettings}
          sellerProfile={sellerProfile}
          leadsCount={savedLeads.length}
          allLeads={savedLeads}
          onUpdateQuotaSettings={setQuotaSettings}
          onUpdateSellerProfile={setSellerProfile}
          outreachSettings={outreachSettings}
          onUpdateOutreachSettings={setOutreachSettings}
        />
      )}
    </Layout>
    </OutreachProvider>
  );
}
