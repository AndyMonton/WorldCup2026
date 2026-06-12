"use client";

import React, { useState } from "react";
import { Trophy, Award, Building2, Users, Search, HelpCircle } from "lucide-react";

interface RankingMember {
  id: string;
  name: string;
  image: string | null;
  department: string;
  internalGroup: string | null;
  points: number;
  pointsPhase1: number;
  pointsPhase2: number;
  pointsPhase3: number;
  exactCount: number;
  differenceCount: number;
  tendencyCount: number;
  consolationCount: number;
  activePhase1: boolean;
  activePhase2: boolean;
  activePhase3: boolean;
}

interface RankingViewProps {
  members: RankingMember[];
  currentUserId?: string;
  isDemo: boolean;
  transferAmount: number | null;
  requiresPayment?: boolean;
  currentTournamentPhase: 1 | 2 | 3;
}

type PhaseTab = "accumulated" | "phase1" | "phase2" | "phase3";

export function RankingView({
  members,
  currentUserId,
  isDemo,
  transferAmount,
  requiresPayment = true,
  currentTournamentPhase,
}: RankingViewProps) {
  const [activePhase, setActivePhase] = useState<PhaseTab>("accumulated");
  const [selectedDept, setSelectedDept] = useState<string>("TODOS");
  const [selectedGroup, setSelectedGroup] = useState<string>("TODOS");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showHelp, setShowHelp] = useState(false);
  const [filterType, setFilterType] = useState<"all" | "habilitados">("all");

  // Obtener sectores únicos para el filtro
  const departments = ["TODOS", ...Array.from(new Set(members.map((m) => m.department)))];

  // Calcular pozo acumulado para la fase activa del torneo
  const paidCount = members.filter((m) => {
    if (!requiresPayment) return true;
    if (currentTournamentPhase === 1) return m.activePhase1;
    if (currentTournamentPhase === 2) return m.activePhase2;
    return m.activePhase3;
  }).length;

  const totalPot = transferAmount ? paidCount * transferAmount : 0;

  // Mapear los puntos del miembro según la fase seleccionada
  const getMemberPhasePoints = (m: RankingMember) => {
    switch (activePhase) {
      case "phase1":
        return m.pointsPhase1;
      case "phase2":
        return m.pointsPhase2;
      case "phase3":
        return m.pointsPhase3;
      case "accumulated":
      default:
        return m.points;
    }
  };

  // Filtrar y ordenar miembros
  const filteredAndSortedMembers = members
    .filter((m) => {
      // Filtro sector
      if (selectedDept !== "TODOS" && m.department !== selectedDept) return false;
      // Filtro grupo interno
      if (selectedGroup !== "TODOS" && m.internalGroup !== selectedGroup) return false;
      // Búsqueda nombre
      if (searchTerm.trim() !== "") {
        if (!m.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      }
      // Filtro Habilitados
      if (filterType === "habilitados") {
        if (!requiresPayment) return true;
        if (currentTournamentPhase === 1) return m.activePhase1;
        if (currentTournamentPhase === 2) return m.activePhase2;
        if (currentTournamentPhase === 3) return m.activePhase3;
      }
      return true;
    })
    .map((m) => ({
      ...m,
      displayPoints: getMemberPhasePoints(m),
    }))
    .sort((a, b) => {
      // 1. Puntos
      if (b.displayPoints !== a.displayPoints) {
        return b.displayPoints - a.displayPoints;
      }
      // 2. Desempate: Cantidad de exactos (EX)
      if (b.exactCount !== a.exactCount) {
        return b.exactCount - a.exactCount;
      }
      // 3. Desempate: Diferencia de gol (DG)
      if (b.differenceCount !== a.differenceCount) {
        return b.differenceCount - a.differenceCount;
      }
      // 4. Desempate: Tendencias (TD)
      if (b.tendencyCount !== a.tendencyCount) {
        return b.tendencyCount - a.tendencyCount;
      }
      // 5. Alfabético por nombre
      return a.name.localeCompare(b.name);
    });

  // Obtener los 3 primeros (Podio) de la lista filtrada
  const podium = filteredAndSortedMembers.slice(0, 3);
  // El resto de los jugadores para la lista normal
  const restOfPlayers = filteredAndSortedMembers.slice(3);

  const getPhaseName = () => {
    switch (activePhase) {
      case "phase1":
        return "Fase de Grupos";
      case "phase2":
        return "16avos y Octavos";
      case "phase3":
        return "Fase Final";
      case "accumulated":
      default:
        return "General Acumulado";
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Tabla de <span className="text-gradient">Posiciones</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Visualizá los rankings de tu liga por fases y sectores.
          </p>
        </div>

        {/* Botón de ayuda/desempates */}
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-border rounded-xl text-xs font-semibold cursor-pointer transition-all self-start md:self-auto"
        >
          <HelpCircle className="w-4 h-4 text-primary" />
          Criterios de Desempate
        </button>
      </div>

      {/* Pozo Acumulado Card */}
      {requiresPayment && transferAmount !== null && (
        <div className="glass-panel border-2 border-primary/30 rounded-2xl p-5 bg-primary/5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg relative overflow-hidden">
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="flex items-center gap-3.5 z-10 w-full sm:w-auto text-left">
            <div className="p-3 bg-primary/10 text-primary rounded-xl">
              <Trophy className="w-6 h-6 text-gold animate-pulse" />
            </div>
            <div>
              <h3 className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                Pozo Acumulado (Fase {currentTournamentPhase})
              </h3>
              <p className="text-2xl font-black text-gradient mt-0.5">
                {new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(totalPot)}
              </p>
            </div>
          </div>
          <div className="text-left sm:text-right z-10 w-full sm:w-auto border-t sm:border-t-0 border-border/40 pt-3 sm:pt-0">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">
              Participantes Habilitados
            </span>
            <span className="text-lg font-extrabold text-foreground">
              {paidCount} <span className="text-xs font-semibold text-slate-400">/ {members.length}</span>
            </span>
          </div>
        </div>
      )}

      {/* Explicación de desempates modal/collapse */}
      {showHelp && (
        <div className="p-5 rounded-2xl bg-slate-900/50 border border-border text-sm space-y-3 animate-float" style={{ animationDuration: "8s" }}>
          <h4 className="font-bold text-foreground flex items-center gap-2 text-base">
            <Trophy className="w-5 h-5 text-gold" />
            Criterios de Ordenación y Desempate
          </h4>
          <p className="text-slate-400">
            En caso de igualdad de puntos en la clasificación, las posiciones se determinan automáticamente utilizando los siguientes criterios en orden de prioridad:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-slate-300 font-medium pl-2">
            <li><span className="text-primary font-bold">Puntos Obtenidos:</span> Puntos sumados en el periodo/fase activa.</li>
            <li><span className="text-gold font-bold">Aciertos Exactos (EX):</span> Mayor cantidad de marcadores exactos (10 pts).</li>
            <li><span className="text-indigo-400 font-bold">Diferencias de Gol (DG):</span> Mayor cantidad de aciertos de ganador con diferencia exacta (7 pts).</li>
            <li><span className="text-emerald-400 font-bold">Tendencias (TD):</span> Mayor cantidad de ganadores/empates no exactos (5 pts).</li>
            <li><span className="text-slate-400 font-bold">Orden Alfabético:</span> Desempate final de cortesía.</li>
          </ol>
        </div>
      )}

      {/* --- PESTAÑAS DE FASES --- */}
      <div className="flex border-b border-border overflow-x-auto gap-2">
        <button
          onClick={() => setActivePhase("accumulated")}
          className={`px-5 py-3.5 text-sm font-semibold tracking-wider transition-all whitespace-nowrap cursor-pointer ${
            activePhase === "accumulated"
              ? "border-b-2 border-primary text-primary font-bold"
              : "text-slate-400 hover:text-foreground"
          }`}
        >
          General Acumulado
        </button>
        <button
          onClick={() => setActivePhase("phase1")}
          className={`px-5 py-3.5 text-sm font-semibold tracking-wider transition-all whitespace-nowrap cursor-pointer ${
            activePhase === "phase1"
              ? "border-b-2 border-primary text-primary font-bold"
              : "text-slate-400 hover:text-foreground"
          }`}
        >
          Fase 1: Grupos
        </button>
        <button
          onClick={() => setActivePhase("phase2")}
          className={`px-5 py-3.5 text-sm font-semibold tracking-wider transition-all whitespace-nowrap cursor-pointer ${
            activePhase === "phase2"
              ? "border-b-2 border-primary text-primary font-bold"
              : "text-slate-400 hover:text-foreground"
          }`}
        >
          Fase 2: 16avos/Octavos
        </button>
        <button
          onClick={() => setActivePhase("phase3")}
          className={`px-5 py-3.5 text-sm font-semibold tracking-wider transition-all whitespace-nowrap cursor-pointer ${
            activePhase === "phase3"
              ? "border-b-2 border-primary text-primary font-bold"
              : "text-slate-400 hover:text-foreground"
          }`}
        >
          Fase 3: Finales
        </button>
      </div>

      {/* --- FILTROS DE RANKING --- */}
      <div className="p-4 rounded-xl bg-slate-900/30 border border-border flex flex-col md:grid md:grid-cols-3 items-center gap-6 md:gap-4 relative">
        {/* Buscador de jugadores */}
        <div className="relative w-full md:w-72 justify-self-start">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar jugador por nombre..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-foreground placeholder-slate-500 transition-all text-xs outline-none"
          />
        </div>

        {/* Dropdowns (Centro) */}
        <div className="flex flex-col items-center justify-center w-full md:w-[300px] justify-self-center">
          <div className="relative w-full">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-4 py-2.5 bg-card border border-border hover:border-primary/50 focus:border-primary rounded-xl text-foreground text-sm font-semibold outline-none appearance-none cursor-pointer text-center shadow-sm transition-all"
            >
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d === "TODOS" ? "Ranking General" : d}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 text-xs">
              ▼
            </div>
          </div>
        </div>

        {/* Filtro Todos vs Habilitados */}
        {requiresPayment && (
          <div className="flex bg-slate-950/80 border border-border p-1 rounded-xl justify-self-end w-full md:w-auto">
            <button
              onClick={() => setFilterType("all")}
              className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterType === "all"
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-slate-400 hover:text-foreground"
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterType("habilitados")}
              className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterType === "habilitados"
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-slate-400 hover:text-foreground"
              }`}
            >
              Habilitados
            </button>
          </div>
        )}
      </div>

      {/* --- EL PODIO DE LA FASE ACTIVA --- */}
      {podium.length > 0 && podium[0].displayPoints > 0 && searchTerm === "" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 items-end">
          {/* Segundo Puesto */}
          {podium[1] && (
            <div className="order-2 sm:order-1 glass-panel border border-slate-500/20 rounded-2xl p-5 text-center flex flex-col items-center gap-2 shadow-lg relative overflow-hidden bg-slate-500/5 h-[185px] justify-end">
              <div className="absolute top-3 left-3 bg-slate-400 text-slate-950 w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow">
                2
              </div>
              <Award className="w-10 h-10 text-slate-400" />
              <h4 className="font-bold text-sm truncate max-w-full text-foreground">{podium[1].name}</h4>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">{podium[1].department}</p>
              <div className="text-lg font-extrabold text-foreground">
                {podium[1].displayPoints} <span className="text-xs font-semibold text-slate-400">pts</span>
              </div>
            </div>
          )}

          {/* Primer Puesto */}
          {podium[0] && (
            <div className="order-1 sm:order-2 glass-panel border border-gold/20 rounded-2xl p-6 text-center flex flex-col items-center gap-3 shadow-2xl relative overflow-hidden bg-gold/5 h-[215px] justify-end glow-card" style={{ "--glow-green": "rgba(234, 179, 8, 0.15)" } as any}>
              <div className="absolute top-4 left-4 bg-gold text-slate-950 w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-sm shadow-md">
                1
              </div>
              <img src="/images/fifa-logo.jpg" alt="Copa FIFA" className="w-14 h-14 object-contain animate-bounce drop-shadow-md rounded-xl" />
              <h4 className="font-extrabold text-base truncate max-w-full">
                <span className="text-gradient inline-block">{podium[0].name}</span>
              </h4>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">{podium[0].department}</p>
              <div className="text-2xl font-extrabold text-gold">
                {podium[0].displayPoints} <span className="text-xs font-semibold text-slate-400">pts</span>
              </div>
            </div>
          )}

          {/* Tercer Puesto */}
          {podium[2] && (
            <div className="order-3 glass-panel border border-amber-700/20 rounded-2xl p-5 text-center flex flex-col items-center gap-2 shadow-lg relative overflow-hidden bg-amber-700/5 h-[170px] justify-end">
              <div className="absolute top-3 left-3 bg-amber-700 text-white w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow">
                3
              </div>
              <Award className="w-9 h-9 text-amber-700" />
              <h4 className="font-bold text-sm truncate max-w-full text-foreground">{podium[2].name}</h4>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">{podium[2].department}</p>
              <div className="text-lg font-extrabold text-foreground">
                {podium[2].displayPoints} <span className="text-xs font-semibold text-slate-400">pts</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- TABLA DE POSICIONES COMPLETA --- */}
      <div className="glass-panel border border-border rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="bg-slate-900/60 border-b border-border/80 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-5 w-16 text-center">Pos</th>
                <th className="py-4 px-4">Jugador</th>
                <th className="py-4 px-5 text-center font-bold text-foreground">Puntos</th>
                <th className="py-4 px-3 text-center" title="Aciertos Exactos (10 pts)">EX</th>
                <th className="py-4 px-3 text-center" title="Acierto Diferencia de Gol (7 pts)">DG</th>
                <th className="py-4 px-3 text-center" title="Acierto Tendencia (5 pts)">TD</th>
                <th className="py-4 px-4 hidden md:table-cell">Sector</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filteredAndSortedMembers.map((member, index) => {
                const isCurrentUser = member.id === currentUserId;
                const position = index + 1;

                return (
                  <tr
                    key={member.id}
                    className={`hover:bg-slate-900/30 transition-all ${
                      isCurrentUser
                        ? "bg-primary/5 font-bold border-l-4 border-l-primary"
                        : ""
                    }`}
                  >
                    {/* Posición */}
                    <td className="py-4 px-5 text-center font-bold">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${
                          position === 1
                            ? "bg-gold/20 text-gold"
                            : position === 2
                            ? "bg-slate-400/20 text-slate-300"
                            : position === 3
                            ? "bg-amber-700/20 text-amber-500"
                            : "text-slate-400"
                        }`}
                      >
                        {position}
                      </span>
                    </td>

                    {/* Nombre Jugador */}
                    <td className="py-4 px-4">
                      <div className="font-semibold text-foreground flex items-center gap-3">
                        {member.image ? (
                          <img 
                            src={member.image} 
                            alt="Avatar" 
                            className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 shrink-0 object-cover" 
                          />
                        ) : (
                          <img 
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.id}`} 
                            alt="Avatar" 
                            className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 shrink-0" 
                          />
                        )}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="truncate max-w-[120px] sm:max-w-none">{member.name}</span>
                          {isCurrentUser && (
                            <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold uppercase shrink-0">
                              Vos
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Puntos de la fase */}
                    <td className="py-4 px-5 text-center font-extrabold text-base text-foreground">
                      {member.displayPoints}
                    </td>

                    {/* Contadores de aciertos */}
                    <td className="py-4 px-3 text-center font-semibold text-slate-300">{member.exactCount}</td>
                    <td className="py-4 px-3 text-center text-slate-400">{member.differenceCount}</td>
                    <td className="py-4 px-3 text-center text-slate-400">{member.tendencyCount}</td>

                    {/* Sector */}
                    <td className="py-4 px-4 text-slate-400 hidden md:table-cell">
                      {member.department}
                    </td>
                  </tr>
                );
              })}

              {filteredAndSortedMembers.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 font-medium">
                    No se encontraron jugadores en la clasificación.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-[11px] text-slate-500 italic text-right px-2">
        * Rankings de la fase {getPhaseName()}. Los criterios de desempate se aplican automáticamente de izquierda a derecha (EX → DG → TD).
      </div>
    </div>
  );
}
