import React, { useState, useEffect } from 'react';
import { Layout } from './components/layout/Layout';
import { SearchScreen } from './components/search/SearchScreen';
import { FichaNegocio } from './components/ficha/FichaNegocio';
import { RadarNichos } from './components/radar/RadarNichos';
import { MisLeads } from './components/leads/MisLeads';
import { AjustesScreen } from './components/ajustes/AjustesScreen';
import { ScreenType, BusinessLead, SellerProfile, AppQuotaSettings } from './types';
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
  const [activeScreen, setActiveScreen] = useState<ScreenType>('buscar');
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
      name: 'Carlos Mendoza',
      companyOrAgency: 'Estudio Impulso Digital',
      servicesOffered: [
        'Páginas web profesionales de alta conversión',
        'Agentes de IA conversacionales para WhatsApp',
        'Sistemas de citas y reservas online automatizadas'
      ],
      valueProposition: 'Digitalizamos negocios locales en Medellín y Colombia para que no pierdan clientes en fines de semana y automaticen sus citas y cotizaciones por WhatsApp.',
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

  const handleSaveLead = (lead: BusinessLead) => {
    setSavedLeads((prev) => {
      if (prev.some((l) => l.id === lead.id)) {
        return prev.filter((l) => l.id !== lead.id);
      }
      return [...prev, { ...lead, savedAt: new Date().toISOString() }];
    });
  };

  const handleUpdateLead = (updated: BusinessLead) => {
    setActiveLead(updated);
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
    <Layout
      activeScreen={activeScreen}
      onNavigate={setActiveScreen}
      leadsCount={savedLeads.length}
      hasActiveBusiness={activeLead !== null}
      activeBusinessName={activeLead?.name}
      monthlyCallsCount={quotaSettings.monthlyPlacesCallsCount}
      monthlyCallsLimit={quotaSettings.monthlyPlacesCallsLimit}
      alertThreshold={quotaSettings.alertThreshold || 800}
      hasGoogleCloudKey={Boolean(quotaSettings.googleCloudApiKey || true)}
      sellerName={sellerProfile.name}
    >
      {/* Vista condicional según pantalla activa */}
      {activeScreen === 'buscar' && (
        <SearchScreen
          initialZone={searchZone}
          initialNiche={searchNiche}
          onNavigateToBusiness={(lead) => {
            setActiveLead(lead);
            setActiveScreen('ficha');
          }}
          onNavigateToSettings={() => setActiveScreen('ajustes')}
          onSaveLead={handleSaveLead}
          isSavedLead={isSavedLead}
          googleCloudApiKey={quotaSettings.googleCloudApiKey}
          onIncrementQuota={() => {
            setQuotaSettings((prev) => ({
              ...prev,
              monthlyPlacesCallsCount: prev.monthlyPlacesCallsCount + 1,
            }));
          }}
        />
      )}

      {activeScreen === 'ficha' && (
        activeLead ? (
          <FichaNegocio
            lead={activeLead}
            sellerProfile={sellerProfile}
            isSaved={isSavedLead(activeLead.id)}
            onSaveLead={handleSaveLead}
            onUpdateLead={handleUpdateLead}
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
          onNavigateToBusiness={(lead) => {
            setActiveLead(lead);
            setActiveScreen('ficha');
          }}
          onUpdateLead={handleUpdateLead}
          onDeleteLead={handleDeleteLead}
          onNavigateToSearch={() => setActiveScreen('buscar')}
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
        />
      )}
    </Layout>
  );
}
