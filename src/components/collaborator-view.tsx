"use client";

import React, { useState, useTransition } from "react";
import { Search, Loader2, ShieldCheck } from "lucide-react";
import { updateUsersPhaseStatus } from "@/app/actions/admin";
import { CustomDialog } from "@/components/ui/custom-dialog";

interface MemberItem {
  id: string;
  userId: string;
  department: string;
  hasPaid: boolean;
  role: string;
  createdAt: Date;
  activePhase1: boolean;
  activePhase2: boolean;
  activePhase3: boolean;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
}

interface CollaboratorViewProps {
  leagueId: string;
  leagueName: string;
  initialMembers: MemberItem[];
  phase1Finished?: boolean;
  phase2Finished?: boolean;
}

export function CollaboratorView({ 
  leagueId, 
  leagueName, 
  initialMembers,
  phase1Finished = false,
  phase2Finished = false
}: CollaboratorViewProps) {
  const [members, setMembers] = useState<MemberItem[]>(initialMembers);
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingPhaseMap, setUpdatingPhaseMap] = useState<Record<string, boolean>>({});
  const [isPending, startTransition] = useTransition();

  // Estado para diálogos/modales custom
  const [dialogConfig, setDialogConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "info" | "success" | "warning" | "error" | "confirm";
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  const triggerAlert = (
    title: string,
    message: string,
    type: "info" | "success" | "warning" | "error" = "info"
  ) => {
    setDialogConfig({
      isOpen: true,
      title,
      message,
      type,
    });
  };

  const handleTogglePhase = (targetUserId: string, phase: 1 | 2 | 3, currentStatus: boolean) => {
    const targetKey = `${targetUserId}-${phase}`;
    setUpdatingPhaseMap((prev) => ({ ...prev, [targetKey]: true }));

    startTransition(async () => {
      const res = await updateUsersPhaseStatus([targetUserId], leagueId, phase, !currentStatus);
      
      setUpdatingPhaseMap((prev) => ({ ...prev, [targetKey]: false }));

      if (res.success) {
        setMembers((prevMembers) =>
          prevMembers.map((member) =>
            member.userId === targetUserId
              ? {
                  ...member,
                  activePhase1: phase === 1 ? !currentStatus : member.activePhase1,
                  activePhase2: phase === 2 ? !currentStatus : member.activePhase2,
                  activePhase3: phase === 3 ? !currentStatus : member.activePhase3,
                }
              : member
          )
        );
      } else {
        triggerAlert("Error de Fase", res.error || "Ocurrió un error al cambiar la fase", "error");
      }
    });
  };

  // Filtrado de usuarios
  const filteredMembers = members.filter((member) => {
    const text = searchTerm.toLowerCase();
    const name = (member.user.name || "").toLowerCase();
    const email = (member.user.email || "").toLowerCase();
    const dept = (member.department || "").toLowerCase();
    return name.includes(text) || email.includes(text) || dept.includes(text);
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Cabecera del Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-8 h-8 text-primary animate-pulse" />
            Control de Pagos
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Liga: <span className="font-semibold text-slate-200">{leagueName}</span> | Habilitá o deshabilitá el estado de pago de los participantes.
          </p>
        </div>
      </div>

      {/* Buscador */}
      <div className="glass-panel border border-border/80 rounded-2xl p-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por nombre, email o sector..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-900/60 border border-border focus:border-primary rounded-xl text-foreground text-sm outline-none placeholder-slate-500 transition-all"
          />
        </div>
      </div>

      {/* Tabla de Participantes */}
      <div className="glass-panel border border-border/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-slate-900/40 text-slate-400 text-[10px] uppercase tracking-wider font-extrabold">
                <th className="px-6 py-4">Usuario</th>
                <th className="px-6 py-4">Sector</th>
                <th className="px-6 py-4 text-center">Fase 1 (Habilitar)</th>
                <th className="px-6 py-4 text-center">Fase 2 (Habilitar)</th>
                <th className="px-6 py-4 text-center">Fase 3 (Habilitar)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-slate-300 text-sm">
              {filteredMembers.length > 0 ? (
                filteredMembers.map((member) => {
                  return (
                    <tr key={member.id} className="hover:bg-slate-900/20 transition-colors">
                      {/* Usuario */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {member.user.image ? (
                            <img
                              src={member.user.image}
                              alt="Avatar"
                              className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 shrink-0 object-cover"
                            />
                          ) : (
                            <img
                              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.user.id}`}
                              alt="Avatar"
                              className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 shrink-0"
                            />
                          )}
                          <div className="flex flex-col">
                            <span className="font-bold text-foreground">
                              {member.user.name || "Sin nombre"}
                            </span>
                            <span className="text-xs text-slate-500 font-mono">
                              {member.user.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Sector */}
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-border text-xs font-semibold">
                          {member.department}
                        </span>
                      </td>

                      {/* Fase 1 Checkbox */}
                      <td className="px-6 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={member.activePhase1}
                          disabled={updatingPhaseMap[`${member.userId}-1`]}
                          onChange={() => handleTogglePhase(member.userId, 1, member.activePhase1)}
                          className="rounded border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer disabled:opacity-50"
                        />
                      </td>

                      {/* Fase 2 Checkbox */}
                      <td className="px-6 py-4 text-center" title={!phase1Finished ? "Se habilita al finalizar la Fase 1" : undefined}>
                        <input
                          type="checkbox"
                          checked={member.activePhase2}
                          disabled={!phase1Finished || updatingPhaseMap[`${member.userId}-2`]}
                          onChange={() => handleTogglePhase(member.userId, 2, member.activePhase2)}
                          className="rounded border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        />
                      </td>

                      {/* Fase 3 Checkbox */}
                      <td className="px-6 py-4 text-center" title={!phase2Finished ? "Se habilita al finalizar la Fase 2" : undefined}>
                        <input
                          type="checkbox"
                          checked={member.activePhase3}
                          disabled={!phase2Finished || updatingPhaseMap[`${member.userId}-3`]}
                          onChange={() => handleTogglePhase(member.userId, 3, member.activePhase3)}
                          className="rounded border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        />
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-semibold">
                    No se encontraron participantes en esta liga.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alerta Custom */}
      <CustomDialog
        isOpen={dialogConfig.isOpen}
        onClose={() => setDialogConfig((prev) => ({ ...prev, isOpen: false }))}
        title={dialogConfig.title}
        message={dialogConfig.message}
        type={dialogConfig.type}
      />
    </div>
  );
}
