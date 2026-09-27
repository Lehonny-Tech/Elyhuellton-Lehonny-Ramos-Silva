import React, { useState } from 'react';
import { Crown, ShieldAlert, KeyRound, Mail, Lock, Eye, EyeOff, CheckCircle2, ArrowRight, X, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface SuperAdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export const SuperAdminLoginModal: React.FC<SuperAdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const { loginSuperAdmin, users } = useApp();
  const [email, setEmail] = useState('superadmin@imobirede.com.br');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password) {
      setError('Por favor, informe a senha de Super Administrador.');
      return;
    }

    const ok = loginSuperAdmin(password, email);
    if (ok) {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onLoginSuccess();
        onClose();
      }, 700);
    } else {
      setError('Senha ou e-mail de Super Administrador incorretos. Verifique suas credenciais.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-stone-900 border-2 border-amber-500/40 text-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col my-auto relative">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="p-6 border-b border-stone-800 flex items-start justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-stone-950 shadow-lg shadow-amber-500/20 font-black">
              <Crown className="w-6 h-6 text-stone-950" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3" />
                Painel Master
              </div>
              <h2 className="text-xl font-bold text-white mt-1">
                Acesso Super Administrador
              </h2>
              <p className="text-xs text-stone-400 mt-0.5">
                Controle irrestrito do portal, imobiliárias, imóveis e senhas
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 relative z-10">
          {error && (
            <div className="p-3.5 bg-rose-950/70 border border-rose-600/50 text-rose-200 text-xs rounded-xl flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-semibold">Autenticado com sucesso! Carregando Painel Master...</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1.5">
              E-mail do Administrador Master
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="superadmin@imobirede.com.br"
                className="w-full pl-10 pr-3 py-2.5 bg-stone-950 border border-stone-700 rounded-xl text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-stone-300">
                Senha Master de Acesso
              </label>
              <span className="text-[11px] text-amber-400 font-mono">
                Padrão: superadmin123
              </span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha master"
                className="w-full pl-10 pr-10 py-2.5 bg-stone-950 border border-stone-700 rounded-xl text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 p-1 cursor-pointer"
                title={showPassword ? 'Ocultar senha' : 'Ver senha'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="bg-stone-950/60 border border-stone-800 rounded-xl p-3 text-[11px] text-stone-400 space-y-1">
            <div className="font-semibold text-amber-400 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5" />
              Poderes do Super Administrador:
            </div>
            <p>
              • Alterar ou redefinir a senha de qualquer usuário (imobiliárias e clientes).
            </p>
            <p>
              • Editar, criar ou remover qualquer imóvel e imobiliária cadastrados.
            </p>
            <p>
              • Gerenciar planos comerciais, assinaturas e agendamentos de visitas.
            </p>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <span>Entrar no Painel Master</span>
            <ArrowRight className="w-4 h-4 text-stone-950" />
          </button>
        </form>
      </div>
    </div>
  );
};
