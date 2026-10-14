import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Agency,
  Property,
  VisitAppointment,
  User,
  PlanType,
  SubscriptionStatus,
  SupportTicket,
  TicketMessage,
  TicketStatus,
  AgencyChatMessage,
} from '../types';
import {
  INITIAL_AGENCIES,
  INITIAL_PROPERTIES,
  INITIAL_VISITS,
  INITIAL_USERS,
  INITIAL_TICKETS,
  INITIAL_AGENCY_CHAT,
} from '../data/initialData';
import { canCreateProperty } from '../utils/planPermissions';

interface AppContextType {
  agencies: Agency[];
  properties: Property[];
  visits: VisitAppointment[];
  users: User[];
  tickets: SupportTicket[];
  agencyChatMessages: AgencyChatMessage[];
  currentUser: User | null;
  selectedAgencyId: string | null; // For agency admin view
  currentAgency: Agency | null;
  isSuperAdmin: boolean;
  isSiteCreatorMode: boolean;
  setIsSiteCreatorMode: (mode: boolean) => void;
  addAgency: (agencyData: Omit<Agency, 'id'>) => Agency;
  updateAgency: (id: string, updates: Partial<Agency>) => void;
  deleteAgency: (agencyId: string) => void;
  updateAgencyPlan: (
    agencyId: string,
    plano: PlanType,
    status_assinatura?: SubscriptionStatus,
    renewalDate?: string
  ) => void;
  addProperty: (propertyData: Omit<Property, 'id' | 'code' | 'createdAt' | 'searchCount'>) => Property;
  updateProperty: (id: string, updates: Partial<Property>) => void;
  deleteProperty: (id: string) => void;
  requestPropertyFeature: (propertyId: string, notes?: string) => void;
  approvePropertyFeature: (propertyId: string) => void;
  rejectPropertyFeature: (propertyId: string) => void;
  togglePropertyFeature: (propertyId: string) => void;
  bookVisit: (visitData: Omit<VisitAppointment, 'id' | 'createdAt' | 'status'>) => { success: boolean; error?: string; appointment?: VisitAppointment };
  cancelVisit: (visitId: string) => void;
  updateVisitStatus: (visitId: string, status: VisitAppointment['status']) => void;
  toggleFavorite: (propertyId: string) => boolean;
  isFavorite: (propertyId: string) => boolean;
  loginUser: (email: string, role?: 'client' | 'agency_admin' | 'super_admin' | 'site_creator', agencyId?: string) => boolean;
  loginUserWithPassword: (email: string, password?: string) => { success: boolean; error?: string; user?: User };
  loginSuperAdmin: (password: string, email?: string) => boolean;
  registerUser: (name: string, email: string, phone?: string, password?: string) => User;
  updateUserPassword: (userId: string, newPassword: string) => boolean;
  updateUser: (userId: string, updates: Partial<User>) => void;
  deleteUser: (userId: string) => boolean;
  addUser: (userData: Omit<User, 'id' | 'favorites'> & { favorites?: string[] }) => User;
  createSupportTicket: (
    ticketData: Omit<SupportTicket, 'id' | 'ticketNumber' | 'createdAt' | 'updatedAt' | 'messages'> & {
      initialMessage?: string;
    }
  ) => SupportTicket;
  addTicketMessage: (
    ticketId: string,
    message: Omit<TicketMessage, 'id' | 'createdAt'>
  ) => void;
  updateTicketStatus: (ticketId: string, status: TicketStatus, assignedTo?: string) => void;
  deleteSupportTicket: (ticketId: string) => void;
  setUserFirstAccess: (userId: string, firstAccess: boolean) => void;
  sendAgencyChatMessage: (
    messageData: Omit<AgencyChatMessage, 'id' | 'createdAt'>
  ) => AgencyChatMessage;
  logoutUser: () => void;
  setSelectedAgencyId: (agencyId: string | null) => void;
  incrementPropertyView: (propertyId: string) => void;
  getAgencyById: (agencyId: string) => Agency | undefined;
  getVisitsForPropertyAndDate: (propertyId: string, date: string) => VisitAppointment[];
  resetToDefaults: () => void;
  recordUserActivity?: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// 90 minutes inactivity timeout (5,400,000 ms) - completely hidden from users
const INACTIVITY_TIMEOUT_MS = 90 * 60 * 1000;

const STORAGE_KEYS = {
  AGENCIES: 'imobirede_agencies_v5',
  PROPERTIES: 'imobirede_properties_v5',
  VISITS: 'imobirede_visits_v4',
  USERS: 'imobirede_users_v5',
  CURRENT_USER: 'imobirede_current_user_v4',
  SELECTED_AGENCY: 'imobirede_selected_agency_v4',
  SITE_CREATOR_MODE: 'imobirede_site_creator_mode_v4',
  TICKETS: 'imobirede_tickets_v1',
  AGENCY_CHAT: 'imobirede_agency_chat_v1',
  LAST_ACTIVITY: 'imobirede_last_activity_v4',
};

// Safe localStorage writer with automatic quota-overflow cleanup so data never disappears
export const safeSaveToLocalStorage = (key: string, data: any) => {
  try {
    const json = JSON.stringify(data);
    localStorage.setItem(key, json);
  } catch (err: any) {
    console.warn(`[ImobiRede] LocalStorage quota overflow no key ${key}. Limpando chaves legadas...`, err);
    try {
      // Purge obsolete historical duplicate keys to recover quota space
      const legacyKeys = [
        'imobirede_agencies_v1',
        'imobirede_agencies_v2',
        'imobirede_agencies_v3',
        'imobirede_agencies_v4',
        'imobirede_properties_v1',
        'imobirede_properties_v2',
        'imobirede_properties_v3',
        'imobirede_users_v1',
        'imobirede_users_v2',
        'imobirede_users_v3',
        'agencies',
        'properties',
        'imobiliarias',
      ];
      legacyKeys.forEach((k) => {
        try {
          localStorage.removeItem(k);
        } catch {}
      });
      // Retry writing to authoritative primary key
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e2) {
      console.error(`[ImobiRede] Erro crítico ao gravar ${key}:`, e2);
    }
  }
};

// Storage synchronization helpers that safely persist without exhausting browser storage quota
const syncAllAgenciesStorage = (data: Agency[]) => {
  safeSaveToLocalStorage(STORAGE_KEYS.AGENCIES, data);
  // Optional mirror to v4 for backwards compatibility only if quota allows
  try {
    localStorage.setItem('imobirede_agencies_v4', JSON.stringify(data));
  } catch {}
};

const syncAllPropertiesStorage = (data: Property[]) => {
  safeSaveToLocalStorage(STORAGE_KEYS.PROPERTIES, data);
  // Optional mirror to v4 for backwards compatibility only if quota allows
  try {
    localStorage.setItem('imobirede_properties_v4', JSON.stringify(data));
  } catch {}
};

const syncAllUsersStorage = (data: User[]) => {
  safeSaveToLocalStorage(STORAGE_KEYS.USERS, data);
  try {
    localStorage.setItem('imobirede_users_v4', JSON.stringify(data));
  } catch {}
};

// Helper function to scan all candidate keys and localStorage for all agencies
const loadAllAgenciesFromStorage = (): Agency[] => {
  const agencyMap = new Map<string, Agency>();

  // 1. Seed with initial project demonstration agencies
  INITIAL_AGENCIES.forEach((ia) => {
    agencyMap.set(ia.id, { ...ia });
  });

  const sanitizeAgency = (item: any): Agency | null => {
    if (!item || typeof item !== 'object') return null;
    const name = String(
      item.name || item.tradeName || item.razaoSocial || item.razao_social || item.nome || ''
    ).trim();
    if (!name) return null;
    const tradeName = String(
      item.tradeName || item.nomeFantasia || item.nome_fantasia || item.fantasia || name
    ).trim();
    const creci = String(item.creci || item.registroCreci || item.creci_numero || '00000-J').trim();
    const fallbackSlug = (name || creci || 'item').toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 32);
    const id = item.id ? String(item.id).trim() : `ag-${fallbackSlug}`;
    const existing = agencyMap.get(id);

    return {
      id,
      name,
      tradeName,
      creci,
      logoUrl:
        item.logoUrl ||
        item.logo ||
        item.logotipo ||
        existing?.logoUrl ||
        'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=200&q=80',
      phone: item.phone || item.telefone || item.contato || existing?.phone || '(11) 3300-0000',
      whatsapp: item.whatsapp || item.celular || item.whats || existing?.whatsapp || '5511999998888',
      email: item.email || item.contatoEmail || existing?.email || 'contato@imobiliaria.com.br',
      adminEmail:
        item.adminEmail ||
        item.emailAdmin ||
        item.email_admin ||
        existing?.adminEmail ||
        item.email ||
        'admin@imobiliaria.com.br',
      address: item.address || item.endereco || existing?.address || 'Endereço Comercial Central',
      city: item.city || item.cidade || item.municipio || existing?.city || 'São Paulo',
      state: item.state || item.estado || item.uf || existing?.state || 'SP',
      description:
        item.description ||
        item.descricao ||
        existing?.description ||
        'Imobiliária credenciada na rede integrada de imóveis.',
      plano: (item.plano || existing?.plano || 'PROFISSIONAL').toUpperCase(),
      status_assinatura: (item.status_assinatura || existing?.status_assinatura || 'ACTIVE').toUpperCase(),
      subscriptionStartDate:
        item.subscriptionStartDate ||
        item.dataInicioAssinatura ||
        existing?.subscriptionStartDate ||
        '2026-01-10',
      subscriptionRenewalDate:
        item.subscriptionRenewalDate ||
        item.dataRenovacao ||
        existing?.subscriptionRenewalDate ||
        '2026-12-31',
    };
  };

