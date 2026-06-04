"use client";

import React, { useState, useTransition } from "react";
import { Search, CheckCircle2, XCircle, Loader2, ShieldCheck, RefreshCw } from "lucide-react";
import { updateUserPaymentStatus } from "@/app/actions/admin";
import { CustomDialog } from "@/components/ui/custom-dialog";

interface MemberItem {
  id: string;
  userId: string;
  department: string;
  hasPaid: boolean;
  role: string;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
}

interface CollaboratorViewProps {
  leagueId: string;
  leagueName: string;
  initialMembers: MemberItem[];
}

export function CollaboratorView({ leagueId, leagueName, initialMembers }: CollaboratorViewProps) {
  const [members, setMembers] = useState<MemberItem[]>(initialMembers);
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingPaymentMap, setUpdatingPaymentMap] = useState<Record<string, boolean>>({});
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

  const handleTogglePayment = (targetUserId: string, currentStatus: boolean) => {
    setUpdatingPaymentMap((prev) => ({ ...prev, [targetUserId]: true }));

    startTransition(async () => {
      const res = await updateUserPaymentStatus(targetUserId, leagueId, !currentStatus);
      
      setUpdatingPaymentMap((prev) => ({ ...prev, [targetUserId]: false }));

      if (res.success) {
        setMembers((prevMembers) =>
          prevMembers.map((member) =>
            member.userId === targetUserId
              ? { ...member, hasPaid: !currentStatus }
              : member
          )
        );
      } else {
        triggerAlert("Error de Pago", res.error || "Ocurrió un error al procesar el pago", "error");
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
                <th className="px-6 py-4">Fecha Inscripción</th>
                <th className="px-6 py-4 text-center">Estado de Pago</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-slate-300 text-sm">
              {filteredMembers.length > 0 ? (
                filteredMembers.map((member) => {
                  const isUpdating = !!updatingPaymentMap[member.userId];
                  
                  return (
                    <tr key={member.id} className="hover:bg-slate-900/20 transition-colors">
                      {/* Usuario */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground">
                            {member.user.name || "Sin nombre"}
                          </span>
                          <span className="text-xs text-slate-500 font-mono">
                            {member.user.email}
                          </span>
                        </div>
                      </td>

                      {/* Sector */}
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-border text-xs font-semibold">
                          {member.department}
                        </span>
                      </td>

                      {/* Fecha Inscripción */}
                      <td className="px-6 py-4 text-xs text-slate-400">
                        {new Date(member.createdAt).toLocaleDateString("es-AR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>

                      {/* Estado de Pago */}
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleTogglePayment(member.userId, member.hasPaid)}
                          disabled={isUpdating}
                          className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                            isUpdating
                              ? "bg-slate-900 text-slate-400 border-border cursor-not-allowed"
                              : member.hasPaid
                              ? "bg-green-500/10 hover:bg-green-500/20 text-green-400 border-green-500/30 hover:border-green-500/50 cursor-pointer"
                              : "bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30 hover:border-red-500/50 cursor-pointer"
                          }`}
                        >
                          {isUpdating ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : member.hasPaid ? (
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-400" />
                          )}
                          {isUpdating
                            ? "Actualizando..."
                            : member.hasPaid
                            ? "Confirmado"
                            : "Pendiente"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500 font-semibold">
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
