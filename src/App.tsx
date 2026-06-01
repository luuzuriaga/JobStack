import { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { ResetPassword } from './components/ResetPassword';
import { Sparkles, Loader2 } from 'lucide-react';

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);

  useEffect(() => {
    // 1. Obtener la sesión activa actual al montar la aplicación
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session);
        setIsDemo(false);
      }
      setLoading(false);
    });

    // 2. Suscribirse a cambios en el estado de autenticación (login, logout, token expired, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovering(true);
      }

      if (session) {
        setSession(session);
        setIsDemo(false);
      } else if (!isDemo) {
        setSession(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [isDemo]);

  const handleStartDemoMode = () => {
    setIsDemo(true);
    setSession({
      user: {
        id: 'demo-user-id',
        email: 'demo@jobstack.io'
      }
    });
  };

  const handleSignOutDemo = () => {
    setSession(null);
    setIsDemo(false);
  };

  // Pantalla de carga premium / estética
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20" />
        
        <div className="absolute w-[400px] h-[400px] bg-violet-600/5 rounded-full blur-3xl pointer-events-none animate-glow-pulse" />
        
        <div className="flex flex-col items-center gap-4 relative z-10 animate-fade-in">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/25 border border-violet-400/20">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-white">JobStack</h1>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Sincronizando Entorno...</p>
          </div>

          <div className="flex items-center gap-2 mt-4 text-xs text-slate-500 bg-slate-900/60 border border-slate-850 px-3 py-1.5 rounded-full">
            <Loader2 className="w-3.5 h-3.5 text-violet-400 animate-spin" />
            <span>Verificando Credenciales de Supabase</span>
          </div>
        </div>
      </div>
    );
  }

  // Renderizar Auth, Dashboard o ResetPassword según sesión y estado de recuperación
  if (isRecovering) {
    return <ResetPassword userEmail={session?.user?.email} onComplete={() => setIsRecovering(false)} />;
  }

  return (
    <>
      {!session ? (
        <Auth onDemoMode={handleStartDemoMode} />
      ) : (
        <Dashboard user={session.user} onSignOutDemo={handleSignOutDemo} />
      )}
    </>
  );
}

export default App;