  const ingest = (items: any) => {
    if (!items) return;
    if (Array.isArray(items)) {
      items.forEach((item) => {
        const sanitized = sanitizeAgency(item);
        if (sanitized) agencyMap.set(sanitized.id, sanitized);
      });
    } else if (typeof items === 'object') {
      if (Array.isArray(items.agencies)) ingest(items.agencies);
      else if (Array.isArray(items.imobiliarias)) ingest(items.imobiliarias);
      else if (Array.isArray(items.items)) ingest(items.items);
      else if (Array.isArray(items.data)) ingest(items.data);
      else {
        const sanitized = sanitizeAgency(items);
        if (sanitized) agencyMap.set(sanitized.id, sanitized);
      }
    }
  };

  // Scan older/legacy candidate keys first so newer keys always take priority
  const olderCandidateKeys = [
    'imobiliarias',
    'registered_agencies',
    'imobirede_registered_agencies',
    'agencies',
    'imobirede_agencies',
    'imobirede_agencies_v1',
    'imobirede_agencies_v2',
    'imobirede_agencies_v3',
    'imobirede_agencies_v4',
  ];

  olderCandidateKeys.forEach((key) => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) ingest(JSON.parse(raw));
    } catch {}
  });

  // Comprehensive scan of ALL localStorage keys for any external agencies registered outside the default keys
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !olderCandidateKeys.includes(key) && key !== STORAGE_KEYS.AGENCIES && key !== 'imobirede_agencies_v5') {
        try {
          const raw = localStorage.getItem(key);
          if (raw && (raw.startsWith('[') || raw.startsWith('{'))) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const first = parsed[0];
              if (first?.name || first?.tradeName || first?.razaoSocial || first?.nomeFantasia || first?.creci) {
                ingest(parsed);
              }
            } else if (parsed && typeof parsed === 'object') {
              if (Array.isArray(parsed.agencies)) ingest(parsed.agencies);
              else if (Array.isArray(parsed.imobiliarias)) ingest(parsed.imobiliarias);
              else if (Array.isArray(parsed.items)) ingest(parsed.items);
              else if (Array.isArray(parsed.data)) ingest(parsed.data);
              else if (parsed.name || parsed.tradeName || parsed.razaoSocial || parsed.creci) {
                ingest([parsed]);
              }
            }
          }
        } catch {}
      }
    }
  } catch {}

  // Ingest primary current keys LAST so current valid data takes top priority
  const primaryKeys = ['imobirede_agencies_v5', STORAGE_KEYS.AGENCIES];
  primaryKeys.forEach((key) => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) ingest(JSON.parse(raw));
    } catch {}
  });

  const result = Array.from(agencyMap.values());
  syncAllAgenciesStorage(result);
  return result;
};

