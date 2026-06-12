"use client";
 
import React, { useState, useEffect, useTransition } from "react";
import { MatchStage, MatchStatus, Team, League, Role, AuditLog, LeagueRole } from "@prisma/client";
import { saveMatchResult, updateUserRole, createNewLeague, deleteUser, addLeagueSector, deleteLeagueSector, updateUsersPhaseStatus, updateLeagueTransferInfo, updateUserPaymentStatus, adminResetUserPassword, updateLeagueName, updateUserLeagueRole } from "@/app/actions/admin";
import { getSectorsForLeague } from "@/lib/sectors";
import { CustomDialog } from "@/components/ui/custom-dialog";
import {
  Trophy,
  CalendarDays,
  Users,
  Settings,
  ShieldCheck,
  Check,
  AlertTriangle,
  Download,
  PlusCircle,
  FileText,
  UserCheck,
  Search,
  Trash2,
  Lock,
  Key,
  X,
  Pencil,
} from "lucide-react";
 
interface MatchItem {
  id: string;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeTeamPlaceholder: string | null;
  awayTeamPlaceholder: string | null;
  homeScore: number | null;
  awayScore: number | null;
  homeScoreExtra: number | null;
  awayScoreExtra: number | null;
  homeScorePenalties: number | null;
  awayScorePenalties: number | null;
  winnerId: string | null;
  date: Date;
  stage: MatchStage;
  group: string | null;
  status: MatchStatus;
  stadium: { name: string; city: string };
  homeTeam: Team | null;
  awayTeam: Team | null;
}
 
interface UserItem {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  memberships: {
    id: string;
    league: { id: string; name: string };
    department: string;
    internalGroup: string | null;
    activePhase1: boolean;
    activePhase2: boolean;
    activePhase3: boolean;
    hasPaid: boolean;
    role: LeagueRole;
  }[];
}
 
interface AdminViewProps {
  initialMatches: MatchItem[];
  leagues: (League & { membershipsCount: number; departments: string | null; transferAlias: string | null; transferAmount: number | null; requiresPayment: boolean })[];
  users: UserItem[];
  auditLogs: (AuditLog & { user: { name: string | null; email: string } })[];
  isDemo: boolean;
  phase1Finished?: boolean;
  phase2Finished?: boolean;
}
 
type AdminTab = "results" | "leagues" | "users" | "exports" | "sectors";

