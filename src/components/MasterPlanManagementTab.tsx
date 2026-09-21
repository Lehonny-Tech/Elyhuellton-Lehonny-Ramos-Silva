import React, { useState } from 'react';
import {
  Crown,
  Building2,
  Edit,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Sparkles,
  TrendingUp,
  Search,
  Filter,
  DollarSign,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { Agency, Property, PlanType, SubscriptionStatus } from '../types';
import {
  PLAN_DETAILS,
  PLAN_FEATURES,
  getAgencyPlan,
  getAgencySubscriptionStatus,
  SUBSCRIPTION_STATUS_CONFIG,
} from '../utils/planPermissions';
import { formatDateBR, formatCurrency } from '../utils/formatters';

interface MasterPlanManagementTabProps {
  agencies: Agency[];
  properties: Property[];
  onOpenManagePlanModal: (agency: Agency) => void;
  onSelectAgencyToView: (agencyId: string) => void;
}

export const MasterPlanManagementTab: React.FC<MasterPlanManagementTabProps> = ({
  agencies,
  properties,
  onOpenManagePlanModal,
  onSelectAgencyToView,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState<string>('todos');
  const [filterStatus, setFilterStatus] = useState<string>('todos');

  // Filtered agencies
  const filteredAgencies = agencies.filter((ag) => {
    const plan = getAgencyPlan(ag);
    const status = getAgencySubscriptionStatus(ag);
    const term = searchTerm.toLowerCase();

    const matchesSearch =
      ag.name.toLowerCase().includes(term) ||
      ag.tradeName.toLowerCase().includes(term) ||
      ag.city.toLowerCase().includes(term) ||
      ag.creci.toLowerCase().includes(term) ||
      ag.id.toLowerCase().includes(term);

    const matchesPlan = filterPlan === 'todos' || plan === filterPlan;
    const matchesStatus = filterStatus === 'todos' || status === filterStatus;

    return matchesSearch && matchesPlan && matchesStatus;
  });

  // Calculate MRR (Monthly Recurring Revenue)
  const totalMRR = agencies.reduce((acc, ag) => {
    const plan = getAgencyPlan(ag);
    const status = getAgencySubscriptionStatus(ag);
    if (status === 'ACTIVE' || status === 'PENDING') {
      return acc + PLAN_DETAILS[plan].price;
    }
    return acc;
  }, 0);

  const planCounts = {
    PREMIUM: agencies.filter((a) => getAgencyPlan(a) === 'PREMIUM').length,
    PROFISSIONAL: agencies.filter((a) => getAgencyPlan(a) === 'PROFISSIONAL').length,
    ESSENCIAL: agencies.filter((a) => getAgencyPlan(a) === 'ESSENCIAL').length,
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Metric Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Total de Imobiliárias
            </span>
            <div className="w-8 h-8 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-stone-900 mt-2 font-serif">
            {agencies.length} ativas
          </div>
          <p className="text-[11px] text-stone-500 mt-1">
            Rede multi-tenant com planos individuais
          </p>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Receita Mensal (MRR)
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-2 font-serif">
            {formatCurrency(totalMRR)}
          </div>
          <p className="text-[11px] text-stone-500 mt-1">
            Faturamento recorrente das assinaturas ativas
          </p>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Distribuição por Plano
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Crown className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold border border-amber-300">
              {planCounts.PREMIUM} Premium
            </span>
            <span className="text-xs px-2 py-0.5 rounded-md bg-blue-100 text-blue-900 font-bold border border-blue-300">
              {planCounts.PROFISSIONAL} Pro
            </span>
            <span className="text-xs px-2 py-0.5 rounded-md bg-stone-100 text-stone-800 font-bold border border-stone-300">
              {planCounts.ESSENCIAL} Essencial
            </span>
          </div>
          <p className="text-[11px] text-stone-500 mt-1.5">
            Segmentação de contratos na plataforma
          </p>
        </div>

        {/* Metric 4 */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Imóveis na Plataforma
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-stone-900 mt-2 font-serif">
            {properties.length} imóveis
          </div>
          <p className="text-[11px] text-stone-500 mt-1">
            Total somado de todas as imobiliárias parceiras
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por imobiliária, cidade, CRECI ou ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
              className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800 font-medium focus:outline-hidden cursor-pointer"
            >
              <option value="todos">Todos os Planos</option>
              <option value="ESSENCIAL">Plano Essencial (R$ 197)</option>
              <option value="PROFISSIONAL">Plano Profissional (R$ 297)</option>
              <option value="PREMIUM">Plano Premium (R$ 497)</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800 font-medium focus:outline-hidden cursor-pointer"
            >
              <option value="todos">Todos os Status</option>
              <option value="ACTIVE">Ativa (ACTIVE)</option>
              <option value="PENDING">Pendente (PENDING)</option>
              <option value="SUSPENDED">Suspensa (SUSPENDED)</option>
              <option value="CANCELLED">Cancelada (CANCELLED)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Agencies Plan Management Cards / Table */}
      <div className="space-y-4">
        {filteredAgencies.map((agency) => {
          const plan = getAgencyPlan(agency);
          const status = getAgencySubscriptionStatus(agency);
          const planDetail = PLAN_DETAILS[plan];
          const statusConfig = SUBSCRIPTION_STATUS_CONFIG[status];
          const agencyProps = properties.filter((p) => p.agencyId === agency.id);
          const propCount = agencyProps.length;
          const maxLimit = PLAN_FEATURES[plan].maxProperties;
          const isUnlimited = maxLimit === Infinity;
          const isOverLimit = !isUnlimited && propCount > maxLimit;

          return (
            <div
              key={agency.id}
              className={`bg-white rounded-2xl border-2 p-5 transition shadow-xs hover:shadow-md ${
                isOverLimit ? 'border-amber-300' : 'border-stone-200'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                {/* Agency Basic Info */}
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
                    <img
                      src={agency.logoUrl}
                      alt={agency.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-stone-900 font-serif">
                        {agency.tradeName || agency.name}
                      </h3>
                      <span className="text-[10px] font-mono text-stone-500 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                        ID: {agency.id}
                      </span>
                    </div>

                    <p className="text-xs text-stone-500 mt-0.5">
                      {agency.name} • CRECI: <span className="font-mono text-stone-700">{agency.creci}</span> • {agency.city}, {agency.state}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {/* Plan Badge */}
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${planDetail.badgeClass}`}>
                        {plan === 'PREMIUM' && <Crown className="w-3 h-3 text-amber-600" />}
                        {planDetail.badgeLabel} ({planDetail.priceFormatted})
                      </span>

                      {/* Status Badge */}
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusConfig.badgeClass}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotClass}`} />
                        {statusConfig.label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Property Count & Limits */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-6 text-xs">
                  {/* Property Limit Metric */}
                  <div className="bg-stone-50 rounded-xl p-3 border border-stone-200 sm:min-w-[160px]">
                    <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                      Carteira / Limite:
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-base font-bold ${isOverLimit ? 'text-rose-600' : 'text-stone-900'}`}>
                        {propCount}
                      </span>
                      <span className="text-stone-500">
                        / {isUnlimited ? 'Sem limite comercial' : `${maxLimit} imóveis`}
                      </span>
                    </div>

                    {isOverLimit && (
                      <span className="inline-block mt-1 text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded border border-rose-200">
                        Acima do limite do plano
                      </span>
                    )}
                  </div>

                  {/* Dates */}
                  <div className="space-y-1 text-stone-600 sm:min-w-[150px]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-stone-400">Início:</span>
                      <span className="font-semibold text-stone-800">
                        {agency.subscriptionStartDate ? formatDateBR(agency.subscriptionStartDate) : '01/01/2026'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-stone-400">Renovação:</span>
                      <span className="font-semibold text-emerald-700">
                        {agency.subscriptionRenewalDate ? formatDateBR(agency.subscriptionRenewalDate) : '30/10/2026'}
                      </span>
                    </div>
                  </div>

                  {/* Actions Button */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenManagePlanModal(agency)}
                      className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5 text-amber-400" />
                      <span>ALTERAR PLANO</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onSelectAgencyToView(agency.id)}
                      className="px-3 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition cursor-pointer"
                      title="Ver dados desta imobiliária no painel"
                    >
                      Acessar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filteredAgencies.length === 0 && (
          <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center text-xs text-stone-500">
            Nenhuma imobiliária encontrada com os filtros selecionados.
          </div>
        )}
      </div>
    </div>
  );
};
