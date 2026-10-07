import React, { useState } from 'react';
import {
  Users,
  KeyRound,
  Edit,
  Trash2,
  PlusCircle,
  Search,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  Building2,
  User as UserIcon,
  Crown,
  Phone,
  Mail,
  Lock,
  RefreshCw,
  X,
  Sparkles,
} from 'lucide-react';
import { User, Agency } from '../types';
import { useApp } from '../context/AppContext';

interface SuperAdminUsersManagementTabProps {
  agencies: Agency[];
}

export const SuperAdminUsersManagementTab: React.FC<SuperAdminUsersManagementTabProps> = ({
  agencies,
}) => {
  const { users, updateUserPassword, updateUser, deleteUser, addUser, currentUser } = useApp();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'client' | 'agency_admin' | 'super_admin'>('all');

  // Change Password Modal State
  const [passwordModalUser, setPasswordModalUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState<'client' | 'agency_admin' | 'super_admin' | 'site_creator'>('client');
  const [editAgencyId, setEditAgencyId] = useState<string>('');
  const [editStatus, setEditStatus] = useState<'active' | 'suspended'>('active');

  // Create User Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPhone, setCreatePhone] = useState('');
  const [createPassword, setCreatePassword] = useState('imobi123');
  const [createRole, setCreateRole] = useState<'client' | 'agency_admin' | 'super_admin' | 'site_creator'>('agency_admin');
  const [createAgencyId, setCreateAgencyId] = useState<string>(agencies[0]?.id || '');
  const [createFirstAccess, setCreateFirstAccess] = useState(true);

  // First Access Dialog Box State (No ato do cadastro)
  const [isFirstAccessInfoModalOpen, setIsFirstAccessInfoModalOpen] = useState(false);

  // Visible Passwords map (for super admin auditing on table)
  const [visiblePasswordIds, setVisiblePasswordIds] = useState<Record<string, boolean>>({});

  // Toast / feedback message
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 4500);
  };

  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswordIds((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  // Filtered Users list
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.phone && u.phone.includes(searchQuery));

    const matchesRole =
      roleFilter === 'all'
        ? true
        : roleFilter === 'super_admin'
        ? u.role === 'super_admin' || u.role === 'site_creator' || u.id === 'user-superadmin'
        : u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const clientsCount = users.filter((u) => u.role === 'client').length;
  const agencyAdminsCount = users.filter((u) => u.role === 'agency_admin').length;
  const superAdminsCount = users.filter((u) => u.role === 'super_admin' || u.role === 'site_creator' || u.id === 'user-superadmin').length;

  // Handlers
  const openPasswordModal = (user: User) => {
    setPasswordModalUser(user);
    setNewPassword('');
    setPasswordError('');
    setShowNewPassword(false);
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalUser) return;

    if (!newPassword.trim()) {
      setPasswordError('Digite a nova senha desejada.');
      return;
    }

    if (newPassword.trim().length < 4) {
      setPasswordError('A senha deve ter pelo menos 4 caracteres.');
      return;
    }

    const ok = updateUserPassword(passwordModalUser.id, newPassword.trim());
    if (ok) {
      showNotification(`Senha do usuário "${passwordModalUser.name}" (${passwordModalUser.email}) foi alterada com sucesso!`, 'success');
      setPasswordModalUser(null);
    } else {
      setPasswordError('Não foi possível alterar a senha. Tente novamente.');
    }
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditPhone(user.phone || '');
    setEditRole(user.role);
    setEditAgencyId(user.agencyId || agencies[0]?.id || '');
    setEditStatus(user.status || 'active');
  };

  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if (!editName.trim() || !editEmail.trim()) {
      showNotification('Nome e e-mail são obrigatórios.', 'error');
      return;
    }

    updateUser(editingUser.id, {
      name: editName.trim(),
      email: editEmail.trim().toLowerCase(),
      phone: editPhone.trim() || undefined,
      role: editRole,
      agencyId: editRole === 'agency_admin' ? editAgencyId : undefined,
      status: editStatus,
    });

    showNotification(`Dados do usuário "${editName}" atualizados com sucesso!`, 'success');
    setEditingUser(null);
  };

  const handleDeleteUser = (user: User) => {
    if (user.id === currentUser?.id) {
      showNotification('Você não pode excluir a sua própria conta ativa de Super Administrador.', 'error');
      return;
    }

    const confirmDelete = window.confirm(
      `Tem certeza que deseja excluir permanentemente o usuário "${user.name}" (${user.email})?`
    );

    if (confirmDelete) {
      const ok = deleteUser(user.id);
      if (ok) {
        showNotification(`Usuário "${user.name}" foi excluído permanentemente do portal.`, 'success');
      } else {
        showNotification('Erro ao excluir usuário.', 'error');
      }
    }
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim() || !createEmail.trim()) {
      showNotification('Nome e e-mail são campos obrigatórios.', 'error');
      return;
    }

    // Check if email already exists
    if (users.some((u) => u.email.toLowerCase() === createEmail.trim().toLowerCase())) {
      showNotification('Já existe um usuário cadastrado com este e-mail.', 'error');
      return;
    }

    addUser({
      name: createName.trim(),
      email: createEmail.trim().toLowerCase(),
      phone: createPhone.trim() || undefined,
      password: createPassword.trim() || 'imobi123',
      role: createRole,
      agencyId: createRole === 'agency_admin' ? createAgencyId : undefined,
      status: 'active',
      firstAccess: createFirstAccess,
    });

    showNotification(
      `Novo usuário "${createName}" criado com sucesso! ${
        createFirstAccess ? '(Primeiro Acesso configurado para alteração de senha)' : ''
      }`,
      'success'
    );
    setIsCreateModalOpen(false);
    setCreateName('');
    setCreateEmail('');
    setCreatePhone('');
    setCreatePassword('imobi123');
    setCreateFirstAccess(true);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-semibold shadow-md transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-50 border border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border border-rose-300 text-rose-900'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Top Banner & Stats */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider mb-1">
              <Crown className="w-3.5 h-3.5 text-amber-700" />
              Controle Geral de Contas & Credenciais
            </div>
            <h2 className="text-xl font-bold text-stone-900">
              Gestão de Usuários & Alteração de Senhas
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Visualize, edite e altere a senha de qualquer usuário do portal, tanto de imobiliárias parceiras quanto de clientes finais.
            </p>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Cadastrar Novo Usuário</span>
          </button>
        </div>

        {/* Quick KPI stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-3">
            <span className="text-[11px] font-semibold text-stone-500 block">Total de Usuários</span>
            <div className="text-xl font-bold text-stone-900 mt-0.5 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              <span>{users.length}</span>
            </div>
          </div>

          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3">
            <span className="text-[11px] font-semibold text-emerald-800 block">Imobiliárias / Corretores</span>
            <div className="text-xl font-bold text-emerald-900 mt-0.5 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-700" />
              <span>{agencyAdminsCount}</span>
            </div>
          </div>

          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3">
            <span className="text-[11px] font-semibold text-blue-800 block">Clientes Cadastrados</span>
            <div className="text-xl font-bold text-blue-900 mt-0.5 flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-blue-700" />
              <span>{clientsCount}</span>
            </div>
          </div>

          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3">
            <span className="text-[11px] font-semibold text-amber-800 block">Super Administradores</span>
            <div className="text-xl font-bold text-amber-900 mt-0.5 flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-700" />
              <span>{superAdminsCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar usuário por nome, e-mail ou telefone..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-emerald-600 bg-stone-50/50"
          />
        </div>

        {/* Role Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setRoleFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              roleFilter === 'all'
                ? 'bg-stone-900 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Todos ({users.length})
          </button>
          <button
            onClick={() => setRoleFilter('agency_admin')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              roleFilter === 'agency_admin'
                ? 'bg-emerald-700 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            🏢 Imobiliárias ({agencyAdminsCount})
          </button>
          <button
            onClick={() => setRoleFilter('client')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              roleFilter === 'client'
                ? 'bg-blue-700 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            👤 Clientes ({clientsCount})
          </button>
          <button
            onClick={() => setRoleFilter('super_admin')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              roleFilter === 'super_admin'
                ? 'bg-amber-500 text-stone-950 font-bold'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            👑 Super Admins ({superAdminsCount})
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-100/80 text-stone-600 font-semibold border-b border-stone-200">
              <tr>
                <th className="py-3.5 px-4">Usuário</th>
                <th className="py-3.5 px-4">Tipo / Perfil</th>
                <th className="py-3.5 px-4">Imobiliária Vinculada</th>
                <th className="py-3.5 px-4">Telefone / WhatsApp</th>
                <th className="py-3.5 px-4">Senha Atual (Master)</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Ações Master</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-stone-400">
                    Nenhum usuário encontrado com os filtros atuais.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const associatedAgency = user.agencyId ? agencies.find((a) => a.id === user.agencyId) : null;
                  const isVisiblePassword = visiblePasswordIds[user.id];
                  const isMasterSuperAdmin = user.role === 'super_admin' || user.role === 'site_creator' || user.id === 'user-superadmin';

                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-stone-50/80 transition ${
                        user.id === currentUser?.id ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      {/* Name & Email */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                              isMasterSuperAdmin
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : user.role === 'agency_admin'
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                : 'bg-stone-100 text-stone-700 border border-stone-200'
                            }`}
                          >
                            {isMasterSuperAdmin ? (
                              <Crown className="w-4 h-4 text-amber-700" />
                            ) : user.role === 'agency_admin' ? (
                              <Building2 className="w-4 h-4 text-emerald-700" />
                            ) : (
                              user.name.substring(0, 2).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-stone-900 flex items-center gap-1.5">
                              <span>{user.name}</span>
                              {user.id === currentUser?.id && (
                                <span className="bg-amber-200 text-amber-900 text-[10px] px-1.5 py-0.2 rounded font-semibold">
                                  Você (Ativo)
                                </span>
                              )}
                            </div>
                            <div className="text-stone-500 text-[11px] font-mono flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3 text-stone-400" />
                              <span>{user.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4">
                        {isMasterSuperAdmin ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            <Crown className="w-3 h-3 text-amber-700" />
                            Super Administrador (Master)
                          </span>
                        ) : user.role === 'agency_admin' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                            <Building2 className="w-3 h-3 text-emerald-700" />
                            Imobiliária / Corretor
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-blue-50 text-blue-800 border border-blue-200">
                            <UserIcon className="w-3 h-3 text-blue-600" />
                            Cliente Final
                          </span>
                        )}
                      </td>

                      {/* Associated Agency */}
                      <td className="py-3.5 px-4">
                        {associatedAgency ? (
                          <div className="flex items-center gap-1.5">
                            {associatedAgency.logoUrl && (
                              <img
                                src={associatedAgency.logoUrl}
                                alt={associatedAgency.tradeName}
                                className="w-5 h-5 rounded-md object-cover border border-stone-200 shrink-0"
                              />
                            )}
                            <div>
                              <div className="font-semibold text-stone-900">
                                {associatedAgency.tradeName || associatedAgency.name}
                              </div>
                              <div className="text-[10px] text-stone-400 font-mono">
                                CRECI {associatedAgency.creci} • {associatedAgency.city}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-stone-400 italic text-[11px]">Nenhuma (Portal Geral)</span>
                        )}
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4">
                        {user.phone ? (
                          <div className="text-stone-800 font-mono text-[11px] flex items-center gap-1">
                            <Phone className="w-3 h-3 text-stone-400" />
                            <span>{user.phone}</span>
                          </div>
                        ) : (
                          <span className="text-stone-400 text-[11px]">-</span>
                        )}
                      </td>

                      {/* Password with View Toggle */}
                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-1.5 bg-stone-100 border border-stone-200 px-2.5 py-1 rounded-lg">
                          <Lock className="w-3 h-3 text-stone-400 shrink-0" />
                          <span className="font-mono text-xs font-semibold text-stone-800">
                            {isVisiblePassword ? user.password || 'cliente123' : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(user.id)}
                            className="text-stone-400 hover:text-stone-700 p-0.5 ml-1 transition cursor-pointer"
                            title={isVisiblePassword ? 'Ocultar senha' : 'Exibir senha'}
                          >
                            {isVisiblePassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            user.status !== 'suspended'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}
                        >
                          {user.status !== 'suspended' ? 'Ativo' : 'Suspenso'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          {/* CRITICAL BUTTON: Alterar Senha */}
                          <button
                            onClick={() => openPasswordModal(user)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold rounded-lg text-xs transition cursor-pointer shadow-xs"
                            title="Alterar ou redefinir a senha deste usuário"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            <span>Alterar Senha</span>
                          </button>

                          {/* Edit User Info */}
                          <button
                            onClick={() => openEditModal(user)}
                            className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition cursor-pointer"
                            title="Editar dados cadastrais"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete User */}
                          <button
                            onClick={() => handleDeleteUser(user)}
                            disabled={user.id === currentUser?.id}
                            className={`p-1.5 rounded-lg transition cursor-pointer ${
                              user.id === currentUser?.id
                                ? 'bg-stone-100 text-stone-300 cursor-not-allowed'
                                : 'bg-rose-50 hover:bg-rose-100 text-rose-700'
                            }`}
                            title={
                              user.id === currentUser?.id
                                ? 'Não é possível excluir o usuário ativo'
                                : 'Excluir usuário do portal'
                            }
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ALTERAR SENHA (CRÍTICO) */}
      {passwordModalUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-md w-full overflow-hidden animate-fade-in">
            <div className="bg-stone-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-stone-950 font-bold">
                  <KeyRound className="w-5 h-5 text-stone-950" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Alterar Senha do Usuário</h3>
                  <p className="text-xs text-stone-400">Controle Super Administrador</p>
                </div>
              </div>
              <button
                onClick={() => setPasswordModalUser(null)}
                className="text-stone-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePassword} className="p-6 space-y-4 text-xs">
              {passwordError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
                  {passwordError}
                </div>
              )}

              {/* User preview */}
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 space-y-1">
                <div className="text-stone-500 text-[11px] font-semibold uppercase tracking-wider">
                  Usuário Selecionado:
                </div>
                <div className="font-bold text-stone-900 text-sm">{passwordModalUser.name}</div>
                <div className="text-stone-600 font-mono text-[11px]">{passwordModalUser.email}</div>
                <div className="text-[11px] text-stone-500 pt-1">
                  Perfil:{' '}
                  <strong className="text-stone-800">
                    {passwordModalUser.role === 'super_admin' || passwordModalUser.role === 'site_creator' || passwordModalUser.id === 'user-superadmin'
                      ? 'Super Administrador (Master)'
                      : passwordModalUser.role === 'agency_admin'
                      ? 'Imobiliária / Corretor'
                      : 'Cliente Final'}
                  </strong>
                </div>
              </div>

              {/* Password input */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Nova Senha *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Digite a nova senha desejada"
                    className="w-full pl-9 pr-10 py-2.5 border border-stone-300 rounded-xl text-xs focus:outline-emerald-600 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer p-0.5"
                    title={showNewPassword ? 'Ocultar senha' : 'Ver senha'}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Quick suggestions */}
              <div>
                <span className="text-[11px] text-stone-500 font-medium block mb-1.5">
                  Sugestões Rápidas:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setNewPassword('123456')}
                    className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-[11px] font-mono cursor-pointer"
                  >
                    123456
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewPassword('mudar123')}
                    className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-[11px] font-mono cursor-pointer"
                  >
                    mudar123
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewPassword('imobi2026')}
                    className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-[11px] font-mono cursor-pointer"
                  >
                    imobi2026
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewPassword('cliente123')}
                    className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-[11px] font-mono cursor-pointer"
                  >
                    cliente123
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setPasswordModalUser(null)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 rounded-xl font-semibold hover:bg-stone-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 rounded-xl font-bold transition cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Salvar Nova Senha</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR USUÁRIO */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-lg w-full overflow-hidden animate-fade-in">
            <div className="bg-stone-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Editar Dados do Usuário</h3>
                  <p className="text-xs text-stone-400">Controle Master do Portal</p>
                </div>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-stone-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    E-mail *
                  </label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-emerald-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="(11) 99888-7766"
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-emerald-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Perfil / Função no Portal
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as any)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-emerald-600 bg-white cursor-pointer"
                  >
                    <option value="client">Cliente Final</option>
                    <option value="agency_admin">Administrador de Imobiliária</option>
                    <option value="super_admin">Super Administrador (Master)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Status da Conta
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-emerald-600 bg-white cursor-pointer"
                  >
                    <option value="active">Ativo (Acesso Liberado)</option>
                    <option value="suspended">Suspenso (Bloqueado)</option>
                  </select>
                </div>

                {editRole === 'agency_admin' && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Imobiliária Vinculada *
                    </label>
                    <select
                      value={editAgencyId}
                      onChange={(e) => setEditAgencyId(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-emerald-600 bg-white cursor-pointer"
                    >
                      {agencies.map((ag) => (
                        <option key={ag.id} value={ag.id}>
                          {ag.tradeName || ag.name} (CRECI {ag.creci} - {ag.city})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 rounded-xl font-semibold hover:bg-stone-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition cursor-pointer shadow-xs"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CRIAR NOVO USUÁRIO */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-lg w-full overflow-hidden animate-fade-in">
            <div className="bg-stone-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Cadastrar Novo Usuário</h3>
                  <p className="text-xs text-stone-400">Criar conta diretamente pelo Super Administrador</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-stone-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: João da Silva"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    E-mail de Login *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="usuario@email.com"
                    value={createEmail}
                    onChange={(e) => setCreateEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-emerald-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Senha Inicial *
                  </label>
                  <input
                    type="text"
                    required
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-emerald-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="(11) 98888-7777"
                    value={createPhone}
                    onChange={(e) => setCreatePhone(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-emerald-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Tipo de Conta
                  </label>
                  <select
                    value={createRole}
                    onChange={(e) => setCreateRole(e.target.value as any)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-emerald-600 bg-white cursor-pointer"
                  >
                    <option value="client">Cliente Final</option>
                    <option value="agency_admin">Administrador de Imobiliária</option>
                    <option value="super_admin">Super Administrador (Master)</option>
                  </select>
                </div>

                {createRole === 'agency_admin' && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Vincular à Imobiliária *
                    </label>
                    <select
                      value={createAgencyId}
                      onChange={(e) => setCreateAgencyId(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-emerald-600 bg-white cursor-pointer"
                    >
                      {agencies.map((ag) => (
                        <option key={ag.id} value={ag.id}>
                          {ag.tradeName || ag.name} (CRECI {ag.creci})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* CAIXA DE DIÁLOGO / CONFIGURAÇÃO DE PRIMEIRO ACESSO */}
                <div className="sm:col-span-2 bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center font-bold shrink-0">
                        <KeyRound className="w-4 h-4 text-amber-800" />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-stone-900">
                          Configuração de Primeiro Acesso
                        </div>
                        <div className="text-[11px] text-stone-600">
                          Exigir troca de senha no primeiro login do administrador
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsFirstAccessInfoModalOpen(true)}
                      className="px-3 py-1.5 bg-white hover:bg-stone-50 border border-amber-300 text-amber-900 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                      <span>Caixa de Diálogo "Primeiro Acesso"</span>
                    </button>
                  </div>

                  <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={createFirstAccess}
                      onChange={(e) => setCreateFirstAccess(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 mt-0.5 cursor-pointer shrink-0"
                    />
                    <div className="text-xs text-stone-800">
                      <span className="font-bold">
                        Habilitar botão/exigência de "Primeiro Acesso"
                      </span>{' '}
                      - O administrador ao realizar o primeiro acesso poderá alterar sua senha. Isso acontece{' '}
                      <span className="font-semibold text-emerald-800">
                        sem a alteração dos dados, configuração, poderes e limites já existentes
                      </span>
                      .
                    </div>
                  </label>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 rounded-xl font-semibold hover:bg-stone-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Cadastrar Usuário</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 1: CAIXA DE DIÁLOGO "PRIMEIRO ACESSO" INFORMATIVA & TERMOS */}
      {isFirstAccessInfoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-md w-full overflow-hidden animate-fade-in">
            <div className="bg-stone-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-stone-950 font-bold">
                  <KeyRound className="w-5 h-5 text-stone-950" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Primeiro Acesso</h3>
                  <p className="text-xs text-amber-400">Caixa de Diálogo de Cadastro</p>
                </div>
              </div>
              <button
                onClick={() => setIsFirstAccessInfoModalOpen(false)}
                className="text-stone-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>Preservação de Poderes e Limites</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Este botão fará com que o administrador ao realizar o primeiro acesso possa alterar a senha. Essa ação ocorre com segurança absoluta sem qualquer perda de poderes e limites.
                </p>
              </div>

              <div className="space-y-2 text-stone-700 leading-relaxed">
                <p>
                  <strong>Garantias do Primeiro Acesso:</strong>
                </p>
                <ul className="list-disc pl-4 space-y-1 text-stone-600">
                  <li>Nenhum dado cadastral da imobiliária ou corretor é alterado.</li>
                  <li>Configurações de CRECI, contatos e localização permanecem 100% mantidos.</li>
                  <li>Poderes administrativos e limites de anúncios do plano contratado continuam inalterados.</li>
                </ul>
              </div>

              <div className="pt-2 flex items-center justify-between gap-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => {
                    setCreateFirstAccess(!createFirstAccess);
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    createFirstAccess
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-stone-100 text-stone-600 border border-stone-200'
                  }`}
                >
                  {createFirstAccess ? '✓ Primeiro Acesso Ativado' : 'Desativado (Clique p/ Ativar)'}
                </button>

                <button
                  type="button"
                  onClick={() => setIsFirstAccessInfoModalOpen(false)}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition cursor-pointer shadow-xs"
                >
                  Confirmar e Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
