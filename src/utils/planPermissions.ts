import { Agency, PlanType, SubscriptionStatus } from '../types';

export interface PlanFeatureMatrix {
  maxProperties: number;
  scheduling: boolean;
  simulator: boolean;
  interestSimulation: boolean;
  premiumProperties: boolean;
  propertyHighlight: boolean;
  reports: boolean;
  advancedReports: boolean;
}

export type FeatureKey =
  | 'scheduling'
  | 'simulator'
  | 'interestSimulation'
  | 'premiumProperties'
  | 'propertyHighlight'
  | 'reports'
  | 'advancedReports';

export interface PlanDetail {
  id: PlanType;
  name: string;
  price: number;
  priceFormatted: string;
  maxProperties: number;
  maxPropertiesLabel: string;
  badgeLabel: string;
  badgeClass: string;
  borderClass: string;
  bgLightClass: string;
  accentColor: string;
  description: string;
  includedFeatures: string[];
  excludedFeatures: string[];
}

export const PLAN_DETAILS: Record<PlanType, PlanDetail> = {
  ESSENCIAL: {
    id: 'ESSENCIAL',
    name: 'Plano Essencial',
    price: 197,
    priceFormatted: 'R$ 197/mês',
    maxProperties: 50,
    maxPropertiesLabel: 'Até 50 imóveis',
    badgeLabel: 'Plano Essencial',
    badgeClass: 'bg-stone-100 text-stone-800 border-stone-300',
    borderClass: 'border-stone-300',
    bgLightClass: 'bg-stone-50',
    accentColor: '#57534e',
    description: 'Ideal para imobiliárias em fase inicial com portfólio compacto de até 50 imóveis.',
    includedFeatures: [
      'Painel da imobiliária',
      'Cadastro, edição e exclusão de imóveis',
      'Publicação no portal',
      'Página exclusiva da imobiliária',
      'Dados de contato & WhatsApp direto',
      'Gerenciamento básico de carteira',
      'Suporte básico',
    ],
    excludedFeatures: [
      'Agendamento online de visitas',
      'Simulador imobiliário avançado',
      'Simulação de juros & prazos',
      'Destaque de imóveis no portal',
      'Imóveis Premium & Área Premium',
      'Relatórios avançados',
    ],
  },
  PROFISSIONAL: {
    id: 'PROFISSIONAL',
    name: 'Plano Profissional',
    price: 297,
    priceFormatted: 'R$ 297/mês',
    maxProperties: 200,
    maxPropertiesLabel: 'Até 200 imóveis',
    badgeLabel: 'Plano Profissional',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
    borderClass: 'border-blue-400',
    bgLightClass: 'bg-blue-50/60',
    accentColor: '#2563eb',
    description: 'Perfeito para imobiliárias consolidadas que necessitam de agendamento online e simulação de crédito.',
    includedFeatures: [
      'Tudo do Plano Essencial',
      'Até 200 imóveis cadastrados',
      'Agendamento online de visitas integrado',
      'Simulador imobiliário completo',
      'Simulação de juros bancários e prazos',
      'Detalhamento de simulações com tabela SAC e Price',
      'Destaque de imóveis no portal',
      'Relatórios básicos de desempenho',
      'Suporte prioritário',
    ],
    excludedFeatures: [
      'Área Premium exclusiva',
      'Imóveis Premium com selo dourado',
      'Relatórios avançados de conversão e captação',
    ],
  },
  PREMIUM: {
    id: 'PREMIUM',
    name: 'Plano Premium',
    price: 497,
    priceFormatted: 'R$ 497/mês',
    maxProperties: Infinity,
    maxPropertiesLabel: 'Sem limite comercial*',
    badgeLabel: 'Plano Premium',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-400',
    borderClass: 'border-amber-400',
    bgLightClass: 'bg-amber-50/60',
    accentColor: '#d97706',
    description: 'Acesso irrestrito a todos os recursos da plataforma sem limites de imóveis e com máxima visibilidade.',
    includedFeatures: [
      'TODOS os recursos existentes na plataforma',
      'Sem limite comercial de imóveis*',
      'Agendamento online de visitas prioritário',
      'Simulador imobiliário completo com juros e SAC/Price',
      'Destaque máximo e selo dourado de Imóveis Premium',
      'Área Premium exclusiva no portal',
      'Relatórios analíticos completos & avançados',
      'Recursos avançados de captação de clientes',
      'Suporte VIP Premium dedicado',
      'Prioridade no lançamento de novos recursos',
    ],
    excludedFeatures: [],
  },
};

export const PLAN_FEATURES: Record<PlanType, PlanFeatureMatrix> = {
  ESSENCIAL: {
    maxProperties: 50,
    scheduling: false,
    simulator: false,
    interestSimulation: false,
    premiumProperties: false,
    propertyHighlight: false,
    reports: false,
    advancedReports: false,
  },
  PROFISSIONAL: {
    maxProperties: 200,
    scheduling: true,
    simulator: true,
    interestSimulation: true,
    premiumProperties: false,
    propertyHighlight: true,
    reports: true,
    advancedReports: false,
  },
  PREMIUM: {
    maxProperties: Infinity,
    scheduling: true,
    simulator: true,
    interestSimulation: true,
    premiumProperties: true,
    propertyHighlight: true,
    reports: true,
    advancedReports: true,
  },
};

