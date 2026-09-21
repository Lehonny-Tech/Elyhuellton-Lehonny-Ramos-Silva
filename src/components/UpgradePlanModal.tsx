import React from 'react';
import { ShieldAlert, Check, X, ArrowUpRight, Crown, Sparkles, Zap, Building2, Phone } from 'lucide-react';
import { Agency, PlanType } from '../types';
import { PLAN_DETAILS, getAgencyPlan, FeatureKey } from '../utils/planPermissions';

interface UpgradePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  agency: Agency | null;
  featureKey?: FeatureKey | string;
  featureTitle?: string;
  requiredPlan?: PlanType;
  onOpenPlanChange?: (agency: Agency) => void;
  isSiteCreator?: boolean;
}

const FEATURE_CONFIG: Record<string, { title: string; requiredPlan: PlanType; description: string }> = {
  scheduling: {
    title: 'Agendamento Online de Visitas',
    requiredPlan: 'PROFISSIONAL',
    description: 'Permita que clientes selecionem datas e horários em tempo real diretamente pelo portal.',
  },
  simulator: {
    title: 'Simulador Imobiliário Completo',
    requiredPlan: 'PROFISSIONAL',
    description: 'Simulações de financiamento com cálculo de entrada, parcelas e tabelas SAC e Price.',
  },
  interestSimulation: {
    title: 'Simulação de Juros e Prazos Bancários',
    requiredPlan: 'PROFISSIONAL',
    description: 'Cálculo de taxas de juros nominais e efetivas com projeção personalizada.',
  },
  propertyHighlight: {
    title: 'Destaque de Imóveis no Portal',
    requiredPlan: 'PROFISSIONAL',
    description: 'Promova imóveis no topo da busca com selo exclusivo de destaque.',
  },
  premiumProperties: {
    title: 'Área Premium & Imóveis com Selo Dourado',
    requiredPlan: 'PREMIUM',
    description: 'Exposição no topo absoluto da Home e na vitrine de alta conversão para clientes seletos.',
  },
  reports: {
    title: 'Relatórios de Desempenho de Carteira',
    requiredPlan: 'PROFISSIONAL',
    description: 'Acompanhe visualizações, buscas e agendamentos por imóvel e corretor.',
  },
  advancedReports: {
    title: 'Relatórios Analíticos Avançados de Captação',
    requiredPlan: 'PREMIUM',
    description: 'Métricas aprofundadas de taxa de conversão, lead tracking e inteligência de mercado.',
  },
  propertyLimit: {
    title: 'Expansão de Limite de Imóveis',
    requiredPlan: 'PREMIUM',
    description: 'Aumente o limite da sua carteira para continuar cadastrando novos imóveis sem bloqueios.',
  },
};

export const UpgradePlanModal: React.FC<UpgradePlanModalProps> = ({
  isOpen,
  onClose,
  agency,
  featureKey = 'scheduling',
  featureTitle,
  requiredPlan: explicitRequiredPlan,
  onOpenPlanChange,
  isSiteCreator = false,
}) => {
  if (!isOpen) return null;

  const currentPlan = getAgencyPlan(agency);
  const featureInfo = FEATURE_CONFIG[featureKey] || {
    title: featureTitle || 'Recurso Avançado',
    requiredPlan: explicitRequiredPlan || 'PROFISSIONAL',
    description: 'Este recurso faz parte dos planos superiores da plataforma ImobiRede.',
  };

  const requiredPlan = explicitRequiredPlan || featureInfo.requiredPlan;
  const targetPlanDetails = PLAN_DETAILS[requiredPlan] || PLAN_DETAILS.PROFISSIONAL;
  const currentPlanDetails = PLAN_DETAILS[currentPlan] || PLAN_DETAILS.ESSENCIAL;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-white p-6 sm:p-7 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-stone-400 hover:text-white bg-stone-800/80 hover:bg-stone-700 w-8 h-8 rounded-full flex items-center justify-center transition cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-3">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>Recurso Disponível em Plano Superior</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-serif">
            {featureTitle || featureInfo.title}
          </h2>
          <p className="text-stone-300 text-xs sm:text-sm mt-1.5 leading-relaxed max-w-xl">
            {featureInfo.description}
          </p>

          <div className="mt-4 pt-3 border-t border-stone-700/60 flex flex-wrap items-center gap-4 text-xs">
            <div>
              <span className="text-stone-400">Imobiliária: </span>
              <span className="font-semibold text-white">{agency?.tradeName || agency?.name}</span>
            </div>
            <div>
              <span className="text-stone-400">Seu plano atual: </span>
              <span className="font-bold text-stone-200 px-2 py-0.5 rounded-md bg-stone-800 border border-stone-700">
                {currentPlanDetails.name} ({currentPlanDetails.priceFormatted})
              </span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-stone-800">
          {/* Target Plan Highlight Box */}
          <div className={`rounded-2xl border-2 p-5 ${targetPlanDetails.borderClass} ${targetPlanDetails.bgLightClass}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  Plano Recomendado
                </div>
                <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                  {targetPlanDetails.name}
                  <span className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold ${targetPlanDetails.badgeClass}`}>
                    {targetPlanDetails.maxPropertiesLabel}
                  </span>
                </h3>
                <p className="text-xs text-stone-600 mt-1">{targetPlanDetails.description}</p>
              </div>

              <div className="text-right sm:text-right shrink-0">
                <div className="text-2xl font-bold text-stone-900 font-serif">
                  {targetPlanDetails.priceFormatted}
                </div>
                <div className="text-[11px] text-stone-500">faturamento mensal</div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-stone-200/80">
              <div className="text-xs font-semibold text-stone-800 mb-2">
                O que você ganha com este upgrade:
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-stone-700">
                {targetPlanDetails.includedFeatures.slice(0, 6).map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Quick Comparison of 3 Plans */}
          <div>
            <div className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-2.5">
              Comparativo dos Planos ImobiRede
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              {(['ESSENCIAL', 'PROFISSIONAL', 'PREMIUM'] as PlanType[]).map((pType) => {
                const p = PLAN_DETAILS[pType];
                const isSelected = pType === currentPlan;
                const isTarget = pType === requiredPlan;

                return (
                  <div
                    key={pType}
                    className={`rounded-xl p-3 border transition ${
                      isTarget
                        ? 'border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-500/20'
                        : isSelected
                        ? 'border-stone-400 bg-stone-100/60'
                        : 'border-stone-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-stone-900">{p.name.replace('Plano ', '')}</span>
                      {isSelected && (
                        <span className="text-[9px] bg-stone-700 text-white px-1.5 py-0.5 rounded font-bold">
                          Atual
                        </span>
                      )}
                      {isTarget && !isSelected && (
                        <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-bold">
                          Necessário
                        </span>
                      )}
                    </div>
                    <div className="font-semibold text-stone-900 text-sm mt-1">{p.priceFormatted}</div>
                    <div className="text-[11px] text-stone-500 font-medium">{p.maxPropertiesLabel}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-stone-50 px-6 py-4 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-stone-600 hover:text-stone-900 rounded-xl hover:bg-stone-200 transition cursor-pointer"
          >
            Continuar no Plano Atual
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onOpenPlanChange && agency ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPlanChange(agency);
                }}
                className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Mudar Plano Agora</span>
              </button>
            ) : (
              <a
                href="https://wa.me/5511998765432?text=Olá!%20Gostaria%20de%20solicitar%20o%20upgrade%20do%20meu%20plano%20na%20plataforma%20ImobiRede."
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition cursor-pointer text-center"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Solicitar Upgrade ao Suporte Master</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
