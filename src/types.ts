export type PlanType = 'ESSENCIAL' | 'PROFISSIONAL' | 'PREMIUM';
export type SubscriptionStatus = 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'CANCELLED';

export interface Agency {
  id: string;
  name: string;
  tradeName: string;
  creci: string;
  logoUrl: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  state: string;
  description: string;
  adminEmail: string;
  // Sistema de Planos & Assinatura Individual
  plano: PlanType;
  status_assinatura: SubscriptionStatus;
  subscriptionStartDate?: string;
  subscriptionRenewalDate?: string;
}

export type PropertyType = 'apartamento' | 'casa' | 'cobertura' | 'terreno' | 'comercial' | 'studio';
export type PropertyPurpose = 'locacao' | 'venda' | 'ambos';
export type PropertyStatus = 'disponivel' | 'reservado' | 'alugado' | 'vendido';

export interface PropertyLocation {
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  lat: number;
  lng: number;
}

export interface Property {
  id: string;
  code: string; // Ex: VRT-204
  agencyId: string;
  title: string;
  description: string;
  type: PropertyType;
  purpose: PropertyPurpose;
  rentPrice?: number; // Valor de locação R$
  salePrice?: number; // Valor de venda R$ (se disponível)
  minRentTermMonths?: number; // Prazo mínimo de locação (meses, ex: 12 ou 30)
  depositValue?: number; // Valor da caução R$ se aplicado
  depositDetails?: string; // Ex: "Caução de 3 aluguéis" ou "Seguro Fiança"
  hasCondo: boolean; // Se tem condomínio
  condoFee?: number; // Valor mensal do condomínio R$
  iptuFee?: number; // Valor do IPTU R$
  floorsCount: number; // Quantidade de pisos (pavimentos/andares)
  buildingBlock?: string; // Bloco / Torre (quando apartamento)
  apartmentFloor?: string; // Andar do apartamento (Térreo até 20º andar)
  bedrooms: number; // Quantidade de quartos
  suites: number;
  bathrooms: number;
  garageSpots: number; // Vagas de garagem
  usableArea: number; // Área útil m²
  totalArea?: number; // Área total m²
  features: string[];
  location: PropertyLocation;
  images: string[];
  searchCount: number; // Quantidade de buscas/acessos para destaque
  featured?: boolean;
  featuredRequestStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  featuredRequestedAt?: string;
  featuredRequestNotes?: string;
  featuredApprovedAt?: string;
  // Condições e Programas Obrigatórios (1. Minha Casa Minha Vida, 2. Uso do FGTS, 3. Análise Gratuita de Crédito)
  minhaCasaMinhaVida: boolean; // 1. Minha Casa Minha Vida
  fgts: boolean; // 2. Uso do FGTS
  analiseCreditoGratuita: boolean; // 3. Análise Gratuita de Crédito
  status: PropertyStatus;
  createdAt: string;
}

export interface VisitAppointment {
  id: string;
  propertyId: string;
  agencyId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // Ex: "09:00", "10:30", "14:00", "15:30", "17:00"
  notes?: string;
  status: 'agendado' | 'confirmado' | 'concluido' | 'cancelado';
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'client' | 'agency_admin' | 'site_creator';
  agencyId?: string; // Preenchido se for admin de imobiliária
  favorites: string[]; // IDs dos imóveis favoritos
}

export interface FilterState {
  searchQuery: string;
  city: string;
  neighborhood: string;
  purpose: 'todos' | 'locacao' | 'venda';
  propertyType: 'todos' | PropertyType;
  minPrice: number;
  maxPrice: number;
  bedrooms: number; // 0 = todos, 1, 2, 3, 4+
  garageSpots: number; // 0 = todos, 1, 2, 3+
  hasCondo: 'todos' | 'sim' | 'nao';
  floorsCount: number; // 0 = todos, 1, 2, 3+
  agencyId: string; // 'todos' ou id específico
  sortBy: 'mais_buscados' | 'menor_preco' | 'maior_preco' | 'mais_recentes';
}
