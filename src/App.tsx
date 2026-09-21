import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { HomeFeatured } from './components/HomeFeatured';
import { PropertyList } from './components/PropertyList';
import { GeolocatedMap } from './components/GeolocatedMap';
import { FavoritesView } from './components/FavoritesView';
import { AdminPanel } from './components/AdminPanel';
import { PropertyDetailModal } from './components/PropertyDetailModal';
import { ScheduleVisitModal } from './components/ScheduleVisitModal';
import { AuthModal } from './components/AuthModal';
import { MortgageSimulator } from './components/MortgageSimulator';
import { Property, FilterState } from './types';
import { Building2, ShieldCheck, MapPin, Phone, Heart, Sparkles, RefreshCw, Calculator } from 'lucide-react';

function MainAppContent() {
  const { properties, agencies, resetToDefaults } = useApp();

  const [currentTab, setCurrentTab] = useState<'home' | 'properties' | 'map' | 'favorites' | 'simulator' | 'admin'>('home');
  const [selectedPropertyForDetail, setSelectedPropertyForDetail] = useState<Property | null>(null);
  const [selectedPropertyForSchedule, setSelectedPropertyForSchedule] = useState<Property | null>(null);
  const [simulatorProperty, setSimulatorProperty] = useState<Property | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [passedFilters, setPassedFilters] = useState<Partial<FilterState>>({});

  const handleGoToSearch = (filters?: Partial<FilterState>) => {
    if (filters) {
      setPassedFilters(filters);
    }
    setCurrentTab('properties');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoToMap = () => {
    setCurrentTab('map');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 font-sans text-stone-900">
      {/* Navigation Header */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        openAuthModal={() => setAuthModalOpen(true)}
      />

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {currentTab === 'home' && (
          <HomeFeatured
            onSelectProperty={(prop) => setSelectedPropertyForDetail(prop)}
            onScheduleVisit={(prop) => setSelectedPropertyForSchedule(prop)}
            onGoToSearch={handleGoToSearch}
            onGoToMap={handleGoToMap}
            openAuthModal={() => setAuthModalOpen(true)}
            onGoToSimulator={() => {
              setCurrentTab('simulator');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {currentTab === 'properties' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-stone-900">Buscar Imóveis na Rede</h1>
                <p className="text-xs text-stone-500">
                  Filtre por localidade, valor, quartos, vagas, condomínio, pisos e imobiliária.
                </p>
              </div>
            </div>

            <PropertyList
              initialFilters={passedFilters}
              onSelectProperty={(prop) => setSelectedPropertyForDetail(prop)}
              onScheduleVisit={(prop) => setSelectedPropertyForSchedule(prop)}
              openAuthModal={() => setAuthModalOpen(true)}
            />
          </div>
        )}

        {currentTab === 'map' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
                  <MapPin className="w-6 h-6 text-emerald-600" />
                  Mapa Geolocalizado de Imóveis
                </h1>
                <p className="text-xs text-stone-500">
                  Explore a localização precisa dos imóveis anunciados por todas as imobiliárias cadastradas.
                </p>
              </div>

              <button
                onClick={() => setCurrentTab('properties')}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold cursor-pointer self-start sm:self-auto"
              >
                Ver em Grade / Lista
              </button>
            </div>

            <GeolocatedMap
              properties={properties}
              onSelectProperty={(prop) => setSelectedPropertyForDetail(prop)}
              onScheduleVisit={(prop) => setSelectedPropertyForSchedule(prop)}
            />
          </div>
        )}

        {currentTab === 'favorites' && (
          <FavoritesView
            onSelectProperty={(prop) => setSelectedPropertyForDetail(prop)}
            onScheduleVisit={(prop) => setSelectedPropertyForSchedule(prop)}
            onGoToSearch={() => setCurrentTab('properties')}
            openAuthModal={() => setAuthModalOpen(true)}
          />
        )}

        {currentTab === 'simulator' && (
          <div className="space-y-4">
            <MortgageSimulator
              initialProperty={simulatorProperty}
              onSelectProperty={(prop) => setSelectedPropertyForDetail(prop)}
              onScheduleVisit={(prop) => setSelectedPropertyForSchedule(prop)}
            />
          </div>
        )}

        {currentTab === 'admin' && (
          <AdminPanel
            onViewProperty={(prop) => setSelectedPropertyForDetail(prop)}
          />
        )}
      </main>

      {/* Global Footer */}
      <footer className="bg-stone-900 text-stone-400 text-xs border-t border-stone-800 py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Col 1 */}
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center gap-2 text-white font-bold text-base font-serif">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                  <Building2 className="w-4 h-4" />
                </div>
                <span>ImobiRede</span>
              </div>
              <p className="text-stone-400 text-xs leading-relaxed max-w-md">
                Plataforma multi-imobiliária para gestão unificada e busca de imóveis residenciais e comerciais.
                Transparência com valores de locação, caução, prazos mínimos, taxas condominiais e agendamento de visitas online.
              </p>
              <div className="flex items-center gap-2 text-emerald-400 text-[11px] font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>Intermediação garantida por corretores credenciados pelo CRECI</span>
              </div>
            </div>

            {/* Col 2 */}
            <div className="space-y-2">
              <div className="font-bold text-white uppercase tracking-wider text-[11px]">
                Navegação Rápida
              </div>
              <ul className="space-y-1.5">
                <li>
                  <button
                    onClick={() => {
                      setCurrentTab('home');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-white transition cursor-pointer"
                  >
                    Início & Destaques
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setCurrentTab('properties');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-white transition cursor-pointer"
                  >
                    Busca Avançada com Filtros
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setCurrentTab('map');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-white transition cursor-pointer"
                  >
                    Mapa Geolocalizado
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setCurrentTab('admin');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-white transition cursor-pointer text-emerald-400"
                  >
                    Painel do Corretor / Imobiliária
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3 */}
            <div className="space-y-2">
              <div className="font-bold text-white uppercase tracking-wider text-[11px]">
                Imobiliárias na Rede
              </div>
              <ul className="space-y-1.5 text-stone-300">
                {agencies.map((ag) => (
                  <li key={ag.id} className="truncate">
                    <span className="text-white font-medium">{ag.tradeName}</span>
                    <span className="text-stone-500 text-[10px] ml-1 font-mono">
                      (CRECI {ag.creci})
                    </span>
                  </li>
                ))}
              </ul>
              <div className="pt-2">
                <button
                  onClick={() => {
                    if (confirm('Deseja restaurar todos os imóveis, imobiliárias e visitas para os dados iniciais de demonstração?')) {
                      resetToDefaults();
                    }
                  }}
                  className="inline-flex items-center gap-1 text-[10px] text-stone-500 hover:text-stone-300 transition cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  Restaurar dados de teste
                </button>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-stone-500 text-[11px]">
            <div>&copy; 2026 ImobiRede Multi-Imobiliárias. Todos os direitos reservados.</div>
            <div>São Paulo • Santos • Campinas e região metropolitana</div>
          </div>
        </div>
      </footer>

      {/* Global Modals */}
      <PropertyDetailModal
        property={selectedPropertyForDetail}
        isOpen={!!selectedPropertyForDetail}
        onClose={() => setSelectedPropertyForDetail(null)}
        onScheduleVisit={(prop) => {
          setSelectedPropertyForDetail(null);
          setSelectedPropertyForSchedule(prop);
        }}
        openAuthModal={() => setAuthModalOpen(true)}
        onOpenSimulatorTab={(prop) => {
          setSimulatorProperty(prop);
          setCurrentTab('simulator');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      <ScheduleVisitModal
        property={selectedPropertyForSchedule}
        isOpen={!!selectedPropertyForSchedule}
        onClose={() => setSelectedPropertyForSchedule(null)}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
