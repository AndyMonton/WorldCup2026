"use client";

import { useActionState, startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trophy, Mail, Lock, ArrowRight, Sparkles, X, AlertCircle, Eye, EyeOff } from "lucide-react";
import { loginWithCredentials, loginWithGoogle } from "@/app/actions/login";

const initialState = {
  error: null as string | null,
  success: false,
};

export default function LoginPage() {
  const router = useRouter();
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [state, formAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const res = await loginWithCredentials(prevState, formData);
      if (res.success) {
        // Redirigir usando el router del cliente para evitar recargas toscas
        router.push("/dashboard");
        router.refresh();
      }
      return res;
    },
    initialState
  );

  const handleGoogleLogin = () => {
    startTransition(async () => {
      await loginWithGoogle();
    });
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12 overflow-hidden bg-background">
      {/* Luces de fondo (Glow effects) */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary opacity-20 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-gold opacity-15 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="z-10 w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-8 animate-float">
          <img src="/images/fifa-logo.jpg" alt="FIFA World Cup 2026 Logo" className="w-24 h-24 object-contain mx-auto mb-4 drop-shadow-lg rounded-xl" />
          <h1 className="text-4xl font-extrabold tracking-tight">
            FIFA <span className="text-gradient">WORLD CUP 2026</span>
          </h1>
          <p className="text-slate-200 text-base font-semibold mt-2 tracking-wider">
            Prode de Ligas Privadas
          </p>
        </div>

        {/* Tarjeta de Login */}
        <div className="glass-panel glow-card rounded-2xl p-8 border border-border shadow-2xl relative">
          <div className="absolute top-0 right-0 p-3 pointer-events-none">
            <Sparkles className="w-5 h-5 text-primary opacity-30" />
          </div>

          <h2 className="text-xl font-bold text-center mb-6 text-foreground">
            Iniciar Sesión
          </h2>

          {state?.error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
              {state.error}
            </div>
          )}

          <form action={formAction} className="space-y-5">
            {/* Campo Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
                  <Mail className="w-5 h-5" />
                </span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="ejemplo@macena.com.ar"
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/50 hover:bg-slate-900 border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-foreground placeholder-slate-500 transition-all text-sm outline-none"
                />
              </div>
            </div>

            {/* Campo Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Contraseña
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs text-primary hover:underline bg-transparent border-none cursor-pointer"
                >
                  ¿La olvidaste?
                </button>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
                  <Lock className="w-5 h-5" />
                </span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 bg-slate-900/50 hover:bg-slate-900 border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-foreground placeholder-slate-500 transition-all text-sm outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-foreground cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Botón de Ingreso */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 py-3 bg-primary hover:bg-primary-hover disabled:opacity-50 text-primary-foreground font-bold rounded-xl transition-all shadow-md cursor-pointer hover:shadow-lg text-sm"
            >
              {isPending ? (
                <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  Ingresar
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Separador */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-slate-400">O ingresar con</span>
            </div>
          </div>

          {/* Google Login */}
          <button
            onClick={handleGoogleLogin}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-3 py-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-xl transition-all cursor-pointer text-sm font-semibold shadow-sm hover:shadow"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Google
          </button>
        </div>

        {/* Link de Registro */}
        <div className="text-center mt-6">
          <p className="text-sm text-slate-400">
            ¿No tenés una cuenta?{" "}
            <Link href="/register" className="text-primary hover:underline font-bold">
              Registrate acá
            </Link>
          </p>
        </div>
      </div>

      {/* Modal - ¿Olvidaste tu contraseña? */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md glass-panel border border-border rounded-2xl shadow-2xl p-6 relative">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-foreground rounded-lg hover:bg-slate-800/50 transition-all outline-none"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Restablecer Contraseña</h3>
            </div>

            <div className="space-y-4 text-sm text-slate-300">
              <p>
                Al tratarse de una plataforma privada de ligas corporativas, no contamos con un recuperador de contraseña por correo público.
              </p>
              <div className="p-3 bg-slate-900/50 border border-border rounded-xl">
                <span className="font-bold text-foreground block mb-1">¿Cómo proceder?</span>
                Por favor, ponete en contacto con el administrador de tu liga corporativa o enviá un correo a:
                <code className="block mt-1 font-semibold text-primary select-all text-xs bg-slate-900 p-1.5 rounded border border-border/40 text-center">
                  utn01@hotmail.com
                </code>
              </div>
              <p className="text-xs text-slate-400">
                El administrador podrá restablecer o configurar una clave temporal para que ingreses y luego la modifiques en tu perfil.
              </p>
            </div>

            <button
              onClick={() => setShowForgotModal(false)}
              className="w-full mt-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-foreground font-semibold rounded-xl text-sm transition-all border border-border"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
