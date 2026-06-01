import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Lock, Eye, EyeOff, Sparkles, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

interface ResetPasswordProps {
  onComplete: () => void;
  userEmail?: string;
}

export const ResetPassword: React.FC<ResetPasswordProps> = ({ onComplete, userEmail }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 6) {
      setMessage({
        text: 'La contraseña debe tener al menos 6 caracteres.',
        type: 'error'
      });
      return;
    }

    if (password !== confirmPassword) {
      setMessage({
        text: 'Las contraseñas no coinciden.',
        type: 'error'
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      setMessage({
        text: '¡Contraseña actualizada con éxito! Redirigiéndote a tu Dashboard...',
        type: 'success'
      });

      // Redirigir después de 2 segundos para dar feedback visual de éxito
      setTimeout(() => {
        onComplete();
      }, 2000);
    } catch (err: any) {
      setMessage({
        text: err.message || 'Ocurrió un error al actualizar la contraseña.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center relative overflow-hidden px-4">
      {/* Background Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none animate-glow-pulse" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none animate-glow-pulse" style={{ animationDelay: '2s' }} />

      {/* Decorative Top Accent Border Line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-600 via-indigo-500 to-cyan-500 z-10" />

      {/* Subtle grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] opacity-35 pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-8 animate-slide-up">
        {/* Brand/App Title */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/25 border border-violet-400/20">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-white">JobStack</h1>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1">Actualizar Credenciales</p>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-slate-900/40 border border-slate-800/85 p-8 rounded-3xl backdrop-blur-md shadow-2xl shadow-slate-950/50">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-white">Establecer Nueva Contraseña</h2>
            <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
              {userEmail 
                ? `Elige una contraseña de alta seguridad para tu cuenta ${userEmail}` 
                : 'Escribe tu nueva contraseña de acceso.'}
            </p>
          </div>

          {message && (
            <div
              className={`p-4 rounded-xl border text-sm mb-6 animate-slide-up flex items-start gap-2.5 ${
                message.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-red-500/10 text-red-400 border-red-500/20'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 font-medium">{message.text}</div>
            </div>
          )}

          {message?.type === 'success' ? (
            <div className="flex flex-col items-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 animate-pulse">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-950/60 border border-slate-900 px-3 py-1.5 rounded-full">
                <svg className="animate-spin h-3.5 w-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Accediendo al entorno...</span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-5">
              <div>
                <label htmlFor="new-password" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all text-sm"
                    placeholder="Escribe tu nueva contraseña"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all text-sm"
                    placeholder="Repite tu nueva contraseña"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 focus:ring-violet-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-500/20 active:scale-[0.98] transition-all"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Guardando Nueva Contraseña...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <span>Restablecer e Iniciar Sesión</span>
                      <ArrowRight className="w-4.5 h-4.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
