import React, { useState } from 'react';
import { X, Mail, Lock, User as UserIcon, Phone, Heart, Crown, KeyRound, Sparkles, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register' | 'superadmin';
  onSuperAdminSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'login',
  onSuperAdminSuccess,
}) => {
  const { loginUser, loginSuperAdmin, loginUserWithPassword, registerUser } = useApp();
  const [mode, setMode] = useState<'login' | 'register' | 'superadmin'>(defaultMode);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

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
        setError('Senha de Super Administrador incorreta (padrão: superadmin123).');
      }
      return;
    }

    if (!email.trim()) {
      setError('Por favor, informe seu e-mail.');
      return;
    }

    if (mode === 'register') {
      if (!name.trim()) {
        setError('Por favor, informe seu nome.');
        return;
      }
      registerUser(name, email, phone, password);
      onClose();
    } else {
      const res = loginUserWithPassword(email, password);
      if (res.success) {
        if (res.user?.role === 'site_creator' && onSuperAdminSuccess) {
          onSuperAdminSuccess();
        }
        onClose();
      } else {
        setError(res.error || 'Não foi possível entrar. Verifique seus dados.');
      }
    }
  };

  const handleQuickLogin = (demoEmail: string, demoPass?: string) => {
    loginUser(demoEmail);
    onClose();
  };

  const handleQuickSuperAdmin = () => {
    setEmail('superadmin@imobirede.com.br');
    setPassword('superadmin123');
    const ok = loginSuperAdmin('superadmin123', 'superadmin@imobirede.com.br');
    if (ok) {
      setSuccessMsg('Autenticado como Super Administrador!');
      setTimeout(() => {
        if (onSuperAdminSuccess) onSuperAdminSuccess();
        onClose();
      }, 500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-md w-full overflow-hidden flex flex-col my-auto">
        {/* Header */}
        <div
          className={`p-5 flex items-center justify-between transition-colors ${
            mode === 'superadmin' ? 'bg-stone-950 text-white border-b border-amber-500/30' : 'bg-stone-900 text-white'
          }`}
        >
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
              {mode === 'superadmin' ? (
                <span className="text-amber-400 flex items-center gap-1">
                  <Crown className="w-3.5 h-3.5" />
                  Painel de Acesso Master
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
                : mode === 'login'
                ? 'Acesse sua Conta'
                : 'Criar Cadastro'}
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">
              {mode === 'superadmin'
                ? 'Gerencie qualquer dado do portal e altere senhas de usuários'
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
        <div className="flex border-b border-stone-200 bg-stone-50/70 text-xs">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError('');
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
              setPassword('superadmin123');
              setError('');
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

        {/* Body Form */}
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
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">Nome Completo *</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-emerald-600"
                />
              </div>
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
              {mode === 'superadmin' && (
                <span className="text-[10px] text-amber-700 font-mono font-semibold">
                  Padrão: superadmin123
                </span>
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

          {/* Demo Accounts shortcuts */}
          <div className="pt-3 border-t border-stone-200 space-y-2">
            <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block text-center">
              Acesso Rápido de Demonstração
            </span>

            {mode === 'superadmin' ? (
              <button
                type="button"
                onClick={handleQuickSuperAdmin}
                className="w-full p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-950 text-left transition cursor-pointer flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold flex items-center gap-1">
                    <Crown className="w-3.5 h-3.5 text-amber-600" />
                    <span>Acesso Imediato Super Admin (1-Clique)</span>
                  </div>
                  <div className="text-[10px] text-amber-700 font-mono">superadmin@imobirede.com.br • superadmin123</div>
                </div>
                <KeyRound className="w-4 h-4 text-amber-600" />
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('mariana@email.com')}
                  className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-left transition cursor-pointer"
                >
                  <div className="font-bold">Cliente Demonstração</div>
                  <div className="text-[10px] text-stone-500 truncate font-mono">mariana@email.com</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin@verticeprime.com.br')}
                  className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-left transition cursor-pointer"
                >
                  <div className="font-bold">Admin Vértice Imóveis</div>
                  <div className="text-[10px] text-emerald-700 truncate font-mono">CRECI 49201-J</div>
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
