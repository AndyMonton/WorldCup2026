"use client";

import React, { useState, useTransition } from "react";
import { MatchStage, Team } from "@prisma/client";
import { savePrediction, saveBonusPredictions } from "@/app/actions/predictions";
import {
  CalendarDays,
  Lock,
  Check,
  AlertTriangle,
  Timer,
  Trophy,
  Sparkles,
  Users,
  Search,
  Bell,
  Save,
} from "lucide-react";

interface MatchItem {
  id: string;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeTeamPlaceholder: string | null;
  awayTeamPlaceholder: string | null;
  homeScore: number | null;
  awayScore: number | null;
  winnerId: string | null;
  date: Date;
  stage: MatchStage;
  group: string | null;
  stadium: { name: string; city: string };
  homeTeam: Team | null;
  awayTeam: Team | null;
  userPrediction: {
    homeScore: number;
    awayScore: number;
    predictedWinnerId: string | null;
    points?: number | null;
    detail?: string | null;
  } | null;
}

interface PredictionsViewProps {
  teams: Team[];
  matches: MatchItem[];
  bonusPrediction: {
    championId: string | null;
    runnerUpId: string | null;
    topScorerName: string | null;
  } | null;
  isDemo: boolean;
  userStats: {
    name: string;
    image: string | null;
    rank: number;
    points: number;
  };
  activePhase1?: boolean;
  activePhase2?: boolean;
  activePhase3?: boolean;
}

type TabType = "groups" | "playoffs-1" | "playoffs-2" | "bonus";