// Helper function to scan all candidate keys and localStorage for properties
const loadAllPropertiesFromStorage = (agenciesList: Agency[]): Property[] => {
  const propMap = new Map<string, Property>();

  INITIAL_PROPERTIES.forEach((ip) => {
    propMap.set(ip.id, {
      ...ip,
      minhaCasaMinhaVida: typeof ip.minhaCasaMinhaVida === 'boolean' ? ip.minhaCasaMinhaVida : false,
      fgts: typeof ip.fgts === 'boolean' ? ip.fgts : true,
      analiseCreditoGratuita: typeof ip.analiseCreditoGratuita === 'boolean' ? ip.analiseCreditoGratuita : true,
    });
  });

  const sanitizeProp = (item: any): Property | null => {
    if (!item || typeof item !== 'object') return null;
    const title = String(item.title || item.titulo || item.nome || '').trim();
    if (!title) return null;

    const fallbackCode = (item.code || item.codigo || title || 'imovel').toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 32);
    const id = item.id ? String(item.id).trim() : `prop-${fallbackCode}`;
    const agencyId =
      item.agencyId ||
      item.imobiliariaId ||
      item.idImobiliaria ||
      item.imobiliaria ||
      agenciesList[0]?.id ||
      'ag-vertice';

    return {
      ...item,
      id,
      agencyId,
      title,
      code: item.code || item.codigo || `IMO-${Math.floor(100 + Math.random() * 900)}`,
      type: item.type || item.tipo || 'apartamento',
      purpose: item.purpose || item.finalidade || 'locacao',
      rentPrice: item.rentPrice !== undefined ? item.rentPrice : item.precoLocacao !== undefined ? item.precoLocacao : item.valorAluguel,
      salePrice: item.salePrice !== undefined ? item.salePrice : item.precoVenda !== undefined ? item.precoVenda : item.valorVenda,
      minRentTermMonths: item.minRentTermMonths !== undefined ? item.minRentTermMonths : item.prazoMinimo,
      depositValue: item.depositValue !== undefined ? item.depositValue : item.valorCaucao,
      hasCondo: typeof item.hasCondo === 'boolean' ? item.hasCondo : typeof item.temCondominio === 'boolean' ? item.temCondominio : Boolean(item.condoFee || item.valorCondominio),
      condoFee: item.condoFee !== undefined ? item.condoFee : item.valorCondominio,
      iptuFee: item.iptuFee !== undefined ? item.iptuFee : item.valorIptu,
      floorsCount: Number(item.floorsCount !== undefined ? item.floorsCount : item.quantidadePisos || item.pisos) || 1,
      bedrooms: Number(item.bedrooms !== undefined ? item.bedrooms : item.quartos || item.dormitorios) || 1,
      suites: Number(item.suites !== undefined ? item.suites : item.qtdSuites) || 0,
      bathrooms: Number(item.bathrooms !== undefined ? item.bathrooms : item.banheiros) || 1,
      garageSpots: Number(item.garageSpots !== undefined ? item.garageSpots : item.vagas) || 0,
      usableArea: Number(item.usableArea !== undefined ? item.usableArea : item.areaUtil || item.area) || 60,
      location: item.location || {
        city: item.cidade || 'São Paulo',
        state: item.estado || item.uf || 'SP',
        neighborhood: item.bairro || 'Centro',
        address: item.endereco || 'Rua Comercial Principal',
        zipCode: item.cep || '01000-000',
        lat: item.latitude || -22.855,
        lng: item.longitude || -46.318,
      },
      images: Array.isArray(item.images) && item.images.length > 0
        ? item.images
        : Array.isArray(item.fotos) && item.fotos.length > 0
        ? item.fotos
        : ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80'],
      minhaCasaMinhaVida: typeof item.minhaCasaMinhaVida === 'boolean' ? item.minhaCasaMinhaVida : false,
      fgts: typeof item.fgts === 'boolean' ? item.fgts : true,
      analiseCreditoGratuita: typeof item.analiseCreditoGratuita === 'boolean' ? item.analiseCreditoGratuita : true,
    };
  };

  const ingest = (items: any) => {
    if (!items) return;
    if (Array.isArray(items)) {
      items.forEach((item) => {
        const sanitized = sanitizeProp(item);
        if (sanitized) propMap.set(sanitized.id, sanitized);
      });
    } else if (typeof items === 'object') {
      if (Array.isArray(items.properties)) ingest(items.properties);
      else if (Array.isArray(items.imoveis)) ingest(items.imoveis);
      else if (Array.isArray(items.items)) ingest(items.items);
      else if (Array.isArray(items.data)) ingest(items.data);
      else {
        const sanitized = sanitizeProp(items);
        if (sanitized) propMap.set(sanitized.id, sanitized);
      }
    }
  };

  // Scan older/legacy candidate keys first
  const olderCandidateKeys = [
    'properties',
    'imobirede_properties',
    'imobirede_properties_v1',
    'imobirede_properties_v2',
    'imobirede_properties_v3',
  ];

  olderCandidateKeys.forEach((key) => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) ingest(JSON.parse(raw));
    } catch {}
  });

  // Scan all localStorage keys for properties registered outside the default keys
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !olderCandidateKeys.includes(key) && key !== STORAGE_KEYS.PROPERTIES && key !== 'imobirede_properties_v5' && key !== 'imobirede_properties_v4') {
        try {
          const raw = localStorage.getItem(key);
          if (raw && (raw.startsWith('[') || raw.startsWith('{'))) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const first = parsed[0];
              if (first?.title || first?.titulo || (first?.rentPrice || first?.salePrice || first?.agencyId)) {
                ingest(parsed);
              }
            } else if (parsed && typeof parsed === 'object') {
              if (Array.isArray(parsed.properties)) ingest(parsed.properties);
              else if (Array.isArray(parsed.imoveis)) ingest(parsed.imoveis);
              else if (Array.isArray(parsed.items)) ingest(parsed.items);
              else if (Array.isArray(parsed.data)) ingest(parsed.data);
            }
          }
        } catch {}
      }
    }
  } catch {}

  // Ingest primary current keys LAST so current valid data takes top priority
  const primaryKeys = ['imobirede_properties_v5', 'imobirede_properties_v4', STORAGE_KEYS.PROPERTIES];
  primaryKeys.forEach((key) => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) ingest(JSON.parse(raw));
    } catch {}
  });

  const result = Array.from(propMap.values());
  syncAllPropertiesStorage(result);
  return result;
};

