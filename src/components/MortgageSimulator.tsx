import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Property } from '../types';
import {
  Calculator,
  Building,
  DollarSign,
  Percent,
  Calendar,
  ShieldCheck,
  TrendingDown,
  Info,
  MessageCircle,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  ChevronRight,
  ExternalLink,
  Search,
  Filter,
  SlidersHorizontal,
  X,
  RotateCcw,
  Check,
  Home,
  Bed,
  Crown,
  Lock,
  AlertTriangle,
} from 'lucide-react';
import { formatCurrency, createFinancingWhatsAppLink } from '../utils/formatters';
import { hasFeature, getAgencyPlan, PLAN_DETAILS } from '../utils/planPermissions';
import { UpgradePlanModal } from './UpgradePlanModal';

interface MortgageSimulatorProps {
  initialProperty?: Property | null;
  onSelectProperty?: (property: Property) => void;
  onScheduleVisit?: (property: Property) => void;
  isEmbedded?: boolean;
}

export const MortgageSimulator: React.FC<MortgageSimulatorProps> = ({
  initialProperty,
  onSelectProperty,
  onScheduleVisit,
  isEmbedded = false,
}) => {
  const { properties, agencies } = useApp();

  // Filter properties that have a sale price
  const saleProperties = useMemo(() => {
    return properties.filter(
      (p) => (p.purpose === 'venda' || p.purpose === 'ambos') && p.salePrice && p.salePrice > 0
    );
  }, [properties]);

  // Search and Multi-Filter State for Simulator
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCity, setFilterCity] = useState('todas');
  const [filterType, setFilterType] = useState('todos');
  const [filterPriceRange, setFilterPriceRange] = useState('todos');
  const [filterBedrooms, setFilterBedrooms] = useState<number>(0);
  const [filterMcmvOnly, setFilterMcmvOnly] = useState<boolean>(false);
  const [filterFgtsOnly, setFilterFgtsOnly] = useState<boolean>(false);
  const [filterAnaliseGratuitaOnly, setFilterAnaliseGratuitaOnly] = useState<boolean>(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState<boolean>(false);

  // Available unique cities for filter
  const availableCities = useMemo(() => {
    const set = new Set<string>();
    saleProperties.forEach((p) => {
      if (p.location?.city) set.add(p.location.city);
    });
    return Array.from(set).sort();
  }, [saleProperties]);

  // Filtered Sale Properties based on search and filters
  const filteredSaleProperties = useMemo(() => {
    return saleProperties.filter((p) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const titleMatch = (p.title || '').toLowerCase().includes(query);
        const codeMatch = (p.code || '').toLowerCase().includes(query);
        const cityMatch = (p.location?.city || '').toLowerCase().includes(query);
        const neighMatch = (p.location?.neighborhood || '').toLowerCase().includes(query);
        const addrMatch = (p.location?.address || '').toLowerCase().includes(query);
        if (!titleMatch && !codeMatch && !cityMatch && !neighMatch && !addrMatch) {
          return false;
        }
      }

      if (filterCity !== 'todas' && p.location?.city !== filterCity) {
        return false;
      }

      if (filterType !== 'todos' && p.type !== filterType) {
        return false;
      }

      if (filterBedrooms > 0 && p.bedrooms < filterBedrooms) {
        return false;
      }

      if (p.salePrice) {
        if (filterPriceRange === 'mcmv_ate_350' && p.salePrice > 350000) return false;
        if (filterPriceRange === '350_750' && (p.salePrice <= 350000 || p.salePrice > 750000)) return false;
        if (filterPriceRange === '750_1500' && (p.salePrice <= 750000 || p.salePrice > 1500000)) return false;
        if (filterPriceRange === 'acima_1500' && p.salePrice <= 1500000) return false;
      }

      if (filterMcmvOnly && !p.minhaCasaMinhaVida) return false;
      if (filterFgtsOnly && !p.fgts) return false;
      if (filterAnaliseGratuitaOnly && !p.analiseCreditoGratuita) return false;

      return true;
    });
  }, [
    saleProperties,
    searchQuery,
    filterCity,
    filterType,
    filterPriceRange,
    filterBedrooms,
    filterMcmvOnly,
    filterFgtsOnly,
    filterAnaliseGratuitaOnly,
  ]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim()) count++;
    if (filterCity !== 'todas') count++;
    if (filterType !== 'todos') count++;
    if (filterPriceRange !== 'todos') count++;
    if (filterBedrooms > 0) count++;
    if (filterMcmvOnly) count++;
    if (filterFgtsOnly) count++;
    if (filterAnaliseGratuitaOnly) count++;
    return count;
  }, [
    searchQuery,
    filterCity,
    filterType,
    filterPriceRange,
    filterBedrooms,
    filterMcmvOnly,
    filterFgtsOnly,
    filterAnaliseGratuitaOnly,
  ]);

  const clearAllFilters = () => {
    setSearchQuery('');
    setFilterCity('todas');
    setFilterType('todos');
    setFilterPriceRange('todos');
    setFilterBedrooms(0);
    setFilterMcmvOnly(false);
    setFilterFgtsOnly(false);
    setFilterAnaliseGratuitaOnly(false);
  };

  // Selected property state
  const [selectedPropId, setSelectedPropId] = useState<string>(
    initialProperty ? initialProperty.id : saleProperties[0]?.id || ''
  );

  const selectedProperty = useMemo(() => {
    if (selectedPropId === 'custom') return null;
    return saleProperties.find((p) => p.id === selectedPropId) || null;
  }, [selectedPropId, saleProperties]);

  const agency = useMemo(() => {
    if (!selectedProperty) return agencies[0] || null;
    return agencies.find((a) => a.id === selectedProperty.agencyId) || agencies[0] || null;
  }, [selectedProperty, agencies]);

  // Core Simulation Parameters
  const [propertyPrice, setPropertyPrice] = useState<number>(() => {
    if (initialProperty?.salePrice) return initialProperty.salePrice;
    return saleProperties[0]?.salePrice || 1250000;
  });

  // Down payment percentage (default 20% - Brazilian banking standard)
  const [downPaymentPercent, setDownPaymentPercent] = useState<number>(20);
  const [downPaymentAmount, setDownPaymentAmount] = useState<number>(() =>
    Math.round(((initialProperty?.salePrice || saleProperties[0]?.salePrice || 1250000) * 20) / 100)
  );

  // Term in years (default 30 years / 360 months)
  const [termYears, setTermYears] = useState<number>(30);

  // Annual Interest Rate (default 9.9% a.a.)
  const [annualInterestRate, setAnnualInterestRate] = useState<number>(9.9);

  // Amortization System ('SAC' or 'PRICE')
  const [amortizationSystem, setAmortizationSystem] = useState<'SAC' | 'PRICE'>('SAC');

  // Handle property dropdown change
  const handlePropertyChange = (propId: string) => {
    setSelectedPropId(propId);
    if (propId !== 'custom') {
      const found = saleProperties.find((p) => p.id === propId);
      if (found && found.salePrice) {
        setPropertyPrice(found.salePrice);
        const newDown = Math.round((found.salePrice * downPaymentPercent) / 100);
        setDownPaymentAmount(newDown);
      }
    }
  };

  // Keep down payment amount synchronized when percent changes
  const handleDownPercentChange = (pct: number) => {
    setDownPaymentPercent(pct);
    setDownPaymentAmount(Math.round((propertyPrice * pct) / 100));
  };

  // Keep down payment percent synchronized when amount changes
  const handleDownAmountChange = (amount: number) => {
    const validAmount = Math.max(0, Math.min(amount, propertyPrice));
    setDownPaymentAmount(validAmount);
    if (propertyPrice > 0) {
      setDownPaymentPercent(Math.round((validAmount / propertyPrice) * 100));
    }
  };

  // When property price input changes
  const handlePriceChange = (price: number) => {
    const validPrice = Math.max(10000, price);
    setPropertyPrice(validPrice);
    setDownPaymentAmount(Math.round((validPrice * downPaymentPercent) / 100));
  };

  // Calculations
  const loanAmount = Math.max(0, propertyPrice - downPaymentAmount);
  const totalMonths = termYears * 12;
  const monthlyRate = annualInterestRate / 100 / 12; // Nominal monthly rate

  // SAC Calculation:
  // Monthly amortization = loanAmount / totalMonths
  // Interest in month k = Remaining balance * monthlyRate
  // First installment = monthlyAmortization + loanAmount * monthlyRate
  // Last installment = monthlyAmortization + monthlyAmortization * monthlyRate
  const sacMonthlyAmortization = totalMonths > 0 ? loanAmount / totalMonths : 0;
  const sacFirstInstallment = sacMonthlyAmortization + loanAmount * monthlyRate;
  const sacLastInstallment = sacMonthlyAmortization + sacMonthlyAmortization * monthlyRate;
  const sacTotalInterest = ((totalMonths + 1) / 2) * loanAmount * monthlyRate;
  const sacTotalPaid = loanAmount + sacTotalInterest;

  // PRICE Calculation:
  // PMT = loanAmount * [monthlyRate * (1 + monthlyRate)^totalMonths] / [(1 + monthlyRate)^totalMonths - 1]
  const priceInstallment = useMemo(() => {
    if (loanAmount <= 0 || totalMonths <= 0 || monthlyRate <= 0) return 0;
    const factor = Math.pow(1 + monthlyRate, totalMonths);
    return (loanAmount * (monthlyRate * factor)) / (factor - 1);
  }, [loanAmount, totalMonths, monthlyRate]);

  const priceTotalPaid = priceInstallment * totalMonths;
  const priceTotalInterest = Math.max(0, priceTotalPaid - loanAmount);

  // Active values based on selected amortization
  const activeFirstInstallment = amortizationSystem === 'SAC' ? sacFirstInstallment : priceInstallment;
  const activeLastInstallment = amortizationSystem === 'SAC' ? sacLastInstallment : priceInstallment;
  const activeTotalInterest = amortizationSystem === 'SAC' ? sacTotalInterest : priceTotalInterest;
  const activeTotalCost = propertyPrice + activeTotalInterest;

  // Minimum recommended household income (Banco Central guideline: installment <= 30% of gross income)
  const minRecommendedIncome = activeFirstInstallment / 0.3;

  // Percent proportions for visual breakdown bar
  const totalBar = downPaymentAmount + loanAmount + activeTotalInterest;
  const downPct = totalBar > 0 ? (downPaymentAmount / totalBar) * 100 : 0;
  const loanPct = totalBar > 0 ? (loanAmount / totalBar) * 100 : 0;
  const interestPct = totalBar > 0 ? (activeTotalInterest / totalBar) * 100 : 0;

  // Sample progression points
  const progressionPoints = useMemo(() => {
    if (amortizationSystem === 'PRICE') {
      return [
        { month: 1, installment: priceInstallment, balance: loanAmount - (priceInstallment - loanAmount * monthlyRate) },
        { month: 12, installment: priceInstallment, balance: loanAmount * 0.98 },
        { month: 60, installment: priceInstallment, balance: loanAmount * 0.9 },
        { month: 120, installment: priceInstallment, balance: loanAmount * 0.75 },
        { month: totalMonths, installment: priceInstallment, balance: 0 },
      ];
    }

    // SAC progression
    const getSacPoint = (m: number) => {
      const balanceBefore = loanAmount - sacMonthlyAmortization * (m - 1);
      const inst = sacMonthlyAmortization + balanceBefore * monthlyRate;
      const balanceAfter = Math.max(0, loanAmount - sacMonthlyAmortization * m);
      return { month: m, installment: inst, balance: balanceAfter };
    };

    const pts = [getSacPoint(1)];
    if (totalMonths >= 12) pts.push(getSacPoint(12));
    if (totalMonths >= 60) pts.push(getSacPoint(60));
    if (totalMonths >= 120) pts.push(getSacPoint(120));
    pts.push(getSacPoint(totalMonths));
    return pts;
  }, [amortizationSystem, loanAmount, monthlyRate, priceInstallment, sacMonthlyAmortization, totalMonths]);

  // WhatsApp financing link
  const whatsAppLink = useMemo(() => {
    if (!agency?.whatsapp) return '#';
    const title = selectedProperty ? selectedProperty.title : 'Imóvel sob consulta';
    const code = selectedProperty ? selectedProperty.code : 'SIMULAÇÃO-SITE';
    return createFinancingWhatsAppLink(
      agency.whatsapp,
      title,
      code,
      propertyPrice,
      downPaymentAmount,
      termYears,
      activeFirstInstallment,
      amortizationSystem
    );
  }, [
    agency,
    selectedProperty,
    propertyPrice,
    downPaymentAmount,
    termYears,
    activeFirstInstallment,
    amortizationSystem,
  ]);

  return (
    <div className={`space-y-6 ${isEmbedded ? '' : 'max-w-6xl mx-auto'}`}>
      {/* Header section (only on standalone page) */}
      {!isEmbedded && (
        <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-stone-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold border border-emerald-500/30">
                <Calculator className="w-3.5 h-3.5" />
                Simulador de Financiamento Imobiliário
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-serif tracking-tight text-white">
                Simule a Parcela do seu Imóvel para Venda
              </h1>
              <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                Descubra em segundos o valor estimado das prestações mensais, entrada mínima recomendada,
                amortização SAC ou PRICE e a renda familiar sugerida para a compra do imóvel dos seus sonhos na rede.
              </p>
            </div>

            <div className="bg-stone-800/80 border border-stone-700 rounded-xl p-4 text-xs space-y-2 shrink-0 md:w-72">
              <div className="text-stone-400 font-medium">Condições Médias de Mercado:</div>
              <div className="flex items-center justify-between font-mono">
                <span className="text-stone-300">Entrada Mínima:</span>
                <span className="text-emerald-400 font-bold">20% do valor</span>
              </div>
              <div className="flex items-center justify-between font-mono">
                <span className="text-stone-300">Prazo Máximo:</span>
                <span className="text-white font-bold">Até 35 anos (420 m)</span>
              </div>
              <div className="flex items-center justify-between font-mono">
                <span className="text-stone-300">Comprometimento:</span>
                <span className="text-white font-bold">Até 30% da renda</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plan feature notice if selected agency is on ESSENCIAL */}
      {agency && !hasFeature(agency, 'simulator') && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 border border-amber-300">
              <Crown className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-amber-950">
                  Recurso dos Planos Profissional e Premium
                </h3>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-200 text-amber-900 border border-amber-300">
                  {agency.tradeName || agency.name}: Plano Essencial
                </span>
              </div>
              <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                A imobiliária <strong>{agency.tradeName || agency.name}</strong> está vinculada ao <strong>Plano Essencial</strong>, que não contempla o Simulador Imobiliário com taxas e prazos customizados. Faça upgrade para o <strong>Plano Profissional</strong> para ativar a integração completa de simulações com tabelas SAC e Price.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsUpgradeModalOpen(true)}
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shrink-0 shadow-sm transition cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" />
            <span>Fazer Upgrade da Imobiliária</span>
          </button>
        </div>
      )}

      {/* Main Simulator Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Controls (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-xs space-y-5">
          {/* Step 1: Select Property or Enter Value with Search Bar and Multiple Filters */}
          <div className="space-y-4 pb-5 border-b border-stone-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
                <Building className="w-4 h-4 text-emerald-600" />
                1. Escolha o Imóvel Desejado para Simular
              </label>
              <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                {saleProperties.length} imóveis à venda na rede
              </span>
            </div>

            {/* Search Bar & Multi-Filters Box */}
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3.5 space-y-3 shadow-2xs">
              {/* Main Search Input */}
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Pesquisar por código (ex: EXT-101, VRT-101), bairro, cidade ou nome do imóvel..."
                  className="w-full text-xs sm:text-sm pl-10 pr-9 py-2.5 bg-white border border-stone-300 rounded-xl focus:outline-emerald-600 focus:border-emerald-600 placeholder:text-stone-400 text-stone-800 shadow-2xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5 rounded-md cursor-pointer"
                    title="Limpar texto da busca"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Primary Quick Filters Row */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
                {/* Cidade Filter */}
                <div className="sm:col-span-5">
                  <select
                    value={filterCity}
                    onChange={(e) => setFilterCity(e.target.value)}
                    className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-stone-700 focus:outline-emerald-600 font-medium"
                  >
                    <option value="todas">📍 Todas as Cidades ({saleProperties.length})</option>
                    {availableCities.map((city) => {
                      const count = saleProperties.filter((p) => p.location.city === city).length;
                      return (
                        <option key={city} value={city}>
                          {city} ({count} imóveis)
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Faixa de Preço Filter */}
                <div className="sm:col-span-4">
                  <select
                    value={filterPriceRange}
                    onChange={(e) => setFilterPriceRange(e.target.value)}
                    className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-stone-700 focus:outline-emerald-600 font-medium"
                  >
                    <option value="todos">💲 Qualquer Valor</option>
                    <option value="mcmv_ate_350">Até R$ 350 mil (MCMV)</option>
                    <option value="350_750">R$ 350 mil a R$ 750 mil</option>
                    <option value="750_1500">R$ 750 mil a R$ 1,5 milhão</option>
                    <option value="acima_1500">Acima de R$ 1,5 milhão</option>
                  </select>
                </div>

                {/* Advanced Filters Toggle & Reset Button */}
                <div className="sm:col-span-3 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowAdvancedFilters((prev) => !prev)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                      showAdvancedFilters || activeFiltersCount > 0
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                    }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Filtros</span>
                    {activeFiltersCount > 0 && (
                      <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">
                        {activeFiltersCount}
                      </span>
                    )}
                  </button>

                  {activeFiltersCount > 0 && (
                    <button
                      type="button"
                      onClick={clearAllFilters}
                      className="p-2 bg-white hover:bg-rose-50 text-stone-500 hover:text-rose-600 border border-stone-300 hover:border-rose-300 rounded-xl transition cursor-pointer"
                      title="Limpar todos os filtros"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Advanced Expandable Filters Panel */}
              {showAdvancedFilters && (
                <div className="pt-3 border-t border-stone-200/80 space-y-3 animate-fade-in text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Tipo de Imóvel */}
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                        Tipo de Imóvel:
                      </label>
                      <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="w-full bg-white border border-stone-300 rounded-xl px-2.5 py-1.5 text-stone-700 focus:outline-emerald-600"
                      >
                        <option value="todos">Todos os Tipos</option>
                        <option value="casa">Casa</option>
                        <option value="apartamento">Apartamento</option>
                        <option value="cobertura">Cobertura</option>
                        <option value="chacara">Chácara / Sítio</option>
                        <option value="terreno">Terreno / Lote</option>
                        <option value="comercial">Comercial</option>
                      </select>
                    </div>

                    {/* Quartos Mínimos */}
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                        Quartos (Mínimo):
                      </label>
                      <select
                        value={filterBedrooms}
                        onChange={(e) => setFilterBedrooms(Number(e.target.value))}
                        className="w-full bg-white border border-stone-300 rounded-xl px-2.5 py-1.5 text-stone-700 focus:outline-emerald-600"
                      >
                        <option value={0}>Qualquer quantidade</option>
                        <option value={1}>1+ quarto</option>
                        <option value={2}>2+ quartos</option>
                        <option value={3}>3+ quartos</option>
                        <option value={4}>4+ quartos</option>
                      </select>
                    </div>
                  </div>

                  {/* Multi-selectable Financing Chips */}
                  <div>
                    <span className="block text-[11px] font-semibold text-stone-600 mb-1.5">
                      Filtros Especiais de Financiamento:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setFilterMcmvOnly((prev) => !prev)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                          filterMcmvOnly
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                            : 'bg-white text-stone-700 border-stone-300 hover:border-emerald-500'
                        }`}
                      >
                        <span>🏠</span>
                        <span>Minha Casa Minha Vida</span>
                        {filterMcmvOnly && <Check className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => setFilterFgtsOnly((prev) => !prev)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                          filterFgtsOnly
                            ? 'bg-blue-600 text-white border-blue-700 shadow-2xs'
                            : 'bg-white text-stone-700 border-stone-300 hover:border-blue-500'
                        }`}
                      >
                        <span>🛡️</span>
                        <span>Aceita FGTS</span>
                        {filterFgtsOnly && <Check className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => setFilterAnaliseGratuitaOnly((prev) => !prev)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                          filterAnaliseGratuitaOnly
                            ? 'bg-amber-600 text-white border-amber-700 shadow-2xs'
                            : 'bg-white text-stone-700 border-stone-300 hover:border-amber-500'
                        }`}
                      >
                        <span>⚡</span>
                        <span>Análise Gratuita de Crédito</span>
                        {filterAnaliseGratuitaOnly && <Check className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Status Header of Filter Results */}
              <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1">
                <span>
                  Mostrando <strong className="text-stone-800 font-bold">{filteredSaleProperties.length}</strong> de{' '}
                  {saleProperties.length} imóveis à venda
                </span>
                {selectedPropId !== 'custom' ? (
                  <button
                    type="button"
                    onClick={() => handlePropertyChange('custom')}
                    className="text-emerald-700 hover:text-emerald-900 font-semibold underline cursor-pointer"
                  >
                    Simular valor manual (sem imóvel)
                  </button>
                ) : (
                  <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Modo: Valor Manual Personalizado
                  </span>
                )}
              </div>

              {/* Search Results / Property Carousel-Grid */}
              {filteredSaleProperties.length === 0 ? (
                <div className="bg-white border border-stone-200 rounded-xl p-6 text-center text-xs text-stone-500 space-y-2">
                  <p>Nenhum imóvel encontrado com os critérios pesquisados.</p>
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg font-semibold transition cursor-pointer"
                  >
                    Limpar filtros de busca
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
                  {filteredSaleProperties.map((p) => {
                    const isSelected = selectedPropId === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => handlePropertyChange(p.id)}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex gap-3 ${
                          isSelected
                            ? 'bg-emerald-50/80 border-emerald-600 ring-2 ring-emerald-600/30 shadow-xs'
                            : 'bg-white border-stone-200 hover:border-stone-300 hover:bg-stone-50/60'
                        }`}
                      >
                        <img
                          src={p.images[0]}
                          alt={p.title}
                          className="w-16 h-16 rounded-lg object-cover shrink-0 border border-stone-200"
                        />
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between gap-1 text-[10px]">
                              <span className="font-mono font-bold bg-stone-100 text-stone-700 px-1.5 py-0.5 rounded">
                                {p.code}
                              </span>
                              <span className="text-stone-500 truncate">{p.location.city}</span>
                            </div>
                            <h4 className="text-xs font-bold text-stone-900 truncate mt-0.5">
                              {p.title}
                            </h4>
                          </div>

                          <div className="flex items-center justify-between gap-1 mt-1">
                            <span className="text-xs font-extrabold text-emerald-700 font-mono">
                              {formatCurrency(p.salePrice)}
                            </span>
                            {isSelected ? (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                                Selecionado
                              </span>
                            ) : (
                              <span className="text-[10px] text-stone-400 hover:text-emerald-700 font-medium">
                                Simular este
                              </span>
                            )}
                          </div>

                          {/* Quick Financing Tags */}
                          <div className="flex items-center gap-1 mt-1 text-[9px] flex-wrap">
                            {p.minhaCasaMinhaVida && (
                              <span className="bg-emerald-100 text-emerald-800 font-bold px-1 rounded">
                                MCMV
                              </span>
                            )}
                            {p.fgts && (
                              <span className="bg-blue-100 text-blue-800 font-bold px-1 rounded">
                                FGTS
                              </span>
                            )}
                            {p.analiseCreditoGratuita && (
                              <span className="bg-amber-100 text-amber-900 font-bold px-1 rounded">
                                Análise Grátis
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Selected Property preview card */}
            {selectedProperty && (
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between gap-2 border-b border-emerald-200/70 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                    <span className="text-xs font-bold text-emerald-950">
                      Imóvel em Simulação Ativa
                    </span>
                  </div>
                  <span className="font-mono text-xs font-bold bg-white text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded">
                    Cód: {selectedProperty.code}
                  </span>
                </div>

                <div className="flex items-start gap-3.5">
                  <img
                    src={selectedProperty.images[0]}
                    alt={selectedProperty.title}
                    className="w-20 h-20 rounded-xl object-cover shrink-0 border border-emerald-200 shadow-2xs"
                  />
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="text-xs font-bold text-stone-900 truncate">
                      {selectedProperty.title}
                    </div>
                    <div className="text-[11px] text-stone-600 flex items-center gap-1">
                      <span>{selectedProperty.location.neighborhood}, {selectedProperty.location.city} - {selectedProperty.location.state}</span>
                    </div>
                    <div className="text-sm font-extrabold text-emerald-800 font-mono">
                      {formatCurrency(selectedProperty.salePrice)}
                    </div>

                    {/* Financing Conditions in Selected Card */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5 text-[10px]">
                      {selectedProperty.minhaCasaMinhaVida && (
                        <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.5 rounded font-bold">
                          🏠 Minha Casa Minha Vida
                        </span>
                      )}
                      {selectedProperty.fgts && (
                        <span className="bg-blue-100 text-blue-800 border border-blue-300 px-1.5 py-0.5 rounded font-bold">
                          🛡️ Aceita FGTS
                        </span>
                      )}
                      {selectedProperty.analiseCreditoGratuita && (
                        <span className="bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded font-bold">
                          ⚡ Análise Gratuita de Crédito
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-emerald-200/60 flex-wrap">
                  <div className="text-[11px] text-stone-600">
                    Imobiliária responsável: <strong className="text-stone-800">{agency?.tradeName}</strong>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {onSelectProperty && (
                      <button
                        type="button"
                        onClick={() => onSelectProperty(selectedProperty)}
                        className="text-[11px] text-stone-700 hover:text-stone-900 font-semibold px-2.5 py-1 bg-white border border-stone-300 rounded-lg hover:shadow-xs transition cursor-pointer"
                      >
                        Ver Detalhes
                      </button>
                    )}
                    {onScheduleVisit && (
                      <button
                        type="button"
                        onClick={() => onScheduleVisit(selectedProperty)}
                        className="text-[11px] text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 font-bold px-2.5 py-1 rounded-lg transition cursor-pointer"
                      >
                        Agendar Visita
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Valor do Imóvel Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-stone-700">Valor do Imóvel para Venda:</span>
                <span className="text-xs font-extrabold text-emerald-700 font-mono">
                  {formatCurrency(propertyPrice)}
                </span>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-xs text-stone-500 font-bold">
                  R$
                </span>
                <input
                  type="number"
                  min="50000"
                  max="50000000"
                  step="10000"
                  value={propertyPrice}
                  onChange={(e) => handlePriceChange(Number(e.target.value))}
                  className="w-full pl-10 pr-4 py-2.5 border border-stone-300 rounded-xl text-sm font-bold text-stone-900 focus:outline-emerald-600 focus:ring-2 focus:ring-emerald-600/10 font-mono"
                />
              </div>

              {/* Quick price adjusters */}
              <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1 text-[11px]">
                <span className="text-stone-500 text-[10px]">Ajuste rápido:</span>
                <button
                  type="button"
                  onClick={() => handlePriceChange(Math.max(50000, propertyPrice - 100000))}
                  className="px-2 py-0.5 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium transition cursor-pointer"
                >
                  - R$ 100 mil
                </button>
                <button
                  type="button"
                  onClick={() => handlePriceChange(propertyPrice + 100000)}
                  className="px-2 py-0.5 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium transition cursor-pointer"
                >
                  + R$ 100 mil
                </button>
                <button
                  type="button"
                  onClick={() => handlePriceChange(propertyPrice + 500000)}
                  className="px-2 py-0.5 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium transition cursor-pointer"
                >
                  + R$ 500 mil
                </button>
              </div>
            </div>
          </div>

          {/* Step 2: Down Payment (Entrada) */}
          <div className="space-y-3 pb-5 border-b border-stone-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                <Percent className="w-4 h-4 text-emerald-600" />
                2. Valor da Entrada ({downPaymentPercent}%)
              </label>
              <span className="text-xs font-bold text-stone-900 font-mono">
                {formatCurrency(downPaymentAmount)}
              </span>
            </div>

            {/* Slider */}
            <div>
              <input
                type="range"
                min="10"
                max="90"
                step="5"
                value={downPaymentPercent}
                onChange={(e) => handleDownPercentChange(Number(e.target.value))}
                className="w-full accent-emerald-600 h-2 bg-stone-200 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-stone-500 mt-1">
                <span>10% (R$ {formatCurrency((propertyPrice * 10) / 100)})</span>
                <span className="font-semibold text-emerald-700">Mínimo sugerido: 20%</span>
                <span>90% (R$ {formatCurrency((propertyPrice * 90) / 100)})</span>
              </div>
            </div>

            {/* Quick percent buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] text-stone-500">Atalhos:</span>
              {[20, 30, 40, 50, 60].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => handleDownPercentChange(pct)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    downPaymentPercent === pct
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                  }`}
                >
                  {pct}% ({formatCurrency((propertyPrice * pct) / 100)})
                </button>
              ))}
            </div>

            {/* Financed amount calculation */}
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 flex items-center justify-between text-xs">
              <span className="text-stone-600">Saldo a ser financiado pelo banco:</span>
              <span className="font-extrabold text-stone-900 font-mono text-sm">
                {formatCurrency(loanAmount)} ({100 - downPaymentPercent}%)
              </span>
            </div>
          </div>

          {/* Step 3: Term (Prazo em Anos) */}
          <div className="space-y-3 pb-5 border-b border-stone-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-600" />
                3. Prazo do Financiamento ({termYears} anos / {totalMonths} meses)
              </label>
              <span className="text-xs text-stone-500 font-medium">
                {totalMonths} parcelas
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[10, 15, 20, 25, 30, 35].map((years) => (
                <button
                  key={years}
                  type="button"
                  onClick={() => setTermYears(years)}
                  className={`p-2 rounded-xl text-center border transition cursor-pointer ${
                    termYears === years
                      ? 'bg-emerald-600 border-emerald-600 text-white font-bold shadow-xs'
                      : 'bg-stone-50 border-stone-200 text-stone-700 hover:border-stone-300 font-medium'
                  }`}
                >
                  <div className="text-xs">{years} Anos</div>
                  <div className={`text-[10px] ${termYears === years ? 'text-emerald-100' : 'text-stone-500'}`}>
                    {years * 12} meses
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Step 4: Taxa de Juros & Sistema de Amortização */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Taxa de Juros */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-700 flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
                Taxa de Juros Anual Estimada
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="5"
                  max="20"
                  value={annualInterestRate}
                  onChange={(e) => setAnnualInterestRate(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:outline-emerald-600"
                />
                <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-stone-500 font-bold">
                  % a.a.
                </span>
              </div>
              <div className="flex gap-1.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => setAnnualInterestRate(9.5)}
                  className={`px-2 py-0.5 rounded border ${
                    annualInterestRate === 9.5
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold'
                      : 'bg-stone-100 text-stone-600 border-stone-200'
                  }`}
                >
                  9,5% (SFH Caixa)
                </button>
                <button
                  type="button"
                  onClick={() => setAnnualInterestRate(10.2)}
                  className={`px-2 py-0.5 rounded border ${
                    annualInterestRate === 10.2
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold'
                      : 'bg-stone-100 text-stone-600 border-stone-200'
                  }`}
                >
                  10,2% (Privados)
                </button>
              </div>
            </div>

            {/* Sistema de Amortização */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-700 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Tabela de Amortização
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAmortizationSystem('SAC')}
                  className={`p-2 rounded-xl text-left border transition cursor-pointer ${
                    amortizationSystem === 'SAC'
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-950 font-bold ring-2 ring-emerald-600/10'
                      : 'bg-stone-50 border-stone-200 text-stone-700 hover:border-stone-300'
                  }`}
                >
                  <div className="text-xs">Tabela SAC</div>
                  <div className="text-[10px] text-stone-500 font-normal">Parcelas decrescentes</div>
                </button>

                <button
                  type="button"
                  onClick={() => setAmortizationSystem('PRICE')}
                  className={`p-2 rounded-xl text-left border transition cursor-pointer ${
                    amortizationSystem === 'PRICE'
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-950 font-bold ring-2 ring-emerald-600/10'
                      : 'bg-stone-50 border-stone-200 text-stone-700 hover:border-stone-300'
                  }`}
                >
                  <div className="text-xs">Tabela PRICE</div>
                  <div className="text-[10px] text-stone-500 font-normal">Parcelas fixas</div>
                </button>
              </div>
              <p className="text-[10px] text-stone-500">
                {amortizationSystem === 'SAC'
                  ? 'No SAC, a 1ª parcela é mais alta e o valor diminui todo mês.'
                  : 'Na PRICE, você paga sempre a mesma prestação mensal até o fim.'}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Results Dashboard (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Main Results Highlight Card */}
          <div className="bg-stone-900 text-white rounded-2xl p-5 sm:p-6 shadow-xl border border-stone-800 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Resultado da Simulação</div>
                  <div className="text-[10px] text-stone-400">
                    Sistema {amortizationSystem} • {termYears} Anos ({totalMonths} meses)
                  </div>
                </div>
              </div>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-semibold px-2 py-0.5 rounded border border-emerald-500/30">
                {annualInterestRate}% a.a.
              </span>
            </div>

            {/* Installment Main Number */}
            <div>
              <div className="text-xs text-stone-400 font-medium">
                {amortizationSystem === 'SAC' ? 'Primeira Parcela Estimada (1º Mês)' : 'Parcela Mensal Fixa'}
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400 font-mono tracking-tight mt-1">
                {formatCurrency(activeFirstInstallment)}
                <span className="text-xs font-normal text-stone-400 ml-1">/mês</span>
              </div>

              {amortizationSystem === 'SAC' && (
                <div className="mt-2 text-xs text-stone-300 flex items-center justify-between bg-stone-800/80 p-2.5 rounded-xl border border-stone-700/80">
                  <span className="text-stone-400">Última Parcela ({totalMonths}º Mês):</span>
                  <span className="font-bold text-emerald-300 font-mono">
                    {formatCurrency(activeLastInstallment)}/mês
                  </span>
                </div>
              )}
            </div>

            {/* Minimum Income Requirement */}
            <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3.5 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-300 font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Renda Familiar Mínima Sugerida:
                </span>
                <span className="font-extrabold text-white font-mono">
                  {formatCurrency(minRecommendedIncome)}
                </span>
              </div>
              <div className="text-[10px] text-stone-400 leading-snug">
                Pode ser composta por até 3 pessoas da mesma família (cônjuge, pais ou filhos).
              </div>
            </div>

            {/* Financial Summary Breakdown */}
            <div className="space-y-2 text-xs pt-2 border-t border-stone-800">
              <div className="flex justify-between text-stone-400">
                <span>Valor Total do Imóvel:</span>
                <span className="text-white font-mono font-medium">{formatCurrency(propertyPrice)}</span>
              </div>
              <div className="flex justify-between text-stone-400">
                <span>Entrada ({downPaymentPercent}%):</span>
                <span className="text-emerald-400 font-mono font-medium">{formatCurrency(downPaymentAmount)}</span>
              </div>
              <div className="flex justify-between text-stone-400">
                <span>Valor Financiado:</span>
                <span className="text-sky-300 font-mono font-medium">{formatCurrency(loanAmount)}</span>
              </div>
              <div className="flex justify-between text-stone-400">
                <span>Juros Estimados ({termYears} anos):</span>
                <span className="text-amber-300 font-mono font-medium">{formatCurrency(activeTotalInterest)}</span>
              </div>
              <div className="flex justify-between text-stone-300 font-bold pt-2 border-t border-stone-800">
                <span>Custo Efetivo Total Estimado:</span>
                <span className="text-white font-mono">{formatCurrency(activeTotalCost)}</span>
              </div>
            </div>

            {/* Visual breakdown bar */}
            <div className="space-y-1.5">
              <div className="text-[10px] text-stone-400 flex justify-between">
                <span>Composição do Pagamento Total:</span>
                <span>100%</span>
              </div>
              <div className="w-full h-3 bg-stone-800 rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${downPct}%` }}
                  className="bg-emerald-500 h-full"
                  title={`Entrada: ${downPct.toFixed(0)}%`}
                />
                <div
                  style={{ width: `${loanPct}%` }}
                  className="bg-sky-500 h-full"
                  title={`Principal Financiado: ${loanPct.toFixed(0)}%`}
                />
                <div
                  style={{ width: `${interestPct}%` }}
                  className="bg-amber-500 h-full"
                  title={`Juros: ${interestPct.toFixed(0)}%`}
                />
              </div>
              <div className="flex items-center justify-between text-[9px] text-stone-400">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Entrada ({downPct.toFixed(0)}%)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-sky-500 inline-block" /> Financiamento ({loanPct.toFixed(0)}%)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Juros ({interestPct.toFixed(0)}%)
                </span>
              </div>
            </div>

            {/* Direct Action Buttons */}
            <div className="space-y-2 pt-2">
              <a
                href={whatsAppLink}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                Falar com Especialista no WhatsApp
              </a>

              {selectedProperty && onScheduleVisit && (
                <button
                  type="button"
                  onClick={() => onScheduleVisit(selectedProperty)}
                  className="w-full py-2.5 px-4 bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-stone-700 transition cursor-pointer"
                >
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  Agendar Visita a este Imóvel
                </button>
              )}
            </div>
          </div>

          {/* Evolution Table Card */}
          <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs space-y-2.5">
            <div className="text-xs font-bold text-stone-800 flex items-center justify-between">
              <span>Evolução das Prestações ({amortizationSystem})</span>
              <span className="text-[10px] text-stone-500">Estimativa</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-[11px] text-left">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500">
                    <th className="py-1.5 font-semibold">Mês</th>
                    <th className="py-1.5 font-semibold text-right">Parcela Estimada</th>
                    <th className="py-1.5 font-semibold text-right">Saldo Restante</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-mono">
                  {progressionPoints.map((pt) => (
                    <tr key={pt.month} className="hover:bg-stone-50">
                      <td className="py-1.5 font-sans font-medium text-stone-700">
                        {pt.month}º mês ({Math.round(pt.month / 12)} anos)
                      </td>
                      <td className="py-1.5 text-right font-bold text-emerald-700">
                        {formatCurrency(pt.installment)}
                      </td>
                      <td className="py-1.5 text-right text-stone-500">
                        {formatCurrency(pt.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="text-[10px] text-stone-400 italic flex items-center gap-1 pt-1">
              <Info className="w-3 h-3 text-stone-400 shrink-0" />
              <span>
                Valores meramente demonstrativos. Sujeito à análise de crédito e seguros obrigatórios (DFI/MIP) de cada instituição financeira.
              </span>
            </div>
          </div>
        </div>
      </div>

      <UpgradePlanModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        agency={agency}
        featureKey="simulator"
        featureTitle="Simulador Imobiliário Completo"
        requiredPlan="PROFISSIONAL"
      />
    </div>
  );
};