function LeagueTransferInfoCell({
  leagueId,
  initialAlias,
  initialAmount,
  initialAccountName,
  initialPhone,
  initialRequiresPayment,
  isDemo,
  onError,
}: {
  leagueId: string;
  initialAlias: string;
  initialAmount: number | null;
  initialAccountName: string | null;
  initialPhone: string | null;
  initialRequiresPayment: boolean;
  isDemo: boolean;
  onError?: (err: string) => void;
}) {
  const [alias, setAlias] = useState(initialAlias);
  const [amount, setAmount] = useState(initialAmount !== null ? initialAmount.toString() : "");
  const [accountName, setAccountName] = useState(initialAccountName || "");
  const [phone, setPhone] = useState(initialPhone || "");
  const [requiresPayment, setRequiresPayment] = useState(initialRequiresPayment);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [, startTransition] = React.useTransition();

  const handleSave = () => {
    setSaving(true);
    setSuccess(false);
    const parsedAmount = amount.trim() === "" ? null : parseFloat(amount);

    startTransition(async () => {
      if (isDemo) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        setSaving(false);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
        return;
      }

      const res = await updateLeagueTransferInfo(
        leagueId,
        alias,
        parsedAmount,
        accountName,
        phone,
        requiresPayment
      );
      setSaving(false);
      if (res.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
      } else {
        if (onError) onError(res.error || "Ocurrió un error al guardar");
        else console.error(res.error || "Ocurrió un error al guardar");
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        <input
          type="text"
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
          placeholder="Alias de transferencia"
          className="px-2 py-1 bg-slate-950 border border-border/60 focus:border-primary rounded-lg text-xs text-foreground placeholder-slate-600 outline-none w-36 transition-all"
        />
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Monto ($)"
          className="px-2 py-1 bg-slate-950 border border-border/60 focus:border-primary rounded-lg text-xs text-foreground placeholder-slate-600 outline-none w-24 transition-all"
        />
        <input
          type="text"
          value={accountName}
          onChange={(e) => setAccountName(e.target.value)}
          placeholder="Titular de la cuenta"
          className="px-2 py-1 bg-slate-950 border border-border/60 focus:border-primary rounded-lg text-xs text-foreground placeholder-slate-600 outline-none w-36 transition-all"
        />
        <input
          type="text"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Celular para comprobante"
          className="px-2 py-1 bg-slate-950 border border-border/60 focus:border-primary rounded-lg text-xs text-foreground placeholder-slate-600 outline-none w-24 transition-all"
        />
        <label className="col-span-1 sm:col-span-2 flex items-center gap-2 mt-1 select-none cursor-pointer">
          <input
            type="checkbox"
            checked={requiresPayment}
            onChange={(e) => setRequiresPayment(e.target.checked)}
            className="rounded border-border text-primary focus:ring-primary w-3.5 h-3.5"
          />
          <span className="text-[10px] text-slate-300 font-semibold">Requiere pago de inscripción</span>
        </label>
      </div>
      <button
        onClick={handleSave}
        disabled={saving}
        className="px-3 py-1 text-[9px] min-w-[65px] btn-premium self-end sm:self-center"
      >
        {saving ? "..." : success ? <Check className="w-3.5 h-3.5 text-white" /> : "Guardar"}
      </button>
    </div>
  );
}
 
export function AdminView({ 
  initialMatches, 
  leagues, 
  users, 
  auditLogs, 
  isDemo,
  phase1Finished = false,
  phase2Finished = false
}: AdminViewProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>("results");
  const [matches, setMatches] = useState<MatchItem[]>(initialMatches);
  const [localLeagues, setLocalLeagues] = useState(leagues);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>(leagues[0]?.id || "");
  const [newSectorName, setNewSectorName] = useState("");
  const [sectorSuccess, setSectorSuccess] = useState<string | null>(null);
  const [sectorError, setSectorError] = useState<string | null>(null);
  const [loadingSector, setLoadingSector] = useState(false);

  // Estados para restablecer contraseña de usuario por Admin
  const [selectedResetUser, setSelectedResetUser] = useState<{ id: string; name: string } | null>(null);
  const [newResetPassword, setNewResetPassword] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  
  // Estados para activación de fases
  const [usersLeagueId, setUsersLeagueId] = useState<string>(leagues[0]?.id || "ALL");
  const [selectedUserIds, setSelectedUserIds] = useState<Record<string, boolean>>({});
  const [updatingPhaseMap, setUpdatingPhaseMap] = useState<Record<string, boolean>>({});
  const [updatingPaymentMap, setUpdatingPaymentMap] = useState<Record<string, boolean>>({});
  const [updatingBulk, setUpdatingBulk] = useState(false);

  // Estado para diálogos/modales custom
  const [dialogConfig, setDialogConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "info" | "success" | "warning" | "error" | "confirm";
    onConfirm?: () => void;
    confirmText?: string;
    cancelText?: string;
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  const triggerAlert = (
    title: string,
    message: string,
    type: "info" | "success" | "warning" | "error" = "info",
    confirmText?: string
  ) => {
    setDialogConfig({
      isOpen: true,
      title,
      message,
      type,
      confirmText,
    });
  };

  const triggerConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText?: string,
    cancelText?: string
  ) => {
    setDialogConfig({
      isOpen: true,
      title,
      message,
      type: "confirm",
      onConfirm,
      confirmText,
      cancelText,
    });
  };

  // Estados para modificar nombre de liga
  const [editingLeagueId, setEditingLeagueId] = useState<string | null>(null);
  const [editingLeagueName, setEditingLeagueName] = useState("");
  const [savingLeagueName, setSavingLeagueName] = useState(false);

  // Estados para ver usuarios de liga
  const [viewingLeagueUsers, setViewingLeagueUsers] = useState<{ id: string; name: string } | null>(null);
  const [userSearchTerm, setUserSearchTerm] = useState("");

  const handleSaveLeagueName = (leagueId: string) => {
    const trimmedName = editingLeagueName.trim();
    if (!trimmedName) {
      triggerAlert("Error", "El nombre de la liga no puede estar vacío.", "error");
      return;
    }

    setSavingLeagueName(true);
    startTransition(async () => {
      if (isDemo) {
        // Modo demostración
        await new Promise((resolve) => setTimeout(resolve, 500));
        const updatedLeagues = localLeagues.map((l) =>
          l.id === leagueId ? { ...l, name: trimmedName } : l
        );
        setLocalLeagues(updatedLeagues);
        setEditingLeagueId(null);
        setEditingLeagueName("");
        setSavingLeagueName(false);
        triggerAlert("Éxito (Demo)", "Nombre de liga actualizado con éxito (Modo Demo).", "success");
        return;
      }

      const res = await updateLeagueName(leagueId, trimmedName);
      setSavingLeagueName(false);
      if (res.success) {
        const updatedLeagues = localLeagues.map((l) =>
          l.id === leagueId ? { ...l, name: trimmedName } : l
        );
        setLocalLeagues(updatedLeagues);
        setEditingLeagueId(null);
        setEditingLeagueName("");
        triggerAlert("Éxito", "Nombre de liga actualizado con éxito.", "success");
      } else {
        triggerAlert("Error", res.error || "Ocurrió un error al guardar.", "error");
      }
    });
  };

  useEffect(() => {
    setLocalLeagues(leagues);
  }, [leagues]);

  useEffect(() => {
    setMatches(initialMatches);
  }, [initialMatches]);

  const handleTogglePayment = (userId: string, currentStatus: boolean) => {
    if (usersLeagueId === "ALL") return;
    setUpdatingPaymentMap((prev) => ({ ...prev, [userId]: true }));

    startTransition(async () => {
      if (isDemo) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        setUpdatingPaymentMap((prev) => ({ ...prev, [userId]: false }));
        const user = users.find(u => u.id === userId);
        const m = user?.memberships.find(memb => memb.league.id === usersLeagueId);
        if (m) m.hasPaid = !currentStatus;
        setLocalLeagues([...localLeagues]);
        return;
      }

      const res = await updateUserPaymentStatus(userId, usersLeagueId, !currentStatus);
      setUpdatingPaymentMap((prev) => ({ ...prev, [userId]: false }));
      if (!res.success) {
        triggerAlert("Error de Pago", res.error || "Ocurrió un error al procesar el pago", "error");
      }
    });
  };

  const filteredUsers = usersLeagueId === "ALL" 
    ? users 
    : users.filter((u) => u.memberships.some((m) => m.league.id === usersLeagueId));

  const isAllSelected = filteredUsers.length > 0 && filteredUsers.every((u) => selectedUserIds[u.id]);

  const handleTogglePhase = (userId: string, phase: 1 | 2 | 3, currentStatus: boolean) => {
    if (usersLeagueId === "ALL") return;
    const targetKey = `${userId}-${phase}`;
    setUpdatingPhaseMap((prev) => ({ ...prev, [targetKey]: true }));

    startTransition(async () => {
      if (isDemo) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        setUpdatingPhaseMap((prev) => ({ ...prev, [targetKey]: false }));
        // Simular cambio
        const user = users.find(u => u.id === userId);
        const m = user?.memberships.find(memb => memb.league.id === usersLeagueId);
        if (m) {
          if (phase === 1) m.activePhase1 = !currentStatus;
          else if (phase === 2) m.activePhase2 = !currentStatus;
          else if (phase === 3) m.activePhase3 = !currentStatus;
        }
        return;
      }

      const res = await updateUsersPhaseStatus([userId], usersLeagueId, phase, !currentStatus);
      setUpdatingPhaseMap((prev) => ({ ...prev, [targetKey]: false }));
      if (!res.success) {
        triggerAlert("Error de Fase", res.error || "Ocurrió un error al cambiar la fase", "error");
      }
    });
  };

  const handleBulkPhaseUpdate = (phase: 1 | 2 | 3, active: boolean) => {
    const userIds = Object.keys(selectedUserIds).filter((id) => selectedUserIds[id]);
    if (userIds.length === 0 || usersLeagueId === "ALL") {
      triggerAlert("Atención", "Por favor, selecciona al menos un usuario.", "warning");
      return;
    }

    setUpdatingBulk(true);
    startTransition(async () => {
      if (isDemo) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        setUpdatingBulk(false);
        // Simular
        userIds.forEach(userId => {
          const user = users.find(u => u.id === userId);
          const m = user?.memberships.find(memb => memb.league.id === usersLeagueId);
          if (m) {
            if (phase === 1) m.activePhase1 = active;
            else if (phase === 2) m.activePhase2 = active;
            else if (phase === 3) m.activePhase3 = active;
          }
        });
        setSelectedUserIds({});
        triggerAlert("Fase Actualizada (Demo)", `Fase ${phase} ${active ? "habilitada" : "deshabilitada"} para ${userIds.length} usuarios (Demo).`, "success");
        return;
      }

      const res = await updateUsersPhaseStatus(userIds, usersLeagueId, phase, active);
      setUpdatingBulk(false);
      if (res.success) {
        setSelectedUserIds({});
      } else {
        triggerAlert("Error de Fase", res.error || "Ocurrió un error al actualizar la fase", "error");
      }
    });
  };

  const handleSelectAll = (checked: boolean) => {
    const newSelected: Record<string, boolean> = {};
    if (checked) {
      filteredUsers.forEach((u) => {
        newSelected[u.id] = true;
      });
    }
    setSelectedUserIds(newSelected);
  };

  const getSelectedLeagueSectors = () => {
    const league = localLeagues.find((l) => l.id === selectedLeagueId);
    if (!league) return [];
    if (league.departments) {
      try {
        return JSON.parse(league.departments) as string[];
      } catch (e) {
        // Fallback
      }
    }
    return getSectorsForLeague(league.inviteCode);
  };

  // --- HANDLERS PARA GESTIÓN DE SECTORES ---
  const handleAddSector = () => {
    if (!selectedLeagueId || !newSectorName.trim()) return;

    setLoadingSector(true);
    setSectorSuccess(null);
    setSectorError(null);

    startTransition(async () => {
      if (isDemo) {
        await new Promise((resolve) => setTimeout(resolve, 600));
        setLoadingSector(false);
        const league = localLeagues.find((l) => l.id === selectedLeagueId);
        if (league) {
          const current = league.departments ? JSON.parse(league.departments) : getSectorsForLeague(league.inviteCode);
          const updated = [...current, newSectorName.trim()];
          league.departments = JSON.stringify(updated);
          setLocalLeagues([...localLeagues]);
          setSectorSuccess(`Sector '${newSectorName}' agregado con éxito en modo demostración.`);
          setNewSectorName("");
        }
        return;
      }

      const res = await addLeagueSector(selectedLeagueId, newSectorName);
      setLoadingSector(false);
      if (res.success && res.sectors) {
        const updatedLeagues = localLeagues.map((l) =>
          l.id === selectedLeagueId ? { ...l, departments: JSON.stringify(res.sectors) } : l
        );
        setLocalLeagues(updatedLeagues);
        setSectorSuccess(`Sector '${newSectorName}' agregado con éxito.`);
        setNewSectorName("");
      } else {
        setSectorError(res.error);
      }
    });
  };

  const handleDeleteSector = (sectorName: string) => {
    if (!selectedLeagueId) return;

    triggerConfirm(
      "¿Eliminar Sector?",
      `¿Estás seguro de que querés eliminar el sector "${sectorName}" de esta liga?\nTodos los usuarios en este sector serán reseteados a 'PENDIENTE' para elegir sector de nuevo.`,
      () => {
        setLoadingSector(true);
        setSectorSuccess(null);
        setSectorError(null);

        startTransition(async () => {
          if (isDemo) {
            await new Promise((resolve) => setTimeout(resolve, 600));
            setLoadingSector(false);
            const league = localLeagues.find((l) => l.id === selectedLeagueId);
            if (league) {
              const current = league.departments ? JSON.parse(league.departments) : getSectorsForLeague(league.inviteCode);
              const updated = current.filter((s: string) => s !== sectorName);
              league.departments = JSON.stringify(updated);
              setLocalLeagues([...localLeagues]);
              setSectorSuccess(`Sector '${sectorName}' eliminado en modo demostración.`);
            }
            return;
          }

          const res = await deleteLeagueSector(selectedLeagueId, sectorName);
          setLoadingSector(false);
          if (res.success && res.sectors) {
            const updatedLeagues = localLeagues.map((l) =>
              l.id === selectedLeagueId ? { ...l, departments: JSON.stringify(res.sectors) } : l
            );
            setLocalLeagues(updatedLeagues);
            setSectorSuccess(`Sector '${sectorName}' eliminado con éxito.`);
          } else {
            setSectorError(res.error);
          }
        });
      },
      "Eliminar",
      "Cancelar"
    );
  };

  // --- FILTROS DE PARTIDOS ---
  const [resultsStageFilter, setResultsStageFilter] = useState<string>("TODOS");
  const [resultsSearchTerm, setResultsSearchTerm] = useState<string>("");

  // --- ESTADOS LOCALES PARA CARGA DE RESULTADOS ---
  const [scores, setScores] = useState<Record<string, { home: string; away: string }>>(() => {
    const initial: Record<string, { home: string; away: string }> = {};
    initialMatches.forEach((m) => {
      initial[m.id] = {
        home: m.homeScore !== null ? m.homeScore.toString() : "",
        away: m.awayScore !== null ? m.awayScore.toString() : "",
      };
    });
    return initial;
  });

  const [extras, setExtras] = useState<Record<string, { home: string; away: string }>>(() => {
    const initial: Record<string, { home: string; away: string }> = {};
    initialMatches.forEach((m) => {
      initial[m.id] = {
        home: m.homeScoreExtra !== null ? m.homeScoreExtra.toString() : "",
        away: m.awayScoreExtra !== null ? m.awayScoreExtra.toString() : "",
      };
    });
    return initial;
  });

  const [penalties, setPenalties] = useState<Record<string, { home: string; away: string }>>(() => {
    const initial: Record<string, { home: string; away: string }> = {};
    initialMatches.forEach((m) => {
      initial[m.id] = {
        home: m.homeScorePenalties !== null ? m.homeScorePenalties.toString() : "",
        away: m.awayScorePenalties !== null ? m.awayScorePenalties.toString() : "",
      };
    });
    return initial;
  });

  const [winners, setWinners] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    initialMatches.forEach((m) => {
      initial[m.id] = m.winnerId || "";
    });
    return initial;
  });

  const [savingMatchMap, setSavingMatchMap] = useState<Record<string, boolean>>({});
  const [matchSuccessMap, setMatchSuccessMap] = useState<Record<string, boolean>>({});
  const [matchErrorMap, setMatchErrorMap] = useState<Record<string, string | null>>({});

  // --- ESTADOS PARA CREACIÓN DE LIGAS ---
  const [newLeagueName, setNewLeagueName] = useState("");
  const [newLeagueCode, setNewLeagueCode] = useState("");
  const [creatingLeague, setCreatingLeague] = useState(false);
  const [leagueSuccess, setLeagueSuccess] = useState<string | null>(null);
  const [leagueError, setLeagueError] = useState<string | null>(null);

  // --- ESTADOS PARA GESTIÓN DE ROLES DE USUARIOS ---
  const [updatingUserRoleMap, setUpdatingUserRoleMap] = useState<Record<string, boolean>>({});
  const [userRoleSuccessMap, setUserRoleSuccessMap] = useState<Record<string, boolean>>({});
  const [deletingUserMap, setDeletingUserMap] = useState<Record<string, boolean>>({});

  const [, startTransition] = useTransition();

  const handleAdminResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResetUser) return;
    if (!newResetPassword || newResetPassword.length < 6) {
      setResetError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setIsResetting(true);
    setResetError(null);
    setResetSuccess(null);

    startTransition(async () => {
      if (isDemo) {
        await new Promise((resolve) => setTimeout(resolve, 600));
        setIsResetting(false);
        setResetSuccess("Contraseña restablecida con éxito (Demo).");
        setTimeout(() => {
          setSelectedResetUser(null);
          setResetSuccess(null);
        }, 1500);
        return;
      }

      const res = await adminResetUserPassword(selectedResetUser.id, newResetPassword);
      setIsResetting(false);
      if (res.success) {
        setResetSuccess("Contraseña restablecida con éxito.");
        setTimeout(() => {
          setSelectedResetUser(null);
          setResetSuccess(null);
        }, 1500);
      } else {
        setResetError(res.error);
      }
    });
  };

  // --- HANDLERS PARA RESULTADOS ---
  const handleScoreChange = (matchId: string, team: "home" | "away", val: string) => {
    if (val !== "" && !/^\d+$/.test(val)) return;
    setScores((prev) => ({
      ...prev,
      [matchId]: { ...prev[matchId], [team]: val },
    }));
    setMatchSuccessMap((prev) => ({ ...prev, [matchId]: false }));
    setMatchErrorMap((prev) => ({ ...prev, [matchId]: null }));
  };

  const handleExtraChange = (matchId: string, team: "home" | "away", val: string) => {
    if (val !== "" && !/^\d+$/.test(val)) return;
    setExtras((prev) => ({
      ...prev,
      [matchId]: { ...prev[matchId], [team]: val },
    }));
    setMatchSuccessMap((prev) => ({ ...prev, [matchId]: false }));
  };

  const handlePenaltiesChange = (matchId: string, team: "home" | "away", val: string) => {
    if (val !== "" && !/^\d+$/.test(val)) return;
    setPenalties((prev) => ({
      ...prev,
      [matchId]: { ...prev[matchId], [team]: val },
    }));
    setMatchSuccessMap((prev) => ({ ...prev, [matchId]: false }));
  };

  const handleSaveMatchResult = (matchId: string) => {
    const score = scores[matchId];
    if (score.home === "" || score.away === "") {
      setMatchErrorMap((prev) => ({ ...prev, [matchId]: "Los goles del tiempo reglamentario son requeridos." }));
      return;
    }

    const homeVal = parseInt(score.home);
    const awayVal = parseInt(score.away);
    
    // Playoff checks
    const matchObj = matches.find((m) => m.id === matchId);
    const isPlayoff = matchObj?.stage !== "GROUPS";
    
    let winnerId = winners[matchId] || null;
    let homeExtra = extras[matchId].home ? parseInt(extras[matchId].home) : null;
    let awayExtra = extras[matchId].away ? parseInt(extras[matchId].away) : null;
    let homePen = penalties[matchId].home ? parseInt(penalties[matchId].home) : null;
    let awayPen = penalties[matchId].away ? parseInt(penalties[matchId].away) : null;

    if (isPlayoff) {
      // Si no es un empate, el ganador se setea automáticamente
      if (homeVal > awayVal) {
        winnerId = matchObj?.homeTeamId || null;
      } else if (awayVal > homeVal) {
        winnerId = matchObj?.awayTeamId || null;
      } else {
        // Si empataron en 90 min, verificar que se haya seleccionado ganador (o penales/extras)
        if (!winnerId) {
          setMatchErrorMap((prev) => ({ ...prev, [matchId]: "En empate de playoff, debés definir quién clasifica." }));
          return;
        }
      }
    } else {
      // En fase de grupos no hay clasificados / extras
      winnerId = null;
      homeExtra = null;
      awayExtra = null;
      homePen = null;
      awayPen = null;
    }

    setSavingMatchMap((prev) => ({ ...prev, [matchId]: true }));
    setMatchErrorMap((prev) => ({ ...prev, [matchId]: null }));

    startTransition(async () => {
      if (isDemo) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        setSavingMatchMap((prev) => ({ ...prev, [matchId]: false }));
        setMatchSuccessMap((prev) => ({ ...prev, [matchId]: true }));
        // Actualizar el estado local para reflejar que está finalizado
        setMatches((mPrev) =>
          mPrev.map((m) =>
            m.id === matchId
              ? {
                  ...m,
                  homeScore: homeVal,
                  awayScore: awayVal,
                  homeScoreExtra: homeExtra,
                  awayScoreExtra: awayExtra,
                  homeScorePenalties: homePen,
                  awayScorePenalties: awayPen,
                  winnerId,
                  status: MatchStatus.FINISHED,
                }
              : m
          )
        );
        return;
      }

      const res = await saveMatchResult(
        matchId,
        homeVal,
        awayVal,
        homeExtra,
        awayExtra,
        homePen,
        awayPen,
        winnerId,
        MatchStatus.FINISHED
      );

      setSavingMatchMap((prev) => ({ ...prev, [matchId]: false }));

      if (res.success) {
        setMatchSuccessMap((prev) => ({ ...prev, [matchId]: true }));
        setMatches((mPrev) =>
          mPrev.map((m) =>
            m.id === matchId
              ? {
                  ...m,
                  homeScore: homeVal,
                  awayScore: awayVal,
                  homeScoreExtra: homeExtra,
                  awayScoreExtra: awayExtra,
                  homeScorePenalties: homePen,
                  awayScorePenalties: awayPen,
                  winnerId,
                  status: MatchStatus.FINISHED,
                }
              : m
          )
        );
      } else {
        setMatchErrorMap((prev) => ({ ...prev, [matchId]: res.error }));
      }
    });
  };

  // --- HANDLER CREACIÓN DE LIGA ---
  const handleCreateLeague = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeagueName || !newLeagueCode) {
      setLeagueError("Todos los campos son requeridos.");
      return;
    }

    setCreatingLeague(true);
    setLeagueSuccess(null);
    setLeagueError(null);

    startTransition(async () => {
      if (isDemo) {
        await new Promise((resolve) => setTimeout(resolve, 600));
        setCreatingLeague(false);
        setLeagueSuccess(`Liga creada exitosamente en modo demostración.`);
        setNewLeagueName("");
        setNewLeagueCode("");
        return;
      }

      const res = await createNewLeague(newLeagueName, newLeagueCode);
      setCreatingLeague(false);
      if (res.success) {
        setLeagueSuccess(`Liga '${newLeagueName}' creada con éxito.`);
        setNewLeagueName("");
        setNewLeagueCode("");
      } else {
        setLeagueError(res.error);
      }
    });
  };

  // --- HANDLER CAMBIO DE ROL USUARIO ---
  const handleUpdateRole = (targetUserId: string, newRole: Role) => {
    setUpdatingUserRoleMap((prev) => ({ ...prev, [targetUserId]: true }));
    setUserRoleSuccessMap((prev) => ({ ...prev, [targetUserId]: false }));

    startTransition(async () => {
      if (isDemo) {
        await new Promise((resolve) => setTimeout(resolve, 600));
        setUpdatingUserRoleMap((prev) => ({ ...prev, [targetUserId]: false }));
        setUserRoleSuccessMap((prev) => ({ ...prev, [targetUserId]: true }));
        return;
      }

      const res = await updateUserRole(targetUserId, newRole);
      setUpdatingUserRoleMap((prev) => ({ ...prev, [targetUserId]: false }));
      if (res.success) {
        setUserRoleSuccessMap((prev) => ({ ...prev, [targetUserId]: true }));
      } else {
        triggerAlert("Error de Rol", res.error || "Ocurrió un error al actualizar el rol", "error");
      }
    });
  };

  // --- HANDLER CAMBIO DE ROL DE LIGA ---
  const handleToggleLeagueRole = (targetUserId: string, newRole: LeagueRole, customLeagueId?: string) => {
    const leagueId = customLeagueId || viewingLeagueUsers?.id;
    if (!leagueId) return;

    setUpdatingUserRoleMap((prev) => ({ ...prev, [targetUserId]: true }));
    setUserRoleSuccessMap((prev) => ({ ...prev, [targetUserId]: false }));

    startTransition(async () => {
      if (isDemo) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        setUpdatingUserRoleMap((prev) => ({ ...prev, [targetUserId]: false }));
        setUserRoleSuccessMap((prev) => ({ ...prev, [targetUserId]: true }));
        const user = users.find((u) => u.id === targetUserId);
        const m = user?.memberships.find((memb) => memb.league.id === leagueId);
        if (m) m.role = newRole;
        setLocalLeagues([...localLeagues]);
        return;
      }

      const res = await updateUserLeagueRole(targetUserId, leagueId, newRole);
      setUpdatingUserRoleMap((prev) => ({ ...prev, [targetUserId]: false }));
      if (res.success) {
        setUserRoleSuccessMap((prev) => ({ ...prev, [targetUserId]: true }));
      } else {
        triggerAlert("Error de Rol de Liga", res.error || "Ocurrió un error al actualizar el rol", "error");
      }
    });
  };

  // --- HANDLER ELIMINACIÓN DE USUARIO ---
  const handleDeleteUser = (targetUserId: string, name: string) => {
    triggerConfirm(
      "¿Eliminar Usuario?",
      `¿Estás seguro de que querés eliminar permanentemente al usuario "${name}"?\nEsta acción borrará todas sus predicciones y no se puede deshacer.`,
      () => {
        setDeletingUserMap((prev) => ({ ...prev, [targetUserId]: true }));

        startTransition(async () => {
          if (isDemo) {
            await new Promise((resolve) => setTimeout(resolve, 600));
            setDeletingUserMap((prev) => ({ ...prev, [targetUserId]: false }));
            triggerAlert("Usuario Eliminado (Demo)", "Usuario eliminado con éxito (Simulación en modo Demo).", "success");
            return;
          }

          const res = await deleteUser(targetUserId);
          setDeletingUserMap((prev) => ({ ...prev, [targetUserId]: false }));
          if (!res.success) {
            triggerAlert("Error al Eliminar", res.error || "Ocurrió un error al eliminar el usuario", "error");
          }
        });
      },
      "Eliminar",
      "Cancelar"
    );
  };

  // --- DESCARGAS EXPORTES ---
  const handleDownload = (type: string, format: string, leagueId?: string) => {
    let url = `/api/admin/export?type=${type}&format=${format}`;
    if (leagueId) url += `&leagueId=${leagueId}`;

    // Descargar abriendo en una nueva pestaña (el navegador forzará la descarga por la cabecera content-disposition)
    window.open(url, "_blank");
  };

  // Filtrado de partidos
  const filteredMatches = matches.filter((m) => {
    if (resultsStageFilter !== "TODOS") {
      if (resultsStageFilter === "GROUPS" && m.stage !== "GROUPS") return false;
      if (resultsStageFilter === "PLAYOFFS" && m.stage === "GROUPS") return false;
    }

    if (resultsSearchTerm.trim() !== "") {
      const search = resultsSearchTerm.toLowerCase();
      const homeName = m.homeTeam?.name.toLowerCase() || m.homeTeamPlaceholder?.toLowerCase() || "";
      const awayName = m.awayTeam?.name.toLowerCase() || m.awayTeamPlaceholder?.toLowerCase() || "";
      if (!homeName.includes(search) && !awayName.includes(search)) return false;
    }

    return true;
  });

  // Filtrado de usuarios de liga seleccionada
  const filteredLeagueUsers = viewingLeagueUsers
    ? users
        .filter((u) => u.memberships.some((m) => m.league.id === viewingLeagueUsers.id))
        .map((u) => {
          const membership = u.memberships.find((m) => m.league.id === viewingLeagueUsers.id);
          return {
            id: u.id,
            name: u.name,
            email: u.email,
            department: membership?.department || "PENDIENTE",
            role: membership?.role || "MEMBER",
          };
        })
        .filter((u) => {
          const search = userSearchTerm.trim().toLowerCase();
          if (search === "") return true;
          return (
            (u.name?.toLowerCase().includes(search) || false) ||
            u.email.toLowerCase().includes(search) ||
            u.department.toLowerCase().includes(search)
          );
        })
    : [];

  return (
    <div className="space-y-6">
      {/* Cabecera Admin */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Panel de <span className="text-gradient">Administración</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Cargá marcadores, creá ligas, administrá accesos y exportá auditorías.
          </p>
        </div>
      </div>

      {isDemo && (
        <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <div>
            <span className="font-bold">Modo Demostración Activo:</span> El panel está en modo simulación. Podés probar la interacción (guardar resultados, crear ligas, cambiar roles) pero los cambios no se guardarán permanentemente en la base de datos.
          </div>
        </div>
      )}

      {/* --- MENU DE NAVEGACION DE ADMIN --- */}
      <div className="flex border-b border-border overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab("results")}
          className={`px-5 py-3 text-sm font-semibold tracking-wider transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
            activeTab === "results"
              ? "border-b-2 border-primary text-primary font-bold"
              : "text-slate-400 hover:text-foreground"
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          Cargar Marcadores
        </button>
        <button
          onClick={() => setActiveTab("leagues")}
          className={`px-5 py-3 text-sm font-semibold tracking-wider transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
            activeTab === "leagues"
              ? "border-b-2 border-primary text-primary font-bold"
              : "text-slate-400 hover:text-foreground"
          }`}
        >
          <Trophy className="w-4 h-4" />
          Gestión de Ligas
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`px-5 py-3 text-sm font-semibold tracking-wider transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
            activeTab === "users"
              ? "border-b-2 border-primary text-primary font-bold"
              : "text-slate-400 hover:text-foreground"
          }`}
        >
          <Users className="w-4 h-4" />
          Gestión de Usuarios
        </button>
        <button
          onClick={() => setActiveTab("exports")}
          className={`px-5 py-3 text-sm font-semibold tracking-wider transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
            activeTab === "exports"
              ? "border-b-2 border-primary text-primary font-bold"
              : "text-slate-400 hover:text-foreground"
          }`}
        >
          <FileText className="w-4 h-4" />
          Exportes y Auditoría
        </button>
        <button
          onClick={() => setActiveTab("sectors")}
          className={`px-5 py-3 text-sm font-semibold tracking-wider transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
            activeTab === "sectors"
              ? "border-b-2 border-primary text-primary font-bold"
              : "text-slate-400 hover:text-foreground"
          }`}
        >
          <Settings className="w-4 h-4" />
          Gestión de Sectores
        </button>
      </div>

      {/* --- CONTENIDO DE CADA PESTAÑA --- */}

      {/* TAB 1: CARGAR RESULTADOS DE PARTIDOS */}
      {activeTab === "results" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900/30 border border-border flex flex-col md:flex-row items-center gap-4">
            <div className="relative w-full md:flex-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={resultsSearchTerm}
                onChange={(e) => setResultsSearchTerm(e.target.value)}
                placeholder="Buscar partido por selección..."
                className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-border focus:border-primary rounded-xl text-foreground text-xs outline-none"
              />
            </div>

            <div className="w-full md:w-48">
              <select
                value={resultsStageFilter}
                onChange={(e) => setResultsStageFilter(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-border focus:border-primary rounded-xl text-foreground text-xs outline-none cursor-pointer"
              >
                <option value="TODOS">Todas las fases</option>
                <option value="GROUPS">Fase de Grupos</option>
                <option value="PLAYOFFS">Fases Eliminatorias</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {filteredMatches.map((match) => {
              const score = scores[match.id];
              const extra = extras[match.id];
              const penalty = penalties[match.id];
              const winnerId = winners[match.id];
              
              const isSaving = savingMatchMap[match.id];
              const success = matchSuccessMap[match.id];
              const error = matchErrorMap[match.id];
              
              const isPlayoff = match.stage !== "GROUPS";
              const isFinished = match.status === "FINISHED";
              const isTie = score.home !== "" && score.away !== "" && parseInt(score.home) === parseInt(score.away);

              return (
                <div
                  key={match.id}
                  className={`glass-panel border rounded-2xl p-5 shadow-md flex flex-col justify-between transition-all ${
                    isFinished
                      ? "border-emerald-500/20 bg-emerald-500/[0.01]"
                      : "border-border hover:border-slate-800"
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-3 border-b border-border/40 pb-2 uppercase tracking-wider">
                    <span>
                      {match.stage === "GROUPS" ? `Grupo ${match.group}` : match.stage.replace("_", " ")}
                    </span>
                    <span className={isFinished ? "text-emerald-500 font-bold" : "text-amber-500 font-bold"}>
                      {isFinished ? "Finalizado" : "Programado"}
                    </span>
                  </div>

                  {/* Carga de Goles Reglamentarios */}
                  <div className="grid grid-cols-7 items-center gap-2 py-2">
                    {/* Local */}
                    <div className="col-span-2 text-center flex flex-col items-center gap-1 min-w-0">
                      <span className="font-extrabold text-sm text-foreground truncate max-w-full">
                        {match.homeTeam?.name || match.homeTeamPlaceholder}
                      </span>
                      <span className="text-[10px] text-slate-500 uppercase">{match.homeTeam?.code || "---"}</span>
                    </div>

                    {/* Input local */}
                    <div className="col-span-1 flex justify-center">
                      <input
                        type="text"
                        value={score.home}
                        onChange={(e) => handleScoreChange(match.id, "home", e.target.value)}
                        placeholder="-"
                        className="w-10 h-10 text-center font-extrabold text-base bg-slate-950 border border-border rounded-xl focus:border-primary outline-none"
                      />
                    </div>

                    {/* vs */}
                    <div className="col-span-1 text-center text-slate-500 font-semibold text-xs">vs</div>

                    {/* Input visitante */}
                    <div className="col-span-1 flex justify-center">
                      <input
                        type="text"
                        value={score.away}
                        onChange={(e) => handleScoreChange(match.id, "away", e.target.value)}
                        placeholder="-"
                        className="w-10 h-10 text-center font-extrabold text-base bg-slate-950 border border-border rounded-xl focus:border-primary outline-none"
                      />
                    </div>

                    {/* Visitante */}
                    <div className="col-span-2 text-center flex flex-col items-center gap-1 min-w-0">
                      <span className="font-extrabold text-sm text-foreground truncate max-w-full">
                        {match.awayTeam?.name || match.awayTeamPlaceholder}
                      </span>
                      <span className="text-[10px] text-slate-500 uppercase">{match.awayTeam?.code || "---"}</span>
                    </div>
                  </div>

                  {/* Panel de Playoff (Extras, Penales y Ganador) */}
                  {isPlayoff && (
                    <div className="mt-3 p-3 bg-slate-950/40 rounded-xl border border-border/40 space-y-3">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center border-b border-border/30 pb-1">
                        Detalles de Prórroga / Penales
                      </div>

                      {/* Suplementario */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Goles Prórroga:</span>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={extra.home}
                            onChange={(e) => handleExtraChange(match.id, "home", e.target.value)}
                            placeholder="L"
                            className="w-8 h-8 text-center bg-slate-950 border border-border rounded-lg text-xs outline-none"
                          />
                          <span className="text-slate-600">-</span>
                          <input
                            type="text"
                            value={extra.away}
                            onChange={(e) => handleExtraChange(match.id, "away", e.target.value)}
                            placeholder="V"
                            className="w-8 h-8 text-center bg-slate-950 border border-border rounded-lg text-xs outline-none"
                          />
                        </div>
                      </div>

                      {/* Penales */}
                      {isTie && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">Tanda de Penales:</span>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={penalty.home}
                              onChange={(e) => handlePenaltiesChange(match.id, "home", e.target.value)}
                              placeholder="L"
                              className="w-8 h-8 text-center bg-slate-950 border border-border rounded-lg text-xs outline-none"
                            />
                            <span className="text-slate-600">-</span>
                            <input
                              type="text"
                              value={penalty.away}
                              onChange={(e) => handlePenaltiesChange(match.id, "away", e.target.value)}
                              placeholder="V"
                              className="w-8 h-8 text-center bg-slate-950 border border-border rounded-lg text-xs outline-none"
                            />
                          </div>
                        </div>
                      )}

                      {/* Selección del clasificado */}
                      <div className="flex items-center justify-between text-xs">
                        <label htmlFor={`winner-${match.id}`} className="text-slate-400">Clasificado:</label>
                        <select
                          id={`winner-${match.id}`}
                          value={winnerId}
                          onChange={(e) => {
                            setWinners((prev) => ({ ...prev, [match.id]: e.target.value }));
                            setMatchSuccessMap((prev) => ({ ...prev, [match.id]: false }));
                          }}
                          className="px-2 py-1 bg-slate-950 border border-border rounded-lg text-xs outline-none cursor-pointer"
                        >
                          <option value="">Seleccionar clasificado</option>
                          {match.homeTeamId && (
                            <option value={match.homeTeamId}>
                              {match.homeTeam?.name || "Local"}
                            </option>
                          )}
                          {match.awayTeamId && (
                            <option value={match.awayTeamId}>
                              {match.awayTeam?.name || "Visitante"}
                            </option>
                          )}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Acciones */}
                  <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between min-h-[38px]">
                    <span className="text-[10px] text-slate-500">
                      {match.stadium.name}
                    </span>

                    <div className="flex items-center gap-2">
                      {error && <span className="text-[10px] text-red-400 max-w-[120px] text-right truncate">{error}</span>}
                      
                      <button
                        onClick={() => handleSaveMatchResult(match.id)}
                        disabled={isSaving}
                        className={`px-5 py-2.5 text-[10px] font-extrabold uppercase tracking-wider cursor-pointer transition-all ${
                          success
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full"
                            : "btn-premium"
                        }`}
                      >
                        {isSaving ? (
                          <div className="w-3.5 h-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                        ) : success ? (
                          <span className="flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Guardado
                          </span>
                        ) : (
                          "Guardar Marcador"
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: GESTION DE LIGAS (CREACIÓN) */}
      {activeTab === "leagues" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulario de creación */}
          <div className="lg:col-span-1 glass-panel rounded-2xl p-6 border border-border shadow-lg">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-foreground">
              <PlusCircle className="w-5 h-5 text-primary" />
              Crear Nueva Liga
            </h3>

            {leagueError && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {leagueError}
              </div>
            )}

            {leagueSuccess && (
              <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs">
                {leagueSuccess}
              </div>
            )}

            <form onSubmit={handleCreateLeague} className="space-y-4">
              <div>
                <label htmlFor="leagueName" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Nombre de la Liga / Grupo
                </label>
                <input
                  id="leagueName"
                  type="text"
                  required
                  value={newLeagueName}
                  onChange={(e) => {
                    setNewLeagueName(e.target.value);
                    setLeagueSuccess(null);
                    setLeagueError(null);
                  }}
                  placeholder="Ej: Amigos del Gym, Club Social"
                  className="w-full px-3 py-2.5 bg-slate-950 border border-border focus:border-primary rounded-xl text-sm text-foreground placeholder-slate-500 outline-none"
                />
              </div>

              <div>
                <label htmlFor="leagueCode" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Código de Invitación Único
                </label>
                <input
                  id="leagueCode"
                  type="text"
                  required
                  value={newLeagueCode}
                  onChange={(e) => {
                    setNewLeagueCode(e.target.value.toUpperCase());
                    setLeagueSuccess(null);
                    setLeagueError(null);
                  }}
                  placeholder="Ej: GYM2026"
                  className="w-full px-3 py-2.5 bg-slate-950 border border-border focus:border-primary rounded-xl text-sm text-foreground placeholder-slate-500 outline-none uppercase"
                />
              </div>

              <button
                type="submit"
                disabled={creatingLeague}
                className="w-full py-3 btn-premium"
              >
                {creatingLeague ? "Creando..." : "Crear Liga"}
              </button>
            </form>
          </div>

          {/* Listado de ligas */}
          <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-border shadow-lg">
            <h3 className="font-bold text-lg mb-4 text-foreground flex items-center gap-2">
              <Trophy className="w-5 h-5 text-gold" />
              Ligas Registradas
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border/80 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-2">Nombre</th>
                    <th className="py-3 px-2">Código</th>
                    <th className="py-3 px-2 text-center">Miembros</th>
                    <th className="py-3 px-2">Alias / Importe de Transferencia</th>
                    <th className="py-3 px-2 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {localLeagues.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-900/10">
                      <td className="py-3.5 px-2 font-semibold text-foreground">
                        {editingLeagueId === l.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={editingLeagueName}
                              onChange={(e) => setEditingLeagueName(e.target.value)}
                              disabled={savingLeagueName}
                              className="px-2 py-1 bg-slate-950 border border-border/60 focus:border-primary rounded-lg text-xs text-foreground outline-none w-44 transition-all"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveLeagueName(l.id)}
                              disabled={savingLeagueName}
                              className="p-1 text-emerald-400 hover:text-emerald-300 disabled:opacity-50 cursor-pointer"
                              title="Guardar"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingLeagueId(null);
                                setEditingLeagueName("");
                              }}
                              disabled={savingLeagueName}
                              className="p-1 text-rose-400 hover:text-rose-300 cursor-pointer"
                              title="Cancelar"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 group">
                            <span>{l.name}</span>
                            <button
                              onClick={() => {
                                setEditingLeagueId(l.id);
                                setEditingLeagueName(l.name);
                              }}
                              className="p-1 text-slate-500 hover:text-foreground opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity cursor-pointer"
                              title="Editar nombre"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-2 text-slate-400 font-mono tracking-wider">{l.inviteCode}</td>
                      <td className="py-3.5 px-2 text-center font-bold text-primary">{l.membershipsCount}</td>
                      <td className="py-3.5 px-2">
                        <LeagueTransferInfoCell
                          leagueId={l.id}
                          initialAlias={l.transferAlias || ""}
                          initialAmount={l.transferAmount}
                          initialAccountName={l.transferAccountName || ""}
                          initialPhone={l.transferPhone || ""}
                          initialRequiresPayment={l.requiresPayment}
                          isDemo={isDemo}
                          onError={(err) => triggerAlert("Error al Guardar", err, "error")}
                        />
                      </td>
                      <td className="py-3.5 px-2 text-center">
                        <button
                          onClick={() => setViewingLeagueUsers({ id: l.id, name: l.name })}
                          className="px-2.5 py-1 text-[10px] font-bold rounded-full btn-premium-secondary border border-border/40 hover:border-slate-600 transition-all cursor-pointer inline-flex items-center gap-1.5"
                          title="Ver usuarios registrados"
                        >
                          <Users className="w-3 h-3" />
                          <span>Usuarios</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GESTIÓN DE ROLES DE USUARIOS */}
      {activeTab === "users" && (
        <div className="glass-panel rounded-2xl p-6 border border-border shadow-lg space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-primary" />
                Control de Acceso y Fases de Usuarios
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Configurá en qué fases de la liga puede participar activamente cada usuario.
              </p>
            </div>

            {/* Selector de Liga */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 whitespace-nowrap">Seleccionar Liga:</span>
              <select
                value={usersLeagueId}
                onChange={(e) => {
                  setUsersLeagueId(e.target.value);
                  setSelectedUserIds({}); // Limpiar seleccionados al cambiar de liga
                }}
                className="bg-slate-900 border border-border text-foreground px-3 py-1.5 rounded-xl text-xs focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer"
              >
                <option value="ALL">Todas las ligas (Global)</option>
                {localLeagues.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.inviteCode})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Acciones Masivas */}
          {usersLeagueId !== "ALL" && filteredUsers.length > 0 && (
            <div className="p-4 rounded-xl bg-slate-900/30 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <span className="text-xs text-slate-300 font-medium">
                {Object.values(selectedUserIds).filter(Boolean).length} usuarios seleccionados
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleBulkPhaseUpdate(2, true)}
                  disabled={!phase1Finished || updatingBulk || Object.values(selectedUserIds).filter(Boolean).length === 0}
                  title={!phase1Finished ? "Se habilita al finalizar la Fase 1" : undefined}
                  className="px-3 py-1.5 bg-primary/20 text-primary border border-primary/30 text-xs font-bold rounded-lg hover:bg-primary/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  Habilitar Fase 2
                </button>
                <button
                  onClick={() => handleBulkPhaseUpdate(2, false)}
                  disabled={!phase1Finished || updatingBulk || Object.values(selectedUserIds).filter(Boolean).length === 0}
                  title={!phase1Finished ? "Se habilita al finalizar la Fase 1" : undefined}
                  className="px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-bold rounded-lg hover:bg-red-500/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  Deshabilitar Fase 2
                </button>
                <button
                  onClick={() => handleBulkPhaseUpdate(3, true)}
                  disabled={!phase2Finished || updatingBulk || Object.values(selectedUserIds).filter(Boolean).length === 0}
                  title={!phase2Finished ? "Se habilita al finalizar la Fase 2" : undefined}
                  className="px-3 py-1.5 bg-primary/20 text-primary border border-primary/30 text-xs font-bold rounded-lg hover:bg-primary/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  Habilitar Fase 3
                </button>
                <button
                  onClick={() => handleBulkPhaseUpdate(3, false)}
                  disabled={!phase2Finished || updatingBulk || Object.values(selectedUserIds).filter(Boolean).length === 0}
                  title={!phase2Finished ? "Se habilita al finalizar la Fase 2" : undefined}
                  className="px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-bold rounded-lg hover:bg-red-500/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  Deshabilitar Fase 3
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border/80 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {usersLeagueId !== "ALL" && (
                    <th className="py-3 px-3 w-10">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                      />
                    </th>
                  )}
                  <th className="py-3 px-3">Nombre</th>
                  <th className="py-3 px-3">Email</th>
                  <th className="py-3 px-3">Sector</th>
                  {usersLeagueId !== "ALL" ? (
                    <>
                      <th className="py-3 px-3 text-center">Fase 1 (Grupos)</th>
                      <th className="py-3 px-3 text-center">Fase 2 (16vos/8vos)</th>
                      <th className="py-3 px-3 text-center">Fase 3 (Finales)</th>
                      <th className="py-3 px-3 text-center">Pago</th>
                    </>
                  ) : (
                    <th className="py-3 px-3">Liga</th>
                  )}
                  <th className="py-3 px-3 text-center">Contraseña</th>
                  <th className="py-3 px-3 text-right">Rol / Acceso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredUsers.map((u) => {
                  const m = usersLeagueId === "ALL" 
                    ? u.memberships[0] 
                    : u.memberships.find((memb) => memb.league.id === usersLeagueId);

                  const isUpdatingRole = updatingUserRoleMap[u.id];
                  const successRole = userRoleSuccessMap[u.id];
                  const isChecked = !!selectedUserIds[u.id];

                  return (
                    <tr key={u.id} className="hover:bg-slate-900/10">
                      {usersLeagueId !== "ALL" && (
                        <td className="py-3.5 px-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              setSelectedUserIds((prev) => ({
                                ...prev,
                                [u.id]: e.target.checked,
                              }));
                            }}
                            className="rounded border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                          />
                        </td>
                      )}
                      <td className="py-3.5 px-3 font-semibold text-foreground">{u.name || "Sin nombre"}</td>
                      <td className="py-3.5 px-3 text-slate-400">{u.email}</td>
                      <td className="py-3.5 px-3 text-slate-400">{m?.department || "Ninguno"}</td>
                      
                      {usersLeagueId !== "ALL" ? (
                        <>
                          <td className="py-3.5 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={m?.activePhase1 ?? true}
                              disabled={updatingPhaseMap[`${u.id}-1`]}
                              onChange={() => handleTogglePhase(u.id, 1, m?.activePhase1 ?? true)}
                              className="rounded border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer disabled:opacity-50"
                            />
                          </td>
                          <td className="py-3.5 px-3 text-center" title={!phase1Finished ? "Se habilita al finalizar la Fase 1" : undefined}>
                            <input
                              type="checkbox"
                              checked={m?.activePhase2 ?? false}
                              disabled={!phase1Finished || updatingPhaseMap[`${u.id}-2`]}
                              onChange={() => handleTogglePhase(u.id, 2, m?.activePhase2 ?? false)}
                              className="rounded border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            />
                          </td>
                          <td className="py-3.5 px-3 text-center" title={!phase2Finished ? "Se habilita al finalizar la Fase 2" : undefined}>
                            <input
                              type="checkbox"
                              checked={m?.activePhase3 ?? false}
                              disabled={!phase2Finished || updatingPhaseMap[`${u.id}-3`]}
                              onChange={() => handleTogglePhase(u.id, 3, m?.activePhase3 ?? false)}
                              className="rounded border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            />
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            <button
                              onClick={() => handleTogglePayment(u.id, m?.hasPaid ?? false)}
                              disabled={updatingPaymentMap[u.id]}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
                                m?.hasPaid
                                  ? "bg-green-500/15 text-green-400 border-green-500/20 hover:bg-green-500/25"
                                  : "bg-amber-500/15 text-amber-400 border-amber-500/20 hover:bg-amber-500/25"
                              }`}
                            >
                              {m?.hasPaid ? "Confirmado" : "Pendiente"}
                            </button>
                          </td>
                        </>
                      ) : (
                        <td className="py-3.5 px-3 text-slate-400">{m?.league?.name || "Ninguna"}</td>
                      )}

                      <td className="py-3.5 px-3 text-center">
                        <button
                          onClick={() => {
                            setSelectedResetUser({ id: u.id, name: u.name || u.email });
                            setNewResetPassword("");
                            setResetError(null);
                            setResetSuccess(null);
                          }}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-foreground rounded-lg border border-border/40 cursor-pointer transition-all flex items-center justify-center mx-auto"
                          title="Restablecer contraseña"
                        >
                          <Key className="w-3.5 h-3.5" />
                        </button>
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-3">
                          {successRole && <Check className="w-4 h-4 text-primary" />}
                          {usersLeagueId === "ALL" ? (
                            <select
                              disabled={isUpdatingRole}
                              value={u.role}
                              onChange={(e) => handleUpdateRole(u.id, e.target.value as Role)}
                              className="px-2 py-1 bg-slate-950 border border-border focus:border-primary rounded-lg text-xs outline-none cursor-pointer"
                            >
                              <option value="USER">USER (Jugador)</option>
                              <option value="ADMIN">ADMIN (Administrador)</option>
                            </select>
                          ) : (
                            <select
                              disabled={isUpdatingRole}
                              value={m?.role || "MEMBER"}
                              onChange={(e) => handleToggleLeagueRole(u.id, e.target.value as LeagueRole, usersLeagueId)}
                              className="px-2 py-1 bg-slate-950 border border-border focus:border-primary rounded-lg text-xs outline-none cursor-pointer"
                            >
                              <option value="MEMBER">Jugador</option>
                              <option value="COLLABORATOR">Colaborador</option>
                              <option value="ADMIN">Admin Liga</option>
                              <option value="OWNER">Owner Liga</option>
                            </select>
                          )}
                          <button
                            disabled={deletingUserMap[u.id]}
                            onClick={() => handleDeleteUser(u.id, u.name || u.email)}
                            className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/20 cursor-pointer transition-all disabled:opacity-50 flex items-center justify-center"
                            title="Eliminar usuario permanentemente"
                          >
                            {deletingUserMap[u.id] ? (
                              <div className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}


      {/* TAB 4: EXPORTACIONES Y AUDITORÍA LOGS */}
      {activeTab === "exports" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Botones de Descargas */}
          <div className="lg:col-span-1 space-y-6">
            {/* Ligas Clasificación */}
            <div className="glass-panel rounded-2xl p-5 border border-border shadow-md space-y-4">
              <h4 className="font-bold text-sm text-foreground uppercase tracking-wider">
                Exportar Rankings de Ligas
              </h4>
              
              <div className="space-y-3">
                {leagues.map((l) => (
                  <div key={l.id} className="p-3 bg-slate-950/40 rounded-xl border border-border/40 flex items-center justify-between gap-3 text-xs">
                    <span className="font-semibold text-slate-300 truncate">{l.name}</span>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => handleDownload("rankings", "csv", l.id)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-border cursor-pointer transition-all"
                        title="Descargar CSV"
                      >
                        CSV
                      </button>
                      <button
                        onClick={() => handleDownload("rankings", "xlsx", l.id)}
                        className="p-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded cursor-pointer transition-all"
                        title="Descargar Excel (.xlsx)"
                      >
                        Excel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sábana de Auditoría General */}
            <div className="glass-panel rounded-2xl p-5 border border-border shadow-md space-y-4">
              <h4 className="font-bold text-sm text-foreground uppercase tracking-wider">
                Auditoría de Pronósticos
              </h4>
              <p className="text-xs text-slate-400">
                Descargá la sábana completa con todos los pronósticos de todos los usuarios del sistema para control administrativo y auditoría manual.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => handleDownload("predictions", "csv")}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-border rounded-xl text-xs font-semibold cursor-pointer transition-all"
                >
                  <Download className="w-4 h-4" /> CSV
                </button>
                <button
                  onClick={() => handleDownload("predictions", "xlsx")}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl text-xs font-bold cursor-pointer transition-all"
                >
                  <Download className="w-4 h-4" /> Excel (XLSX)
                </button>
              </div>
            </div>
          </div>

          {/* Historial de Auditoría Logs */}
          <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-border shadow-lg">
            <h3 className="font-bold text-lg mb-4 text-foreground flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Historial de Auditoría Reciente
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/80 font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5 px-2">Fecha</th>
                    <th className="py-2.5 px-2">Administrador</th>
                    <th className="py-2.5 px-2">Acción</th>
                    <th className="py-2.5 px-2">Detalles</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30 text-slate-300">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-900/5">
                      <td className="py-3 px-2 text-slate-500 whitespace-nowrap">
                        {log.createdAt.toLocaleDateString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="py-3 px-2 font-semibold">{log.user.name || log.user.email}</td>
                      <td className="py-3 px-2">
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-bold text-slate-400 border border-border/30">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-2 max-w-[200px] truncate" title={log.details}>
                        {log.details}
                      </td>
                    </tr>
                  ))}

                  {auditLogs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-500 italic">
                        No hay registros de auditoría aún.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "sectors" && (
        <div className="glass-panel rounded-2xl p-6 border border-border shadow-lg space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                Gestión de Sectores por Liga
              </h3>
              <p className="text-xs text-slate-400">
                Agregá o eliminá los sectores o departamentos disponibles para los usuarios de cada liga.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 whitespace-nowrap">Seleccionar Liga:</span>
              <select
                value={selectedLeagueId}
                onChange={(e) => {
                  setSelectedLeagueId(e.target.value);
                  setSectorSuccess(null);
                  setSectorError(null);
                }}
                className="bg-slate-900 border border-border text-foreground px-3 py-1.5 rounded-xl text-xs focus:ring-1 focus:ring-primary focus:outline-none"
              >
                {localLeagues.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.inviteCode})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {sectorSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-center gap-2">
              <Check className="w-4 h-4 flex-shrink-0" />
              {sectorSuccess}
            </div>
          )}

          {sectorError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {sectorError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Formulario Agregar */}
            <div className="space-y-4 bg-slate-950/20 p-5 rounded-2xl border border-border/40">
              <h4 className="font-bold text-sm text-foreground uppercase tracking-wider">
                Nuevo Sector
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-slate-400 text-xs mb-1.5 font-medium">
                    Nombre del Sector / Departamento
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Recursos Humanos, Ventas, etc."
                    value={newSectorName}
                    onChange={(e) => setNewSectorName(e.target.value)}
                    className="w-full bg-slate-900 border border-border text-foreground px-4 py-2.5 rounded-xl text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>

                <button
                  onClick={handleAddSector}
                  disabled={loadingSector || !newSectorName.trim()}
                  className="w-full flex items-center justify-center gap-2 py-3 btn-premium text-xs"
                >
                  <PlusCircle className="w-4 h-4" />
                  {loadingSector ? "Agregando..." : "Agregar Sector"}
                </button>
              </div>
            </div>

            {/* Lista de Sectores */}
            <div className="space-y-4 bg-slate-950/20 p-5 rounded-2xl border border-border/40">
              <h4 className="font-bold text-sm text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>Sectores Existentes</span>
                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">
                  {getSelectedLeagueSectors().length} totales
                </span>
              </h4>

              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {getSelectedLeagueSectors().map((sector, index) => (
                  <div
                    key={index}
                    className="p-3 bg-slate-900/60 border border-border/40 rounded-xl flex items-center justify-between gap-3"
                  >
                    <span className="text-xs font-semibold text-foreground">{sector}</span>
                    <button
                      onClick={() => handleDeleteSector(sector)}
                      disabled={loadingSector}
                      className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded cursor-pointer transition-all border border-transparent hover:border-rose-500/20"
                      title="Eliminar Sector"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {getSelectedLeagueSectors().length === 0 && (
                  <div className="py-8 text-center text-slate-500 italic text-xs">
                    Esta liga no tiene sectores configurados.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Restablecer Contraseña por Admin */}
      {selectedResetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm glass-panel border border-border rounded-2xl shadow-2xl p-6 relative">
            <button
              onClick={() => {
                setSelectedResetUser(null);
                setResetError(null);
                setResetSuccess(null);
              }}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-foreground rounded-lg hover:bg-slate-800/50 transition-all outline-none"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary">
                <Key className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">Restablecer Contraseña</h3>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Estás restableciendo la contraseña de <strong className="text-slate-200">{selectedResetUser.name}</strong>.
            </p>

            {resetError && (
              <div className="mb-4 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center font-semibold">
                {resetError}
              </div>
            )}

            {resetSuccess && (
              <div className="mb-4 p-2.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs text-center font-semibold">
                {resetSuccess}
              </div>
            )}

            <form onSubmit={handleAdminResetPassword} className="space-y-4">
              <div>
                <label htmlFor="adminNewPassword" className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Nueva Contraseña (mín. 6 caracteres)
                </label>
                <input
                  id="adminNewPassword"
                  type="password"
                  required
                  value={newResetPassword}
                  onChange={(e) => setNewResetPassword(e.target.value)}
                  placeholder="Ej: Macena2026!"
                  className="w-full px-3 py-2 bg-slate-900/50 hover:bg-slate-900 border border-border focus:border-primary rounded-xl text-foreground placeholder-slate-500 transition-all text-sm outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isResetting || !newResetPassword}
                className="w-full py-2.5 bg-primary hover:bg-primary-hover text-primary-foreground font-bold rounded-xl transition-all shadow text-xs cursor-pointer disabled:opacity-50"
              >
                {isResetting ? "Restableciendo..." : "Guardar Contraseña"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Ver Usuarios de la Liga */}
      {viewingLeagueUsers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg glass-panel border border-border rounded-2xl shadow-2xl p-6 relative max-h-[80vh] flex flex-col">
            {/* Close Button */}
            <button
              onClick={() => {
                setViewingLeagueUsers(null);
                setUserSearchTerm("");
              }}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-foreground rounded-lg hover:bg-slate-800/50 transition-all outline-none"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-4 flex-shrink-0">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Usuarios Registrados</h3>
                <p className="text-xs text-slate-400 mt-0.5">Liga: {viewingLeagueUsers.name}</p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative mb-4 flex-shrink-0">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, email o sector..."
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-border/60 focus:border-primary rounded-xl text-xs text-foreground placeholder-slate-500 outline-none transition-all"
              />
            </div>

            {/* User List Container */}
            <div className="overflow-y-auto flex-1 pr-1 scrollbar-thin">
              {filteredLeagueUsers.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No se encontraron usuarios para esta liga.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border/40 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-2 px-1">Usuario</th>
                      <th className="py-2 px-1">Sector</th>
                      <th className="py-2 px-1 text-right">Rol</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {filteredLeagueUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-800/20">
                        <td className="py-2.5 px-1">
                          <div className="font-semibold text-foreground">{u.name || "Invitado (Sin Nombre)"}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{u.email}</div>
                        </td>
                        <td className="py-2.5 px-1">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            u.department === "PENDIENTE" 
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" 
                              : "bg-primary/10 text-primary border border-primary/20"
                          }`}>
                            {u.department}
                          </span>
                        </td>
                        <td className="py-2.5 px-1 text-right">
                          <select
                            value={u.role}
                            onChange={(e) => handleToggleLeagueRole(u.id, e.target.value as LeagueRole)}
                            className="px-2 py-1 bg-slate-950 border border-border focus:border-primary rounded-lg text-[10px] text-foreground outline-none cursor-pointer"
                          >
                            <option value="MEMBER">Jugador</option>
                            <option value="COLLABORATOR">Colaborador</option>
                            <option value="ADMIN">Admin</option>
                            <option value="OWNER">Owner</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Custom dialog alert/confirm dialog */}
      <CustomDialog
        isOpen={dialogConfig.isOpen}
        onClose={() => setDialogConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={dialogConfig.onConfirm}
        title={dialogConfig.title}
        message={dialogConfig.message}
        type={dialogConfig.type}
        confirmText={dialogConfig.confirmText}
        cancelText={dialogConfig.cancelText}
      />
    </div>
  );
}