// Helper function to scan all candidate keys and localStorage for users
const loadAllUsersFromStorage = (): User[] => {
  const userMap = new Map<string, User>();

  INITIAL_USERS.forEach((iu) => {
    userMap.set(iu.id, { ...iu });
  });

  const sanitizeUser = (u: any): User | null => {
    if (!u || typeof u !== 'object' || !u.email) return null;
    const email = String(u.email).toLowerCase().trim();
    const id = u.id ? String(u.id) : `user-${Date.now()}`;
    const isSuper = id === 'user-superadmin' || email === 'superadmin@imobirede.com.br' || u.role === 'super_admin' || u.role === 'site_creator';

    return {
      ...u,
      id: isSuper ? 'user-superadmin' : id,
      name: isSuper ? 'Super Administrador (Master)' : u.name || email.split('@')[0],
      email: isSuper ? 'superadmin@imobirede.com.br' : email,
      role: isSuper ? ('super_admin' as const) : u.role || 'client',
      agencyId: u.agencyId,
      password: u.password || (isSuper ? 'superadmin123' : u.role === 'agency_admin' ? 'imobiliaria123' : 'cliente123'),
      favorites: Array.isArray(u.favorites) ? u.favorites : [],
      createdAt: u.createdAt || '2026-01-15',
      status: u.status || 'active',
      firstAccess: typeof u.firstAccess === 'boolean' ? u.firstAccess : false,
    };
  };

  const ingest = (items: any) => {
    if (!items) return;
    if (Array.isArray(items)) {
      items.forEach((item) => {
        const sanitized = sanitizeUser(item);
        if (sanitized) userMap.set(sanitized.id, sanitized);
      });
    } else if (typeof items === 'object') {
      if (Array.isArray(items.users)) ingest(items.users);
      else if (Array.isArray(items.usuarios)) ingest(items.usuarios);
    }
  };

  const olderCandidateKeys = [
    'users',
    'imobirede_users',
    'imobirede_users_v1',
    'imobirede_users_v2',
    'imobirede_users_v3',
  ];

  olderCandidateKeys.forEach((key) => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) ingest(JSON.parse(raw));
    } catch {}
  });

  const primaryKeys = ['imobirede_users_v5', 'imobirede_users_v4', STORAGE_KEYS.USERS];
  primaryKeys.forEach((key) => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) ingest(JSON.parse(raw));
    } catch {}
  });

  const result = Array.from(userMap.values());
  syncAllUsersStorage(result);
  return result;
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [agencies, setAgencies] = useState<Agency[]>(() => {
    try {
      return loadAllAgenciesFromStorage();
    } catch {
      return INITIAL_AGENCIES;
    }
  });

  const [properties, setProperties] = useState<Property[]>(() => {
    try {
      return loadAllPropertiesFromStorage(agencies);
    } catch {
      return INITIAL_PROPERTIES;
    }
  });

  const [visits, setVisits] = useState<VisitAppointment[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.VISITS) || localStorage.getItem('imobirede_visits_v4');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const loadedVisits = [...parsed];
          INITIAL_VISITS.forEach((iv) => {
            if (!loadedVisits.some((v) => v.id === iv.id)) {
              loadedVisits.push(iv);
            }
          });
          return loadedVisits;
        }
      }
      return INITIAL_VISITS;
    } catch {
      return INITIAL_VISITS;
    }
  });

  const [users, setUsers] = useState<User[]>(() => {
    try {
      return loadAllUsersFromStorage();
    } catch {
      return INITIAL_USERS;
    }
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      // Inactivity timeout check: if inactive for >= 90 minutes, disconnect session
      const lastActivityStr = localStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY);
      if (lastActivityStr) {
        const lastActivityTime = Number(lastActivityStr);
        if (!isNaN(lastActivityTime) && lastActivityTime > 0 && Date.now() - lastActivityTime >= INACTIVITY_TIMEOUT_MS) {
          localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
          localStorage.removeItem(STORAGE_KEYS.LAST_ACTIVITY);
          return null;
        }
      }

      const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.id === 'user-site-creator' || parsed.email?.toLowerCase() === 'criador@imobirede.com.br') {
          return null;
        }
        if (parsed.role === 'site_creator' || parsed.id === 'user-superadmin') {
          return { ...parsed, role: 'super_admin' as const, name: 'Super Administrador (Master)', email: 'superadmin@imobirede.com.br' };
        }
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });

  const [selectedAgencyId, setSelectedAgencyId] = useState<string | null>(() => {
    try {
      const savedUserStr = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (savedUserStr) {
        const parsedUser = JSON.parse(savedUserStr);
        if (parsedUser.role === 'agency_admin' && parsedUser.agencyId) {
          return parsedUser.agencyId;
        }
      }
      return localStorage.getItem(STORAGE_KEYS.SELECTED_AGENCY) || 'ag-extrema';
    } catch {
      return 'ag-extrema';
    }
  });

  const [isSiteCreatorMode, setIsSiteCreatorMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.SITE_CREATOR_MODE) === 'true';
    } catch {
      return false;
    }
  });

  const isSuperAdmin = Boolean(
    currentUser &&
    (currentUser.role === 'super_admin' ||
      currentUser.role === 'site_creator' ||
      currentUser.id === 'user-superadmin')
  );

  const [tickets, setTickets] = useState<SupportTicket[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TICKETS);
      if (!saved) return INITIAL_TICKETS;
      const parsed: any[] = JSON.parse(saved);
      // Remodel legacy status to the 3 mandatory statuses: 'aberto', 'atribuido', 'resolvido'
      return parsed.map((t) => {
        let status: TicketStatus = t.status;
        if (t.status === 'em_analise' || t.status === 'respondido') {
          status = 'atribuido';
        } else if (t.status === 'fechado') {
          status = 'resolvido';
        }
        return {
          ...t,
          status,
          assignedTo: t.assignedTo || (status === 'atribuido' ? 'Equipe de Suporte Master' : undefined),
        };
      });
    } catch {
      return INITIAL_TICKETS;
    }
  });

  const [agencyChatMessages, setAgencyChatMessages] = useState<AgencyChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AGENCY_CHAT);
      return saved ? JSON.parse(saved) : INITIAL_AGENCY_CHAT;
    } catch {
      return INITIAL_AGENCY_CHAT;
    }
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AGENCIES, JSON.stringify(agencies));
  }, [agencies]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROPERTIES, JSON.stringify(properties));
  }, [properties]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(visits));
  }, [visits]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
  }, [tickets]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AGENCY_CHAT, JSON.stringify(agencyChatMessages));
  }, [agencyChatMessages]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedAgencyId) {
      localStorage.setItem(STORAGE_KEYS.SELECTED_AGENCY, selectedAgencyId);
    } else {
      localStorage.removeItem(STORAGE_KEYS.SELECTED_AGENCY);
    }
  }, [selectedAgencyId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SITE_CREATOR_MODE, String(isSiteCreatorMode));
  }, [isSiteCreatorMode]);

  // Sync selectedAgencyId with currentUser.agencyId for agency_admin (unless user is Super Admin)
  useEffect(() => {
    if (!isSuperAdmin && currentUser?.role === 'agency_admin' && currentUser.agencyId) {
      setSelectedAgencyId(currentUser.agencyId);
    }
  }, [currentUser, isSuperAdmin]);

  const setSelectedAgencyIdSafe = (agencyId: string | null) => {
    // Security: Agency admin cannot change selected agency to other companies (Super Admin can change freely)
    if (!isSuperAdmin && currentUser?.role === 'agency_admin' && currentUser.agencyId) {
      setSelectedAgencyId(currentUser.agencyId);
      return;
    }
    setSelectedAgencyId(agencyId);
  };

  const currentAgency =
    !isSuperAdmin && currentUser?.role === 'agency_admin' && currentUser?.agencyId
      ? agencies.find((a) => a.id === currentUser.agencyId) || null
      : agencies.find((a) => a.id === selectedAgencyId) || agencies[0] || null;

  const getAgencyById = (agencyId: string) => {
    return agencies.find((a) => a.id === agencyId);
  };

  const addAgency = (agencyData: Omit<Agency, 'id'>): Agency => {
    const id = `ag-${Date.now()}`;
    const newAgency: Agency = {
      ...agencyData,
      id,
      tradeName: agencyData.tradeName || agencyData.name,
      plano: (agencyData.plano || 'PROFISSIONAL').toUpperCase() as PlanType,
      status_assinatura: (agencyData.status_assinatura || 'ACTIVE').toUpperCase() as SubscriptionStatus,
      subscriptionStartDate: agencyData.subscriptionStartDate || new Date().toISOString().split('T')[0],
      subscriptionRenewalDate:
        agencyData.subscriptionRenewalDate ||
        new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    };

    setAgencies((prev) => {
      const updated = [newAgency, ...prev.filter((a) => a.id !== id)];
      syncAllAgenciesStorage(updated);
      return updated;
    });

    return newAgency;
  };

  const updateAgency = (id: string, updates: Partial<Agency>) => {
    // Security: Agency admin can only update their own agency profile (Super Admin has unrestricted full access)
    if (!isSuperAdmin && currentUser?.role === 'agency_admin' && currentUser.agencyId && id !== currentUser.agencyId) {
      console.warn('Acesso negado: Administrador de imobiliária só pode alterar dados da sua própria empresa.');
      return;
    }

    // Security: Agency admin cannot modify subscription plan or billing status (Super Admin can modify anything)
    const safeUpdates = !isSuperAdmin && currentUser?.role === 'agency_admin'
      ? { ...updates, plano: undefined, status_assinatura: undefined, subscriptionRenewalDate: undefined }
      : updates;

    const sanitizedUpdates: Partial<Agency> = {};
    (Object.keys(safeUpdates) as (keyof Agency)[]).forEach((key) => {
      if (safeUpdates[key] !== undefined) {
        (sanitizedUpdates as any)[key] = safeUpdates[key];
      }
    });

    setAgencies((prev) => {
      const updated = prev.map((ag) => (ag.id === id ? { ...ag, ...sanitizedUpdates } : ag));
      syncAllAgenciesStorage(updated);
      return updated;
    });
  };

  const deleteAgency = (agencyId: string) => {
    if (!isSuperAdmin) {
      console.warn('Acesso negado: Apenas o Super Administrador pode excluir imobiliárias.');
      return;
    }
    setAgencies((prev) => {
      const updated = prev.filter((ag) => ag.id !== agencyId);
      syncAllAgenciesStorage(updated);
      return updated;
    });
    setProperties((prev) => {
      const updated = prev.filter((p) => p.agencyId !== agencyId);
      syncAllPropertiesStorage(updated);
      return updated;
    });
    setVisits((prev) => prev.filter((v) => v.agencyId !== agencyId));
    if (selectedAgencyId === agencyId) {
      const remaining = agencies.filter((ag) => ag.id !== agencyId);
      setSelectedAgencyId(remaining[0]?.id || null);
    }
  };

  const updateAgencyPlan = (
    agencyId: string,
    plano: PlanType,
    status_assinatura: SubscriptionStatus = 'ACTIVE',
    renewalDate?: string
  ) => {
    if (!isSuperAdmin) {
      console.warn('Acesso negado: Apenas o Super Administrador pode gerenciar planos de imobiliárias.');
      return;
    }
    setAgencies((prev) => {
      const updated = prev.map((ag) => {
        if (ag.id !== agencyId) return ag;
        return {
          ...ag,
          plano,
          status_assinatura,
          subscriptionRenewalDate:
            renewalDate ||
            ag.subscriptionRenewalDate ||
            new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        };
      });
      syncAllAgenciesStorage(updated);
      return updated;
    });
  };

  const addProperty = (propertyData: Omit<Property, 'id' | 'code' | 'createdAt' | 'searchCount'>): Property => {
    // Security: Agency admin must strictly create properties for their own agency; Super Admin can create for ANY agency
    const candidateAgencyId =
      !isSuperAdmin && currentUser?.role === 'agency_admin' && currentUser.agencyId
        ? currentUser.agencyId
        : propertyData.agencyId;

    // Never allow 'all', empty or null as target agency ID
    const targetAgencyId =
      candidateAgencyId && candidateAgencyId !== 'all'
        ? candidateAgencyId
        : (agencies[0]?.id || 'ag-vertice');

    const agency = getAgencyById(targetAgencyId);
    
    // Regra central de controle de limite de imóveis por plano (Super Admin possui poderes totais e irrestritos)
    if (agency && !isSiteCreatorMode && !isSuperAdmin) {
      const currentCount = properties.filter((p) => p.agencyId === targetAgencyId).length;
      const check = canCreateProperty(agency, currentCount);
      if (!check.allowed) {
        throw new Error(check.reason || 'Limite de cadastro de imóveis atingido para o plano desta imobiliária.');
      }
    }

    const id = `prop-${Date.now()}`;
    const agencyPrefix = agency ? agency.name.substring(0, 3).toUpperCase() : 'IMO';
    const code = `${agencyPrefix}-${Math.floor(100 + Math.random() * 900)}`;

    const newProperty: Property = {
      ...propertyData,
      agencyId: targetAgencyId,
      id,
      code,
      searchCount: Math.floor(Math.random() * 40) + 10,
      createdAt: new Date().toISOString(),
    };

    setProperties((prev) => {
      const updated = [newProperty, ...prev.filter((p) => p.id !== id)];
      syncAllPropertiesStorage(updated);
      return updated;
    });
    return newProperty;
  };

  const updateProperty = (id: string, updates: Partial<Property>) => {
    setProperties((prev) => {
      const updated = prev.map((p) => {
        if (p.id !== id) return p;
        // Security check: Agency admin can ONLY update properties of their own agency! Super Admin can update ANY property
        if (!isSuperAdmin && currentUser?.role === 'agency_admin' && currentUser.agencyId && p.agencyId !== currentUser.agencyId) {
          console.warn('Acesso negado: Administrador de imobiliária não pode alterar imóvel de outra empresa.');
          return p;
        }
        // Protect against accidental 'all' agencyId assignment
        const safeAgencyId =
          updates.agencyId && updates.agencyId !== 'all'
            ? updates.agencyId
            : p.agencyId;

        const safeUpdates =
          !isSuperAdmin && currentUser?.role === 'agency_admin' && currentUser.agencyId
            ? { ...updates, agencyId: currentUser.agencyId }
            : { ...updates, agencyId: safeAgencyId };
        return { ...p, ...safeUpdates };
      });
      syncAllPropertiesStorage(updated);
      return updated;
    });
  };

  const deleteProperty = (id: string) => {
    setProperties((prev) => {
      const updated = prev.filter((p) => {
        if (p.id !== id) return true;
        // Security check: Agency admin can ONLY delete properties of their own agency! Super Admin can delete ANY property
        if (!isSuperAdmin && currentUser?.role === 'agency_admin' && currentUser.agencyId && p.agencyId !== currentUser.agencyId) {
          console.warn('Acesso negado: Administrador de imobiliária não pode excluir imóvel de outra empresa.');
          return true;
        }
        return false;
      });
      syncAllPropertiesStorage(updated);
      return updated;
    });
  };

  const requestPropertyFeature = (propertyId: string, notes?: string) => {
    setProperties((prev) =>
      prev.map((p) => {
        if (p.id !== propertyId) return p;
        if (currentUser?.role === 'agency_admin' && currentUser.agencyId && p.agencyId !== currentUser.agencyId) {
          console.warn('Acesso negado: Imóvel não pertence à sua imobiliária.');
          return p;
        }
        return {
          ...p,
          featuredRequestStatus: 'pending' as const,
          featuredRequestedAt: new Date().toISOString(),
          featuredRequestNotes: notes || p.featuredRequestNotes,
        };
      })
    );
  };

  const approvePropertyFeature = (propertyId: string) => {
    setProperties((prev) =>
      prev.map((p) =>
        p.id === propertyId
          ? {
              ...p,
              featured: true,
              featuredRequestStatus: 'approved' as const,
              featuredApprovedAt: new Date().toISOString(),
            }
          : p
      )
    );
  };

  const rejectPropertyFeature = (propertyId: string) => {
    setProperties((prev) =>
      prev.map((p) =>
        p.id === propertyId
          ? {
              ...p,
              featured: false,
              featuredRequestStatus: 'rejected' as const,
            }
          : p
      )
    );
  };

  const togglePropertyFeature = (propertyId: string) => {
    setProperties((prev) =>
      prev.map((p) =>
        p.id === propertyId
          ? {
              ...p,
              featured: !p.featured,
              featuredRequestStatus: !p.featured ? ('approved' as const) : ('none' as const),
              featuredApprovedAt: !p.featured ? new Date().toISOString() : undefined,
            }
          : p
      )
    );
  };

  const incrementPropertyView = (propertyId: string) => {
    setProperties((prev) =>
      prev.map((p) => (p.id === propertyId ? { ...p, searchCount: (p.searchCount || 0) + 1 } : p))
    );
  };

  const getVisitsForPropertyAndDate = (propertyId: string, date: string) => {
    return visits.filter(
      (v) => v.propertyId === propertyId && v.date === date && v.status !== 'cancelado'
    );
  };

  const bookVisit = (visitData: Omit<VisitAppointment, 'id' | 'createdAt' | 'status'>) => {
    // Check if time slot is already occupied
    const existing = visits.find(
      (v) =>
        v.propertyId === visitData.propertyId &&
        v.date === visitData.date &&
        v.timeSlot === visitData.timeSlot &&
        v.status !== 'cancelado'
    );

    if (existing) {
      return { success: false, error: 'Este horário já está ocupado para esta data.' };
    }

    const newAppointment: VisitAppointment = {
      ...visitData,
      id: `vis-${Date.now()}`,
      status: 'confirmado',
      createdAt: new Date().toISOString(),
    };

    setVisits((prev) => [newAppointment, ...prev]);
    return { success: true, appointment: newAppointment };
  };

  const cancelVisit = (visitId: string) => {
    setVisits((prev) =>
      prev.map((v) => (v.id === visitId ? { ...v, status: 'cancelado' as const } : v))
    );
  };

  const updateVisitStatus = (visitId: string, status: VisitAppointment['status']) => {
    setVisits((prev) =>
      prev.map((v) => {
        if (v.id !== visitId) return v;
        if (currentUser?.role === 'agency_admin' && currentUser.agencyId && v.agencyId !== currentUser.agencyId) {
          console.warn('Acesso negado: Não é permitido alterar agendamento de outra imobiliária.');
          return v;
        }
        return { ...v, status };
      })
    );
  };

  const toggleFavorite = (propertyId: string): boolean => {
    if (!currentUser) return false;

    const isFav = currentUser.favorites.includes(propertyId);
    const updatedFavorites = isFav
      ? currentUser.favorites.filter((id) => id !== propertyId)
      : [...currentUser.favorites, propertyId];

    const updatedUser = { ...currentUser, favorites: updatedFavorites };
    setCurrentUser(updatedUser);

    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));
    return !isFav;
  };

  const isFavorite = (propertyId: string): boolean => {
    if (!currentUser) return false;
    return currentUser.favorites.includes(propertyId);
  };

  const loginUser = (email: string, role?: 'client' | 'agency_admin' | 'super_admin' | 'site_creator', agencyId?: string): boolean => {
    const existingUser = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      setCurrentUser(existingUser);
      localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, String(Date.now()));
      if (existingUser.role === 'super_admin' || existingUser.role === 'site_creator' || existingUser.id === 'user-superadmin') {
        setIsSiteCreatorMode(true);
      }
      if (existingUser.agencyId) {
        setSelectedAgencyId(existingUser.agencyId);
      }
      return true;
    }

    // Create user if not existing
    const newUser: User = {
      id: `user-${Date.now()}`,
      name: email.split('@')[0],
      email: email.toLowerCase(),
      password: role === 'agency_admin' ? 'imobiliaria123' : 'cliente123',
      role: role || 'client',
      agencyId: agencyId,
      favorites: [],
      createdAt: new Date().toISOString().split('T')[0],
      status: 'active',
    };
    setUsers((prev) => [...prev, newUser]);
    setCurrentUser(newUser);
    localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, String(Date.now()));
    if (agencyId) {
      setSelectedAgencyId(agencyId);
    }
    return true;
  };

  const loginUserWithPassword = (
    email: string,
    password?: string
  ): { success: boolean; error?: string; user?: User } => {
    const normalized = email.toLowerCase().trim();
    const user = users.find((u) => u.email.toLowerCase() === normalized);

    if (!user) {
      return { success: false, error: 'Usuário não encontrado. Verifique seu e-mail.' };
    }

    if (!password || password.trim().length === 0) {
      return { success: false, error: 'Por favor, informe a sua senha para entrar.' };
    }

    if (user.password && user.password !== password) {
      return { success: false, error: 'Senha incorreta. Verifique e tente novamente.' };
    }

    setCurrentUser(user);
    localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, String(Date.now()));
    if (user.role === 'super_admin' || user.role === 'site_creator' || user.id === 'user-superadmin') {
      setIsSiteCreatorMode(true);
    } else {
      setIsSiteCreatorMode(false);
    }
    if (user.agencyId) {
      setSelectedAgencyId(user.agencyId);
    }
    return { success: true, user };
  };

  const loginSuperAdmin = (password: string, email = 'superadmin@imobirede.com.br'): boolean => {
    if (!password || password.trim().length === 0) return false;
    const normalizedEmail = email.toLowerCase().trim();
    // Allow master login strictly for Super Administrador (Master)
    const admin = users.find(
      (u) =>
        (u.email.toLowerCase() === normalizedEmail ||
          u.role === 'super_admin' ||
          u.role === 'site_creator' ||
          u.id === 'user-superadmin') &&
        (u.password === password || password === 'superadmin123')
    );

    if (admin) {
      const masterUser: User = {
        ...admin,
        role: 'super_admin',
        name: 'Super Administrador (Master)',
        email: 'superadmin@imobirede.com.br',
      };
      setCurrentUser(masterUser);
      localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, String(Date.now()));
      setIsSiteCreatorMode(true);
      return true;
    }

    // If password matches the master default
    if (password === 'superadmin123') {
      const sa = users.find((u) => u.id === 'user-superadmin') || INITIAL_USERS[0];
      setCurrentUser(sa);
      localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, String(Date.now()));
      setIsSiteCreatorMode(true);
      return true;
    }

    return false;
  };

  const registerUser = (name: string, email: string, phone?: string, password?: string): User => {
    const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      setCurrentUser(existing);
      localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, String(Date.now()));
      return existing;
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      name,
      email: email.toLowerCase(),
      phone,
      password: password || 'cliente123',
      role: 'client',
      favorites: [],
      createdAt: new Date().toISOString().split('T')[0],
      status: 'active',
    };

    setUsers((prev) => [...prev, newUser]);
    setCurrentUser(newUser);
    localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, String(Date.now()));
    return newUser;
  };

  const updateUserPassword = (userId: string, newPassword: string): boolean => {
    if (!newPassword || newPassword.trim().length === 0) return false;
    const cleanPassword = newPassword.trim();
    setUsers((prev) => {
      const updated = prev.map((u) => (u.id === userId ? { ...u, password: cleanPassword, firstAccess: false } : u));
      syncAllUsersStorage(updated);
      return updated;
    });
    if (currentUser?.id === userId) {
      setCurrentUser((prev) => (prev ? { ...prev, password: cleanPassword, firstAccess: false } : null));
    }
    return true;
  };

  const setUserFirstAccess = (userId: string, firstAccess: boolean) => {
    setUsers((prev) => {
      const updated = prev.map((u) => (u.id === userId ? { ...u, firstAccess } : u));
      syncAllUsersStorage(updated);
      return updated;
    });
    if (currentUser?.id === userId) {
      setCurrentUser((prev) => (prev ? { ...prev, firstAccess } : null));
    }
  };

  const updateUser = (userId: string, updates: Partial<User>) => {
    setUsers((prev) => {
      const updated = prev.map((u) => (u.id === userId ? { ...u, ...updates } : u));
      syncAllUsersStorage(updated);
      return updated;
    });
    if (currentUser?.id === userId) {
      setCurrentUser((prev) => (prev ? { ...prev, ...updates } : null));
    }
  };

  const deleteUser = (userId: string): boolean => {
    if (currentUser?.id === userId) {
      return false; // Cannot delete self
    }
    setUsers((prev) => {
      const updated = prev.filter((u) => u.id !== userId);
      syncAllUsersStorage(updated);
      return updated;
    });
    return true;
  };

  const addUser = (userData: Omit<User, 'id' | 'favorites'> & { favorites?: string[]; firstAccess?: boolean }): User => {
    const id = `user-${Date.now()}`;
    const newUser: User = {
      ...userData,
      id,
      password:
        userData.password ||
        (userData.role === 'site_creator'
          ? 'superadmin123'
          : userData.role === 'agency_admin'
          ? 'imobiliaria123'
          : 'cliente123'),
      favorites: userData.favorites || [],
      createdAt: new Date().toISOString().split('T')[0],
      status: userData.status || 'active',
      firstAccess: userData.firstAccess ?? (userData.role === 'agency_admin' ? true : false),
    };
    setUsers((prev) => {
      const updated = [...prev, newUser];
      syncAllUsersStorage(updated);
      return updated;
    });
    return newUser;
  };

  const createSupportTicket = (
    ticketData: Omit<SupportTicket, 'id' | 'ticketNumber' | 'createdAt' | 'updatedAt' | 'messages'> & {
      initialMessage?: string;
    }
  ): SupportTicket => {
    const highestNumber = tickets.reduce((max, t) => Math.max(max, t.ticketNumber || 1000), 1000);
    const ticketNumber = highestNumber + 1;
    const id = `ticket-${ticketNumber}`;
    const now = new Date().toISOString();

    const initialMessages: TicketMessage[] = ticketData.initialMessage
      ? [
          {
            id: `msg-${Date.now()}`,
            senderRole: ticketData.requesterRole === 'client' ? 'client' : 'agency',
            senderName: ticketData.requesterName,
            senderEmail: ticketData.requesterEmail,
            senderAgencyId: ticketData.agencyId,
            message: ticketData.initialMessage,
            images: ticketData.images,
            createdAt: now,
          },
        ]
      : [];

    const newTicket: SupportTicket = {
      ...ticketData,
      id,
      ticketNumber,
      status: 'aberto',
      messages: initialMessages,
      createdAt: now,
      updatedAt: now,
    };

    setTickets((prev) => [newTicket, ...prev]);
    return newTicket;
  };

  const addTicketMessage = (
    ticketId: string,
    messageData: Omit<TicketMessage, 'id' | 'createdAt'>
  ) => {
    const now = new Date().toISOString();
    const newMessage: TicketMessage = {
      ...messageData,
      id: `msg-${Date.now()}`,
      createdAt: now,
    };

    setTickets((prev) =>
      prev.map((t) => {
        if (t.id !== ticketId) return t;
        let nextStatus = t.status;
        let assignedTo = t.assignedTo;
        if (messageData.senderRole === 'superadmin') {
          if (t.status === 'aberto') {
            nextStatus = 'atribuido';
          }
          if (!assignedTo) {
            assignedTo = messageData.senderName;
          }
        }

        return {
          ...t,
          status: nextStatus,
          assignedTo,
          updatedAt: now,
          messages: [...t.messages, newMessage],
        };
      })
    );
  };

  const updateTicketStatus = (ticketId: string, status: TicketStatus, assignedTo?: string) => {
    const now = new Date().toISOString();
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id !== ticketId) return t;
        const updates: Partial<SupportTicket> = { status, updatedAt: now };
        if (assignedTo !== undefined) {
          updates.assignedTo = assignedTo;
          updates.assignedAt = now;
        }
        return { ...t, ...updates };
      })
    );
  };

  const deleteSupportTicket = (ticketId: string) => {
    setTickets((prev) => prev.filter((t) => t.id !== ticketId));
  };

  const sendAgencyChatMessage = (
    messageData: Omit<AgencyChatMessage, 'id' | 'createdAt'>
  ): AgencyChatMessage => {
    const now = new Date().toISOString();
    const newMessage: AgencyChatMessage = {
      ...messageData,
      id: `chat-${Date.now()}`,
      createdAt: now,
    };

    setAgencyChatMessages((prev) => [...prev, newMessage]);
    return newMessage;
  };

  const logoutUser = () => {
    setCurrentUser(null);
    setIsSiteCreatorMode(false);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(STORAGE_KEYS.LAST_ACTIVITY);
  };

  const recordUserActivity = () => {
    if (!currentUser) return;
    const now = Date.now();
    localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, String(now));
  };

  // Automatic security logout on lack of movement/navigation >= 90 minutes.
  // The inactivity timer is completely hidden and invisible to all users.
  useEffect(() => {
    if (!currentUser) {
      return;
    }

    // Initialize or verify last activity timestamp
    const storedLast = localStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY);
    let lastActivityTime = storedLast ? Number(storedLast) : Date.now();
    if (!storedLast || isNaN(lastActivityTime) || lastActivityTime <= 0) {
      lastActivityTime = Date.now();
      localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, String(lastActivityTime));
    }

    // Function to verify elapsed time and disconnect if inactive for >= 90 minutes
    const checkInactivity = () => {
      const storedTime = Number(localStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY));
      const targetTime = !isNaN(storedTime) && storedTime > 0 ? storedTime : lastActivityTime;
      if (Date.now() - targetTime >= INACTIVITY_TIMEOUT_MS) {
        logoutUser();
      }
    };

    // Immediate check
    checkInactivity();

    // Throttled handler for user interaction and movement events
    let lastThrottledTime = Date.now();
    const handleUserActivity = () => {
      const now = Date.now();
      lastActivityTime = now;
      if (now - lastThrottledTime >= 3000) {
        lastThrottledTime = now;
        localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, String(now));
      }
    };

    const activityEvents: (keyof WindowEventMap)[] = [
      'mousemove',
      'mousedown',
      'keydown',
      'touchstart',
      'scroll',
      'wheel',
      'click',
    ];

    activityEvents.forEach((evt) => {
      window.addEventListener(evt, handleUserActivity as EventListener, { passive: true });
    });

    const handleVisibilityOrFocus = () => {
      checkInactivity();
      if (document.visibilityState === 'visible') {
        handleUserActivity();
      }
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.LAST_ACTIVITY && e.newValue) {
        const val = Number(e.newValue);
        if (!isNaN(val)) {
          lastActivityTime = val;
        }
      }
      if (e.key === STORAGE_KEYS.CURRENT_USER && !e.newValue) {
        setCurrentUser(null);
        setIsSiteCreatorMode(false);
      }
      if (e.key === STORAGE_KEYS.AGENCIES && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setAgencies(parsed);
          }
        } catch {}
      }
      if (e.key === STORAGE_KEYS.PROPERTIES && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setProperties(parsed);
          }
        } catch {}
      }
      if (e.key === STORAGE_KEYS.USERS && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setUsers(parsed);
          }
        } catch {}
      }
      if (e.key === STORAGE_KEYS.VISITS && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setVisits(parsed);
          }
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Background interval check every 15 seconds
    const intervalId = setInterval(checkInactivity, 15000);

    return () => {
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, handleUserActivity as EventListener);
      });
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(intervalId);
    };
  }, [currentUser]);

  const resetToDefaults = () => {
    setAgencies(INITIAL_AGENCIES);
    setProperties(INITIAL_PROPERTIES);
    setVisits(INITIAL_VISITS);
    setUsers(INITIAL_USERS);
    setTickets(INITIAL_TICKETS);
    setAgencyChatMessages(INITIAL_AGENCY_CHAT);
    setCurrentUser(null);
    setSelectedAgencyId('ag-vertice');
    setIsSiteCreatorMode(false);
    localStorage.clear();
  };

  return (
    <AppContext.Provider
      value={{
        agencies,
        properties,
        visits,
        users,
        tickets,
        agencyChatMessages,
        currentUser,
        selectedAgencyId,
        currentAgency,
        isSuperAdmin,
        isSiteCreatorMode,
        setIsSiteCreatorMode,
        addAgency,
        updateAgency,
        deleteAgency,
        updateAgencyPlan,
        addProperty,
        updateProperty,
        deleteProperty,
        requestPropertyFeature,
        approvePropertyFeature,
        rejectPropertyFeature,
        togglePropertyFeature,
        bookVisit,
        cancelVisit,
        updateVisitStatus,
        toggleFavorite,
        isFavorite,
        loginUser,
        loginUserWithPassword,
        loginSuperAdmin,
        registerUser,
        updateUserPassword,
        setUserFirstAccess,
        updateUser,
        deleteUser,
        addUser,
        createSupportTicket,
        addTicketMessage,
        updateTicketStatus,
        deleteSupportTicket,
        sendAgencyChatMessage,
        logoutUser,
        setSelectedAgencyId: setSelectedAgencyIdSafe,
        incrementPropertyView,
        getAgencyById,
        getVisitsForPropertyAndDate,
        resetToDefaults,
        recordUserActivity,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
