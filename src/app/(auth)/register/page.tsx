"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trophy, Mail, Lock, User, Key, Users, ArrowRight, Sparkles, Building2, Eye, EyeOff } from "lucide-react";
import { registerUser } from "@/app/actions/auth";
import { loginWithCredentials } from "@/app/actions/login";

const initialState = {
  error: null as string | null,
  success: false,
};

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  const [state, formAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      // Forzar valores del estado en el FormData por seguridad
      formData.set("name", name);
      formData.set("email", email);
      formData.set("password", password);
      formData.set("inviteCode", inviteCode);

      const res = await registerUser(prevState, formData);
      if (res.success) {
        // Iniciar sesión automáticamente
        const loginRes = await loginWithCredentials(null, formData);
        if (loginRes.success) {
          router.push("/dashboard");
          router.refresh();
        } else {
          router.push("/login?registered=true");
        }
      }
      return res;
    },
    initialState
  );

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12 overflow-hidden bg-background">
      {/* Luces de fondo (Glow effects) */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary opacity-20 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-gold opacity-15 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="z-10 w-full max-w-lg">
        {/* Logo / Header */}
        <div className="text-center mb-6 animate-float">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-slate-800/50 border border-slate-700 mb-4 shadow-inner">
            <Trophy className="w-8 h-8 text-gold" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            REGISTRO <span className="text-gradient">PRODE 2026</span>
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            Unite a tu liga privada y empezá a pronosticar
          </p>
        </div>

        {/* Tarjeta de Registro */}
        <div className="glass-panel glow-card rounded-2xl p-8 border border-border shadow-2xl relative">
          <div className="absolute top-0 right-0 p-3 pointer-events-none">
            <Sparkles className="w-5 h-5 text-primary opacity-30" />
          </div>

          <h2 className="text-xl font-bold text-center mb-6 text-foreground">
            Crear Nueva Cuenta
          </h2>

          {state?.error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
              {state.error}
            </div>
          )}

          <form action={formAction} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Campo Nombre */}
              <div>
                <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Nombre Completo
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Juan Pérez"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-900/50 hover:bg-slate-900 border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-foreground placeholder-slate-500 transition-all text-sm outline-none"
                  />
                </div>
              </div>

              {/* Campo Email */}
              <div>
                <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="juan@macena.com.ar"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-900/50 hover:bg-slate-900 border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-foreground placeholder-slate-500 transition-all text-sm outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Campo Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-900/50 hover:bg-slate-900 border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-foreground placeholder-slate-500 transition-all text-sm outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-foreground cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Código de Invitación */}
            <div>
              <label htmlFor="inviteCode" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Código de Invitación de Liga
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
                  <Key className="w-4 h-4" />
                </span>
                <input
                  id="inviteCode"
                  name="inviteCode"
                  type="text"
                  required
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="Ej: MACENA2026"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-900/50 hover:bg-slate-900 border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-foreground placeholder-slate-500 transition-all text-sm outline-none uppercase"
                />
              </div>
            </div>

            {/* Botón de Registro */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 py-3 bg-primary hover:bg-primary-hover disabled:opacity-50 text-primary-foreground font-bold rounded-xl transition-all shadow-md cursor-pointer hover:shadow-lg text-sm mt-2"
            >
              {isPending ? (
                <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  Registrarme y Unirme
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Link de Login */}
        <div className="text-center mt-6">
          <p className="text-sm text-slate-400">
            ¿Ya tenés una cuenta?{" "}
            <Link href="/login" className="text-primary hover:underline font-bold">
              Iniciá sesión acá
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
