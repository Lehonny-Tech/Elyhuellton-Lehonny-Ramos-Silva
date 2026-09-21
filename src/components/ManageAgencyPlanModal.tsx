import React, { useState, useEffect } from 'react';
import {
  X,
  Crown,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Building2,
  Check,
  Zap,
  Info,
} from 'lucide-react';
import { Agency, PlanType, SubscriptionStatus } from '../types';
import { PLAN_DETAILS, getAgencyPlan, getAgencySubscriptionStatus, PLAN_FEATURES } from '../utils/planPermissions';

interface ManageAgencyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  agency: Agency | null;
  currentPropertyCount: number;
  onSavePlan: (
    agencyId: string,
    plan: PlanType,
    status: SubscriptionStatus,
    renewalDate: string
  ) => void;
}

export const ManageAgencyPlanModal: React.FC<ManageAgencyPlanModalProps> = ({
  isOpen,
  onClose,
  agency,
  currentPropertyCount,
  onSavePlan,
}) => {
  if (!isOpen || !agency) return null;

  const currentPlan = getAgencyPlan(agency);
  const currentStatus = getAgencySubscriptionStatus(agency);

  const [selectedPlan, setSelectedPlan] = useState<PlanType>(currentPlan);
  const [selectedStatus, setSelectedStatus] = useState<SubscriptionStatus>(currentStatus);
  const [renewalDate, setRenewalDate] = useState<string>(
    agency.subscriptionRenewalDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );
  const [savedNotice, setSavedNotice] = useState<boolean>(false);

  useEffect(() => {
    setSelectedPlan(getAgencyPlan(agency));
    setSelectedStatus(getAgencySubscriptionStatus(agency));
    setRenewalDate(
      agency.subscriptionRenewalDate ||
        new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
    );
    setSavedNotice(false);
  }, [agency]);

  const targetLimit = PLAN_FEATURES[selectedPlan].maxProperties;
  const isDowngradeOverLimit = currentPropertyCount > targetLimit;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSavePlan(agency.id, selectedPlan, selectedStatus, renewalDate);
    setSavedNotice(true);
    setTimeout(() => {
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-stone-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-stone-400 hover:text-white bg-stone-800/80 hover:bg-stone-700 w-8 h-8 rounded-full flex items-center justify-center transition cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="p-1.5 rounded-lg bg-emerald-600 text-white">
              <Crown className="w-4 h-4" />
            </span>
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              Painel Master de Assinaturas
            </span>
          </div>

          <h2 className="text-xl font-bold tracking-tight text-white font-serif">
            Alterar Plano & Assinatura da Imobiliária
          </h2>
          <div className="text-xs text-stone-300 mt-1 flex flex-wrap items-center gap-2">
            <span className="font-semibold text-white">{agency.tradeName || agency.name}</span>
            <span>•</span>
            <span>ID: <code className="font-mono text-emerald-300">{agency.id}</code></span>
            <span>•</span>
            <span>CRECI: <span className="font-mono text-stone-200">{agency.creci}</span></span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
          {savedNotice && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-xl flex items-center gap-2 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Plano atualizado com sucesso! Aplicando imediatamente...</span>
            </div>
          )}

          {/* Current Status Overview */}
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-stone-500 block text-[11px]">Situação Atual da Carteira:</span>
              <span className="font-bold text-stone-900 text-sm">
                {currentPropertyCount} imóveis cadastrados
              </span>
            </div>
            <div>
              <span className="text-stone-500 block text-[11px]">Plano Contratado Atualmente:</span>
              <span className="font-semibold text-stone-800">
                {PLAN_DETAILS[currentPlan].name} ({PLAN_DETAILS[currentPlan].priceFormatted})
              </span>
            </div>
            <div>
              <span className="text-stone-500 block text-[11px]">Status Vigente:</span>
              <span className="font-semibold text-stone-800">{currentStatus}</span>
            </div>
          </div>

          {/* Section 1: Choose Plan */}
          <div>
            <label className="block text-xs font-bold text-stone-900 uppercase tracking-wider mb-2.5">
              1. Selecionar Novo Plano
            </label>

            <div className="space-y-3">
              {(['ESSENCIAL', 'PROFISSIONAL', 'PREMIUM'] as PlanType[]).map((planType) => {
                const plan = PLAN_DETAILS[planType];
                const isSelected = selectedPlan === planType;

                return (
                  <label
                    key={planType}
                    className={`block p-4 rounded-2xl border-2 cursor-pointer transition relative ${
                      isSelected
                        ? `${plan.borderClass} ${plan.bgLightClass} shadow-xs ring-2 ring-emerald-500/20`
                        : 'border-stone-200 hover:border-stone-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="planChoice"
                        value={planType}
                        checked={isSelected}
                        onChange={() => setSelectedPlan(planType)}
                        className="mt-1 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />

                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-stone-900 text-sm">{plan.name}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${plan.badgeClass}`}>
                              {plan.maxPropertiesLabel}
                            </span>
                          </div>

                          <div className="font-bold text-stone-900 text-sm font-serif">
                            {plan.priceFormatted}
                          </div>
                        </div>

                        <p className="text-xs text-stone-600 mt-1">{plan.description}</p>

                        <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-stone-600">
                          {plan.includedFeatures.slice(0, 4).map((f, i) => (
                            <span key={i} className="flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-600" />
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Downgrade Preservation Alert Notice */}
          {isDowngradeOverLimit && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 text-xs text-amber-900 space-y-1.5 animate-fadeIn">
              <div className="flex items-center gap-2 font-bold text-amber-950">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Política de Preservação de Dados em Downgrade</span>
              </div>
              <p className="leading-relaxed">
                A imobiliária possui <strong>{currentPropertyCount} imóveis cadastrados</strong> e o plano selecionado ({PLAN_DETAILS[selectedPlan].name}) tem limite de <strong>{targetLimit} imóveis</strong>.
              </p>
              <div className="bg-white/80 rounded-xl p-2.5 border border-amber-200 text-stone-800 font-medium">
                ✅ <strong>Garantia de Não Exclusão:</strong> Nenhum dos {currentPropertyCount} imóveis existentes será apagado. Todos continuam salvos e acessíveis. Apenas novas criações de imóveis ficarão temporariamente bloqueadas até upgrade ou exclusão manual.
              </div>
            </div>
          )}

          {/* Section 2: Subscription Status & Renewal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-stone-200">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                2. Status da Assinatura
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as SubscriptionStatus)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="ACTIVE">ACTIVE — Ativa (Totalmente Operacional)</option>
                <option value="PENDING">PENDING — Pagamento Pendente (Aguardando)</option>
                <option value="SUSPENDED">SUSPENDED — Suspensa (Bloqueia novos cadastros)</option>
                <option value="CANCELLED">CANCELLED — Cancelada (Bloqueada)</option>
              </select>
              <p className="text-[11px] text-stone-500 mt-1">
                {selectedStatus === 'ACTIVE'
                  ? 'A imobiliária tem acesso total aos recursos do plano.'
                  : 'Status não-ativo bloqueia novos cadastros e recursos online.'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                3. Data de Próxima Renovação
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={renewalDate}
                  onChange={(e) => setRenewalDate(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  required
                />
              </div>
              <p className="text-[11px] text-stone-500 mt-1">
                Data do próximo ciclo de cobrança recorrente.
              </p>
            </div>
          </div>

          {/* Immediate Application Info */}
          <div className="bg-stone-50 rounded-xl p-3 border border-stone-200 text-xs text-stone-600 flex items-center gap-2">
            <Info className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              A alteração é aplicada imediatamente para esta imobiliária, atualizando limites, menus e recursos disponíveis sem necessidade de reiniciar.
            </span>
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 rounded-xl hover:bg-stone-100 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Salvar Plano da Imobiliária</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
