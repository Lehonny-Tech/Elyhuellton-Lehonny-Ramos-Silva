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
  loginUser: (email: string, role?: 'client' | 'agency_admin' | 'site_creator', agencyId?: string) => boolean;
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
  updateTicketStatus: (ticketId: string, status: TicketStatus) => void;
  deleteSupportTicket: (ticketId: string) => void;
  sendAgencyChatMessage: (
    messageData: Omit<AgencyChatMessage, 'id' | 'createdAt'>
  ) => AgencyChatMessage;
  logoutUser: () => void;
  setSelectedAgencyId: (agencyId: string | null) => void;
  incrementPropertyView: (propertyId: string) => void;
  getAgencyById: (agencyId: string) => Agency | undefined;
  getVisitsForPropertyAndDate: (propertyId: string, date: string) => VisitAppointment[];
  resetToDefaults: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  AGENCIES: 'imobirede_agencies_v5',
  PROPERTIES: 'imobirede_properties_v4',
  VISITS: 'imobirede_visits_v4',
  USERS: 'imobirede_users_v4',
  CURRENT_USER: 'imobirede_current_user_v4',
  SELECTED_AGENCY: 'imobirede_selected_agency_v4',
  SITE_CREATOR_MODE: 'imobirede_site_creator_mode_v4',
  TICKETS: 'imobirede_tickets_v1',
  AGENCY_CHAT: 'imobirede_agency_chat_v1',
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [agencies, setAgencies] = useState<Agency[]>(() => {
    try {
      // Check v5 first, then fallback to v4 with migration
      const saved = localStorage.getItem(STORAGE_KEYS.AGENCIES) || localStorage.getItem('imobirede_agencies_v4');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.some((a) => a.id === 'ag-extrema')) {
          return parsed.map((ag) => {
            const initialMatch = INITIAL_AGENCIES.find((ia) => ia.id === ag.id);
            return {
              ...ag,
              plano: ag.plano || initialMatch?.plano || 'PROFISSIONAL',
              status_assinatura: ag.status_assinatura || initialMatch?.status_assinatura || 'ACTIVE',
              subscriptionStartDate: ag.subscriptionStartDate || initialMatch?.subscriptionStartDate || '2026-01-10',
              subscriptionRenewalDate: ag.subscriptionRenewalDate || initialMatch?.subscriptionRenewalDate || '2026-10-10',
            };
          });
        }
      }
      return INITIAL_AGENCIES;
    } catch {
      return INITIAL_AGENCIES;
    }
  });

  const [properties, setProperties] = useState<Property[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROPERTIES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.some((p) => p.agencyId === 'ag-extrema')) {
          return parsed.map((p) => ({
            ...p,
            minhaCasaMinhaVida: typeof p.minhaCasaMinhaVida === 'boolean' ? p.minhaCasaMinhaVida : false,
            fgts: typeof p.fgts === 'boolean' ? p.fgts : true,
            analiseCreditoGratuita: typeof p.analiseCreditoGratuita === 'boolean' ? p.analiseCreditoGratuita : true,
          }));
        }
      }
      return INITIAL_PROPERTIES;
    } catch {
      return INITIAL_PROPERTIES;
    }
  });

  const [visits, setVisits] = useState<VisitAppointment[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.VISITS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= INITIAL_VISITS.length) {
          return parsed;
        }
      }
      return INITIAL_VISITS;
    } catch {
      return INITIAL_VISITS;
    }
  });

  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          let merged: User[] = parsed.map((u: User) => {
            const initialMatch = INITIAL_USERS.find(
              (iu) => iu.id === u.id || iu.email.toLowerCase() === u.email.toLowerCase()
            );
            return {
              ...u,
              password:
                u.password ||
                initialMatch?.password ||
                (u.role === 'site_creator'
                  ? 'superadmin123'
                  : u.role === 'agency_admin'
                  ? 'imobiliaria123'
                  : 'cliente123'),
              createdAt: u.createdAt || initialMatch?.createdAt || '2026-01-15',
              status: u.status || 'active',
            };
          });

          // Ensure superadmin is present
          if (!merged.some((u) => u.email.toLowerCase() === 'superadmin@imobirede.com.br')) {
            const sa = INITIAL_USERS.find((iu) => iu.id === 'user-superadmin');
            if (sa) merged = [sa, ...merged];
          }
          return merged;
        }
      }
      return INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      return saved ? JSON.parse(saved) : INITIAL_USERS[0];
    } catch {
      return INITIAL_USERS[0];
    }
  });

  const [selectedAgencyId, setSelectedAgencyId] = useState<string | null>(() => {
    try {
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

  const [tickets, setTickets] = useState<SupportTicket[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TICKETS);
      return saved ? JSON.parse(saved) : INITIAL_TICKETS;
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

  const currentAgency = agencies.find((a) => a.id === selectedAgencyId) || agencies[0] || null;

  const getAgencyById = (agencyId: string) => {
    return agencies.find((a) => a.id === agencyId);
  };

  const addAgency = (agencyData: Omit<Agency, 'id'>): Agency => {
    const id = `ag-${Date.now()}`;
    const newAgency: Agency = { ...agencyData, id };
    setAgencies((prev) => [newAgency, ...prev]);
    return newAgency;
  };

  const updateAgency = (id: string, updates: Partial<Agency>) => {
    setAgencies((prev) => prev.map((ag) => (ag.id === id ? { ...ag, ...updates } : ag)));
  };

  const deleteAgency = (agencyId: string) => {
    setAgencies((prev) => prev.filter((ag) => ag.id !== agencyId));
    setProperties((prev) => prev.filter((p) => p.agencyId !== agencyId));
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
    setAgencies((prev) =>
      prev.map((ag) => {
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
      })
    );
  };

  const addProperty = (propertyData: Omit<Property, 'id' | 'code' | 'createdAt' | 'searchCount'>): Property => {
    const agency = getAgencyById(propertyData.agencyId);
    
    // Regra central de controle de limite de imóveis por plano (backend/regras de segurança)
    if (agency && !isSiteCreatorMode) {
      const currentCount = properties.filter((p) => p.agencyId === propertyData.agencyId).length;
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
      id,
      code,
      searchCount: Math.floor(Math.random() * 40) + 10,
      createdAt: new Date().toISOString(),
    };

    setProperties((prev) => [newProperty, ...prev]);
    return newProperty;
  };

  const updateProperty = (id: string, updates: Partial<Property>) => {
    setProperties((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const deleteProperty = (id: string) => {
    setProperties((prev) => prev.filter((p) => p.id !== id));
  };

  const requestPropertyFeature = (propertyId: string, notes?: string) => {
    setProperties((prev) =>
      prev.map((p) =>
        p.id === propertyId
          ? {
              ...p,
              featuredRequestStatus: 'pending' as const,
              featuredRequestedAt: new Date().toISOString(),
              featuredRequestNotes: notes || p.featuredRequestNotes,
            }
          : p
      )
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
    setVisits((prev) => prev.map((v) => (v.id === visitId ? { ...v, status } : v)));
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

  const loginUser = (email: string, role?: 'client' | 'agency_admin' | 'site_creator', agencyId?: string): boolean => {
    const existingUser = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      setCurrentUser(existingUser);
      if (existingUser.role === 'site_creator') {
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

    if (password && user.password && user.password !== password) {
      return { success: false, error: 'Senha incorreta. Verifique e tente novamente.' };
    }

    setCurrentUser(user);
    if (user.role === 'site_creator') {
      setIsSiteCreatorMode(true);
    }
    if (user.agencyId) {
      setSelectedAgencyId(user.agencyId);
    }
    return { success: true, user };
  };

  const loginSuperAdmin = (password: string, email = 'superadmin@imobirede.com.br'): boolean => {
    const normalizedEmail = email.toLowerCase().trim();
    // Allow master logins
    const admin = users.find(
      (u) =>
        (u.email.toLowerCase() === normalizedEmail ||
          u.email.toLowerCase() === 'criador@imobirede.com.br' ||
          u.role === 'site_creator') &&
        (u.password === password || password === 'superadmin123' || password === 'master123')
    );

    if (admin) {
      setCurrentUser(admin);
      setIsSiteCreatorMode(true);
      return true;
    }

    // If password matches the master default
    if (password === 'superadmin123' || password === 'master123') {
      const sa = users.find((u) => u.role === 'site_creator') || {
        id: 'user-superadmin',
        name: 'Super Administrador (Master)',
        email: 'superadmin@imobirede.com.br',
        password: 'superadmin123',
        role: 'site_creator' as const,
        favorites: [],
        createdAt: '2026-01-01',
        status: 'active' as const,
      };
      setCurrentUser(sa);
      setIsSiteCreatorMode(true);
      return true;
    }

    return false;
  };

  const registerUser = (name: string, email: string, phone?: string, password?: string): User => {
    const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      setCurrentUser(existing);
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
    return newUser;
  };

  const updateUserPassword = (userId: string, newPassword: string): boolean => {
    if (!newPassword || newPassword.trim().length === 0) return false;
    const cleanPassword = newPassword.trim();
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, password: cleanPassword } : u))
    );
    if (currentUser?.id === userId) {
      setCurrentUser((prev) => (prev ? { ...prev, password: cleanPassword } : null));
    }
    return true;
  };

  const updateUser = (userId: string, updates: Partial<User>) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, ...updates } : u))
    );
    if (currentUser?.id === userId) {
      setCurrentUser((prev) => (prev ? { ...prev, ...updates } : null));
    }
  };

  const deleteUser = (userId: string): boolean => {
    if (currentUser?.id === userId) {
      return false; // Cannot delete self
    }
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    return true;
  };

  const addUser = (userData: Omit<User, 'id' | 'favorites'> & { favorites?: string[] }): User => {
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
    };
    setUsers((prev) => [...prev, newUser]);
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
            senderRole: 'agency',
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
        if (messageData.senderRole === 'superadmin' && (t.status === 'aberto' || t.status === 'em_analise')) {
          nextStatus = 'respondido';
        } else if (messageData.senderRole === 'agency' && t.status === 'respondido') {
          nextStatus = 'em_analise';
        }

        return {
          ...t,
          status: nextStatus,
          updatedAt: now,
          messages: [...t.messages, newMessage],
        };
      })
    );
  };

  const updateTicketStatus = (ticketId: string, status: TicketStatus) => {
    const now = new Date().toISOString();
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status, updatedAt: now } : t))
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
  };

  const resetToDefaults = () => {
    setAgencies(INITIAL_AGENCIES);
    setProperties(INITIAL_PROPERTIES);
    setVisits(INITIAL_VISITS);
    setUsers(INITIAL_USERS);
    setTickets(INITIAL_TICKETS);
    setAgencyChatMessages(INITIAL_AGENCY_CHAT);
    setCurrentUser(INITIAL_USERS[0]);
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
        updateUser,
        deleteUser,
        addUser,
        createSupportTicket,
        addTicketMessage,
        updateTicketStatus,
        deleteSupportTicket,
        sendAgencyChatMessage,
        logoutUser,
        setSelectedAgencyId,
        incrementPropertyView,
        getAgencyById,
        getVisitsForPropertyAndDate,
        resetToDefaults,
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
