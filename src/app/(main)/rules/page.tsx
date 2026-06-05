import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";
import { Trophy, ShieldCheck, Timer, Sparkles, HelpCircle, Award, CalendarClock } from "lucide-react";
import { TransferAliasCard } from "@/components/transfer-alias-card";

export default async function RulesPage() {
  const session = await auth();
  const userId = session?.user?.id;

  let activeLeague = null;

  if (userId) {
    const cookieStore = await cookies();
    const activeLeagueId = cookieStore.get("active_league_id")?.value;

    const isAdmin = session?.user?.role === "ADMIN";

    const memberships = await prisma.leagueMembership.findMany({
      where: { userId },
      include: { league: true },
    });

    if (memberships.length > 0) {
      const activeMem = memberships.find((m) => m.leagueId === activeLeagueId) || memberships[0];
      activeLeague = activeMem.league;
    } else if (isAdmin && activeLeagueId) {
      activeLeague = await prisma.league.findUnique({
        where: { id: activeLeagueId },
      });
    }

    if (!activeLeague && isAdmin) {
      activeLeague = await prisma.league.findFirst();
    }
  }

  const scoringRules = [
    { name: "Marcador Exacto", points: "+10 pts", desc: "Acertás los goles de ambos equipos en los 90 minutos reglamentarios.", example: "Real: 2-1 | Pronóstico: 2-1" },
    { name: "Diferencia de Goles", points: "+7 pts", desc: "Acertás el ganador y la diferencia de goles correcta (solo partidos con ganador).", example: "Real: 2-1 | Pronóstico: 1-0 (Diferencia +1)" },
    { name: "Tendencia de Ganador", points: "+5 pts", desc: "Acertás quién gana el partido o si empatan, pero sin coincidir en goles ni en diferencia.", example: "Real: 2-1 | Pronóstico: 3-0" },
    { name: "Pifia Total", points: "0 pts", desc: "No acertás ninguna tendencia, ni tampoco los goles individuales de ningún equipo.", example: "Real: 2-1 | Pronóstico: 0-3" },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Cabecera */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">
          Reglas del <span className="text-gradient">Prode Mundial 2026</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Informate sobre el sistema de puntuación, plazos de bloqueo y criterios de desempate de la liga.
        </p>
      </div>

      {activeLeague ? (
        <TransferAliasCard
          alias={activeLeague.transferAlias}
          amount={activeLeague.transferAmount}
          leagueName={activeLeague.name}
          transferAccountName={activeLeague.transferAccountName}
          transferPhone={activeLeague.transferPhone}
        />
      ) : (
        <div className="glass-panel border border-amber-500/20 bg-amber-500/5 rounded-2xl p-6 shadow-lg text-center flex flex-col items-center justify-center gap-3">
          <div className="p-3 bg-amber-500/10 rounded-full text-amber-400">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-base text-foreground">Inscripción y Pago Pendiente</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              Los datos para el pago de la inscripción (Alias de transferencia y Monto) se mostrarán aquí una vez que te unas a una liga privada.
            </p>
          </div>
        </div>
      )}


      {/* --- SECCIÓN 1: SISTEMA DE PUNTUACIÓN REGLAMENTARIA --- */}
      <section className="glass-panel border border-border rounded-2xl p-6 md:p-8 shadow-lg space-y-6">
        <div className="flex items-center gap-3">
          <Award className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold">Puntos en Tiempo Reglamentario (90' + Adición)</h2>
        </div>

        <p className="text-sm text-slate-400">
          Los marcadores de los partidos del prode consideran únicamente el resultado al finalizar el tiempo regular (90 minutos reglamentarios más el tiempo de adición agregado por el árbitro). El alargue (tiempo suplementario) y la tanda de penales no modifican el marcador del partido a efectos de estos puntos.
        </p>

        {/* Lista de Reglas */}
        <div className="space-y-4 pt-2">
          {scoringRules.map((rule, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center ${
                idx === 0
                  ? "bg-primary/5 border-primary/20"
                  : idx === 1
                  ? "bg-slate-500/5 border-slate-500/10"
                  : "bg-slate-900/30 border-border/40"
              }`}
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-foreground">{rule.name}</span>
                  <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded font-bold uppercase">
                    Ejemplo: {rule.example}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{rule.desc}</p>
              </div>

              <span className={`px-4 py-2 rounded-xl text-sm font-extrabold border ${
                idx === 0
                  ? "bg-primary/10 text-primary border-primary/25"
                  : idx === 1
                  ? "bg-slate-800 text-slate-300 border-slate-700"
                  : "bg-slate-900 text-slate-400 border-border/30"
              }`}>
                {rule.points}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* --- SECCIÓN 2: BONUS POR ELIMINATORIAS Y TORNEO --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* BONUS PLAYOFFS */}
        <section className="glass-panel border border-border rounded-2xl p-6 shadow-lg space-y-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-base">Bonus por Clasificado (Playoffs)</h3>
          </div>
          
          <p className="text-xs text-slate-400 leading-relaxed">
            A partir de los 16avos de final, en caso de que pronostiques un empate en tiempo regular, el sistema habilitará la selección obligatoria de quién clasifica de ronda.
          </p>

          <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/15 flex items-center justify-between gap-4">
            <span className="text-xs font-semibold text-slate-300">
              Acertar el equipo que avanza de ronda (por penales, alargue o 90')
            </span>
            <span className="px-3 py-1.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-bold rounded-xl whitespace-nowrap">
              +3 pts extra
            </span>
          </div>

          <p className="text-[10px] text-slate-500 italic">
            * Este punto es acumulativo. Podés sumar 10 puntos por marcador exacto (1-1) y 3 adicionales por clasificado acertado para un total de 13 puntos.
          </p>
        </section>

        {/* PRONÓSTICOS ESPECIALES */}
        <section className="glass-panel border border-border rounded-2xl p-6 shadow-lg space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-gold" />
            <h3 className="font-bold text-base">Pronósticos Especiales del Torneo</h3>
          </div>
          
          <p className="text-xs text-slate-400 leading-relaxed">
            Deberán registrarse antes del inicio del partido inaugural del Mundial. Una vez comenzado el torneo, estos pronósticos se bloquean de forma definitiva.
          </p>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs py-2 border-b border-border/40">
              <span className="text-slate-300">Acertar el Campeón del Mundo</span>
              <span className="font-bold text-gold">+20 pts</span>
            </div>
            <div className="flex justify-between items-center text-xs py-2 border-b border-border/40">
              <span className="text-slate-300">Acertar el Subcampeón del Mundo</span>
              <span className="font-bold text-gold">+15 pts</span>
            </div>
            <div className="flex justify-between items-center text-xs py-2">
              <span className="text-slate-300">Acertar el Goleador (Bota de Oro)</span>
              <span className="font-bold text-gold">+15 pts</span>
            </div>
          </div>
        </section>
      </div>

      {/* --- SECCIÓN 3: PLAZOS Y DESEMPATES --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* PLAZOS DE BLOQUEO */}
        <section className="glass-panel border border-border rounded-2xl p-6 shadow-lg space-y-4">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-red-400" />
            <h3 className="font-bold text-base">Plazos y Bloqueos de Carga</h3>
          </div>
          
          <p className="text-xs text-slate-400 leading-relaxed">
            Por transparencia total de la competencia, se establece un límite estricto de cierre de pronósticos:
          </p>

          <div className="flex items-center gap-3 p-4 bg-red-500/5 border border-red-500/15 rounded-xl">
            <Timer className="w-6 h-6 text-red-400 flex-shrink-0" />
            <span className="text-xs font-semibold text-slate-300 leading-relaxed">
              Los pronósticos de cada partido se bloquean exactamente <span className="text-red-400 font-bold">15 minutos antes</span> de la hora oficial de inicio del partido.
            </span>
          </div>

          <p className="text-[10px] text-slate-500 italic">
            * El servidor de base de datos valida este plazo en cada inserción para evitar modificaciones fuera de término.
          </p>
        </section>

        {/* CRITERIOS DE ORDENACIÓN */}
        <section className="glass-panel border border-border rounded-2xl p-6 shadow-lg space-y-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-teal-400" />
            <h3 className="font-bold text-base">Criterios de Desempate en Clasificación</h3>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Si dos o más participantes empatan en cantidad de puntos acumulados, las posiciones de los rankings se ordenan según:
          </p>

          <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-300 font-medium pl-1">
            <li>Mayor cantidad de marcadores exactos acertados.</li>
            <li>Mayor cantidad de diferencias de gol acertadas.</li>
            <li>Mayor cantidad de tendencias acertadas.</li>
            <li>Orden alfabético de nombre de usuario.</li>
          </ol>
        </section>
      </div>
    </div>
  );
}
