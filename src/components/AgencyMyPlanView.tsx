import React from 'react';
import {
  Crown,
  Sparkles,
  Check,
  X,
  AlertTriangle,
  ArrowUpRight,
  Calendar,
  Building2,
  ShieldCheck,
  Zap,
  HelpCircle,
} from 'lucide-react';
import { Agency, PlanType } from '../types';
import {
  PLAN_DETAILS,
  PLAN_FEATURES,
  getAgencyPlan,
  getAgencySubscriptionStatus,
  SUBSCRIPTION_STATUS_CONFIG,
} from '../utils/planPermissions';
import { formatDateBR } from '../utils/formatters';

interface AgencyMyPlanViewProps {
  agency: Agency;
  propertyCount: number;
  onOpenUpgradeModal: (requiredPlan: PlanType, featureTitle?: string) => void;
  onRequestChangePlan?: () => void;
}

export const AgencyMyPlanView: React.FC<AgencyMyPlanViewProps> = ({
  agency,
  propertyCount,
  onOpenUpgradeModal,
  onRequestChangePlan,
}) => {
  const currentPlan = getAgencyPlan(agency);
  const currentStatus = getAgencySubscriptionStatus(agency);
  const planInfo = PLAN_DETAILS[currentPlan];
  const maxLimit = PLAN_FEATURES[currentPlan].maxProperties;
  const statusConfig = SUBSCRIPTION_STATUS_CONFIG[currentStatus];

  const isUnlimited = maxLimit === Infinity;
  const usagePercentage = isUnlimited ? 15 : Math.min(100, Math.round((propertyCount / maxLimit) * 100));
  const isOverLimit = !isUnlimited && propertyCount > maxLimit;

  // Features checklist to show
  const FEATURE_MATRIX_ROWS = [
    { label: 'Painel Administrativo da Imobiliária', key: 'panel', included: true },
    { label: 'Cadastro, Edição e Exclusão de Imóveis', key: 'crud', included: true },
    { label: 'Publicação no Portal e Página Exclusiva', key: 'page', included: true },
    { label: 'Dados de Contato e WhatsApp Direto', key: 'contact', included: true },
    {
      label: 'Agendamento Online de Visitas Integrado',
      key: 'scheduling',
      included: PLAN_FEATURES[currentPlan].scheduling,
      required: 'PROFISSIONAL' as PlanType,
    },
    {
      label: 'Simulador Imobiliário Completo com Financiamento',
      key: 'simulator',
      included: PLAN_FEATURES[currentPlan].simulator,
      required: 'PROFISSIONAL' as PlanType,
    },
    {
      label: 'Simulação de Juros e Prazos Bancários (SAC e Price)',
      key: 'interest',
      included: PLAN_FEATURES[currentPlan].interestSimulation,
      required: 'PROFISSIONAL' as PlanType,
    },
    {
      label: 'Solicitação de Destaque de Imóveis no Portal',
      key: 'highlight',
      included: PLAN_FEATURES[currentPlan].propertyHighlight,
      required: 'PROFISSIONAL' as PlanType,
    },
    {
      label: 'Relatórios de Desempenho e Visualizações',
      key: 'reports',
      included: PLAN_FEATURES[currentPlan].reports,
      required: 'PROFISSIONAL' as PlanType,
    },
    {
      label: 'Imóveis Premium com Selo Dourado de Alta Conversão',
      key: 'premiumProperties',
      included: PLAN_FEATURES[currentPlan].premiumProperties,
      required: 'PREMIUM' as PlanType,
    },
    {
      label: 'Área Premium Exclusiva no Topo da Home',
      key: 'premiumArea',
      included: PLAN_FEATURES[currentPlan].premiumProperties,
      required: 'PREMIUM' as PlanType,
    },
    {
      label: 'Relatórios Analíticos Avançados de Captação e Leads',
      key: 'advancedReports',
      included: PLAN_FEATURES[currentPlan].advancedReports,
      required: 'PREMIUM' as PlanType,
    },
    {
      label: 'Suporte VIP Dedicado com Prioridade Máxima',
      key: 'support',
      included: currentPlan === 'PREMIUM',
      required: 'PREMIUM' as PlanType,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Plan Header Card */}
      <div className={`rounded-3xl border-2 p-6 sm:p-8 bg-white shadow-sm ${planInfo.borderClass}`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                Plano Atual da Imobiliária
              </span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${planInfo.badgeClass}`}>
                {currentPlan === 'PREMIUM' && <Crown className="w-3 h-3 text-amber-600" />}
                {planInfo.badgeLabel}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusConfig.badgeClass}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotClass}`} />
                Status: {statusConfig.label}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 font-serif">
              {planInfo.name}
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 max-w-xl">
              {planInfo.description}
            </p>
          </div>

          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 shrink-0 flex flex-col justify-between sm:min-w-[240px]">
            <div>
              <div className="text-[11px] text-stone-500 font-medium">Valor da Assinatura:</div>
              <div className="text-2xl sm:text-3xl font-bold text-stone-900 font-serif">
                {planInfo.priceFormatted}
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-stone-200 text-xs text-stone-600 space-y-1">
              {agency.subscriptionStartDate && (
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">Início do plano:</span>
                  <span className="font-semibold text-stone-800">{formatDateBR(agency.subscriptionStartDate)}</span>
                </div>
              )}
              {agency.subscriptionRenewalDate && (
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">Próxima renovação:</span>
                  <span className="font-semibold text-stone-800">{formatDateBR(agency.subscriptionRenewalDate)}</span>
                </div>
              )}
            </div>

            {currentPlan !== 'PREMIUM' && (
              <button
                type="button"
                onClick={() => onOpenUpgradeModal(currentPlan === 'ESSENCIAL' ? 'PROFISSIONAL' : 'PREMIUM')}
                className="mt-4 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Fazer Upgrade de Plano</span>
              </button>
            )}
          </div>
        </div>

        {/* Capacity / Property Progress Bar */}
        <div className="mt-8 pt-6 border-t border-stone-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <div>
              <span className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                Utilização da Capacidade de Imóveis
              </span>
              <p className="text-xs text-stone-500">
                Quantidade de imóveis ativos em relação ao limite contratado
              </p>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-stone-900">
                {propertyCount}{' '}
                <span className="text-stone-500 font-normal">
                  / {isUnlimited ? 'Sem limite comercial*' : `${maxLimit} imóveis`}
                </span>
              </span>
            </div>
          </div>

          {/* Bar */}
          <div className="w-full bg-stone-100 rounded-full h-3 overflow-hidden border border-stone-200">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                isOverLimit
                  ? 'bg-rose-600'
                  : usagePercentage >= 90
                  ? 'bg-amber-500'
                  : 'bg-emerald-600'
              }`}
              style={{ width: `${isUnlimited ? 20 : Math.min(100, usagePercentage)}%` }}
            />
          </div>

          {/* Over-Limit / Downgrade Alert Banner (Verbatim format from prompt section 5) */}
          {isOverLimit && (
            <div className="mt-4 bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 text-xs text-rose-950 flex items-start gap-3 animate-fadeIn">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold text-sm text-rose-900">
                  Capacidade Máxima de Imóveis Ultrapassada
                </div>
                <p className="leading-relaxed">
                  Seu plano atual permite até <strong>{maxLimit} imóveis</strong>. Você possui{' '}
                  <strong>{propertyCount} imóveis cadastrados</strong>. Seus imóveis foram preservados, porém novos cadastros estão temporariamente bloqueados. Faça upgrade do plano ou reduza a quantidade de imóveis ativos.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => onOpenUpgradeModal('PROFISSIONAL')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    <span>Fazer Upgrade Agora</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Features Checklist Grid */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-lg font-bold text-stone-900 font-serif">
              Recursos Disponíveis no Seu Plano
            </h3>
            <p className="text-xs text-stone-500">
              Consulte quais funcionalidades estão ativas para a sua imobiliária
            </p>
          </div>

          {currentPlan !== 'PREMIUM' && (
            <div className="text-xs text-stone-500 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Desbloqueie mais recursos migrando para um plano superior</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {FEATURE_MATRIX_ROWS.map((row) => (
            <div
              key={row.key}
              className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                row.included
                  ? 'bg-stone-50/70 border-stone-200 text-stone-900'
                  : 'bg-stone-50/30 border-dashed border-stone-300 text-stone-400'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {row.included ? (
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 stroke-[2.5]" />
                  </span>
                ) : (
                  <span className="w-5 h-5 rounded-full bg-stone-200 text-stone-400 flex items-center justify-center shrink-0">
                    <X className="w-3 h-3 stroke-[2.5]" />
                  </span>
                )}
                <span className={row.included ? 'font-medium' : 'line-through opacity-70'}>
                  {row.label}
                </span>
              </div>

              {!row.included && row.required && (
                <button
                  type="button"
                  onClick={() => onOpenUpgradeModal(row.required, row.label)}
                  className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[10px] font-bold flex items-center gap-1 shrink-0 transition cursor-pointer"
                >
                  <Crown className="w-3 h-3 text-amber-600" />
                  <span>Plano {row.required === 'PROFISSIONAL' ? 'Pro' : 'Premium'}</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
