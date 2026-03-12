import React, { useState } from 'react';
import { Car, Wrench, Search, ArrowRight, ShieldCheck, Mail, Lock, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LoginProps {
  onLogin: () => void;
  onCustomerSearch: (patente: string) => void;
}

export function Login({ onLogin, onCustomerSearch }: LoginProps) {
  const [patente, setPatente] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (patente.trim()) {
      onCustomerSearch(patente.trim());
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;
      onLogin();
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">

        {/* Customer Section */}
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-zinc-100 flex flex-col items-center text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6">
            <Search className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 mb-4">
            ¿Eres Cliente?
          </h2>
          <p className="text-zinc-500 mb-8 max-w-sm">
            Ingresa la patente de tu vehículo para consultar el estado actual de tu reparación en tiempo real.
          </p>

          <form onSubmit={handleSearch} className="w-full max-w-xs space-y-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Ej: AB·CD·12"
                className="w-full px-5 py-4 rounded-xl border-2 border-zinc-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all font-mono text-center text-xl uppercase tracking-widest placeholder:normal-case placeholder:tracking-normal placeholder:text-base"
                value={patente}
                onChange={e => setPatente(e.target.value.toUpperCase())}
              />
            </div>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors shadow-md hover:shadow-lg"
            >
              Consultar Estado
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        </div>

        {/* Mechanic Section */}
        <div className="bg-zinc-900 p-8 md:p-12 rounded-3xl shadow-xl flex flex-col items-center text-center text-zinc-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-zinc-700"></div>
          <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center mb-6">
            <Wrench className="w-8 h-8 text-zinc-300" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight mb-2">
            Nexus Garage
          </h2>
          <p className="text-zinc-400 mb-8 max-w-sm">
            Acceso exclusivo para personal del taller. Gestiona reparaciones, inventario y clientes.
          </p>

          <form onSubmit={handleAdminLogin} className="w-full max-w-xs space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="email"
                placeholder="Email corporativo"
                required
                className="w-full pl-12 pr-5 py-4 bg-zinc-800 border-2 border-zinc-700 rounded-xl focus:border-zinc-500 outline-none transition-all"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="password"
                placeholder="Contraseña"
                required
                className="w-full pl-12 pr-5 py-4 bg-zinc-800 border-2 border-zinc-700 rounded-xl focus:border-zinc-500 outline-none transition-all"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-zinc-100 hover:bg-white text-zinc-900 rounded-xl font-bold transition-colors shadow-md hover:shadow-lg disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ShieldCheck className="w-5 h-5" />
              )}
              {loading ? 'Iniciando...' : 'Ingresar al Taller'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
