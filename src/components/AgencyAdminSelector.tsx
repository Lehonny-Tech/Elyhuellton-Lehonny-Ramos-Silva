import React, { useState } from 'react';
import { User, Agency } from '../types';
import { Search, UserCheck, UserPlus, Shield, Building2, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

export interface AgencyAdminSelectorProps {
  mode: 'existing' | 'new';
  setMode: (mode: 'existing' | 'new') => void;
  users: User[];
  selectedUserId: string;
  onSelectUser: (userId: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  newAdminName: string;
  setNewAdminName: (name: string) => void;
  newAdminEmail: string;
  setNewAdminEmail: (email: string) => void;
  newAdminPassword: string;
  setNewAdminPassword: (pw: string) => void;
  newAdminPhone: string;
  setNewAdminPhone: (phone: string) => void;
  getAgencyById?: (agencyId: string) => Agency | undefined;
}

export const AgencyAdminSelector: React.FC<AgencyAdminSelectorProps> = ({
  mode,
  setMode,
  users,
  selectedUserId,
  onSelectUser,
  searchQuery,
  setSearchQuery,
  newAdminName,
  setNewAdminName,
  newAdminEmail,
  setNewAdminEmail,
  newAdminPassword,
  setNewAdminPassword,
  newAdminPhone,
  setNewAdminPhone,
  getAgencyById,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.phone && u.phone.includes(q))
    );
  });

  const selectedUser = users.find((u) => u.id === selectedUserId);

  return (
    <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 sm:p-5 space-y-3.5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-stone-200 pb-3">
        <div>
          <label className="block text-xs font-bold text-stone-900 flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            Administrador Responsável da Imobiliária *
          </label>
          <p className="text-[11px] text-stone-500 mt-0.5">
            Indique, selecione ou crie o administrador com plenos poderes para gerenciar esta imobiliária e seus corretores.
          </p>
        </div>

        {/* Mode Switcher Buttons */}
        <div className="flex items-center gap-1 bg-stone-200/80 p-0.5 rounded-xl text-xs shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setMode('existing')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer ${
              mode === 'existing'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Vincular Existente</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('new')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer ${
              mode === 'new'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Criar Novo Admin</span>
          </button>
        </div>
      </div>

      {mode === 'existing' ? (
        <div className="space-y-2.5">
          {/* Search Bar for selecting existing user */}
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Pesquisar usuário da rede por nome, e-mail ou telefone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-xl bg-white focus:outline-emerald-600 shadow-xs"
            />
          </div>

          {/* Searchable Users List Selector */}
          <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 border border-stone-200 rounded-xl p-2 bg-white divide-y divide-stone-100">
            {filteredUsers.length === 0 ? (
              <div className="py-6 text-center text-xs text-stone-500">
                Nenhum usuário encontrado para a busca &quot;{searchQuery}&quot;. Você pode alternar para &quot;Criar Novo Admin&quot;.
              </div>
            ) : (
              filteredUsers.map((u) => {
                const isSelected = selectedUserId === u.id;
                const agencyName = u.agencyId && getAgencyById ? getAgencyById(u.agencyId)?.tradeName : undefined;
                return (
                  <div
                    key={u.id}
                    onClick={() => onSelectUser(u.id)}
                    className={`pt-1.5 first:pt-0 pb-1.5 flex items-center justify-between p-2 rounded-xl transition cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 border border-emerald-300 text-emerald-950 ring-1 ring-emerald-300'
                        : 'hover:bg-stone-50 border border-transparent text-stone-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                          isSelected
                            ? 'bg-emerald-600 text-white'
                            : 'bg-stone-100 text-stone-700 border border-stone-200'
                        }`}
                      >
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 text-left">
                        <div className="font-bold text-xs truncate flex items-center gap-1.5">
                          <span>{u.name}</span>
                          {u.role === 'super_admin' && (
                            <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.2 rounded-md font-semibold">
                              Super Admin
                            </span>
                          )}
                          {u.role === 'agency_admin' && (
                            <span className="text-[10px] bg-blue-100 text-blue-900 border border-blue-300 px-1.5 py-0.2 rounded-md font-semibold flex items-center gap-0.5">
                              <Building2 className="w-2.5 h-2.5" />
                              {agencyName || 'Admin Imob'}
                            </span>
                          )}
                          {u.role === 'client' && (
                            <span className="text-[10px] bg-stone-100 text-stone-600 border border-stone-200 px-1.5 py-0.2 rounded-md">
                              Cliente
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-stone-500 truncate">
                          {u.email} {u.phone ? `• ${u.phone}` : ''}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 pl-2">
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center transition ${
                          isSelected
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-stone-300 bg-white'
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {selectedUser && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 flex items-center gap-2 text-xs text-emerald-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="truncate">
                Administrador selecionado:{' '}
                <strong className="font-bold">{selectedUser.name}</strong> ({selectedUser.email}) — será vinculado automaticamente a esta nova imobiliária.
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Nome Completo do Administrador *
              </label>
              <input
                type="text"
                placeholder="Ex: Carlos Eduardo Silva"
                value={newAdminName}
                onChange={(e) => setNewAdminName(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl bg-white focus:outline-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                E-mail de Acesso do Administrador *
              </label>
              <input
                type="email"
                placeholder="admin@imobiliaria.com.br"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl bg-white focus:outline-emerald-600 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Senha Inicial / Provisória *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Defina a senha (ex: imobiliaria123)"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-9 border border-stone-300 rounded-xl bg-white focus:outline-emerald-600 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Telefone / WhatsApp Direto
              </label>
              <input
                type="text"
                placeholder="(11) 99999-8888"
                value={newAdminPhone}
                onChange={(e) => setNewAdminPhone(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl bg-white focus:outline-emerald-600"
              />
            </div>
          </div>

          <div className="text-[11px] text-stone-500 bg-stone-100 p-2.5 rounded-xl border border-stone-200 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              O novo administrador será criado com o perfil <strong>Administrador da Imobiliária (agency_admin)</strong> e poderá logar imediatamente com este e-mail e senha.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
