import React, { useState, useRef, useLayoutEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ScreenType } from '../../types';

interface LayoutProps {
  activeScreen: ScreenType;
  onNavigate: (screen: ScreenType) => void;
  children: React.ReactNode;
  leadsCount?: number;
  historyCount?: number;
  hasActiveBusiness?: boolean;
  activeBusinessName?: string;
  monthlyCallsCount?: number;
  monthlyCallsLimit?: number;
  alertThreshold?: number;
  hasGoogleCloudKey?: boolean;
  sellerName?: string;
}

export const Layout: React.FC<LayoutProps> = ({
  activeScreen,
  onNavigate,
  children,
  leadsCount = 0,
  historyCount = 0,
  hasActiveBusiness = false,
  activeBusinessName,
  monthlyCallsCount = 0,
  monthlyCallsLimit = 1000,
  alertThreshold = 800,
  hasGoogleCloudKey = true,
  sellerName = 'Consultor Digital',
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Al volver a «Buscar» se restaura el scroll donde el usuario lo dejó; las demás pantallas abren arriba.
  const mainRef = useRef<HTMLElement>(null);
  const searchScrollRef = useRef(0);
  useLayoutEffect(() => {
    const main = mainRef.current;
    if (!main) return;
    main.scrollTop = activeScreen === 'buscar' ? searchScrollRef.current : 0;
  }, [activeScreen]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row antialiased selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Sidebar navigation */}
      <Sidebar
        activeScreen={activeScreen}
        onNavigate={onNavigate}
        leadsCount={leadsCount}
        historyCount={historyCount}
        hasActiveBusiness={hasActiveBusiness}
        activeBusinessName={activeBusinessName}
        monthlyCallsCount={monthlyCallsCount}
        monthlyCallsLimit={monthlyCallsLimit}
        alertThreshold={alertThreshold}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main content wrapper */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header */}
        <Header
          activeScreen={activeScreen}
          onOpenMobileNav={() => setMobileOpen(true)}
          hasGoogleCloudKey={hasGoogleCloudKey}
          sellerName={sellerName}
          onNavigateToSettings={() => onNavigate('ajustes')}
        />

        {/* Central Content Area */}
        <main
          ref={mainRef}
          onScroll={(e) => {
            if (activeScreen === 'buscar') searchScrollRef.current = e.currentTarget.scrollTop;
          }}
          className="flex-1 overflow-y-auto bg-slate-950 p-4 sm:p-6 lg:p-8"
        >
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
