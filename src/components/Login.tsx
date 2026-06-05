import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  Sparkles, 
  CheckCircle, 
  Sun, 
  Moon, 
  Flame, 
  ChevronRight, 
  Volume2, 
  ShieldCheck 
} from 'lucide-react';
import { AccessibilitySettings, triggerSensoryFeedback } from '../utils/sensory';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider 
} from 'firebase/auth';
import { auth } from '../firebase';

interface LoginProps {
  onLoginSuccess: (name: string, email: string) => void;
  theme: 'claro' | 'escuro' | 'galatico';
  setTheme: (t: 'claro' | 'escuro' | 'galatico') => void;
}

export default function LoginView({ onLoginSuccess, theme, setTheme }: LoginProps) {
  const [email, setEmail] = useState('operador@ciclocred.com');
  const [password, setPassword] = useState('admin_ciclo');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const mockAccSettings: AccessibilitySettings = {
    enableSound: true,
    enableVibration: true,
    soundVolume: 0.5,
    fontSizeClass: 'normal',
    highContrast: false,
    visualPulse: true
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    triggerSensoryFeedback('click', mockAccSettings);

    if (!email.includes('@') || email.length < 5) {
      setErrorMsg('Por favor, informe um endereço de e-mail institucional válido.');
      setIsLoading(false);
      triggerSensoryFeedback('warning', mockAccSettings);
      return;
    }

    if (password.length < 6) {
      setErrorMsg('A senha do Firebase requer pelo menos 6 caracteres.');
      setIsLoading(false);
      triggerSensoryFeedback('warning', mockAccSettings);
      return;
    }

    try {
      // 1. Attempt standard Firebase Auth sign in
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const calculatedName = user.email ? user.email.split('@')[0].toUpperCase() : 'OPERADOR';
      const userName = user.displayName || (calculatedName === 'OPERADOR' ? 'Operador CicloCred' : calculatedName);
      
      triggerSensoryFeedback('success', mockAccSettings);
      onLoginSuccess(userName, user.email || email);
    } catch (signInErr: any) {
      // 2. If it's a new database/user (auth/user-not-found or invalid or user not registered yet), self-register
      if (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential' || signInErr.code === 'auth/cannot-find-user') {
        try {
          const signUpCredential = await createUserWithEmailAndPassword(auth, email, password);
          const newUser = signUpCredential.user;
          const calculatedName = newUser.email ? newUser.email.split('@')[0].toUpperCase() : 'OPERADOR';
          const userName = calculatedName === 'OPERADOR' ? 'Operador CicloCred' : calculatedName;
          
          triggerSensoryFeedback('success', mockAccSettings);
          onLoginSuccess(userName, newUser.email || email);
        } catch (signUpErr: any) {
          console.error(signUpErr);
          setErrorMsg(`Erro de registro: ${signUpErr.message || 'Falha ao registrar credencial.'}`);
          triggerSensoryFeedback('warning', mockAccSettings);
        }
      } else {
        console.error(signInErr);
        setErrorMsg(`Erro de autenticação: ${signInErr.message || 'Senha incorreta ou credencial inválida.'}`);
        triggerSensoryFeedback('warning', mockAccSettings);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setIsLoading(true);
    triggerSensoryFeedback('click', mockAccSettings);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      triggerSensoryFeedback('success', mockAccSettings);
      onLoginSuccess(user.displayName || 'Operador Google', user.email || 'operador@ciclocred.com');
    } catch (err: any) {
      console.error(err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setErrorMsg(`Erro do Google login: ${err.message || 'Conexão interrompida.'}`);
      }
      triggerSensoryFeedback('warning', mockAccSettings);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center p-4 relative overflow-hidden transition-all duration-500 font-sans">
      
      {/* Dynamic graphic backgrounds based on theme selection */}
      {theme === 'galatico' && (
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-950 via-zinc-950 to-indigo-950 z-0">
          <div className="absolute top-1/4 left-1/5 w-64 h-64 rounded-full bg-violet-600/15 blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl animate-pulse" />
        </div>
      )}

      {theme === 'escuro' && (
        <div className="absolute inset-0 bg-zinc-950 z-0" />
      )}

      {theme === 'claro' && (
        <div className="absolute inset-0 bg-zinc-50 z-0" />
      )}

      {/* CORE LOGIN CONTAINER CARD */}
      <div className="relative z-10 w-full max-w-md bg-white border-4 border-zinc-950 p-8 rounded-3xl shadow-[6px_6px_0px_0px_rgba(24,24,27,1)] space-y-6">
        
        {/* Branding header */}
        <div className="text-center space-y-1 select-none">
          <div className="mx-auto w-12 h-12 bg-indigo-600 border-2 border-zinc-950 flex items-center justify-center text-white font-black text-lg rounded-2xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            S
          </div>
          <h1 className="text-md font-black uppercase italic tracking-tight text-zinc-950 font-mono mt-2">
            CRM SWAT Imobiliário
          </h1>
          <p className="text-[10px] text-zinc-500 font-bold font-mono">
            SISTEMA DE GESTÃO PATRIMONIAL & EXPANSÃO
          </p>
        </div>

        {/* Real-time Theme selector inside login */}
        <div className="p-3.5 bg-zinc-50 border-2 border-zinc-950 rounded-2xl space-y-2">
          <span className="text-[8px] font-mono font-black uppercase text-zinc-500 block text-center">
            Selecione a Atmosfera de Cores
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => {
                setTheme('claro');
                triggerSensoryFeedback('click', mockAccSettings);
              }}
              className={`py-1.5 px-2 rounded-lg border-2 border-zinc-950 text-center flex items-center justify-center gap-1 transition-all text-[9px] font-mono uppercase ${
                theme === 'claro' ? 'bg-zinc-900 text-white font-black' : 'bg-white text-zinc-500'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>Claro</span>
            </button>

            <button
              onClick={() => {
                setTheme('escuro');
                triggerSensoryFeedback('click', mockAccSettings);
              }}
              className={`py-1.5 px-2 rounded-lg border-2 border-zinc-950 text-center flex items-center justify-center gap-1 transition-all text-[9px] font-mono uppercase ${
                theme === 'escuro' ? 'bg-zinc-900 text-white font-black' : 'bg-white text-zinc-500'
              }`}
            >
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
              <span>Escuro</span>
            </button>

            <button
              onClick={() => {
                setTheme('galatico');
                triggerSensoryFeedback('chime', mockAccSettings);
              }}
              className={`py-1.5 px-1.5 rounded-lg border-2 border-indigo-400 text-indigo-200 text-center flex items-center justify-center gap-1 transition-all text-[9px] font-mono uppercase bg-indigo-950 px-1 py-1.5 ${
                theme === 'galatico' ? 'ring-2 ring-indigo-500 font-black' : 'opacity-70'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-violet-400" />
              <span>Galático</span>
            </button>
          </div>
        </div>

        {/* LoginForm form block */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-mono font-black text-zinc-700 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-indigo-600" />
              <span>E-mail Corporativo</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operador@ciclocred.com"
              className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-2xl p-3 text-xs font-bold text-zinc-900 focus:bg-white focus:outline-none placeholder:text-zinc-400"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-mono font-black text-zinc-700 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-indigo-600" />
              <span>Senha de Acesso</span>
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha institucional"
              className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-2xl p-3 text-xs font-bold text-zinc-900 focus:bg-white focus:outline-none placeholder:text-zinc-400"
            />
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-[10px] text-rose-800 font-mono font-black uppercase text-center">
              ⚠ {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase font-mono tracking-wider rounded-2xl border-2 border-zinc-950 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] hover:translate-y-[-1px] active:translate-y-[1px] transition-all flex items-center justify-center gap-2 select-none cursor-pointer"
          >
            <span>{isLoading ? 'Autenticando no Firebase...' : 'Entrar / Registrar com E-mail'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </form>

        <div className="flex items-center my-3">
          <div className="flex-1 border-t-2 border-zinc-200"></div>
          <span className="px-3 text-[9px] font-mono font-black text-zinc-400 uppercase">OU</span>
          <div className="flex-1 border-t-2 border-zinc-200"></div>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full py-4 bg-white hover:bg-zinc-50 text-zinc-950 text-xs font-black uppercase font-mono tracking-wider rounded-2xl border-2 border-zinc-950 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] hover:translate-y-[-1px] active:translate-y-[1px] transition-all flex items-center justify-center gap-2 select-none cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Acessar com o Google</span>
        </button>

        {/* Quick helpers for testing */}
        <div className="pt-3 border-t text-center text-[10px] text-zinc-500 font-mono">
          <p>
            DICA: Banco integrado ao Firebase.<br />
            Novas credenciais são registradas <strong className="text-zinc-800">automaticamente</strong> no primeiro acesso!
          </p>
          <div className="flex items-center justify-center gap-1 mt-2 text-indigo-700 font-bold">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>Banco de Dados Firestore & Auth Ativo</span>
          </div>
        </div>

      </div>

    </div>
  );
}