export function PredictionsView({
  teams,
  matches,
  bonusPrediction,
  isDemo,
  userStats,
  activePhase1 = true,
  activePhase2 = false,
  activePhase3 = false,
}: PredictionsViewProps) {
  // 1. React Hooks (State & Transitions) first
  const [activeTab, setActiveTab] = useState<TabType>("groups");
  const [groupFilter, setGroupFilter] = useState<string>("TODOS"); // Inicializado en TODOS por defecto en mobile/desktop
  const [statusFilter, setStatusFilter] = useState<string>("TODOS");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const [mobileActiveTab, setMobileActiveTab] = useState<"groups" | "knockout" | "bonus">("groups");
  const [globalStatus, setGlobalStatus] = useState<{ type: "success" | "error" | "info" | null; message: string | null }>({ type: null, message: null });

  // Estados locales para los inputs de goles y clasificados
  const [scores, setScores] = useState<Record<string, { home: string; away: string }>>(() => {
    const initial: Record<string, { home: string; away: string }> = {};
    matches.forEach((m) => {
      if (m.userPrediction) {
        initial[m.id] = {
          home: m.userPrediction.homeScore.toString(),
          away: m.userPrediction.awayScore.toString(),
        };
      } else {
        initial[m.id] = { home: "", away: "" };
      }
    });
    return initial;
  });

  const [predictedWinners, setPredictedWinners] = useState<Record<string, string | null>>(() => {
    const initial: Record<string, string | null> = {};
    matches.forEach((m) => {
      initial[m.id] = m.userPrediction?.predictedWinnerId || null;
    });
    return initial;
  });

  // Estados de carga e indicaciones de éxito al guardar
  const [isSavingMap, setIsSavingMap] = useState<Record<string, boolean>>({});
  const [savedSuccessMap, setSavedSuccessMap] = useState<Record<string, boolean>>({});
  const [errorMap, setErrorMap] = useState<Record<string, string | null>>({});

  // Estados para las predicciones del torneo (Bonus)
  const [championId, setChampionId] = useState(bonusPrediction?.championId || "");
  const [runnerUpId, setRunnerUpId] = useState(bonusPrediction?.runnerUpId || "");
  const [topScorerName, setTopScorerName] = useState(bonusPrediction?.topScorerName || "");
  const [savingBonus, setSavingBonus] = useState(false);
  const [savedBonusSuccess, setSavedBonusSuccess] = useState(false);
  const [bonusError, setBonusError] = useState<string | null>(null);

  const [, startSavingTransition] = useTransition();

  // 2. Helper Mappings and functions
  const codeMapping: Record<string, string> = {
    ARG: "ar", BRA: "br", MEX: "mx", USA: "us", CAN: "ca", ESP: "es", FRA: "fr", GER: "de", ITA: "it", ENG: "gb-eng",
    POR: "pt", NED: "nl", BEL: "be", URU: "uy", COL: "co", PAR: "py", ECU: "ec", VEN: "ve", CHI: "cl", PER: "pe",
    BOL: "bo", CRC: "cr", PAN: "pa", HON: "hn", SLV: "sv", GUA: "gt", JAM: "jm", RSA: "za", KOR: "kr",
    CZE: "cz", BIH: "ba", QAT: "qa", SUI: "ch", MAR: "ma", HAI: "ht", SCO: "gb-sct", AUS: "au", TUR: "tr",
    CUW: "cw", CIV: "ci", TUN: "tn", EGY: "eg", IRN: "ir", NZL: "nz", CPV: "cv", KSA: "sa", SEN: "sn",
    IRQ: "iq", NOR: "no", ALG: "dz", AUT: "at", JOR: "jo", COD: "cd", UZB: "uz", CRO: "hr", GHA: "gh", SWE: "se"
  };

  const getFlagUrl = (code: string | null | undefined) => {
    if (!code) return "/images/fifa-logo.jpg";
    const lowerCode = codeMapping[code.toUpperCase()];
    if (lowerCode) {
      return `https://flagcdn.com/w80/${lowerCode}.png`;
    }
    return `https://flagcdn.com/w80/${code.toLowerCase().substring(0, 2)}.png`;
  };

  const getMatchBadge = (match: MatchItem, hasPred: boolean, isPhaseActive: boolean = true) => {
    if (!isPhaseActive) {
      return { text: "NO HABILITADO", style: "bg-amber-500/10 text-amber-500 border-amber-500/20" };
    }
    const blockTime = new Date(match.date.getTime() - 15 * 60 * 1000);
    const isLocked = new Date() > blockTime;

    if (match.homeScore !== null && match.awayScore !== null) {
      return { text: "FINALIZADO", style: "bg-slate-800 text-slate-400 border-slate-700/50" };
    }
    if (isLocked) {
      return { text: "BLOQUEADO", style: "bg-red-500/10 text-red-400 border-red-500/20" };
    }
    if (match.stage === MatchStage.FINAL) {
      return { text: "GRAN FINAL", style: "bg-gold/15 text-gold border-gold/30" };
    }
    if (hasPred) {
      return { text: "PRONOSTICADO", style: "bg-primary/10 text-primary border-primary/20" };
    }
    return { text: "PRÓXIMO", style: "bg-blue-500/10 text-blue-400 border-blue-500/20" };
  };

  const incrementScore = (matchId: string, team: "home" | "away") => {
    setScores((prev) => {
      const current = prev[matchId]?.[team] ?? "";
      let newVal = "";
      if (current === "") {
        newVal = "0";
      } else {
        const num = parseInt(current);
        newVal = (num + 1).toString();
      }

      // Limpiar ganador predicho en playoffs si deja de haber empate
      const otherTeam = team === "home" ? "away" : "home";
      const otherVal = prev[matchId]?.[otherTeam] ?? "";
      if (newVal !== "" && otherVal !== "" && parseInt(newVal) !== parseInt(otherVal)) {
        setPredictedWinners((winPrev) => ({ ...winPrev, [matchId]: null }));
      }

      return {
        ...prev,
        [matchId]: {
          ...prev[matchId],
          [team]: newVal,
        },
      };
    });
    setSavedSuccessMap((prev) => ({ ...prev, [matchId]: false }));
    setGlobalStatus({ type: null, message: null });
  };

  const decrementScore = (matchId: string, team: "home" | "away") => {
    setScores((prev) => {
      const current = prev[matchId]?.[team] ?? "";
      let newVal = "";
      if (current === "") {
        newVal = "0";
      } else {
        const num = parseInt(current);
        if (num <= 0) return prev;
        newVal = (num - 1).toString();
      }

      const otherTeam = team === "home" ? "away" : "home";
      const otherVal = prev[matchId]?.[otherTeam] ?? "";
      if (newVal !== "" && otherVal !== "" && parseInt(newVal) !== parseInt(otherVal)) {
        setPredictedWinners((winPrev) => ({ ...winPrev, [matchId]: null }));
      }

      return {
        ...prev,
        [matchId]: {
          ...prev[matchId],
          [team]: newVal,
        },
      };
    });
    setSavedSuccessMap((prev) => ({ ...prev, [matchId]: false }));
    setGlobalStatus({ type: null, message: null });
  };

  const handleSaveAll = () => {
    // Determinar los partidos activos según la pestaña móvil actual
    const activeMatches = matches.filter((m) => {
      if (mobileActiveTab === "groups") {
        return m.stage === "GROUPS" && (groupFilter === "TODOS" ? true : m.group === groupFilter);
      } else {
        return m.stage !== "GROUPS";
      }
    });

    const matchesToSave = activeMatches.filter((m) => {
      const isPhaseActive =
        m.stage === "GROUPS" ? activePhase1 :
        (m.stage === "ROUND_32" || m.stage === "ROUND_16") ? activePhase2 :
        activePhase3;
      const blockTime = new Date(m.date.getTime() - 15 * 60 * 1000);
      const isLocked = new Date() > blockTime || !isPhaseActive;
      if (isLocked) return false;

      const score = scores[m.id];
      if (!score || score.home === "" || score.away === "") return false;

      const originalHome = m.userPrediction?.homeScore?.toString() ?? "";
      const originalAway = m.userPrediction?.awayScore?.toString() ?? "";
      const originalWinner = m.userPrediction?.predictedWinnerId ?? null;

      return (
        score.home !== originalHome ||
        score.away !== originalAway ||
        predictedWinners[m.id] !== originalWinner
      );
    });

    if (matchesToSave.length === 0) {
      setGlobalStatus({ type: "info", message: "No hay cambios pendientes o válidos por guardar." });
      return;
    }

    // Validar playoffs
    for (const m of matchesToSave) {
      const score = scores[m.id];
      const isPlayoff = m.stage !== "GROUPS";
      if (isPlayoff && parseInt(score.home) === parseInt(score.away) && !predictedWinners[m.id]) {
        setGlobalStatus({
          type: "error",
          message: `Por favor, seleccioná quién clasifica para el partido ${m.homeTeam?.name || m.homeTeamPlaceholder} vs ${m.awayTeam?.name || m.awayTeamPlaceholder}`,
        });
        return;
      }
    }

    setSavingBonus(true);
    setGlobalStatus({ type: "info", message: "Guardando pronósticos..." });

    startSavingTransition(async () => {
      let successCount = 0;
      let errorOccurred = false;
      let lastErrorMessage = "";

      for (const m of matchesToSave) {
        const score = scores[m.id];
        const homeVal = parseInt(score.home);
        const awayVal = parseInt(score.away);
        const predictedWinner = predictedWinners[m.id];

        if (isDemo) {
          await new Promise((resolve) => setTimeout(resolve, 350));
          setSavedSuccessMap((prev) => ({ ...prev, [m.id]: true }));
          successCount++;
        } else {
          const res = await savePrediction(m.id, homeVal, awayVal, predictedWinner);
          if (res.success) {
            setSavedSuccessMap((prev) => ({ ...prev, [m.id]: true }));
            successCount++;
          } else {
            setErrorMap((prev) => ({ ...prev, [m.id]: res.error }));
            errorOccurred = true;
            lastErrorMessage = res.error || "Error al guardar.";
          }
        }
      }

      setSavingBonus(false);

      if (successCount > 0 && !errorOccurred) {
        setGlobalStatus({ type: "success", message: "¡Tus pronósticos se han guardado con éxito!" });
      } else if (errorOccurred) {
        setGlobalStatus({ type: "error", message: `Ocurrió un problema: ${lastErrorMessage}` });
      }
    });
  };

  const handleCancelChanges = () => {
    setScores(() => {
      const initial: Record<string, { home: string; away: string }> = {};
      matches.forEach((m) => {
        if (m.userPrediction) {
          initial[m.id] = {
            home: m.userPrediction.homeScore.toString(),
            away: m.userPrediction.awayScore.toString(),
          };
        } else {
          initial[m.id] = { home: "", away: "" };
        }
      });
      return initial;
    });

    setPredictedWinners(() => {
      const initial: Record<string, string | null> = {};
      matches.forEach((m) => {
        initial[m.id] = m.userPrediction?.predictedWinnerId || null;
      });
      return initial;
    });

    setGlobalStatus({ type: "info", message: "Cambios cancelados." });
    setTimeout(() => setGlobalStatus({ type: null, message: null }), 3000);
  };

  // Cambiar input de goles
  const handleScoreChange = (matchId: string, team: "home" | "away", val: string) => {
    // Solo permitir números y vacío
    if (val !== "" && !/^\d+$/.test(val)) return;

    setScores((prev) => {
      const updated = {
        ...prev,
        [matchId]: {
          ...prev[matchId],
          [team]: val,
        },
      };

      // Si los goles cambian y dejan de ser iguales, limpiar el ganador predicho
      const homeVal = team === "home" ? val : prev[matchId].home;
      const awayVal = team === "away" ? val : prev[matchId].away;
      if (homeVal !== "" && awayVal !== "" && parseInt(homeVal) !== parseInt(awayVal)) {
        setPredictedWinners((winPrev) => ({ ...winPrev, [matchId]: null }));
      }

      return updated;
    });

    // Resetear estados de guardado/error al editar
    setSavedSuccessMap((prev) => ({ ...prev, [matchId]: false }));
    setErrorMap((prev) => ({ ...prev, [matchId]: null }));
  };

  // Seleccionar ganador predicho en caso de empate en playoffs
  const handleSelectWinner = (matchId: string, teamId: string) => {
    setPredictedWinners((prev) => ({
      ...prev,
      [matchId]: prev[matchId] === teamId ? null : teamId,
    }));
    setSavedSuccessMap((prev) => ({ ...prev, [matchId]: false }));
    setErrorMap((prev) => ({ ...prev, [matchId]: null }));
  };

  // Guardar un partido individual
  const handleSaveMatch = (matchId: string) => {
    const score = scores[matchId];
    if (score.home === "" || score.away === "") {
      setErrorMap((prev) => ({ ...prev, [matchId]: "Ingresá goles para ambos equipos" }));
      return;
    }

    const homeVal = parseInt(score.home);
    const awayVal = parseInt(score.away);
    const predictedWinner = predictedWinners[matchId];

    const matchObj = matches.find((m) => m.id === matchId);
    const isPlayoff = matchObj?.stage !== "GROUPS";

    if (isPlayoff && homeVal === awayVal && !predictedWinner) {
      setErrorMap((prev) => ({ ...prev, [matchId]: "Seleccioná quién clasifica" }));
      return;
    }

    setIsSavingMap((prev) => ({ ...prev, [matchId]: true }));
    setErrorMap((prev) => ({ ...prev, [matchId]: null }));

    startSavingTransition(async () => {
      if (isDemo) {
        // En modo demostración simulamos el guardado
        await new Promise((resolve) => setTimeout(resolve, 600));
        setIsSavingMap((prev) => ({ ...prev, [matchId]: false }));
        setSavedSuccessMap((prev) => ({ ...prev, [matchId]: true }));
        return;
      }

      const res = await savePrediction(matchId, homeVal, awayVal, predictedWinner);
      setIsSavingMap((prev) => ({ ...prev, [matchId]: false }));

      if (res.success) {
        setSavedSuccessMap((prev) => ({ ...prev, [matchId]: true }));
      } else {
        setErrorMap((prev) => ({ ...prev, [matchId]: res.error }));
      }
    });
  };

  // Guardar predicciones especiales
  const handleSaveBonus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!championId || !runnerUpId || !topScorerName.trim()) {
      setBonusError("Por favor completá todas las predicciones del torneo");
      return;
    }
    if (championId === runnerUpId) {
      setBonusError("El Campeón y el Subcampeón no pueden ser el mismo equipo");
      return;
    }

    setSavingBonus(true);
    setBonusError(null);
    setSavedBonusSuccess(false);

    startSavingTransition(async () => {
      if (isDemo) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        setSavingBonus(false);
        setSavedBonusSuccess(true);
        return;
      }

      const res = await saveBonusPredictions(championId, runnerUpId, topScorerName);
      setSavingBonus(false);
      if (res.success) {
        setSavedBonusSuccess(true);
      } else {
        setBonusError(res.error);
      }
    });
  };

  // Filtrar partidos
  const filteredMatches = matches.filter((m) => {
    // 1. Filtrar por Pestaña
    if (activeTab === "groups" && m.stage !== "GROUPS") return false;
    if (activeTab === "playoffs-1" && m.stage !== "ROUND_32" && m.stage !== "ROUND_16") return false;
    if (
      activeTab === "playoffs-2" &&
      m.stage !== "QUARTER_FINALS" &&
      m.stage !== "SEMI_FINALS" &&
      m.stage !== "THIRD_PLACE" &&
      m.stage !== "FINAL"
    )
      return false;

    // 2. Filtrar por grupo (solo aplica en grupos)
    if (activeTab === "groups" && groupFilter !== "TODOS" && m.group !== groupFilter) return false;

    // 3. Filtrar por estado de la predicción
    const hasPred = scores[m.id].home !== "" && scores[m.id].away !== "";
    if (statusFilter === "PRONOSTICADOS" && !hasPred) return false;
    if (statusFilter === "PENDIENTES" && hasPred) return false;

    // 4. Filtrar por término de búsqueda (equipos o estadios)
    if (searchTerm.trim() !== "") {
      const search = searchTerm.toLowerCase();
      const homeName = m.homeTeam?.name.toLowerCase() || m.homeTeamPlaceholder?.toLowerCase() || "";
      const awayName = m.awayTeam?.name.toLowerCase() || m.awayTeamPlaceholder?.toLowerCase() || "";
      const city = m.stadium.city.toLowerCase();
      if (!homeName.includes(search) && !awayName.includes(search) && !city.includes(search)) return false;
    }

    return true;
  });

  // Limpiar filtros
  const handleClearFilters = () => {
    setSearchTerm("");
    setGroupFilter("TODOS");
    setStatusFilter("TODOS");
  };

  // Fecha del primer partido para verificar bloqueo de especiales
  const firstMatchStart = new Date("2026-06-11T12:00:00Z");
  const isBonusLocked = new Date() > firstMatchStart;

  // Cálculos dinámicos para el encabezado del grupo activo en mobile
  const currentGroupMatches = matches.filter((m) => m.stage === "GROUPS" && (groupFilter === "TODOS" ? true : m.group === groupFilter));
  const predictedCount = currentGroupMatches.filter((m) => {
    const score = scores[m.id];
    return score && score.home !== "" && score.away !== "";
  }).length;
  const totalCount = currentGroupMatches.length;

  // Para eliminatorias en mobile
  const knockoutMatches = matches.filter((m) => m.stage !== "GROUPS");
  const predictedKnockoutCount = knockoutMatches.filter((m) => {
    const score = scores[m.id];
    return score && score.home !== "" && score.away !== "";
  }).length;
  const totalKnockoutCount = knockoutMatches.length;

  const mobileFilteredMatches = matches.filter((m) => {
    if (mobileActiveTab === "groups") {
      return m.stage === "GROUPS" && (groupFilter === "TODOS" ? true : m.group === groupFilter);
    } else {
      return m.stage !== "GROUPS";
    }
  });

  const showMobileScroll = mobileFilteredMatches.length > 2;

  return (
    <>
      {/* ========================================================================= */}
      {/* VISTA DESKTOP (md y superior)                                            */}
      {/* ========================================================================= */}
      <div className="hidden md:block space-y-6">
        {/* Cabecera */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Pronósticos del <span className="text-gradient">Mundial 2026</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Completá tus marcadores. Los pronósticos cierran automáticamente 15 minutos antes de cada partido.
            </p>
          </div>
        </div>

        {/* --- PESTAÑAS PRINCIPALES (TABS) --- */}
        <div className="flex border-b border-border overflow-x-auto gap-2">
          <button
            onClick={() => {
              setActiveTab("groups");
              handleClearFilters();
            }}
            className={`px-5 py-3.5 text-sm font-semibold tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "groups"
                ? "border-b-2 border-primary text-primary font-bold"
                : "text-slate-400 hover:text-foreground"
            }`}
          >
            Fase de Grupos
          </button>
          <button
            onClick={() => {
              setActiveTab("playoffs-1");
              handleClearFilters();
            }}
            className={`px-5 py-3.5 text-sm font-semibold tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "playoffs-1"
                ? "border-b-2 border-primary text-primary font-bold"
                : "text-slate-400 hover:text-foreground"
            }`}
          >
            16avos y Octavos
          </button>
          <button
            onClick={() => {
              setActiveTab("playoffs-2");
              handleClearFilters();
            }}
            className={`px-5 py-3.5 text-sm font-semibold tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "playoffs-2"
                ? "border-b-2 border-primary text-primary font-bold"
                : "text-slate-400 hover:text-foreground"
            }`}
          >
            Cuartos a la Final
          </button>
          <button
            onClick={() => {
              setActiveTab("bonus");
              handleClearFilters();
            }}
            className={`px-5 py-3.5 text-sm font-semibold tracking-wider transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 cursor-pointer ${
              activeTab === "bonus"
                ? "border-b-2 border-primary text-primary font-bold"
                : "text-slate-400 hover:text-foreground"
            }`}
          >
            <Sparkles className="w-4 h-4 text-gold" />
            Especiales del Torneo
          </button>
        </div>

        {/* Banner de fase inactiva */}
        {((activeTab === "groups" && !activePhase1) ||
          (activeTab === "playoffs-1" && !activePhase2) ||
          (activeTab === "playoffs-2" && !activePhase3)) && (
          <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl text-sm shadow-md animate-pulse">
            <Lock className="w-5 h-5 flex-shrink-0" />
            <div>
              <span className="font-bold">Fase Deshabilitada:</span> No estás habilitado para participar o modificar pronósticos en esta fase de la liga. Contactá al administrador para que te habilite.
            </div>
          </div>
        )}

        {/* --- PANELES Y FILTROS --- */}
        {activeTab !== "bonus" && (
          <div className="p-4 rounded-xl bg-slate-900/30 border border-border flex flex-col md:flex-row items-center gap-4">
            {/* Búsqueda */}
            <div className="relative w-full md:w-64 flex-shrink-0">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por selección o ciudad..."
                className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-foreground placeholder-slate-500 transition-all text-xs outline-none"
              />
            </div>

            {/* Filtros y Botones de Grupos */}
            <div className="flex flex-col md:flex-row md:items-center gap-3 flex-1 w-full justify-between">
              {activeTab === "groups" && (
                <div className="flex flex-wrap items-center gap-1.5 py-1">
                  {["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"].map((g) => {
                    const isActive = groupFilter === g;
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGroupFilter(g)}
                        className={`px-4 py-2 text-[10px] font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                          isActive
                            ? "btn-premium-gold"
                            : "btn-premium-secondary"
                        }`}
                      >
                        Grupo {g}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setGroupFilter("TODOS")}
                    className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer whitespace-nowrap ${
                      groupFilter === "TODOS"
                        ? "bg-primary/10 text-primary border-primary"
                        : "bg-slate-950 text-slate-400 hover:text-foreground border-border"
                    }`}
                  >
                    Todos los grupos
                  </button>
                </div>
              )}

              <div className={`w-full md:w-44 flex-shrink-0 ${activeTab === "groups" ? "md:ml-auto" : ""}`}>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-foreground text-xs outline-none appearance-none cursor-pointer"
                >
                  <option value="TODOS">Todos los pronósticos</option>
                  <option value="PRONOSTICADOS">Pronosticados</option>
                  <option value="PENDIENTES">Pendientes</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* --- VISTA DE LOS PARTIDOS --- */}
        {activeTab !== "bonus" ? (
          <div className="space-y-8 pb-44 md:pb-8">
            {(() => {
              // Agrupar partidos por fecha para Escritorio
              const grouped: { dateStr: string; matches: typeof filteredMatches }[] = [];
              filteredMatches.forEach((m) => {
                const dateStr = m.date.toLocaleDateString("es-ES", { day: "numeric", month: "long" });
                let group = grouped.find((g) => g.dateStr === dateStr);
                if (!group) {
                  group = { dateStr, matches: [] };
                  grouped.push(group);
                }
                group.matches.push(m);
              });

              return grouped.map((group) => (
                <div key={group.dateStr} className="space-y-4">
                  {/* Título de la fecha (blanco en modo oscuro, negro en modo claro) */}
                  <h3 className="text-xl md:text-2xl font-black text-foreground mt-8 mb-4 px-1">
                    {group.dateStr}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.matches.map((match) => {
                      const isPhaseActive =
                        match.stage === MatchStage.GROUPS ? activePhase1 :
                        (match.stage === MatchStage.ROUND_32 || match.stage === MatchStage.ROUND_16) ? activePhase2 :
                        activePhase3;
                      const blockTime = new Date(match.date.getTime() - 15 * 60 * 1000);
                      const isLocked = new Date() > blockTime || !isPhaseActive;
                      const isLockedTime = new Date() > blockTime;

                      const score = scores[match.id];
                      const predictedWinner = predictedWinners[match.id];
                      const isSaving = isSavingMap[match.id];
                      const savedSuccess = savedSuccessMap[match.id];
                      const error = errorMap[match.id];

                      const isTie = score.home !== "" && score.away !== "" && parseInt(score.home) === parseInt(score.away);
                      const isPlayoff = match.stage !== "GROUPS";
                      const isFinished = match.homeScore !== null && match.awayScore !== null;

                      const formattedTime = match.date.toLocaleTimeString("es-ES", {
                        hour: "2-digit",
                        minute: "2-digit",
                      });

                      if (isFinished) {
                        const pointsEarned = match.userPrediction?.points ?? 0;
                        const detailMessage = match.userPrediction?.detail ?? "Sin predicción registrada.";

                        return (
                          <div
                            key={match.id}
                            className={`glass-panel border rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between transition-all ${
                              pointsEarned > 0
                                ? "border-primary/30 bg-primary/[0.02]"
                                : "border-border hover:border-slate-800"
                            }`}
                          >
                            {/* Header */}
                            <div className="flex items-center justify-between mb-3.5 border-b border-border/20 pb-2.5">
                              <span className="text-sm font-bold text-foreground">
                                {formattedTime} - {match.stadium.name}
                              </span>
                              <span className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">
                                Finalizado (+{pointsEarned} pts)
                              </span>
                            </div>

                            {/* Central Score Area */}
                            <div className="grid grid-cols-7 items-center gap-2 py-1">
                              {/* Local */}
                              <div className="col-span-2 text-center flex flex-col items-center gap-1.5 min-w-0">
                                <div className="w-10 h-7 bg-slate-900 border border-slate-700/80 rounded flex items-center justify-center font-bold text-[10px] uppercase text-slate-400">
                                  {match.homeTeam?.code || "???"}
                                </div>
                                <span className="text-xs font-bold text-foreground line-clamp-2 leading-tight whitespace-normal break-words min-h-[2rem] flex items-center justify-center text-center uppercase tracking-wide">
                                  {match.homeTeam?.name || match.homeTeamPlaceholder}
                                </span>
                              </div>

                              {/* Marcador Real */}
                              <div className="col-span-3 flex flex-col items-center justify-center">
                                <span className="text-2xl font-black tracking-widest text-foreground px-4 py-1.5 bg-slate-950/85 rounded-xl border border-border">
                                  {match.homeScore} - {match.awayScore}
                                </span>
                                {isPlayoff && match.homeScore === match.awayScore && (
                                  <span className="text-[9px] text-slate-400 font-bold uppercase mt-1">
                                    Clasificó: {teams.find(t => t.id === match.winnerId)?.name || "Clasificado"}
                                  </span>
                                )}
                              </div>

                              {/* Visitante */}
                              <div className="col-span-2 text-center flex flex-col items-center gap-1.5 min-w-0">
                                <div className="w-10 h-7 bg-slate-900 border border-slate-700/80 rounded flex items-center justify-center font-bold text-[10px] uppercase text-slate-400">
                                  {match.awayTeam?.code || "???"}
                                </div>
                                <span className="text-xs font-bold text-foreground line-clamp-2 leading-tight whitespace-normal break-words min-h-[2rem] flex items-center justify-center text-center uppercase tracking-wide">
                                  {match.awayTeam?.name || match.awayTeamPlaceholder}
                                </span>
                              </div>
                            </div>

                            {/* Explicación de pronóstico e información de puntos */}
                            <div className="mt-4 p-3 rounded-xl bg-slate-950/60 border border-border/60 flex flex-col gap-1.5">
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-400 font-semibold">Tu pronóstico:</span>
                                <span className="font-extrabold text-foreground">
                                  {match.userPrediction
                                    ? `${match.userPrediction.homeScore} - ${match.userPrediction.awayScore}`
                                    : "No pronosticado"}
                                </span>
                              </div>
                              {match.userPrediction?.predictedWinnerId && (
                                <div className="text-[10px] text-slate-400 flex justify-between">
                                  <span>Clasifica predicho:</span>
                                  <span className="font-semibold text-foreground">
                                    {teams.find(t => t.id === match.userPrediction?.predictedWinnerId)?.name}
                                  </span>
                                </div>
                              )}
                              <div className="text-[11px] text-primary-foreground/90 font-medium border-t border-border/40 pt-1.5 flex items-center gap-1.5 text-primary">
                                <Sparkles className="w-3.5 h-3.5 text-gold flex-shrink-0" />
                                <span>{detailMessage}</span>
                              </div>
                            </div>

                            {/* Footer */}
                            <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-end">
                              {/* Badge de Puntos Ganados */}
                              <span className={`inline-flex items-center gap-1 px-3 py-1.5 font-bold rounded-xl text-xs border ${
                                pointsEarned > 0
                                  ? "bg-primary/10 text-primary border-primary/20 shadow-sm"
                                  : "bg-slate-800 text-slate-500 border-border/40"
                              }`}>
                                +{pointsEarned} pts
                              </span>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={match.id}
                          className="glass-panel border border-border hover:border-border/80 rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between"
                        >
                          {/* Header de la tarjeta */}
                          <div className="flex items-center justify-between mb-3.5 border-b border-border/20 pb-2.5">
                            <span className="text-sm font-bold text-foreground">
                              {formattedTime} - {match.stadium.name}
                            </span>
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                              {match.stage === "GROUPS" ? `Grupo ${match.group}` : match.stage.replace("_", " ")}
                            </span>
                          </div>

                          {/* Grid del partido y entradas (Restored compact sizes on PC) */}
                          <div className="grid grid-cols-7 gap-2 items-center py-2 mt-2">
                            {/* Home Team */}
                            <div className="col-span-2 text-center flex flex-col items-center gap-1.5 min-w-0">
                              <img
                                src={getFlagUrl(match.homeTeam?.code)}
                                alt=""
                                className="w-16 h-10 object-cover rounded shadow-md border border-border"
                              />
                              <span className="text-xs font-bold text-foreground uppercase tracking-wide line-clamp-2 leading-tight whitespace-normal break-words min-h-[2rem] flex items-center justify-center text-center">
                                {match.homeTeam?.name || match.homeTeamPlaceholder}
                              </span>
                            </div>

                            {/* Middle: Score Adjusters */}
                            <div className="col-span-3 flex justify-center gap-2">
                              {/* Home Team goals +/- */}
                              <div className="flex flex-col items-center">
                                <button
                                  type="button"
                                  tabIndex={-1}
                                  onClick={() => incrementScore(match.id, "home")}
                                  disabled={isLocked}
                                  className="text-slate-400 hover:text-primary active:scale-95 text-base font-bold px-2 py-0.5 cursor-pointer transition-colors select-none"
                                >
                                  +
                                </button>
                                <input
                                  type="text"
                                  pattern="[0-9]*"
                                  inputMode="numeric"
                                  disabled={isLocked}
                                  value={score.home}
                                  onChange={(e) => handleScoreChange(match.id, "home", e.target.value)}
                                  placeholder="-"
                                  className="w-11 h-11 text-center font-extrabold text-base bg-slate-950 border border-border rounded-xl focus:border-primary outline-none transition-all disabled:opacity-60"
                                />
                                <button
                                  type="button"
                                  tabIndex={-1}
                                  onClick={() => decrementScore(match.id, "home")}
                                  disabled={isLocked}
                                  className="text-slate-400 hover:text-primary active:scale-95 text-base font-bold px-2 py-0.5 cursor-pointer transition-colors select-none"
                                >
                                  -
                                </button>
                              </div>

                              {/* Colon separator */}
                              <span className="text-slate-500 font-bold text-lg flex items-center justify-center pt-6">:</span>

                              {/* Away Team goals +/- */}
                              <div className="flex flex-col items-center">
                                <button
                                  type="button"
                                  tabIndex={-1}
                                  onClick={() => incrementScore(match.id, "away")}
                                  disabled={isLocked}
                                  className="text-slate-400 hover:text-primary active:scale-95 text-base font-bold px-2 py-0.5 cursor-pointer transition-colors select-none"
                                >
                                  +
                                </button>
                                <input
                                  type="text"
                                  pattern="[0-9]*"
                                  inputMode="numeric"
                                  disabled={isLocked}
                                  value={score.away}
                                  onChange={(e) => handleScoreChange(match.id, "away", e.target.value)}
                                  placeholder="-"
                                  className="w-11 h-11 text-center font-extrabold text-base bg-slate-950 border border-border rounded-xl focus:border-primary outline-none transition-all disabled:opacity-60"
                                />
                                <button
                                  type="button"
                                  tabIndex={-1}
                                  onClick={() => decrementScore(match.id, "away")}
                                  disabled={isLocked}
                                  className="text-slate-400 hover:text-primary active:scale-95 text-base font-bold px-2 py-0.5 cursor-pointer transition-colors select-none"
                                >
                                  -
                                </button>
                              </div>
                            </div>

                            {/* Away Team */}
                            <div className="col-span-2 text-center flex flex-col items-center gap-1.5 min-w-0">
                              <img
                                src={getFlagUrl(match.awayTeam?.code)}
                                alt=""
                                className="w-16 h-10 object-cover rounded shadow-md border border-border"
                              />
                              <span className="text-xs font-bold text-foreground uppercase tracking-wide line-clamp-2 leading-tight whitespace-normal break-words min-h-[2rem] flex items-center justify-center text-center">
                                {match.awayTeam?.name || match.awayTeamPlaceholder}
                              </span>
                            </div>
                          </div>

                          {/* Caso de playoff con empate -> Seleccionar clasificado */}
                          {isPlayoff && isTie && (
                            <div className="mt-4 p-3 rounded-xl bg-slate-900/40 border border-border/40 text-center">
                              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                                ¿Quién clasifica a la siguiente ronda?
                              </p>
                              <div className="flex justify-center gap-4">
                                <button
                                  type="button"
                                  tabIndex={-1}
                                  disabled={isLocked}
                                  onClick={() => match.homeTeamId && handleSelectWinner(match.id, match.homeTeamId)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    predictedWinner === match.homeTeamId
                                      ? "bg-primary text-primary-foreground border border-primary"
                                      : "bg-slate-950 text-slate-400 hover:text-foreground border border-border"
                                  }`}
                                >
                                  {match.homeTeam?.name || "Local"}
                                </button>
                                <button
                                  type="button"
                                  tabIndex={-1}
                                  disabled={isLocked}
                                  onClick={() => match.awayTeamId && handleSelectWinner(match.id, match.awayTeamId)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    predictedWinner === match.awayTeamId
                                      ? "bg-primary text-primary-foreground border border-primary"
                                      : "bg-slate-950 text-slate-400 hover:text-foreground border border-border"
                                  }`}
                                >
                                  {match.awayTeam?.name || "Visitante"}
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Footer de la Tarjeta con Estado/Guardado */}
                          <div className="mt-4 pt-4 border-t border-border/40 flex items-center justify-end min-h-[44px]">
                            {/* Acciones */}
                            <div>
                              {!isPhaseActive ? (
                                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-500/10 text-amber-500 font-bold uppercase text-[10px] rounded-xl border border-amber-500/20">
                                  <Lock className="w-3.5 h-3.5" /> No Habilitado
                                </span>
                              ) : isLockedTime ? (
                                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-800 text-slate-500 font-bold uppercase text-[10px] rounded-xl border border-border/40">
                                  <Lock className="w-3.5 h-3.5" /> Bloqueado
                                </span>
                              ) : (
                                <div className="flex items-center gap-2">
                                  {error && <span className="text-[10px] text-red-400 max-w-[180px] text-right leading-tight whitespace-normal">{error}</span>}

                                  <button
                                    tabIndex={-1}
                                    onClick={() => handleSaveMatch(match.id)}
                                    disabled={isSaving}
                                    className={`flex items-center justify-center gap-1.5 px-5 py-2.5 text-[10px] font-extrabold uppercase tracking-wider cursor-pointer transition-all ${
                                      savedSuccess
                                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full"
                                        : "btn-premium"
                                    }`}
                                  >
                                    {isSaving ? (
                                      <div className="w-3.5 h-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                                    ) : savedSuccess ? (
                                      <>
                                        <Check className="w-3.5 h-3.5" /> Guardado
                                      </>
                                    ) : (
                                      "Guardar"
                                    )}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ));
            })()}

            {filteredMatches.length === 0 && (
              <div className="col-span-2 text-center py-20 bg-slate-900/10 border border-border border-dashed rounded-3xl">
                <CalendarDays className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                <p className="text-slate-400 font-medium text-sm">No se encontraron partidos con los filtros aplicados.</p>
                <button
                  onClick={handleClearFilters}
                  className="mt-3 text-xs text-primary font-bold hover:underline"
                >
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>
        ) : (
          /* --- PREDICCIONES ESPECIALES (BONUS TAB) --- */
          <div className="max-w-2xl mx-auto glass-panel border border-border rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 pointer-events-none">
              <Sparkles className="w-6 h-6 text-gold opacity-30 animate-pulse" />
            </div>

            <div className="flex items-center gap-3 mb-6">
              <Trophy className="w-6 h-6 text-gold" />
              <h2 className="text-xl font-extrabold">Pronósticos Especiales del Torneo</h2>
            </div>

            <p className="text-sm text-slate-400 mb-6">
              Estos pronósticos son a largo plazo y otorgan puntos masivos al finalizar el Mundial. Podés modificarlas libremente hasta que comience el primer partido.
            </p>

            {bonusError && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center flex items-center justify-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {bonusError}
              </div>
            )}

            {savedBonusSuccess && (
              <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs text-center flex items-center justify-center gap-2">
                <Check className="w-4 h-4" />
                ¡Pronósticos del torneo guardados con éxito!
              </div>
            )}

            <form onSubmit={handleSaveBonus} className="space-y-6">
              {/* Campeón */}
              <div>
                <label htmlFor="champion-desktop" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Campeón del Mundo (+20 Puntos)
                </label>
                <select
                  id="champion-desktop"
                  disabled={isBonusLocked}
                  value={championId}
                  onChange={(e) => {
                    setChampionId(e.target.value);
                    setSavedBonusSuccess(false);
                    setBonusError(null);
                  }}
                  required
                  className="w-full px-3 py-3 bg-slate-950 border border-border focus:border-primary rounded-xl text-foreground text-sm outline-none appearance-none cursor-pointer disabled:opacity-60"
                >
                  <option value="">Seleccionar Selección</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subcampeón */}
              <div>
                <label htmlFor="runnerUp-desktop" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Subcampeón del Mundo (+15 Puntos)
                </label>
                <select
                  id="runnerUp-desktop"
                  disabled={isBonusLocked}
                  value={runnerUpId}
                  onChange={(e) => {
                    setRunnerUpId(e.target.value);
                    setSavedBonusSuccess(false);
                    setBonusError(null);
                  }}
                  required
                  className="w-full px-3 py-3 bg-slate-950 border border-border focus:border-primary rounded-xl text-foreground text-sm outline-none appearance-none cursor-pointer disabled:opacity-60"
                >
                  <option value="">Seleccionar Selección</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Goleador */}
              <div>
                <label htmlFor="topScorer-desktop" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Goleador (Bota de Oro) (+15 Puntos)
                </label>
                <input
                  id="topScorer-desktop"
                  type="text"
                  disabled={isBonusLocked}
                  value={topScorerName}
                  onChange={(e) => {
                    setTopScorerName(e.target.value);
                    setSavedBonusSuccess(false);
                    setBonusError(null);
                  }}
                  required
                  placeholder="Nombre exacto del jugador (ej. Lionel Messi)"
                  className="w-full px-4 py-3 bg-slate-950 border border-border focus:border-primary rounded-xl text-foreground placeholder-slate-500 text-sm outline-none transition-all disabled:opacity-60"
                />
              </div>

              {/* Guardar */}
              {isBonusLocked ? (
                <div className="p-4 rounded-xl bg-slate-900 border border-border flex items-center justify-center gap-3 text-slate-400 text-sm">
                  <Lock className="w-5 h-5" />
                  Los pronósticos especiales del torneo están cerrados
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={savingBonus}
                  className="w-full py-3 btn-premium"
                >
                  {savingBonus ? (
                    <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      Guardar Especiales
                      <Check className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </form>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* VISTA MOBILE (Celular - md e inferior)                                    */}
      {/* ========================================================================= */}
      <div className="block md:hidden flex flex-col gap-4 pb-24 relative select-none">
        {/* 1. Header (Avatar + Info / World Cup 2026 / Bell) */}
        <div className="flex items-center justify-between pb-4 border-b border-border/40">
          {/* Perfil Usuario */}
          <div className="flex items-center gap-2.5">
            {userStats.image ? (
              <img
                src={userStats.image}
                alt={userStats.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-primary"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center font-black text-primary text-xs">
                {userStats.name.substring(0, 2).toUpperCase()}
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <span className="font-extrabold text-xs text-foreground truncate max-w-[130px] leading-tight">
                {userStats.name}
              </span>
              <span className="text-[9px] text-slate-400 font-bold tracking-tight uppercase mt-0.5 whitespace-nowrap">
                PUESTO #{userStats.rank.toLocaleString("es-ES")} &middot; {userStats.points.toLocaleString("es-ES")} PTS
              </span>
            </div>
          </div>

          {/* World Cup 2026 Banner */}
          <div className="flex items-center gap-3">
            <div className="text-right font-black leading-none uppercase">
              <div className="text-[10px] text-slate-400 tracking-wider">World Cup</div>
              <div className="text-base text-slate-100 mt-0.5 tracking-tight">2026</div>
            </div>
            <button
              type="button"
              className="text-slate-400 hover:text-foreground relative p-1 cursor-pointer transition-colors"
            >
              <Bell className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. Selector de Pestañas Segmentado (Pills) */}
        <div className="bg-slate-950 p-1 rounded-full flex gap-1 border border-border/40">
          <button
            type="button"
            onClick={() => {
              setMobileActiveTab("groups");
              setGroupFilter("A");
              setGlobalStatus({ type: null, message: null });
            }}
            className={`flex-1 text-center py-2 text-xs font-bold rounded-full transition-all cursor-pointer ${
              mobileActiveTab === "groups"
                ? "bg-slate-800 text-primary shadow"
                : "text-slate-400 hover:text-foreground"
            }`}
          >
            Grupos
          </button>
          <button
            type="button"
            onClick={() => {
              setMobileActiveTab("knockout");
              setGroupFilter("TODOS");
              setGlobalStatus({ type: null, message: null });
            }}
            className={`flex-1 text-center py-2 text-xs font-bold rounded-full transition-all cursor-pointer ${
              mobileActiveTab === "knockout"
                ? "bg-slate-800 text-primary shadow"
                : "text-slate-400 hover:text-foreground"
            }`}
          >
            Eliminatorias
          </button>
          <button
            type="button"
            onClick={() => {
              setMobileActiveTab("bonus");
              setGlobalStatus({ type: null, message: null });
            }}
            className={`flex-1 text-center py-2 text-xs font-bold rounded-full transition-all cursor-pointer flex items-center justify-center gap-1 ${
              mobileActiveTab === "bonus"
                ? "bg-slate-800 text-primary shadow"
                : "text-slate-400 hover:text-foreground"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            Especiales
          </button>
        </div>

        {/* Banner de fase inactiva móvil */}
        {((mobileActiveTab === "groups" && !activePhase1) ||
          (mobileActiveTab === "knockout" && (!activePhase2 || !activePhase3))) && (
          <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-xs shadow-md mb-3 animate-pulse">
            <Lock className="w-4 h-4 flex-shrink-0" />
            <div>
              <span className="font-bold">Fase Deshabilitada:</span> No estás habilitado para participar en esta fase de la liga.
            </div>
          </div>
        )}

        {/* 3. Carrusel Horizontal de Grupos (Solo en Grupos) */}
        {mobileActiveTab === "groups" && (
          <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-none select-none">
            <button
              type="button"
              onClick={() => {
                setGroupFilter("TODOS");
                setGlobalStatus({ type: null, message: null });
              }}
              className={`px-4.5 py-2 text-[10px] font-extrabold transition-all whitespace-nowrap cursor-pointer ${
                groupFilter === "TODOS"
                  ? "btn-premium-gold"
                  : "btn-premium-secondary"
              }`}
            >
              Todos
            </button>
            {["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"].map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => {
                  setGroupFilter(g);
                  setGlobalStatus({ type: null, message: null });
                }}
                className={`px-4.5 py-2 text-[10px] font-extrabold transition-all whitespace-nowrap cursor-pointer ${
                  groupFilter === g
                    ? "btn-premium-gold"
                    : "btn-premium-secondary"
                }`}
              >
                Grupo {g}
              </button>
            ))}
          </div>
        )}

        {/* 4. Encabezado del Listado */}
        {mobileActiveTab !== "bonus" && (
          <div className="flex items-center justify-between mt-1 pb-1">
            <h3 className="text-base font-extrabold text-foreground tracking-tight">
              {mobileActiveTab === "groups" ? (
                <>
                  Partidos <span className="text-primary">{groupFilter === "TODOS" ? "Todos los Grupos" : `Grupo ${groupFilter}`}</span>
                </>
              ) : (
                <>
                  Fase <span className="text-primary">Eliminatoria</span>
                </>
              )}
            </h3>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              {mobileActiveTab === "groups" ? (
                <>{predictedCount} de {totalCount} Pronosticados</>
              ) : (
                <>{predictedKnockoutCount} de {totalKnockoutCount} Pronosticados</>
              )}
            </span>
          </div>
        )}

        {/* 5. Listado de Tarjetas de Partidos con Scroll si hay más de 2 */}
        {mobileActiveTab !== "bonus" ? (
          <div className="space-y-6 pr-1">
            {(() => {
              // Agrupar partidos por fecha
              const grouped: { dateStr: string; matches: typeof mobileFilteredMatches }[] = [];
              mobileFilteredMatches.forEach((m) => {
                const dateStr = m.date.toLocaleDateString("es-ES", { day: "numeric", month: "long" });
                let group = grouped.find((g) => g.dateStr === dateStr);
                if (!group) {
                  group = { dateStr, matches: [] };
                  grouped.push(group);
                }
                group.matches.push(m);
              });

              return grouped.map((group) => (
                <div key={group.dateStr} className="space-y-4">
                  {/* Título de la fecha (blanco en modo oscuro, negro en modo claro) */}
                  <h3 className="text-xl font-black text-foreground mt-6 mb-2 px-1">
                    {group.dateStr}
                  </h3>

                  {group.matches.map((match) => {
                    const isPhaseActive =
                      match.stage === MatchStage.GROUPS ? activePhase1 :
                      (match.stage === MatchStage.ROUND_32 || match.stage === MatchStage.ROUND_16) ? activePhase2 :
                      activePhase3;
                    const blockTime = new Date(match.date.getTime() - 15 * 60 * 1000);
                    const isLocked = new Date() > blockTime || !isPhaseActive;

                    const score = scores[match.id] || { home: "", away: "" };
                    const predictedWinner = predictedWinners[match.id];
                    const savedSuccess = savedSuccessMap[match.id];
                    const error = errorMap[match.id];

                    const isTie = score.home !== "" && score.away !== "" && parseInt(score.home) === parseInt(score.away);
                    const isPlayoff = match.stage !== "GROUPS";
                    const isFinished = match.homeScore !== null && match.awayScore !== null;

                    const formattedTime = match.date.toLocaleTimeString("es-ES", {
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    if (isFinished) {
                      const pointsEarned = match.userPrediction?.points ?? 0;
                      const detailMessage = match.userPrediction?.detail ?? "Sin predicción registrada.";

                      return (
                        <div
                          key={match.id}
                          className={`glass-panel border rounded-2xl p-4 shadow relative overflow-hidden flex flex-col justify-between transition-all ${
                            pointsEarned > 0
                              ? "border-primary/30 bg-primary/[0.03]"
                              : "border-border"
                          }`}
                        >
                          {/* Header de la tarjeta móvil (Finalizado) */}
                          <div className="flex items-center justify-between mb-3.5 border-b border-border/20 pb-2.5">
                            <span className="text-sm md:text-base font-extrabold text-foreground">
                              {formattedTime} - {match.stadium.name}
                            </span>
                            <span className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">
                              Finalizado (+{pointsEarned} pts)
                            </span>
                          </div>

                          {/* Central Area */}
                          <div className="grid grid-cols-7 items-center gap-1 py-1">
                            {/* Team 1 */}
                            <div className="col-span-2 text-center flex flex-col items-center gap-1 min-w-0">
                              <img
                                src={getFlagUrl(match.homeTeam?.code)}
                                alt=""
                                className="w-10 h-7 object-cover rounded shadow-sm border border-border"
                              />
                              <span className="text-[10px] font-black text-foreground uppercase tracking-wide line-clamp-2 leading-tight whitespace-normal break-words h-6 flex items-center justify-center text-center">
                                {match.homeTeam?.name || match.homeTeamPlaceholder}
                              </span>
                            </div>

                            {/* Score real */}
                            <div className="col-span-3 flex flex-col items-center justify-center">
                              <span className="text-xl font-black tracking-widest text-foreground px-3 py-1 bg-slate-950 rounded-xl border border-border shadow-inner">
                                {match.homeScore} - {match.awayScore}
                              </span>
                              {isPlayoff && match.homeScore === match.awayScore && (
                                <span className="text-[8px] text-slate-400 font-extrabold uppercase mt-1">
                                  Clasificó: {teams.find(t => t.id === match.winnerId)?.name}
                                </span>
                              )}
                            </div>

                            {/* Team 2 */}
                            <div className="col-span-2 text-center flex flex-col items-center gap-1 min-w-0">
                              <img
                                src={getFlagUrl(match.awayTeam?.code)}
                                alt=""
                                className="w-10 h-7 object-cover rounded shadow-sm border border-border"
                              />
                              <span className="text-[10px] font-black text-foreground uppercase tracking-wide line-clamp-2 leading-tight whitespace-normal break-words h-6 flex items-center justify-center text-center">
                                {match.awayTeam?.name || match.awayTeamPlaceholder}
                              </span>
                            </div>
                          </div>

                          {/* Info de tu predicción */}
                          <div className="mt-3 p-2.5 rounded-xl bg-slate-950 border border-border/30 flex flex-col gap-1 text-[10px]">
                            <div className="flex justify-between items-center text-slate-400">
                              <span>Tu pronóstico:</span>
                              <span className="font-extrabold text-foreground">
                                {match.userPrediction
                                  ? `${match.userPrediction.homeScore} - ${match.userPrediction.awayScore}`
                                  : "No pronosticado"}
                              </span>
                            </div>
                            <div className="text-primary font-bold border-t border-border/20 pt-1 mt-1 flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-gold flex-shrink-0" />
                              <span className="truncate">{detailMessage}</span>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={match.id}
                        className={`glass-panel border rounded-2xl p-4 shadow-md relative overflow-hidden transition-all duration-300 ${
                          savedSuccess
                            ? "border-primary/45 bg-primary/[0.03]"
                            : "border-border bg-slate-900/10 hover:border-slate-800"
                        }`}
                      >
                        {/* Header de la tarjeta móvil (Editable) */}
                        <div className="flex items-center justify-between mb-3.5 border-b border-border/20 pb-2.5">
                          <span className="text-sm md:text-base font-extrabold text-foreground">
                            {formattedTime} - {match.stadium.name}
                          </span>
                          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            {match.stage === "GROUPS" ? `Grupo ${match.group}` : match.stage.replace("_", " ")}
                          </span>
                        </div>

                        {/* Card Match Grid */}
                        <div className="grid grid-cols-7 gap-1 md:gap-2 items-center py-2 mt-2">
                          {/* Home Team */}
                          <div className="col-span-2 text-center flex flex-col items-center gap-1.5 min-w-0">
                            <img
                              src={getFlagUrl(match.homeTeam?.code)}
                              alt=""
                              className="w-24 h-16 object-cover rounded-lg shadow-md border border-border"
                            />
                            <span className="text-sm font-extrabold text-foreground uppercase tracking-wide line-clamp-2 leading-tight whitespace-normal break-words min-h-[2.5rem] flex items-center justify-center text-center">
                              {match.homeTeam?.name || match.homeTeamPlaceholder}
                            </span>
                          </div>

                          {/* Middle: Score Adjusters */}
                          <div className="col-span-3 flex justify-center gap-2">
                            {/* Home Team goals +/- */}
                            <div className="flex flex-col items-center">
                              <button
                                type="button"
                                onClick={() => incrementScore(match.id, "home")}
                                disabled={isLocked}
                                className="text-slate-400 hover:text-primary active:scale-95 text-3xl font-black px-3 py-1 cursor-pointer transition-colors select-none"
                              >
                                +
                              </button>
                              <input
                                type="text"
                                pattern="[0-9]*"
                                inputMode="numeric"
                                disabled={isLocked}
                                value={score.home}
                                onChange={(e) => handleScoreChange(match.id, "home", e.target.value)}
                                placeholder="-"
                                className="w-16 h-16 text-center font-black text-2xl bg-slate-950 border border-border rounded-2xl focus:border-primary outline-none transition-all disabled:opacity-60"
                              />
                              <button
                                type="button"
                                onClick={() => decrementScore(match.id, "home")}
                                disabled={isLocked}
                                className="text-slate-400 hover:text-primary active:scale-95 text-3xl font-black px-3 py-1 cursor-pointer transition-colors select-none"
                              >
                                -
                              </button>
                            </div>

                            {/* Colon separator */}
                            <span className="text-slate-500 font-black text-2xl flex items-center justify-center h-16 self-center">:</span>

                            {/* Away Team goals +/- */}
                            <div className="flex flex-col items-center">
                              <button
                                type="button"
                                onClick={() => incrementScore(match.id, "away")}
                                disabled={isLocked}
                                className="text-slate-400 hover:text-primary active:scale-95 text-3xl font-black px-3 py-1 cursor-pointer transition-colors select-none"
                              >
                                +
                              </button>
                              <input
                                type="text"
                                pattern="[0-9]*"
                                inputMode="numeric"
                                disabled={isLocked}
                                value={score.away}
                                onChange={(e) => handleScoreChange(match.id, "away", e.target.value)}
                                placeholder="-"
                                className="w-16 h-16 text-center font-black text-2xl bg-slate-950 border border-border rounded-2xl focus:border-primary outline-none transition-all disabled:opacity-60"
                              />
                              <button
                                type="button"
                                onClick={() => decrementScore(match.id, "away")}
                                disabled={isLocked}
                                className="text-slate-400 hover:text-primary active:scale-95 text-3xl font-black px-3 py-1 cursor-pointer transition-colors select-none"
                              >
                                -
                              </button>
                            </div>
                          </div>

                          {/* Away Team */}
                          <div className="col-span-2 text-center flex flex-col items-center gap-1.5 min-w-0">
                            <img
                              src={getFlagUrl(match.awayTeam?.code)}
                              alt=""
                              className="w-24 h-16 object-cover rounded-lg shadow-md border border-border"
                            />
                            <span className="text-sm font-extrabold text-foreground uppercase tracking-wide line-clamp-2 leading-tight whitespace-normal break-words min-h-[2.5rem] flex items-center justify-center text-center">
                              {match.awayTeam?.name || match.awayTeamPlaceholder}
                            </span>
                          </div>
                        </div>

                        {/* Playoff Draw Clasifica selector */}
                        {isPlayoff && isTie && (
                          <div className="mt-3 p-2.5 rounded-xl bg-slate-950 border border-border/40 text-center">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                              ¿Quién clasifica a la siguiente ronda?
                            </p>
                            <div className="flex justify-center gap-4">
                              <button
                                type="button"
                                disabled={isLocked}
                                onClick={() => match.homeTeamId && handleSelectWinner(match.id, match.homeTeamId)}
                                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  predictedWinner === match.homeTeamId
                                    ? "bg-primary text-primary-foreground border border-primary"
                                    : "bg-slate-900 text-slate-400 border border-border"
                                }`}
                              >
                                {match.homeTeam?.name || "Local"}
                              </button>
                              <button
                                type="button"
                                disabled={isLocked}
                                onClick={() => match.awayTeamId && handleSelectWinner(match.id, match.awayTeamId)}
                                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  predictedWinner === match.awayTeamId
                                    ? "bg-primary text-primary-foreground border border-primary"
                                    : "bg-slate-900 text-slate-400 border border-border"
                                }`}
                              >
                                {match.awayTeam?.name || "Visitante"}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Inline errors inside cards */}
                        {error && (
                          <div className="mt-2 text-[9px] text-red-400 font-bold text-center">
                            {error}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ));
            })()}

            {mobileFilteredMatches.length === 0 && (
              <div className="text-center py-12 bg-slate-900/10 border border-border border-dashed rounded-3xl">
                <CalendarDays className="w-10 h-10 text-slate-500 mx-auto mb-2" />
                <p className="text-slate-400 font-medium text-xs">No se encontraron partidos para este grupo.</p>
              </div>
            )}
          </div>
        ) : (
          /* --- MÓVIL ESPECIALES DEL TORNEO (BONUS) --- */
          <div className="glass-panel border border-border rounded-2xl p-5 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 pointer-events-none">
              <Sparkles className="w-5 h-5 text-gold opacity-30 animate-pulse" />
            </div>

            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-gold" />
              <h2 className="text-sm font-extrabold uppercase tracking-wider">Especiales del Torneo</h2>
            </div>

            <p className="text-[11px] text-slate-400 mb-5 leading-normal">
              Pronosticá el Campeón, Subcampeón y Goleador. Suman puntos masivos. Cerrado una vez que comience el primer partido.
            </p>

            {bonusError && (
              <div className="mb-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center flex items-center justify-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                {bonusError}
              </div>
            )}

            {savedBonusSuccess && (
              <div className="mb-3 p-3 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs text-center flex items-center justify-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                ¡Pronósticos guardados con éxito!
              </div>
            )}

            <form onSubmit={handleSaveBonus} className="space-y-4">
              {/* Campeón */}
              <div>
                <label htmlFor="champion-mobile" className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Campeón del Mundo (+20 Pts)
                </label>
                <select
                  id="champion-mobile"
                  disabled={isBonusLocked}
                  value={championId}
                  onChange={(e) => {
                    setChampionId(e.target.value);
                    setSavedBonusSuccess(false);
                    setBonusError(null);
                  }}
                  required
                  className="w-full px-3 py-2.5 bg-slate-950 border border-border focus:border-primary rounded-xl text-foreground text-xs outline-none appearance-none cursor-pointer disabled:opacity-60"
                >
                  <option value="">Seleccionar Selección</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subcampeón */}
              <div>
                <label htmlFor="runnerUp-mobile" className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Subcampeón del Mundo (+15 Pts)
                </label>
                <select
                  id="runnerUp-mobile"
                  disabled={isBonusLocked}
                  value={runnerUpId}
                  onChange={(e) => {
                    setRunnerUpId(e.target.value);
                    setSavedBonusSuccess(false);
                    setBonusError(null);
                  }}
                  required
                  className="w-full px-3 py-2.5 bg-slate-950 border border-border focus:border-primary rounded-xl text-foreground text-xs outline-none appearance-none cursor-pointer disabled:opacity-60"
                >
                  <option value="">Seleccionar Selección</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Goleador */}
              <div>
                <label htmlFor="topScorer-mobile" className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Bota de Oro / Goleador (+15 Pts)
                </label>
                <input
                  id="topScorer-mobile"
                  type="text"
                  disabled={isBonusLocked}
                  value={topScorerName}
                  onChange={(e) => {
                    setTopScorerName(e.target.value);
                    setSavedBonusSuccess(false);
                    setBonusError(null);
                  }}
                  required
                  placeholder="ej. Lionel Messi"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-border focus:border-primary rounded-xl text-foreground placeholder-slate-500 text-xs outline-none transition-all disabled:opacity-60"
                />
              </div>

              {/* Guardar Especiales Button */}
              {isBonusLocked ? (
                <div className="p-3.5 rounded-xl bg-slate-900 border border-border flex items-center justify-center gap-2 text-slate-400 text-xs text-center font-semibold">
                  <Lock className="w-4 h-4" />
                  Especiales cerrados por inicio del torneo
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={savingBonus}
                  className="w-full py-3 btn-premium"
                >
                  {savingBonus ? (
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      Guardar Especiales
                      <Check className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              )}
            </form>
          </div>
        )}

        {/* 6. Alerta de Estado Global & Botón de Guardado Flotante Pegajoso al Pie (Solo en partidos) */}
        {mobileActiveTab !== "bonus" && (
          <div className="fixed bottom-[57px] md:bottom-0 left-0 right-0 p-4 bg-background/90 backdrop-blur-md border-t border-border/40 z-30 flex flex-col gap-2">
            {/* Mensaje de estado global */}
            {globalStatus.message && (
              <div className={`p-2.5 rounded-xl border text-center text-[10px] font-bold uppercase tracking-wider ${
                globalStatus.type === "success"
                  ? "bg-primary/10 border-primary/20 text-primary"
                  : globalStatus.type === "error"
                  ? "bg-red-500/10 border-red-500/20 text-red-400"
                  : "bg-slate-950 border-border text-slate-300"
              }`}>
                {globalStatus.message}
              </div>
            )}

            {/* Botones de acción */}
            <div className="flex gap-3 w-full">
              <button
                type="button"
                onClick={handleCancelChanges}
                disabled={savingBonus}
                className="flex-1 bg-slate-900 hover:bg-slate-800 border border-border text-slate-300 font-black text-xs tracking-wider uppercase py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSaveAll}
                disabled={savingBonus}
                className="flex-1 bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs tracking-wider uppercase py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
              >
                {savingBonus ? (
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Guardar
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
