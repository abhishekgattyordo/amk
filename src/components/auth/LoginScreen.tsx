import React, { useState } from 'react';
import { Lock, User, ShieldCheck, ArrowRight, Building, CheckCircle2 } from 'lucide-react';
import { User as UserType } from '../../types';
import { INITIAL_USERS } from '../../data/initialData';
import { UserAvatar } from '../common/UserAvatar';

interface LoginScreenProps {
  onLogin: (user: UserType) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [selectedUser, setSelectedUser] = useState<UserType>(INITIAL_USERS[0]);
  const [username, setUsername] = useState('rajesh.sharma@amkerp.com');
  const [password, setPassword] = useState('••••••••••••');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: username.trim(),
          password: password || 'admin123',
        }),
      });
      const result = await res.json();
      if (result.success && result.data) {
        const { user, token } = result.data;
        if (token) {
          localStorage.setItem('erp_token', token);
          document.cookie = `erp_token=${token}; path=/; max-age=604800; SameSite=Lax`;
          document.cookie = `token=${token}; path=/; max-age=604800; SameSite=Lax`;
        }
        onLogin({
          ...selectedUser,
          ...user,
          token,
        });
      } else {
        onLogin(selectedUser);
      }
    } catch (err) {
      console.warn('Login API fetch error, falling back:', err);
      onLogin(selectedUser);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-6 relative overflow-hidden">
      {/* Decorative background grid & blur */}
      <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:32px_32px] opacity-10"></div>
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-teal-600/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 rounded-3xl shadow-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl overflow-hidden relative z-10">
        {/* Left Branding & Highlights */}
        <div className="lg:col-span-5 p-10 bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950/60 border-r border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/30 text-white font-black text-2xl">
                AM
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">AMK <span className="text-emerald-400">ERP</span></h1>
                <p className="text-xs text-slate-400 font-medium">Enterprise Manufacturing Software</p>
              </div>
            </div>

            <h2 className="text-xl font-bold text-slate-100 mb-3 leading-snug">
              Paper Carton & Corrugated Box Production Suite
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">
              Complete raw material inventory tracking, mill procurement workflows, automated warehouse management, and precision financial accounting.
            </p>

            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Real-time GSM & Flute grade tracking</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Mill-level supplier ledger & outstanding balance</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Multi-warehouse bin mapping & audit trails</span>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800/60 text-xs text-slate-500 flex items-center justify-between">
            <span>© 2026 AMK Systems Inc.</span>
            <span className="font-mono text-emerald-400">Secure 256-bit SSL</span>
          </div>
        </div>

        {/* Right Form */}
        <div className="lg:col-span-7 p-10 sm:p-12 flex flex-col justify-center">
          <div className="mb-8">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Enterprise Authentication
            </span>
            <h2 className="text-2xl font-bold text-white mt-3">Sign in to AMK ERP</h2>
            <p className="text-sm text-slate-400 mt-1">Select an enterprise role or enter credentials to continue</p>
          </div>

          {/* Quick Demo Role Selector */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Quick Demo Role Switcher
            </label>
            <div className="grid grid-cols-3 gap-2">
              {INITIAL_USERS.map(usr => (
                <button
                  key={usr.id}
                  type="button"
                  onClick={() => {
                    setSelectedUser(usr);
                    setUsername(usr.email);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all flex items-center space-x-2.5 ${
                    selectedUser.id === usr.id
                      ? 'bg-emerald-600/20 border-emerald-500 text-white shadow-md'
                      : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <UserAvatar name={usr.name} src={usr.avatar} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold truncate">{usr.name}</p>
                    <p className="text-[10px] text-emerald-400 font-medium truncate">{usr.role}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Enterprise Email / Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-700 bg-slate-800/60 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  placeholder="name@amkerp.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Secure Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-700 bg-slate-800/60 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 bg-slate-800"
                />
                <span className="text-slate-300 text-xs">Remember this device</span>
              </label>
              <a href="#forgot" onClick={(e) => e.preventDefault()} className="text-xs text-emerald-400 hover:underline">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 transition-all transform active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Launch AMK ERP Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
