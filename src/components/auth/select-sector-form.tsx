"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, ArrowRight, Sparkles, Trophy } from "lucide-react";
import { saveUserSector } from "@/app/actions/sector";

interface SelectSectorFormProps {
  sectors: string[];
  leagueName: string;
}

const initialState = {
  error: null as string | null,
  success: false,
};

export function SelectSectorForm({ sectors, leagueName }: SelectSectorFormProps) {
  const router = useRouter();
  const [selectedDept, setSelectedDept] = useState(sectors[0] || "Otro");
  const [customDept, setCustomDept] = useState("");

  const [state, formAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      if (selectedDept === "Otro") {
        formData.set("department", customDept.trim() || "Otro");
      } else {
        formData.set("department", selectedDept);
      }

      const res = await saveUserSector(prevState, formData);
      if (res.success) {
        router.push("/dashboard");
        router.refresh();
      }
      return res;
    },
    initialState
  );

  const displaySectors = [...sectors];
  if (!displaySectors.includes("Otro")) {
    displaySectors.push("Otro");
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12 overflow-hidden bg-background text-foreground">
      {/* Luces de fondo (Glow effects) */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary opacity-20 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-gold opacity-15 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="z-10 w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-6 animate-float">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-slate-800/50 border border-slate-700 mb-4 shadow-inner">
            <Trophy className="w-8 h-8 text-gold" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            PRODE <span className="text-gradient">MUNDIAL 2026</span>
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            ¡Ya casi estás adentro!
          </p>
        </div>

        {/* Tarjeta de Selección */}
        <div className="glass-panel glow-card rounded-2xl p-8 border border-border shadow-2xl relative">
          <div className="absolute top-0 right-0 p-3 pointer-events-none">
            <Sparkles className="w-5 h-5 text-primary opacity-30" />
          </div>

          <h2 className="text-xl font-bold text-center mb-2 text-foreground">
            Seleccioná tu Sector
          </h2>
          <p className="text-xs text-slate-400 text-center mb-6">
            Para participar en la liga de <span className="text-primary font-semibold">{leagueName}</span>, necesitamos saber a qué sector o departamento pertenecés.
          </p>

          {state?.error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
              {state.error}
            </div>
          )}

          <form action={formAction} className="space-y-5">
            {/* Departamento / Sector */}
            <div>
              <label htmlFor="department-select" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Sector / Departamento
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
                  <Building2 className="w-5 h-5" />
                </span>
                <select
                  id="department-select"
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/50 hover:bg-slate-900 border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-foreground transition-all text-sm outline-none appearance-none cursor-pointer"
                >
                  {displaySectors.map((dept) => (
                    <option key={dept} value={dept} className="bg-slate-900 text-foreground">
                      {dept}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                  ▼
                </div>
              </div>
            </div>

            {/* Input personalizado si selecciona "Otro" */}
            {selectedDept === "Otro" && (
              <div className="animate-fade-in">
                <label htmlFor="custom-dept" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Escribí tu sector
                </label>
                <input
                  id="custom-dept"
                  type="text"
                  required
                  value={customDept}
                  onChange={(e) => setCustomDept(e.target.value)}
                  placeholder="Ej: Logística, Administración"
                  className="w-full px-4 py-3 bg-slate-900/50 hover:bg-slate-900 border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-foreground placeholder-slate-500 transition-all text-sm outline-none"
                />
              </div>
            )}

            {/* Botón de Confirmación */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 py-3 bg-primary hover:bg-primary-hover disabled:opacity-50 text-primary-foreground font-bold rounded-xl transition-all shadow-md cursor-pointer hover:shadow-lg text-sm"
            >
              {isPending ? (
                <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  Ingresar a la Liga
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
