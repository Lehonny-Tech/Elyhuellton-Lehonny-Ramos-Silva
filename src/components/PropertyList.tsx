import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  RotateCcw,
  MapPin,
  Building,
  Bed,
  Car,
  Layers,
  Map,
  Grid,
  Flame,
  DollarSign,
  Check,
  ChevronDown,
} from 'lucide-react';
import { Property, FilterState, PropertyType } from '../types';
import { PropertyCard } from './PropertyCard';
import { GeolocatedMap } from './GeolocatedMap';
import { useApp } from '../context/AppContext';

interface PropertyListProps {
  initialFilters?: Partial<FilterState>;
  onSelectProperty: (property: Property) => void;
  onScheduleVisit: (property: Property) => void;
  openAuthModal: () => void;
}

const DEFAULT_FILTERS: FilterState = {
  searchQuery: '',
  city: 'todas',
  neighborhood: '',
  purpose: 'todos',
  propertyType: 'todos',
  minPrice: 0,
  maxPrice: 0,
  bedrooms: 0,
  garageSpots: 0,
  hasCondo: 'todos',
  floorsCount: 0,
  agencyId: 'todos',
  sortBy: 'mais_buscados',
};

export const PropertyList: React.FC<PropertyListProps> = ({
  initialFilters,
  onSelectProperty,
  onScheduleVisit,
  openAuthModal,
}) => {
  const { properties, agencies } = useApp();
  const [filters, setFilters] = useState<FilterState>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  });

  const [viewMode, setViewMode] = useState<'grid' | 'split'>('grid');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | undefined>();

  // Extract unique cities from active properties
  const availableCities = useMemo(() => {
    const set = new Set<string>();
    properties.forEach((p) => {
      if (p.location.city) set.add(p.location.city);
    });
    return Array.from(set);
  }, [properties]);

  // Filtering Logic with all prompt criteria:
  // - localidade
  // - valor
  // - quantidade de quarto
  // - vagas de garagem
  // - se tem condomínio
  // - quantidade de pisos
  // - imobiliária
  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
      // Search query (title, description, neighborhood, code)
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(query);
        const matchesDesc = p.description.toLowerCase().includes(query);
        const matchesNeighborhood = p.location.neighborhood.toLowerCase().includes(query);
        const matchesCity = p.location.city.toLowerCase().includes(query);
        const matchesCode = p.code.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesNeighborhood && !matchesCity && !matchesCode) {
          return false;
        }
      }

      // City
      if (filters.city !== 'todas' && p.location.city !== filters.city) {
        return false;
      }

      // Purpose (locacao, venda)
      if (filters.purpose !== 'todos') {
        if (p.purpose !== 'ambos' && p.purpose !== filters.purpose) {
          return false;
        }
      }

      // Property Type
      if (filters.propertyType !== 'todos' && p.type !== filters.propertyType) {
        return false;
      }

      // Agency
      if (filters.agencyId !== 'todos' && p.agencyId !== filters.agencyId) {
        return false;
      }

      // Bedrooms
      if (filters.bedrooms > 0 && p.bedrooms < filters.bedrooms) {
        return false;
      }

      // Garage Spots
      if (filters.garageSpots > 0 && p.garageSpots < filters.garageSpots) {
        return false;
      }

      // Has Condo
      if (filters.hasCondo === 'sim' && !p.hasCondo) {
        return false;
      }
      if (filters.hasCondo === 'nao' && p.hasCondo) {
        return false;
      }

      // Floors Count (Quantidade de Pisos)
      if (filters.floorsCount > 0) {
        if (filters.floorsCount === 3 && p.floorsCount < 3) return false;
        if (filters.floorsCount < 3 && p.floorsCount !== filters.floorsCount) return false;
      }

      // Price Filter
      const effectivePrice =
        filters.purpose === 'venda'
          ? p.salePrice || 0
          : filters.purpose === 'locacao'
          ? p.rentPrice || 0
          : p.rentPrice || p.salePrice || 0;

      if (filters.minPrice > 0 && effectivePrice < filters.minPrice) {
        return false;
      }
      if (filters.maxPrice > 0 && effectivePrice > filters.maxPrice) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (filters.sortBy === 'mais_buscados') {
        return (b.searchCount || 0) - (a.searchCount || 0);
      }
      if (filters.sortBy === 'menor_preco') {
        const priceA = a.rentPrice || a.salePrice || 0;
        const priceB = b.rentPrice || b.salePrice || 0;
        return priceA - priceB;
      }
      if (filters.sortBy === 'maior_preco') {
        const priceA = a.rentPrice || a.salePrice || 0;
        const priceB = b.rentPrice || b.salePrice || 0;
        return priceB - priceA;
      }
      if (filters.sortBy === 'mais_recentes') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return 0;
    });
  }, [properties, filters]);

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  return (
    <div className="space-y-6">
      {/* Top Filter & Control Bar */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search bar input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por bairro, condomínio, código ou palavra-chave..."
              value={filters.searchQuery}
              onChange={(e) => setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-emerald-600 focus:bg-white transition"
            />
          </div>

          {/* Quick Purpose buttons */}
          <div className="flex items-center gap-1.5 self-start md:self-auto overflow-x-auto">
            {(['todos', 'locacao', 'venda'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setFilters((prev) => ({ ...prev, purpose: p }))}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  filters.purpose === p
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                {p === 'todos' ? 'Todos' : p === 'locacao' ? 'Locação' : 'Venda'}
              </button>
            ))}

            {/* Sort Dropdown */}
            <select
              value={filters.sortBy}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  sortBy: e.target.value as FilterState['sortBy'],
                }))
              }
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-stone-100 border border-stone-200 text-stone-800 focus:outline-emerald-600 cursor-pointer"
            >
              <option value="mais_buscados">🔥 Mais Buscados</option>
              <option value="menor_preco">Menor Preço</option>
              <option value="maior_preco">Maior Preço</option>
              <option value="mais_recentes">Mais Recentes</option>
            </select>

            {/* Toggle View Mode: Grid vs Split Map */}
            <div className="hidden sm:flex items-center border border-stone-200 rounded-lg p-0.5 bg-stone-100">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white shadow-xs text-stone-900 font-bold' : 'text-stone-500 hover:text-stone-900'
                }`}
                title="Grade de Imóveis"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('split')}
                className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition cursor-pointer ${
                  viewMode === 'split' ? 'bg-white shadow-xs text-stone-900 font-bold' : 'text-stone-500 hover:text-stone-900'
                }`}
                title="Visualização Dividida com Mapa"
              >
                <Map className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
              className="md:hidden px-3 py-1.5 bg-stone-800 text-white rounded-lg text-xs font-medium flex items-center gap-1"
            >
              <Filter className="w-3.5 h-3.5" />
              Filtros
            </button>
          </div>
        </div>

        {/* Detailed Filters Panel (Visible on Desktop, toggleable on mobile) */}
        <div
          className={`${
            mobileFilterOpen ? 'block' : 'hidden'
          } md:block pt-3 border-t border-stone-100`}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
            {/* 1. Localidade / Cidade */}
            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                Cidade
              </label>
              <select
                value={filters.city}
                onChange={(e) => setFilters((prev) => ({ ...prev, city: e.target.value }))}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-stone-800 focus:outline-emerald-600"
              >
                <option value="todas">Todas as Cidades</option>
                {availableCities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Quantidade de Quartos */}
            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1 flex items-center gap-1">
                <Bed className="w-3 h-3 text-stone-400" />
                Quartos
              </label>
              <select
                value={filters.bedrooms}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, bedrooms: Number(e.target.value) }))
                }
                className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-stone-800 focus:outline-emerald-600"
              >
                <option value={0}>Qualquer quantidade</option>
                <option value={1}>1+ quarto</option>
                <option value={2}>2+ quartos</option>
                <option value={3}>3+ quartos</option>
                <option value={4}>4+ quartos</option>
              </select>
            </div>

            {/* 3. Vagas de Garagem */}
            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1 flex items-center gap-1">
                <Car className="w-3 h-3 text-stone-400" />
                Vagas de Garagem
              </label>
              <select
                value={filters.garageSpots}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, garageSpots: Number(e.target.value) }))
                }
                className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-stone-800 focus:outline-emerald-600"
              >
                <option value={0}>Qualquer vaga</option>
                <option value={1}>1+ vaga</option>
                <option value={2}>2+ vagas</option>
                <option value={3}>3+ vagas</option>
                <option value={4}>4+ vagas</option>
              </select>
            </div>

            {/* 4. Se tem Condomínio */}
            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                Condomínio
              </label>
              <select
                value={filters.hasCondo}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    hasCondo: e.target.value as FilterState['hasCondo'],
                  }))
                }
                className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-stone-800 focus:outline-emerald-600"
              >
                <option value="todos">Todos (Com e Sem)</option>
                <option value="sim">Apenas com condomínio</option>
                <option value="nao">Sem condomínio (Isento)</option>
              </select>
            </div>

            {/* 5. Quantidade de Pisos (Pavimentos) */}
            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1 flex items-center gap-1">
                <Layers className="w-3 h-3 text-stone-400" />
                Quantidade de Pisos
              </label>
              <select
                value={filters.floorsCount}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, floorsCount: Number(e.target.value) }))
                }
                className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-stone-800 focus:outline-emerald-600"
              >
                <option value={0}>Todos os pisos</option>
                <option value={1}>1 Piso (Térreo)</option>
                <option value={2}>2 Pisos (Sobrado/Duplex)</option>
                <option value={3}>3+ Pisos (Triplex/Mansão)</option>
              </select>
            </div>

            {/* 6. Imobiliária Específica (Multi-empresa) */}
            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1 flex items-center gap-1">
                <Building className="w-3 h-3 text-stone-400" />
                Imobiliária
              </label>
              <select
                value={filters.agencyId}
                onChange={(e) => setFilters((prev) => ({ ...prev, agencyId: e.target.value }))}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-stone-800 focus:outline-emerald-600"
              >
                <option value="todos">Todas as Imobiliárias</option>
                {agencies.map((ag) => (
                  <option key={ag.id} value={ag.id}>
                    {ag.tradeName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Reset Filters & Count */}
          <div className="mt-3 flex items-center justify-between text-xs text-stone-500 pt-2 border-t border-stone-100">
            <span>
              Mostrando <strong className="text-stone-900">{filteredProperties.length}</strong> de{' '}
              {properties.length} imóveis cadastrados
            </span>

            <button
              onClick={handleResetFilters}
              className="text-stone-500 hover:text-emerald-700 font-medium flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Limpar Todos os Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area: Grid or Split View */}
      {viewMode === 'split' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Properties list */}
          <div className="lg:col-span-6 space-y-4 max-h-[850px] overflow-y-auto pr-1">
            {filteredProperties.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-stone-200 text-stone-500">
                Nenhum imóvel encontrado com os filtros selecionados.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                {filteredProperties.map((prop) => (
                  <PropertyCard
                    key={prop.id}
                    property={prop}
                    onSelect={(p) => {
                      setSelectedPropertyId(p.id);
                      onSelectProperty(p);
                    }}
                    onScheduleVisit={onScheduleVisit}
                    openAuthModal={openAuthModal}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Sticky Geolocated Map */}
          <div className="lg:col-span-6 sticky top-20">
            <GeolocatedMap
              properties={filteredProperties}
              selectedPropertyId={selectedPropertyId}
              onSelectProperty={onSelectProperty}
              onScheduleVisit={onScheduleVisit}
            />
          </div>
        </div>
      ) : (
        /* Regular Grid View */
        <div>
          {filteredProperties.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-stone-200 space-y-3">
              <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-stone-800">Nenhum imóvel encontrado</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Tente alterar a localidade, diminuir a quantidade de quartos ou limpar os filtros de condomínio e pisos.
              </p>
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Limpar Filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProperties.map((prop) => (
                <PropertyCard
                  key={prop.id}
                  property={prop}
                  onSelect={onSelectProperty}
                  onScheduleVisit={onScheduleVisit}
                  openAuthModal={openAuthModal}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
