import React, { useState } from 'react';
import { X, Mail, Lock, User as UserIcon, Phone, Heart, ShieldCheck, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'login',
}) => {
  const { loginUser, registerUser, agencies } = useApp();
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Por favor, informe seu e-mail.');
      return;
    }

    if (mode === 'register') {
      if (!name.trim()) {
        setError('Por favor, informe seu nome.');
        return;
      }
      registerUser(name, email, phone);
      onClose();
    } else {
      const ok = loginUser(email);
      if (ok) {
        onClose();
      } else {
        setError('Não foi possível entrar. Verifique seus dados.');
      }
    }
  };

  const handleQuickLogin = (demoEmail: string) => {
    loginUser(demoEmail);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-md w-full overflow-hidden flex flex-col my-auto">
        {/* Header */}
        <div className="bg-stone-900 text-white p-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold uppercase tracking-wider">
              <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
              Área do Usuário
            </div>
            <h3 className="text-lg font-bold">
              {mode === 'login' ? 'Acesse sua Conta' : 'Criar Cadastro'}
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">
              Faça login para salvar seus imóveis favoritos e agendar visitas
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
        <div className="flex border-b border-stone-200">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-3 text-xs font-bold transition cursor-pointer ${
              mode === 'login'
                ? 'border-b-2 border-emerald-600 text-emerald-700 bg-stone-50'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Já Tenho Conta (Entrar)
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 py-3 text-xs font-bold transition cursor-pointer ${
              mode === 'register'
                ? 'border-b-2 border-emerald-600 text-emerald-700 bg-stone-50'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Criar Nova Conta (Cadastro)
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {error}
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
                  className="w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-emerald-600"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">E-mail *</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="seuemail@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-emerald-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">Senha *</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="Sua senha segura"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-emerald-600"
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
                  className="w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-emerald-600"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
          >
            {mode === 'login' ? 'Entrar na Plataforma' : 'Criar Conta e Começar'}
          </button>

          {/* Demo Accounts shortcut for review */}
          <div className="pt-3 border-t border-stone-200">
            <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block mb-2 text-center">
              Acesso Rápido de Demonstração
            </span>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => handleQuickLogin('mariana@email.com')}
                className="p-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-left transition cursor-pointer"
              >
                <div className="font-bold">Cliente Demonstração</div>
                <div className="text-[10px] text-stone-500 truncate">mariana@email.com</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('admin@verticeprime.com.br')}
                className="p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-left transition cursor-pointer"
              >
                <div className="font-bold">Admin Vértice Imóveis</div>
                <div className="text-[10px] text-emerald-700 truncate">CRECI 49201-J</div>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
