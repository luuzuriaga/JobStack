import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Mail, Lock, UserPlus, LogIn, Sparkles, Terminal, Award, Eye, EyeOff } from 'lucide-react';

interface AuthProps {
  onDemoMode: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onDemoMode }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isSignUp) {
        // Registrar usuario
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;
        
        // Supabase por defecto puede requerir confirmación por correo
        if (data?.user && data.session === null) {
          setMessage({
            text: '¡Registro exitoso! Verifica tu bandeja de entrada para confirmar tu correo e iniciar sesión.',
            type: 'success'
          });
        } else {
          setMessage({
            text: '¡Cuenta creada e inicio de sesión exitoso!',
            type: 'success'
          });
        }
      } else {
        // Iniciar sesión
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
      }
    } catch (err: any) {
      setMessage({
        text: err.message || 'Ocurrió un error en la autenticación.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}`,
      });

      if (error) throw error;

      setMessage({
        text: '¡Enlace de recuperación enviado! Revisa tu bandeja de entrada de correo electrónico para restablecer tu contraseña.',
        type: 'success'
      });
    } catch (err: any) {
      setMessage({
        text: err.message || 'Ocurrió un error al procesar tu solicitud.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-stretch justify-center bg-slate-950 text-slate-100 overflow-hidden relative">
      
      {/* Background Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none animate-glow-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none animate-glow-pulse" style={{ animationDelay: '2s' }} />

      {/* Decorative Top Accent Border Line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-600 via-indigo-500 to-cyan-500 z-10" />

      {/* Columna Izquierda: Presentación Estética / Técnica */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900/40 border-r border-slate-800/80 p-12 flex-col justify-between relative overflow-hidden">
        
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35" />
        
        <div className="relative z-10 flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/25 border border-violet-400/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">JobStack</h1>
            <p className="text-xs text-slate-400">Personal Funnel Tracker</p>
          </div>
        </div>

        <div className="relative z-10 my-auto max-w-md">
          <h2 className="text-4xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            Controla tu futuro profesional, <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-indigo-300 to-cyan-300">paso a paso</span>.
          </h2>
          <p className="text-slate-400 leading-relaxed mb-8">
            Diseñado para desarrolladores e ingenieros que buscan llevar su proceso de postulación laboral al siguiente nivel. Reemplaza hojas de cálculo lentas por un dashboard técnico ágil.
          </p>

          {/* Interactive technical visualization */}
          <div className="space-y-4 bg-slate-950/60 p-6 rounded-2xl border border-slate-800/80 backdrop-blur-sm shadow-xl shadow-slate-950/20">
            <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800/60 pb-2">
              <span className="flex items-center gap-1.5"><Terminal className="w-3.5 h-3.5 text-violet-400" /> jobstack-funnel.sh</span>
              <span className="text-emerald-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> online</span>
            </div>
            
            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span>[1] Entrevistas Técnicas</span>
                <span className="text-violet-400 font-bold">4 Activas</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                <div className="bg-gradient-to-r from-violet-600 to-indigo-500 h-full rounded-full w-[80%]" />
              </div>

              <div className="flex justify-between items-center text-slate-300">
                <span>[2] Ofertas Recibidas</span>
                <span className="text-emerald-400 font-bold">2 Recientes</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full w-[40%]" />
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-3 text-xs text-slate-500">
          <Award className="w-4 h-4 text-slate-400" />
          <span>Postulaciones Centralizadas: LinkedIn, Indeed, Computrabajo y más.</span>
        </div>
      </div>

      {/* Columna Derecha: Formulario de Auth */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10">
        
        {/* Subtle decorative glow for mobile view */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/5 rounded-full blur-3xl pointer-events-none lg:hidden" />
        
        <div className="w-full max-w-md space-y-8">
          
          {/* Logo visible only on mobile/tablet */}
          <div className="flex items-center gap-2 lg:hidden justify-center mb-8">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-500 flex items-center justify-center shadow-md">
              <Sparkles className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">JobStack</h1>
            </div>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-white">
              {isForgotPassword 
                ? 'Recuperar Contraseña' 
                : isSignUp 
                  ? 'Crea tu Cuenta' 
                  : 'Bienvenido de Nuevo'}
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              {isForgotPassword
                ? 'Te enviaremos un enlace seguro para restablecer tu contraseña.'
                : isSignUp 
                  ? 'Empieza a organizar tus postulaciones hoy mismo.' 
                  : 'Inicia sesión para acceder a tu embudo laboral.'}
            </p>
          </div>

          {message && (
            <div
              className={`p-4 rounded-xl border text-sm animate-slide-up flex items-start gap-2.5 ${
                message.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-red-500/10 text-red-400 border-red-500/20'
              }`}
            >
              <div className="flex-1">{message.text}</div>
            </div>
          )}

          {isForgotPassword ? (
            <form className="mt-8 space-y-6" onSubmit={handleForgotPassword}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="email-address-recovery" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Mail className="w-5 h-5" />
                    </div>
                    <input
                      id="email-address-recovery"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all text-sm"
                      placeholder="luuzuriaga@gmail.com"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 focus:ring-violet-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-500/20 active:scale-[0.98] transition-all"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Enviando...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Mail className="w-4.5 h-4.5" />
                      Enviar Enlace de Recuperación
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setMessage(null);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900/30 hover:bg-slate-900/70 text-slate-400 hover:text-slate-200 font-semibold border border-slate-800 hover:border-slate-700/80 rounded-xl transition-all active:scale-[0.98] shadow-sm text-xs"
                >
                  Volver al Inicio de Sesión
                </button>
              </div>
            </form>
          ) : (
            <form className="mt-8 space-y-6" onSubmit={handleAuth}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="email-address" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Mail className="w-5 h-5" />
                    </div>
                    <input
                      id="email-address"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all text-sm"
                      placeholder="dev@jobstack.io"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Contraseña
                    </label>
                    {!isSignUp && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotPassword(true);
                          setMessage(null);
                        }}
                        className="text-xs font-medium text-violet-400 hover:text-violet-300 transition-colors focus:outline-none"
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-10 py-3 bg-slate-900/50 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all text-sm"
                      placeholder="••••••••••••"
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
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 focus:ring-violet-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-500/20 active:scale-[0.98] transition-all"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Procesando...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      {isSignUp ? <UserPlus className="w-4.5 h-4.5" /> : <LogIn className="w-4.5 h-4.5" />}
                      {isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión'}
                    </span>
                  )}
                </button>
              </div>
            </form>
          )}

          {!isForgotPassword && (
            <div className="text-center space-y-4">
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setMessage(null);
                }}
                className="text-sm font-medium text-violet-400 hover:text-violet-300 focus:outline-none transition-colors border-b border-transparent hover:border-violet-400"
              >
                {isSignUp 
                  ? '¿Ya tienes una cuenta? Inicia Sesión' 
                  : '¿No tienes cuenta? Regístrate gratis'}
              </button>

              <div className="relative flex py-1.5 items-center">
                <div className="flex-grow border-t border-slate-900"></div>
                <span className="flex-shrink mx-4 text-slate-500 text-[10px] font-bold uppercase tracking-widest">O</span>
                <div className="flex-grow border-t border-slate-900"></div>
              </div>

              <button
                onClick={onDemoMode}
                type="button"
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900/30 hover:bg-slate-900/70 text-violet-450 hover:text-violet-300 font-semibold border border-slate-800 hover:border-slate-700/80 rounded-xl transition-all active:scale-[0.98] shadow-sm text-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
                Acceder en Modo Demostración (Offline)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
