"use client";

import { useState } from "react";
import { joinNewLeague } from "@/app/actions/league";
import { Trophy, Key, ArrowRight, Sparkles } from "lucide-react";

export function JoinLeagueCard() {
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setLoading(true);
    setError(null);

    const res = await joinNewLeague(inviteCode);
    setLoading(false);

    if (res.success) {
      // Recargar la página para que la sesión y el layout de Next.js
      // detecten la membresía y redireccionen a la selección de sector.
      window.location.reload();
    } else {
      setError(res.error);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-12 px-4">
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-72 h-72 bg-primary opacity-20 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="glass-panel glow-card rounded-3xl p-8 border border-border shadow-2xl relative text-center space-y-6 bg-slate-900/10">
        <div className="absolute top-0 right-0 p-4 pointer-events-none">
          <Sparkles className="w-5 h-5 text-gold opacity-40 animate-pulse" />
        </div>

        {/* Icon */}
        <div className="inline-flex items-center justify-center p-4 rounded-full bg-slate-800/40 border border-slate-700/60 mb-2 shadow-inner">
          <Trophy className="w-10 h-10 text-gold" />
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h2 className="text-2xl font-black tracking-tight text-foreground uppercase">
            ¡Bienvenido al Prode <span className="text-gradient">2026</span>!
          </h2>
          <p className="text-slate-400 text-sm max-w-sm mx-auto leading-relaxed">
            Todavía no estás participando en ninguna liga. Para comenzar a realizar tus pronósticos y ver las tablas, únete a una ingresando el código de invitación corporativo.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
              <Key className="w-5 h-5" />
            </span>
            <input
              type="text"
              required
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="INGRESA EL CÓDIGO (Ej: MACENA2026)"
              className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-2xl text-foreground placeholder-slate-500 transition-all text-sm outline-none uppercase font-bold tracking-wider text-center"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !inviteCode.trim()}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary hover:bg-primary-hover disabled:opacity-50 text-primary-foreground font-bold rounded-2xl transition-all shadow-md cursor-pointer hover:shadow-lg text-sm"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                Unirme a la Liga
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
