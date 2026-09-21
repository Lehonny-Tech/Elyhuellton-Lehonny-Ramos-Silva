import React, { useState } from 'react';
import {
  Search,
  MapPin,
  Flame,
  Building2,
  SlidersHorizontal,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Sparkles,
  Layers,
  KeyRound,
  CheckCircle,
  Calculator,
  Star,
} from 'lucide-react';
import { Property, Agency } from '../types';
import { PropertyCard } from './PropertyCard';
import { useApp } from '../context/AppContext';

interface HomeFeaturedProps {
  onSelectProperty: (property: Property) => void;
  onScheduleVisit: (property: Property) => void;
  onGoToSearch: (filters?: { searchQuery?: string; purpose?: 'todos' | 'locacao' | 'venda'; agencyId?: string }) => void;
  onGoToMap: () => void;
  openAuthModal: () => void;
  onGoToSimulator?: () => void;
}

export const HomeFeatured: React.FC<HomeFeaturedProps> = ({
  onSelectProperty,
  onScheduleVisit,
  onGoToSearch,
  onGoToMap,
  openAuthModal,
  onGoToSimulator,
}) => {
  const { properties, agencies } = useApp();
  const [keyword, setKeyword] = useState('');
  const [purposeTab, setPurposeTab] = useState<'todos' | 'locacao' | 'venda'>('todos');

  // "OS IMOVEIS COM MAIS BUSCAS EM DESTAQUE DE MODO GERAL IDEPENDENTE DE QUAL IMOBILIÁRIA FOR"
  const mostSearchedProperties = [...properties]
    .sort((a, b) => (b.searchCount || 0) - (a.searchCount || 0))
    .slice(0, 6);

  // IMÓVEIS EM DESTAQUE SELECIONADOS PELAS IMOBILIÁRIAS E APROVADOS PELO CRIADOR DO SITE
  const featuredProperties = properties.filter((p) => p.featured);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onGoToSearch({ searchQuery: keyword, purpose: purposeTab });
  };

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Banner with Integrated Search */}
      <section className="relative bg-gradient-to-b from-stone-900 via-stone-900 to-stone-800 text-white rounded-3xl p-6 sm:p-10 lg:p-14 overflow-hidden shadow-2xl border border-stone-800">
        {/* Subtle Background Glows */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-teal-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl mx-auto text-center space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/50 text-emerald-400 text-xs font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            Rede Unificada de Imobiliárias e Corretores
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight font-serif">
            Encontre o imóvel ideal com{' '}
            <span className="text-emerald-400">transparência total</span> e agendamento online.
          </h1>

          <p className="text-sm sm:text-base text-stone-300 max-w-2xl mx-auto leading-relaxed">
            Consulte valores de locação com prazo mínimo e caução detalhados, valor de venda,
            taxa de condomínio, quantidade de pisos e agende visitas com horários em tempo real.
          </p>

          {/* Search Bar Container */}
          <div className="pt-3 max-w-2xl mx-auto">
            {/* Locação / Venda toggle chips */}
            <div className="flex justify-center gap-1 mb-3">
              <button
                type="button"
                onClick={() => setPurposeTab('todos')}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                  purposeTab === 'todos'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-stone-800/80 text-stone-300 hover:bg-stone-700'
                }`}
              >
                Todos os Imóveis
              </button>
              <button
                type="button"
                onClick={() => setPurposeTab('locacao')}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                  purposeTab === 'locacao'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-stone-800/80 text-stone-300 hover:bg-stone-700'
                }`}
              >
                Locação (Aluguel)
              </button>
              <button
                type="button"
                onClick={() => setPurposeTab('venda')}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                  purposeTab === 'venda'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-stone-800/80 text-stone-300 hover:bg-stone-700'
                }`}
              >
                Comprar (Venda)
              </button>
            </div>

            {/* Main Input Form */}
            <form
              onSubmit={handleHeroSearch}
              className="bg-white p-2 sm:p-2.5 rounded-2xl shadow-xl flex flex-col sm:flex-row items-center gap-2 text-stone-900 border border-stone-200"
            >
              <div className="flex items-center gap-2.5 flex-1 px-3 w-full">
                <Search className="w-5 h-5 text-emerald-600 shrink-0" />
                <input
                  type="text"
                  placeholder="Digite bairro, cidade (ex: Jardins, Campinas, Santos) ou tipo..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="w-full text-sm text-stone-900 placeholder-stone-400 focus:outline-hidden py-2"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onGoToMap}
                  className="w-full sm:w-auto px-4 py-3 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                  title="Abrir mapa de imóveis"
                >
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span className="whitespace-nowrap">Ver no Mapa</span>
                </button>

                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition shadow-md cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  <span>Buscar</span>
                </button>
              </div>
            </form>
          </div>

          {/* Quick Stats Banner */}
          <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-stone-300 text-xs border-t border-stone-800/80">
            <div className="flex items-center justify-center gap-1.5">
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span>{agencies.length} Imobiliárias Ativas</span>
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <KeyRound className="w-4 h-4 text-emerald-400" />
              <span>{properties.length} Imóveis Disponíveis</span>
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>Agendamento em Tempo Real</span>
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Corretores com CRECI</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: SEÇÃO DE DESTAQUE APROVADA PELO CRIADOR DO SITE */}
      {featuredProperties.length > 0 && (
        <section id="secao-destaques-site" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-amber-200 bg-amber-50/60 p-4 sm:p-6 rounded-2xl border">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-900 bg-amber-200/80 px-3 py-1 rounded-full border border-amber-300 mb-2">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-900" />
                Seção de Destaque Oficial da Rede
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-stone-950 tracking-tight font-serif flex items-center gap-2">
                Imóveis em Destaque
                <span className="text-xs font-sans font-semibold bg-amber-500 text-stone-950 px-2.5 py-0.5 rounded-full">
                  {featuredProperties.length} {featuredProperties.length === 1 ? 'imóvel' : 'imóveis'}
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 mt-1">
                Imóveis escolhidos pelas imobiliárias parceiras (incluindo Extrema, São Paulo, Santos e Campinas) e aprovados pelo Criador do Site.
              </p>
            </div>

            <button
              onClick={() => onGoToSearch()}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 hover:text-stone-900 bg-white hover:bg-amber-100 border border-amber-300 px-4 py-2 rounded-xl transition cursor-pointer shrink-0 shadow-2xs"
            >
              <span>Explorar todo o catálogo</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Featured Properties Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProperties.map((prop) => (
              <PropertyCard
                key={prop.id}
                property={prop}
                onSelect={onSelectProperty}
                onScheduleVisit={onScheduleVisit}
                openAuthModal={openAuthModal}
              />
            ))}
          </div>
        </section>
      )}

      {/* SECTION: OS IMOVEIS COM MAIS BUSCAS EM DESTAQUE DE MODO GERAL INDEPENDENTE DE QUAL IMOBILIÁRIA FOR */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-stone-200 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 mb-1">
              <Flame className="w-3.5 h-3.5 fill-amber-600" />
              Em Alta na Rede Geral
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight font-serif">
              Imóveis com Mais Buscas em Destaque
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              Ranking consolidado dos imóveis mais acessados e procurados, independente da imobiliária anunciante.
            </p>
          </div>

          <button
            onClick={() => onGoToSearch()}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-xl transition cursor-pointer"
          >
            <span>Ver Todos os Imóveis ({properties.length})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Properties Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mostSearchedProperties.map((prop) => (
            <PropertyCard
              key={prop.id}
              property={prop}
              onSelect={onSelectProperty}
              onScheduleVisit={onScheduleVisit}
              openAuthModal={openAuthModal}
            />
          ))}
        </div>
      </section>

      {/* SECTION: Mortgage Simulation Interactive Teaser */}
      {onGoToSimulator && (
        <section className="bg-gradient-to-br from-stone-900 via-stone-850 to-stone-900 text-white rounded-3xl p-6 sm:p-8 lg:p-10 border border-stone-800 shadow-xl relative overflow-hidden">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold border border-emerald-500/30">
              <Calculator className="w-3.5 h-3.5" />
              Planeje sua Compra
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold font-serif text-white tracking-tight">
              Simule o Financiamento do seu Imóvel
            </h2>

            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed max-w-2xl">
              Calcule quanto fica a parcela mensal dos imóveis à venda na rede. Compare as tabelas
              <strong> SAC (parcelas decrescentes)</strong> e <strong>PRICE (parcelas fixas)</strong>,
              personalize o valor da entrada, prazos de até 35 anos e consulte a renda familiar mínima sugerida.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onGoToSimulator}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-900/40 transition cursor-pointer"
              >
                <Calculator className="w-4 h-4" />
                Abrir Simulador de Parcelas
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onGoToSearch({ purpose: 'venda' })}
                className="px-5 py-3 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white text-xs sm:text-sm font-semibold rounded-xl border border-stone-700 transition cursor-pointer"
              >
                Ver Imóveis à Venda
              </button>
            </div>
          </div>
        </section>
      )}

      {/* SECTION: Imobiliárias Parceiras Cadastradas */}
      <section className="bg-stone-100 rounded-3xl p-6 sm:p-8 border border-stone-200 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Ecossistema Multi-Empresas
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900">
              Imobiliárias Credenciadas com Gestão Individual
            </h2>
            <p className="text-xs text-stone-600 mt-0.5">
              Cada administradora gerencia seus próprios imóveis, contratos de caução e agendas de visita.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {agencies.map((agency) => {
            const agencyPropsCount = properties.filter((p) => p.agencyId === agency.id).length;
            return (
              <div
                key={agency.id}
                onClick={() => onGoToSearch({ agencyId: agency.id })}
                className="bg-white p-5 rounded-2xl border border-stone-200 hover:border-emerald-500 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <img
                      src={agency.logoUrl}
                      alt={agency.name}
                      className="w-12 h-12 rounded-xl object-cover border border-stone-200 group-hover:scale-105 transition-transform"
                    />
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-stone-900 group-hover:text-emerald-700 transition truncate">
                        {agency.name}
                      </h3>
                      <div className="text-[11px] text-stone-500 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        CRECI {agency.creci}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-stone-600 line-clamp-2 mb-3">
                    {agency.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                  <span className="text-stone-500 font-medium">
                    {agency.city}, {agency.state}
                  </span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                    {agencyPropsCount} {agencyPropsCount === 1 ? 'imóvel' : 'imóveis'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
