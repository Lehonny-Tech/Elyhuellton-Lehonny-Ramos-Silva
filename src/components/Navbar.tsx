import React, { useState } from 'react';
import { Building2, Heart, MapPin, Search, ShieldCheck, User as UserIcon, LogOut, Menu, X, PlusCircle, Sparkles, Calculator } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface NavbarProps {
  currentTab: 'home' | 'properties' | 'map' | 'favorites' | 'simulator' | 'admin';
  setCurrentTab: (tab: 'home' | 'properties' | 'map' | 'favorites' | 'simulator' | 'admin') => void;
  openAuthModal: () => void;
  openNewPropertyModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  openAuthModal,
  openNewPropertyModal,
}) => {
  const { currentUser, logoutUser, agencies, currentAgency, setSelectedAgencyId } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [agencyDropdownOpen, setAgencyDropdownOpen] = useState(false);

  const favoritesCount = currentUser?.favorites?.length || 0;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
      {/* Top Banner with Agency multi-tenant awareness */}
      <div className="bg-stone-900 text-stone-300 text-xs px-4 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 font-medium text-amber-400">
            <Sparkles className="w-3.5 h-3.5" />
            Rede Integrada:
          </span>
          <span>{agencies.length} imobiliárias parceiras ativas</span>
          <span className="hidden sm:inline text-stone-500">•</span>
          <span className="hidden sm:inline text-stone-400">Locação garantida com caução, agendamento online e busca com mapa</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Agency quick selector for demo / multi-imobiliária management */}
          <div className="relative">
            <button
              id="agency-selector-top"
              onClick={() => setAgencyDropdownOpen(!agencyDropdownOpen)}
              className="text-stone-300 hover:text-white flex items-center gap-1.5 transition text-xs font-medium cursor-pointer"
              title="Alternar entre imobiliárias para gerenciar"
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="truncate max-w-[140px] sm:max-w-[200px]">
                {currentAgency ? currentAgency.tradeName : 'Selecionar Imobiliária'}
              </span>
              <span className="text-[10px] text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">
                CRECI {currentAgency?.creci}
              </span>
            </button>

            {agencyDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-stone-900 border border-stone-700 rounded-lg shadow-xl p-2 z-50 text-xs">
                <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider px-2 py-1">
                  Alternar Imobiliária Ativa
                </div>
                {agencies.map((ag) => (
                  <button
                    key={ag.id}
                    onClick={() => {
                      setSelectedAgencyId(ag.id);
                      setAgencyDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded flex flex-col gap-0.5 transition cursor-pointer ${
                      currentAgency?.id === ag.id
                        ? 'bg-emerald-700 text-white'
                        : 'hover:bg-stone-800 text-stone-200'
                    }`}
                  >
                    <span className="font-semibold text-xs">{ag.name}</span>
                    <span className="text-[10px] opacity-80">
                      {ag.city}, {ag.state} • CRECI {ag.creci}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div
            onClick={() => setCurrentTab('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-stone-900 font-serif">
                  Imobi<span className="text-emerald-600">Rede</span>
                </span>
                <span className="text-[10px] uppercase font-semibold tracking-widest bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded border border-stone-200">
                  Multi-Imobiliárias
                </span>
              </div>
              <p className="text-[11px] text-stone-500 -mt-0.5">
                Portal de Locação, Venda & Agendamento
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              id="nav-btn-home"
              onClick={() => setCurrentTab('home')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                currentTab === 'home'
                  ? 'bg-emerald-50 text-emerald-700 font-semibold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              Início
            </button>

            <button
              id="nav-btn-properties"
              onClick={() => setCurrentTab('properties')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 cursor-pointer ${
                currentTab === 'properties'
                  ? 'bg-emerald-50 text-emerald-700 font-semibold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Search className="w-4 h-4" />
              Buscar Imóveis
            </button>

            <button
              id="nav-btn-map"
              onClick={() => setCurrentTab('map')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 cursor-pointer ${
                currentTab === 'map'
                  ? 'bg-emerald-50 text-emerald-700 font-semibold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <MapPin className="w-4 h-4 text-emerald-600" />
              Mapa Geolocalizado
            </button>

            <button
              id="nav-btn-favorites"
              onClick={() => setCurrentTab('favorites')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 cursor-pointer relative ${
                currentTab === 'favorites'
                  ? 'bg-emerald-50 text-emerald-700 font-semibold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Heart
                className={`w-4 h-4 ${
                  favoritesCount > 0 ? 'text-rose-500 fill-rose-500' : 'text-stone-500'
                }`}
              />
              Favoritos
              {favoritesCount > 0 && (
                <span className="bg-rose-500 text-white text-[11px] font-bold px-1.5 py-0.2 rounded-full min-w-[18px] text-center">
                  {favoritesCount}
                </span>
              )}
            </button>

            <button
              id="nav-btn-simulator"
              onClick={() => setCurrentTab('simulator')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 cursor-pointer ${
                currentTab === 'simulator'
                  ? 'bg-emerald-50 text-emerald-700 font-semibold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Calculator className="w-4 h-4 text-emerald-600" />
              <span>Simular Financiamento</span>
            </button>

            <button
              id="nav-btn-admin"
              onClick={() => setCurrentTab('admin')}
              className={`ml-2 px-3.5 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 cursor-pointer border ${
                currentTab === 'admin'
                  ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                  : 'border-stone-300 text-stone-700 hover:bg-stone-100 hover:border-stone-400'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Painel do Corretor / Imobiliária</span>
            </button>
          </nav>

          {/* User Auth and CTA */}
          <div className="hidden md:flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="text-xs font-semibold text-stone-900 leading-tight">
                    {currentUser.name}
                  </div>
                  <div className="text-[11px] text-stone-500">
                    {currentUser.role === 'agency_admin' ? 'Administrador' : 'Cliente'}
                  </div>
                </div>
                <button
                  id="nav-logout-btn"
                  onClick={logoutUser}
                  title="Sair da conta"
                  className="p-2 text-stone-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="nav-login-btn"
                onClick={openAuthModal}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-700 hover:text-emerald-700 bg-stone-100 hover:bg-stone-200/80 px-3.5 py-2 rounded-lg transition cursor-pointer"
              >
                <UserIcon className="w-4 h-4" />
                Entrar / Cadastrar
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              id="nav-mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-stone-700 hover:bg-stone-100 transition cursor-pointer"
              aria-label="Abrir menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-stone-200 bg-white px-4 pt-3 pb-6 space-y-2 shadow-lg">
          <button
            onClick={() => {
              setCurrentTab('home');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-3 py-2 rounded-lg text-base font-medium ${
              currentTab === 'home' ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-stone-700'
            }`}
          >
            Início
          </button>
          <button
            onClick={() => {
              setCurrentTab('properties');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-3 py-2 rounded-lg text-base font-medium flex items-center gap-2 ${
              currentTab === 'properties' ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-stone-700'
            }`}
          >
            <Search className="w-4 h-4" />
            Buscar Imóveis
          </button>
          <button
            onClick={() => {
              setCurrentTab('map');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-3 py-2 rounded-lg text-base font-medium flex items-center gap-2 ${
              currentTab === 'map' ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-stone-700'
            }`}
          >
            <MapPin className="w-4 h-4 text-emerald-600" />
            Mapa Geolocalizado
          </button>
          <button
            onClick={() => {
              setCurrentTab('favorites');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-3 py-2 rounded-lg text-base font-medium flex items-center justify-between ${
              currentTab === 'favorites' ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-stone-700'
            }`}
          >
            <span className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-500" />
              Favoritos
            </span>
            {favoritesCount > 0 && (
              <span className="bg-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {favoritesCount}
              </span>
            )}
          </button>
          <button
            onClick={() => {
              setCurrentTab('simulator');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-3 py-2 rounded-lg text-base font-medium flex items-center gap-2 ${
              currentTab === 'simulator' ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-stone-700'
            }`}
          >
            <Calculator className="w-4 h-4 text-emerald-600" />
            Simular Financiamento
          </button>
          <button
            onClick={() => {
              setCurrentTab('admin');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-3 py-2 rounded-lg text-base font-medium flex items-center gap-2 ${
              currentTab === 'admin' ? 'bg-stone-900 text-white' : 'text-stone-900 bg-stone-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Painel da Imobiliária (Gestão)
          </button>

          <div className="pt-4 border-t border-stone-200">
            {currentUser ? (
              <div className="flex items-center justify-between px-2">
                <div>
                  <div className="text-sm font-semibold text-stone-900">{currentUser.name}</div>
                  <div className="text-xs text-stone-500">{currentUser.email}</div>
                </div>
                <button
                  onClick={() => {
                    logoutUser();
                    setMobileMenuOpen(false);
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-rose-600 bg-rose-50 rounded-lg"
                >
                  Sair
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  openAuthModal();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-center py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-sm shadow-sm"
              >
                Entrar ou Cadastrar
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
