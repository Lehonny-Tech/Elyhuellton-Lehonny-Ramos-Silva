import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Agency, Property, VisitAppointment, User, PlanType, SubscriptionStatus } from '../types';
import { INITIAL_AGENCIES, INITIAL_PROPERTIES, INITIAL_VISITS, INITIAL_USERS } from '../data/initialData';
import { canCreateProperty } from '../utils/planPermissions';

interface AppContextType {
  agencies: Agency[];
  properties: Property[];
  visits: VisitAppointment[];
  currentUser: User | null;
  selectedAgencyId: string | null; // For agency admin view
  currentAgency: Agency | null;
  isSiteCreatorMode: boolean;
  setIsSiteCreatorMode: (mode: boolean) => void;
  addAgency: (agencyData: Omit<Agency, 'id'>) => Agency;
  updateAgency: (id: string, updates: Partial<Agency>) => void;
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
  registerUser: (name: string, email: string, phone?: string) => User;
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
      return saved ? JSON.parse(saved) : INITIAL_USERS;
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

  const loginUser = (email: string, role?: 'client' | 'agency_admin', agencyId?: string): boolean => {
    const existingUser = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      setCurrentUser(existingUser);
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
      role: role || 'client',
      agencyId: agencyId,
      favorites: [],
    };
    setUsers((prev) => [...prev, newUser]);
    setCurrentUser(newUser);
    if (agencyId) {
      setSelectedAgencyId(agencyId);
    }
    return true;
  };

  const registerUser = (name: string, email: string, phone?: string): User => {
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
      role: 'client',
      favorites: [],
    };

    setUsers((prev) => [...prev, newUser]);
    setCurrentUser(newUser);
    return newUser;
  };

  const logoutUser = () => {
    setCurrentUser(null);
  };

  const resetToDefaults = () => {
    setAgencies(INITIAL_AGENCIES);
    setProperties(INITIAL_PROPERTIES);
    setVisits(INITIAL_VISITS);
    setUsers(INITIAL_USERS);
    setCurrentUser(INITIAL_USERS[0]);
    setSelectedAgencyId('ag-vertice');
    localStorage.clear();
  };

  return (
    <AppContext.Provider
      value={{
        agencies,
        properties,
        visits,
        currentUser,
        selectedAgencyId,
        currentAgency,
        isSiteCreatorMode,
        setIsSiteCreatorMode,
        addAgency,
        updateAgency,
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
        registerUser,
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