/**
 * Retorna o plano normalizado da imobiliária (com fallback seguro para PROFISSIONAL)
 */
export const getAgencyPlan = (agency?: Agency | null): PlanType => {
  if (!agency || !agency.plano) {
    return 'PROFISSIONAL';
  }
  const p = agency.plano.toUpperCase() as PlanType;
  if (p === 'ESSENCIAL' || p === 'PROFISSIONAL' || p === 'PREMIUM') {
    return p;
  }
  return 'PROFISSIONAL';
};

/**
 * Retorna o status da assinatura normalizado (com fallback seguro para ACTIVE)
 */
export const getAgencySubscriptionStatus = (agency?: Agency | null): SubscriptionStatus => {
  if (!agency || !agency.status_assinatura) {
    return 'ACTIVE';
  }
  const s = agency.status_assinatura.toUpperCase() as SubscriptionStatus;
  if (s === 'ACTIVE' || s === 'PENDING' || s === 'SUSPENDED' || s === 'CANCELLED') {
    return s;
  }
  return 'ACTIVE';
};

/**
 * Verifica se a imobiliária tem acesso a um determinado recurso do sistema.
 * @param agency Imobiliária ou null
 * @param feature Recurso a ser testado
 */
export const hasFeature = (agency: Agency | null | undefined, feature: FeatureKey): boolean => {
  if (!agency) return false;
  const status = getAgencySubscriptionStatus(agency);
  if (status === 'SUSPENDED' || status === 'CANCELLED') {
    return false;
  }
  const plan = getAgencyPlan(agency);
  const matrix = PLAN_FEATURES[plan];
  return matrix ? Boolean(matrix[feature]) : false;
};

export interface CanCreatePropertyResult {
  allowed: boolean;
  reason?: string;
  currentCount: number;
  maxLimit: number;
  isOverLimit: boolean;
  isBlockedByStatus: boolean;
}

/**
 * Função central para controle do limite de cadastro de imóveis.
 * Verifica o plano da imobiliária + quantidade atual de imóveis + limite do plano + status de assinatura.
 */
export const canCreateProperty = (
  agency: Agency | null | undefined,
  currentPropertyCount: number
): CanCreatePropertyResult => {
  if (!agency) {
    return {
      allowed: false,
      reason: 'Imobiliária não selecionada ou inválida.',
      currentCount: currentPropertyCount,
      maxLimit: 0,
      isOverLimit: true,
      isBlockedByStatus: false,
    };
  }

  const status = getAgencySubscriptionStatus(agency);
  if (status === 'SUSPENDED') {
    return {
      allowed: false,
      reason: 'A assinatura desta imobiliária está SUSPENSA. Regularize seu pagamento para cadastrar novos imóveis.',
      currentCount: currentPropertyCount,
      maxLimit: 0,
      isOverLimit: false,
      isBlockedByStatus: true,
    };
  }

  if (status === 'CANCELLED') {
    return {
      allowed: false,
      reason: 'A assinatura desta imobiliária está CANCELADA. Reative o plano para cadastrar novos imóveis.',
      currentCount: currentPropertyCount,
      maxLimit: 0,
      isOverLimit: false,
      isBlockedByStatus: true,
    };
  }

  const plan = getAgencyPlan(agency);
  const matrix = PLAN_FEATURES[plan];
  const maxLimit = matrix ? matrix.maxProperties : 50;

  if (currentPropertyCount >= maxLimit) {
    return {
      allowed: false,
      reason: `Seu plano atual permite até ${maxLimit} imóveis. Você possui ${currentPropertyCount} imóveis cadastrados. Seus imóveis foram preservados, porém novos cadastros estão temporariamente bloqueados. Faça upgrade do plano ou reduza a quantidade de imóveis ativos.`,
      currentCount: currentPropertyCount,
      maxLimit,
      isOverLimit: true,
      isBlockedByStatus: false,
    };
  }

  return {
    allowed: true,
    currentCount: currentPropertyCount,
    maxLimit,
    isOverLimit: false,
    isBlockedByStatus: false,
  };
};

/**
 * Retorna o limite numérico de imóveis do plano da imobiliária
 */
export const getPlanPropertyLimit = (agency: Agency | null | undefined): number => {
  const plan = getAgencyPlan(agency);
  return PLAN_FEATURES[plan]?.maxProperties ?? 50;
};

/**
 * Informações visuais para o status da assinatura
 */
export const SUBSCRIPTION_STATUS_CONFIG: Record<
  SubscriptionStatus,
  { label: string; badgeClass: string; dotClass: string }
> = {
  ACTIVE: {
    label: 'Ativa',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    dotClass: 'bg-emerald-500',
  },
  PENDING: {
    label: 'Pendente',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
    dotClass: 'bg-amber-500',
  },
  SUSPENDED: {
    label: 'Suspensa',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
    dotClass: 'bg-rose-500',
  },
  CANCELLED: {
    label: 'Cancelada',
    badgeClass: 'bg-stone-200 text-stone-700 border-stone-400',
    dotClass: 'bg-stone-500',
  },
};
