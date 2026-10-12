import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  User as UserIcon,
  Phone,
  Heart,
  Crown,
  KeyRound,
  Sparkles,
  CheckCircle2,
  LifeBuoy,
  AlertCircle,
  Building2,
  ShieldCheck,
  Send,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register' | 'superadmin' | 'reset_password' | 'first_access';
  onSuperAdminSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'login',
  onSuperAdminSuccess,
}) => {
  const {
    loginUser,
    loginSuperAdmin,
    loginUserWithPassword,
    registerUser,
    createSupportTicket,
    users,
    updateUserPassword,
    agencies,
    addAgency,
  } = useApp();

  const [mode, setMode] = useState<'login' | 'register' | 'superadmin' | 'reset_password' | 'first_access'>(defaultMode);

  // Common login/register state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Agency registration state
  const [registerType, setRegisterType] = useState<'client' | 'agency'>('client');
  const [regAgencyName, setRegAgencyName] = useState('');
  const [regAgencyTradeName, setRegAgencyTradeName] = useState('');
  const [regAgencyCreci, setRegAgencyCreci] = useState('');
  const [regAgencyCity, setRegAgencyCity] = useState('');
  const [regAgencyState, setRegAgencyState] = useState('SP');
  const [regAgencyWhatsApp, setRegAgencyWhatsApp] = useState('');
  const [regAgencyPlan, setRegAgencyPlan] = useState<'ESSENCIAL' | 'PROFISSIONAL' | 'PREMIUM'>('PROFISSIONAL');

  // Reset password ticket state
  const [resetRequesterType, setResetRequesterType] = useState<'client' | 'agency_admin'>('client');
  const [resetAgencyId, setResetAgencyId] = useState(agencies[0]?.id || 'ag-extrema');
  const [resetNotes, setResetNotes] = useState('Esqueci minha senha cadastrada no portal e solicito a redefinição de acesso à minha conta.');

  // First access state
  const [firstAccessNewPassword, setFirstAccessNewPassword] = useState('');
  const [firstAccessConfirmPassword, setFirstAccessConfirmPassword] = useState('');

  if (!isOpen) return null;

  const handleResetPasswordTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email.trim() || !name.trim()) {
      setError('Por favor, informe seu nome e e-mail.');
      return;
    }

    const agencyObj = agencies.find((a) => a.id === resetAgencyId);
    const targetAgencyId = resetRequesterType === 'agency_admin' ? resetAgencyId : 'portal_geral';
    const targetAgencyName = resetRequesterType === 'agency_admin' ? (agencyObj?.name || 'Imobiliária') : 'Cliente Final do Portal';
    const targetTradeName = resetRequesterType === 'agency_admin' ? (agencyObj?.tradeName || 'Imobiliária') : 'Cliente Final';

    const ticket = createSupportTicket({
      agencyId: targetAgencyId,
      agencyName: targetAgencyName,
      agencyTradeName: targetTradeName,
      agencyCreci: agencyObj?.creci,
      requesterRole: resetRequesterType,
      requesterName: name.trim(),
      requesterEmail: email.trim().toLowerCase(),
      requesterPhone: phone.trim() || undefined,
      title: 'Redefinição de Senha',
      category: 'login_usuarios',
      priority: 'alta',
      siteSection: 'Portal > Login > Redefinição de Senha',
      description: resetNotes.trim(),
      images: [],
      initialMessage: `Solicitação de Redefinição de Senha para ${name.trim()} (${email.trim()}). Tipo: ${
        resetRequesterType === 'agency_admin' ? `Administrador de Imobiliária (${targetTradeName})` : 'Cliente Final'
      }. Telefone/WhatsApp: ${phone.trim() || 'Não informado'}.`,
    });

    setSuccessMsg(`Chamado #${ticket.ticketNumber} com o título "Redefinição de Senha" foi aberto com sucesso com status "1. Aberto"! A administração do portal analisará seu pedido.`);
    setTimeout(() => {
      setMode('login');
      setSuccessMsg('');
    }, 4500);
  };

  const handleFirstAccessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email.trim() || !password.trim()) {
      setError('Informe seu e-mail e a senha inicial de acesso.');
      return;
    }

    if (!firstAccessNewPassword.trim() || firstAccessNewPassword.length < 4) {
      setError('A nova senha deve possuir ao menos 4 caracteres.');
      return;
    }

    if (firstAccessNewPassword !== firstAccessConfirmPassword) {
      setError('A confirmação da nova senha não confere.');
      return;
    }

    // Verify current user
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
    if (!user) {
      setError('Usuário não localizado pelo e-mail informado.');
      return;
    }

    if (user.password && user.password !== password) {
      setError('Senha inicial incorreta. Verifique a senha temporária fornecida.');
      return;
    }

    // Update password strictly preserving all configuration, role, powers, and limits
    updateUserPassword(user.id, firstAccessNewPassword.trim());

    // Auto login
    const loginRes = loginUserWithPassword(user.email, firstAccessNewPassword.trim());
    if (loginRes.success) {
      setSuccessMsg('Primeiro acesso concluído com sucesso! Sua senha pessoal foi definida, mantendo todas as permissões e dados intactos.');
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      setSuccessMsg('Senha alterada com sucesso! Faça login com a sua nova senha.');
      setMode('login');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (mode === 'superadmin') {
      const ok = loginSuperAdmin(password, email || 'superadmin@imobirede.com.br');
      if (ok) {
        setSuccessMsg('Autenticado como Super Administrador!');
        setTimeout(() => {
          if (onSuperAdminSuccess) onSuperAdminSuccess();
          onClose();
        }, 600);
      } else {
        setError('Senha ou e-mail de Super Administrador incorretos. Verifique suas credenciais.');
      }
      return;
    }

    if (!email.trim()) {
      setError('Por favor, informe seu e-mail.');
      return;
    }

    if (mode === 'register') {
      if (registerType === 'agency') {
        if (!regAgencyName.trim() || !regAgencyCreci.trim()) {
          setError('Razão Social e CRECI da imobiliária são obrigatórios.');
          return;
        }
        if (!password.trim()) {
          setError('Defina uma senha de acesso para o administrador da imobiliária.');
          return;
        }

        const created = addAgency({
          name: regAgencyName.trim(),
          tradeName: regAgencyTradeName.trim() || regAgencyName.trim(),
          creci: regAgencyCreci.trim(),
          phone: phone.trim() || regAgencyWhatsApp.trim() || '(11) 3300-0000',
          whatsapp: regAgencyWhatsApp.trim() || phone.trim() || '5511999998888',
          email: email.trim().toLowerCase(),
          adminEmail: email.trim().toLowerCase(),
          address: 'Endereço Comercial Central',
          city: regAgencyCity.trim() || 'São Paulo',
          state: regAgencyState.trim() || 'SP',
          description: 'Imobiliária parceira credenciada no portal.',
          logoUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=200&q=80',
          plano: regAgencyPlan,
          status_assinatura: 'ACTIVE',
          subscriptionStartDate: new Date().toISOString().split('T')[0],
          subscriptionRenewalDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        });

        const targetUser = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
        if (targetUser && password.trim()) {
          updateUserPassword(targetUser.id, password.trim());
        }

        loginUserWithPassword(email.trim().toLowerCase(), password.trim() || 'imobiliaria123');
        setSuccessMsg(`Imobiliária "${created.name}" cadastrada com sucesso! Bem-vindo(a) ao portal.`);
        setTimeout(() => onClose(), 1200);
        return;
      }

      if (!name.trim()) {
        setError('Por favor, informe seu nome.');
        return;
      }
      registerUser(name, email, phone, password);
      onClose();
    } else {
      const res = loginUserWithPassword(email, password);
      if (res.success) {
        if (
          (res.user?.role === 'super_admin' ||
            res.user?.role === 'site_creator' ||
            res.user?.id === 'user-superadmin') &&
          onSuperAdminSuccess
        ) {
          onSuperAdminSuccess();
        }
        onClose();
      } else {
        setError(res.error || 'Não foi possível entrar. Verifique seus dados.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-md w-full overflow-hidden flex flex-col my-auto">
        {/* Header */}
        <div
          className={`p-5 flex items-center justify-between transition-colors ${
            mode === 'superadmin'
              ? 'bg-stone-950 text-white border-b border-amber-500/30'
              : mode === 'reset_password'
              ? 'bg-amber-950 text-white border-b border-amber-500/30'
              : mode === 'first_access'
              ? 'bg-emerald-950 text-white border-b border-emerald-500/30'
              : 'bg-stone-900 text-white'
          }`}
        >
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
              {mode === 'superadmin' ? (
                <span className="text-amber-400 flex items-center gap-1">
                  <Crown className="w-3.5 h-3.5" />
                  Painel de Acesso Master
                </span>
              ) : mode === 'reset_password' ? (
                <span className="text-amber-300 flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5" />
                  Chamado de Suporte
                </span>
              ) : mode === 'first_access' ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Segurança do Administrador
                </span>
              ) : (
                <span className="text-emerald-400 flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                  Área do Usuário
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold">
              {mode === 'superadmin'
                ? 'Super Administrador'
                : mode === 'reset_password'
                ? 'Redefinição de Senha'
                : mode === 'first_access'
                ? 'Primeiro Acesso - Trocar Senha'
                : mode === 'login'
                ? 'Acesse sua Conta'
                : 'Criar Cadastro'}
            </h3>
            <p className="text-xs text-stone-300 mt-0.5">
              {mode === 'superadmin'
                ? 'Gerencie qualquer dado do portal e configure usuários'
                : mode === 'reset_password'
                ? 'Abra um chamado oficial para redefinição de senha com os administradores'
                : mode === 'first_access'
                ? 'Defina sua nova senha mantendo seus dados, configurações, poderes e limites'
                : 'Acesse imóveis favoritos, agendamentos e painel da imobiliária'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        {mode !== 'reset_password' && mode !== 'first_access' && (
          <div className="flex border-b border-stone-200 bg-stone-50/70 text-xs">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-3 text-center font-bold transition cursor-pointer ${
                mode === 'login'
                  ? 'border-b-2 border-emerald-600 text-emerald-800 bg-white'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-3 text-center font-bold transition cursor-pointer ${
                mode === 'register'
                  ? 'border-b-2 border-emerald-600 text-emerald-800 bg-white'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Cadastrar
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('superadmin');
                setEmail('superadmin@imobirede.com.br');
                setPassword('');
                setError('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-3 text-center font-bold transition cursor-pointer flex items-center justify-center gap-1 ${
                mode === 'superadmin'
                  ? 'border-b-2 border-amber-500 text-amber-900 bg-amber-50/60 font-black'
                  : 'text-amber-700 hover:text-amber-900'
              }`}
            >
              <Crown className="w-3.5 h-3.5 text-amber-500" />
              <span>Super Admin</span>
            </button>
          </div>
        )}

        {/* ================================================================= */}
        {/* VIEW: REDEFINIÇÃO DE SENHA (ABERTURA DE CHAMADO PARA CLIENTE OU ADMIN) */}
        {/* ================================================================= */}
        {mode === 'reset_password' ? (
          <form onSubmit={handleResetPasswordTicketSubmit} className="p-5 space-y-3.5 text-xs">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-800">
                <KeyRound className="w-4 h-4 text-amber-700" />
                <span>Título do Chamado: Redefinição de Senha</span>
              </div>
              <p className="text-[11px] text-amber-700 leading-relaxed">
                Tanto clientes finais quanto administradores de imobiliárias podem abrir este chamado caso tenham esquecido sua senha. O chamado será registrado com <strong>Status: 1. Aberto</strong> e encaminhado à administração do portal.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Tipo de Usuário *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setResetRequesterType('client')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    resetRequesterType === 'client'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                      : 'border-stone-300 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>Cliente Final</span>
                </button>

                <button
                  type="button"
                  onClick={() => setResetRequesterType('agency_admin')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    resetRequesterType === 'agency_admin'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                      : 'border-stone-300 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Administrador Imob.</span>
                </button>
              </div>
            </div>

            {resetRequesterType === 'agency_admin' && (
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Imobiliária / Corretora *
                </label>
                <select
                  value={resetAgencyId}
                  onChange={(e) => setResetAgencyId(e.target.value)}
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

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Seu Nome Completo *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: João da Silva"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                E-mail Cadastrado *
              </label>
              <input
                type="email"
                required
                placeholder="seuemail@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-emerald-600 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                WhatsApp / Telefone para Contato
              </label>
              <input
                type="tel"
                placeholder="(11) 99888-7766"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-emerald-600 font-mono"
              />
            </div>

            <div className="pt-2 flex items-center justify-between gap-2 border-t border-stone-200">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
                className="text-stone-500 hover:text-stone-800 text-xs font-semibold cursor-pointer underline"
              >
                Voltar ao Login
              </button>

              <button
                type="submit"
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold rounded-xl text-xs transition cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5 text-stone-950" />
                <span>Abrir Chamado: Redefinição de Senha</span>
              </button>
            </div>
          </form>
        ) : mode === 'first_access' ? (
          /* ================================================================= */
          /* VIEW: PRIMEIRO ACESSO DO ADMINISTRADOR (ALTERAÇÃO DE SENHA)       */
          /* ================================================================= */
          <form onSubmit={handleFirstAccessSubmit} className="p-5 space-y-3.5 text-xs">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Primeiro Acesso do Administrador</span>
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                Ao realizar o primeiro acesso, você pode alterar sua senha com segurança. Esta alteração ocorre <strong>sem qualquer modificação nos seus dados cadastrais, configurações da imobiliária, poderes administrativos e limites de imóveis já existentes</strong>.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                E-mail do Administrador *
              </label>
              <input
                type="email"
                required
                placeholder="admin@imobiliaria.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-emerald-600 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Senha Temporária Inicial *
              </label>
              <input
                type="password"
                required
                placeholder="Senha inicial fornecida no cadastro"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-emerald-600 font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Nova Senha Definitiva *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Mínimo 4 caracteres"
                  value={firstAccessNewPassword}
                  onChange={(e) => setFirstAccessNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-emerald-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Confirmar Nova Senha *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Repita a nova senha"
                  value={firstAccessConfirmPassword}
                  onChange={(e) => setFirstAccessConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-emerald-600 font-mono"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-2 border-t border-stone-200">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
                className="text-stone-500 hover:text-stone-800 text-xs font-semibold cursor-pointer underline"
              >
                Voltar ao Login
              </button>

              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Salvar Nova Senha</span>
              </button>
            </div>
          </form>
        ) : (
          /* ================================================================= */
          /* VIEW: LOGIN / CADASTRO NORMAL                                     */
          /* ================================================================= */
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                {error}
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            {mode === 'register' && (
              <div className="space-y-3">
                <div className="flex p-1 bg-stone-100 rounded-xl text-xs font-semibold gap-1">
                  <button
                    type="button"
                    onClick={() => setRegisterType('client')}
                    className={`flex-1 py-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      registerType === 'client'
                        ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <UserIcon className="w-3.5 h-3.5" />
                    <span>Cliente / Comprador</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegisterType('agency')}
                    className={`flex-1 py-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      registerType === 'agency'
                        ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Imobiliária Parceira</span>
                  </button>
                </div>

                {registerType === 'client' ? (
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">Nome Completo *</label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder="Seu nome completo"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-emerald-600"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 p-3 bg-emerald-50/50 border border-emerald-200 rounded-2xl">
                    <div className="font-bold text-xs text-emerald-950 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-emerald-700" />
                      <span>Dados da Imobiliária</span>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-stone-700 mb-1">Razão Social da Imobiliária *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Alfa Gestão Imobiliária LTDA"
                        value={regAgencyName}
                        onChange={(e) => setRegAgencyName(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-emerald-600"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-stone-700 mb-1">Nome Fantasia</label>
                        <input
                          type="text"
                          placeholder="Ex: Alfa Imóveis"
                          value={regAgencyTradeName}
                          onChange={(e) => setRegAgencyTradeName(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-emerald-600"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-stone-700 mb-1">CRECI Jurídico *</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: 54321-J"
                          value={regAgencyCreci}
                          onChange={(e) => setRegAgencyCreci(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-emerald-600 font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-stone-700 mb-1">Cidade Sede *</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: São Paulo"
                          value={regAgencyCity}
                          onChange={(e) => setRegAgencyCity(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-emerald-600"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-stone-700 mb-1">UF *</label>
                        <input
                          type="text"
                          required
                          maxLength={2}
                          placeholder="SP"
                          value={regAgencyState}
                          onChange={(e) => setRegAgencyState(e.target.value.toUpperCase())}
                          className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-emerald-600 uppercase font-bold text-center"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-stone-700 mb-1">WhatsApp Comercial *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: (11) 99876-5432"
                        value={regAgencyWhatsApp}
                        onChange={(e) => setRegAgencyWhatsApp(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-emerald-600 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-stone-700 mb-1">Plano Desejado</label>
                      <select
                        value={regAgencyPlan}
                        onChange={(e) => setRegAgencyPlan(e.target.value as any)}
                        className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-emerald-600 bg-white"
                      >
                        <option value="ESSENCIAL">Plano Essencial (Até 15 imóveis)</option>
                        <option value="PROFISSIONAL">Plano Profissional (Até 60 imóveis + Agendamentos)</option>
                        <option value="PREMIUM">Plano Premium (Ilimitado + Destaques Master)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                {mode === 'superadmin' ? 'E-mail do Super Administrador *' : 'E-mail *'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder={mode === 'superadmin' ? 'superadmin@imobirede.com.br' : 'seuemail@exemplo.com'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-emerald-600 font-mono"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-stone-700">
                  {mode === 'superadmin' ? 'Senha Master *' : 'Senha *'}
                </label>
                {mode !== 'superadmin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('reset_password');
                      setError('');
                      setSuccessMsg('');
                    }}
                    className="text-[11px] text-emerald-700 hover:text-emerald-900 font-semibold cursor-pointer underline flex items-center gap-1"
                  >
                    <KeyRound className="w-3 h-3 text-emerald-600" />
                    <span>Esqueci a senha?</span>
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder={mode === 'superadmin' ? 'Senha do Super Admin' : 'Sua senha'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-emerald-600 font-mono"
                />
              </div>
            </div>

            {mode === 'login' && (
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl flex flex-col gap-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-stone-600 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Primeiro Acesso de Administrador?
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('first_access');
                      setError('');
                      setSuccessMsg('');
                    }}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer underline"
                  >
                    Alterar Senha Inicial
                  </button>
                </div>
                <p className="text-[10px] text-stone-400">
                  Permite definir sua senha definitiva sem alterar dados, configurações, poderes ou limites.
                </p>
              </div>
            )}

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  WhatsApp / Telefone (Opcional)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    placeholder="(11) 99888-7766"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-emerald-600 font-mono"
                  />
                </div>
              </div>
            )}

            {mode === 'superadmin' ? (
              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Crown className="w-4 h-4 text-stone-950" />
                <span>Entrar no Painel Super Administrador</span>
              </button>
            ) : (
              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
              >
                {mode === 'login' ? 'Entrar na Plataforma' : 'Criar Conta e Começar'}
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
