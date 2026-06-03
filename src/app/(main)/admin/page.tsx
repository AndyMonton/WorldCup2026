import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { AdminView } from "@/components/admin-view";
import { MatchStage, MatchStatus, Role } from "@prisma/client";

// Mock data en caso de que falle la base de datos (Modo Demostración)
const mockLeagues = [
  { id: "l1", name: "Macena SA", inviteCode: "MACENA2026", membershipsCount: 48, transferAlias: "macena.mercado.pago", transferAmount: 5000, createdAt: new Date(), updatedAt: new Date() },
  { id: "l2", name: "Club Deportivo", inviteCode: "CLUB2026", membershipsCount: 12, transferAlias: "club.dep.transfer", transferAmount: 3000, createdAt: new Date(), updatedAt: new Date() },
  { id: "l3", name: "Amigos del Gym", inviteCode: "GYM2026", membershipsCount: 5, transferAlias: null, transferAmount: null, createdAt: new Date(), updatedAt: new Date() },
];

const mockUsers = [
  {
    id: "m-user-1",
    name: "Sofía Rodríguez",
    email: "sofia@macena.com.ar",
    role: Role.USER,
    memberships: [{
      id: "memb-1",
      league: { id: "l1", name: "Macena SA" },
      department: "Ventas y Marketing",
      internalGroup: null,
      activePhase1: true,
      activePhase2: false,
      activePhase3: false,
      hasPaid: true,
    }],
  },
  {
    id: "m-user-2",
    name: "Martín Gómez",
    email: "martin@macena.com.ar",
    role: Role.USER,
    memberships: [{
      id: "memb-2",
      league: { id: "l1", name: "Macena SA" },
      department: "Programación",
      internalGroup: "Amigos del Gym",
      activePhase1: true,
      activePhase2: true,
      activePhase3: false,
      hasPaid: true,
    }],
  },
  {
    id: "m-user-3",
    name: "Ana Clara Silva",
    email: "ana@macena.com.ar",
    role: Role.USER,
    memberships: [{
      id: "memb-3",
      league: { id: "l1", name: "Macena SA" },
      department: "Soporte Técnico",
      internalGroup: "Asado",
      activePhase1: true,
      activePhase2: false,
      activePhase3: true,
      hasPaid: false,
    }],
  },
  {
    id: "m-user-current",
    name: "Administrador Macena",
    email: "admin@macena.com.ar",
    role: Role.ADMIN,
    memberships: [{
      id: "memb-current",
      league: { id: "l1", name: "Macena SA" },
      department: "Administración",
      internalGroup: null,
      activePhase1: true,
      activePhase2: true,
      activePhase3: true,
      hasPaid: true,
    }],
  },
];

const mockAuditLogs = [
  {
    id: "log-1",
    userId: "m-user-current",
    action: "SAVE_MATCH_RESULT",
    details: "Marcador cargado para partido ID m-group-1: 2-1. Puntos recalculados.",
    createdAt: new Date("2026-06-01T15:30:00Z"),
    user: { name: "Administrador Macena", email: "admin@macena.com.ar" },
  },
  {
    id: "log-2",
    userId: "m-user-current",
    action: "CREATE_LEAGUE",
    details: "Liga creada: Amigos del Gym con código GYM2026.",
    createdAt: new Date("2026-06-01T14:15:00Z"),
    user: { name: "Administrador Macena", email: "admin@macena.com.ar" },
  },
];

const mockTeams = [
  { id: "t1", name: "México", code: "MEX", flagUrl: null, group: "A", createdAt: new Date(), updatedAt: new Date() },
  { id: "t2", name: "Sudáfrica", code: "RSA", flagUrl: null, group: "A", createdAt: new Date(), updatedAt: new Date() },
  { id: "t3", name: "Corea del Sur", code: "KOR", flagUrl: null, group: "A", createdAt: new Date(), updatedAt: new Date() },
  { id: "t4", name: "República Checa", code: "CZE", flagUrl: null, group: "A", createdAt: new Date(), updatedAt: new Date() },
  { id: "t5", name: "Canadá", code: "CAN", flagUrl: null, group: "B", createdAt: new Date(), updatedAt: new Date() },
  { id: "t8", name: "Suiza", code: "SUI", flagUrl: null, group: "B", createdAt: new Date(), updatedAt: new Date() },
];

const mockMatches = [
  {
    id: "m-group-1",
    homeTeamId: "t1",
    awayTeamId: "t4",
    homeTeamPlaceholder: null,
    awayTeamPlaceholder: null,
    homeScore: 2,
    awayScore: 1,
    homeScoreExtra: null,
    awayScoreExtra: null,
    homeScorePenalties: null,
    awayScorePenalties: null,
    winnerId: null,
    date: new Date("2026-06-11T13:00:00Z"),
    stage: MatchStage.GROUPS,
    group: "A",
    status: MatchStatus.FINISHED,
    stadium: { name: "Estadio Azteca", city: "Ciudad de México" },
    homeTeam: mockTeams[0],
    awayTeam: mockTeams[3],
  },
  {
    id: "m-group-2",
    homeTeamId: "t2",
    awayTeamId: "t3",
    homeTeamPlaceholder: null,
    awayTeamPlaceholder: null,
    homeScore: null,
    awayScore: null,
    homeScoreExtra: null,
    awayScoreExtra: null,
    homeScorePenalties: null,
    awayScorePenalties: null,
    winnerId: null,
    date: new Date("2026-06-11T16:00:00Z"),
    stage: MatchStage.GROUPS,
    group: "A",
    status: MatchStatus.SCHEDULED,
    stadium: { name: "Mercedes-Benz Stadium", city: "Atlanta" },
    homeTeam: mockTeams[1],
    awayTeam: mockTeams[2],
  },
  {
    id: "m-group-3",
    homeTeamId: "t5",
    awayTeamId: "t8",
    homeTeamPlaceholder: null,
    awayTeamPlaceholder: null,
    homeScore: null,
    awayScore: null,
    homeScoreExtra: null,
    awayScoreExtra: null,
    homeScorePenalties: null,
    awayScorePenalties: null,
    winnerId: null,
    date: new Date("2026-06-11T19:00:00Z"),
    stage: MatchStage.GROUPS,
    group: "B",
    status: MatchStatus.SCHEDULED,
    stadium: { name: "BMO Field", city: "Toronto" },
    homeTeam: mockTeams[4],
    awayTeam: mockTeams[5],
  },
  {
    id: "m-r32-1",
    homeTeamId: null,
    awayTeamId: null,
    homeTeamPlaceholder: "1° Grupo A",
    awayTeamPlaceholder: "3° Grupo C/D/E/F",
    homeScore: null,
    awayScore: null,
    homeScoreExtra: null,
    awayScoreExtra: null,
    homeScorePenalties: null,
    awayScorePenalties: null,
    winnerId: null,
    date: new Date("2026-06-28T14:00:00Z"),
    stage: MatchStage.ROUND_32,
    group: null,
    status: MatchStatus.SCHEDULED,
    stadium: { name: "MetLife Stadium", city: "Nueva York" },
    homeTeam: null,
    awayTeam: null,
  },
];

export default async function AdminPage() {
  const session = await auth();

  // Forzar protección a nivel de servidor (por seguridad extra, además del middleware)
  if (!session || session.user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  let matches: any[] = [];
  let leagues: any[] = [];
  let users: any[] = [];
  let auditLogs: any[] = [];
  let isDemo = false;

  try {
    // 1. Obtener partidos
    const dbMatches = await prisma.match.findMany({
      include: {
        homeTeam: true,
        awayTeam: true,
        stadium: true,
      },
      orderBy: { date: "asc" },
    });

    if (dbMatches.length === 0) {
      throw new Error("No matches in database");
    }

    matches = dbMatches.map((m) => ({
      id: m.id,
      homeTeamId: m.homeTeamId,
      awayTeamId: m.awayTeamId,
      homeTeamPlaceholder: m.homeTeamPlaceholder,
      awayTeamPlaceholder: m.awayTeamPlaceholder,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      homeScoreExtra: m.homeScoreExtra,
      awayScoreExtra: m.awayScoreExtra,
      homeScorePenalties: m.homeScorePenalties,
      awayScorePenalties: m.awayScorePenalties,
      winnerId: m.winnerId,
      date: m.date,
      stage: m.stage,
      group: m.group,
      status: m.status,
      stadium: m.stadium,
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
    }));

    // 2. Obtener ligas y contar sus miembros
    const dbLeagues = await prisma.league.findMany({
      include: {
        _count: {
          select: { memberships: true },
        },
      },
      orderBy: { name: "asc" },
    });

    leagues = dbLeagues.map((l) => ({
      id: l.id,
      name: l.name,
      inviteCode: l.inviteCode,
      departments: l.departments,
      transferAlias: l.transferAlias,
      transferAmount: l.transferAmount,
      membershipsCount: l._count.memberships,
      createdAt: l.createdAt,
      updatedAt: l.updatedAt,
    }));

    // 3. Obtener usuarios y sus sectores/ligas
    const dbUsers = await prisma.user.findMany({
      include: {
        memberships: {
          include: { league: true },
        },
      },
      orderBy: { email: "asc" },
    });

    users = dbUsers.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      memberships: u.memberships.map((m) => ({
        id: m.id,
        league: { id: m.league.id, name: m.league.name },
        department: m.department,
        internalGroup: m.internalGroup,
        activePhase1: m.activePhase1,
        activePhase2: m.activePhase2,
        activePhase3: m.activePhase3,
        hasPaid: m.hasPaid,
      })),
    }));

    // 4. Obtener logs de auditoría (últimos 15)
    const dbLogs = await prisma.auditLog.findMany({
      include: {
        user: true,
      },
      orderBy: { createdAt: "desc" },
      take: 15,
    });

    auditLogs = dbLogs.map((log) => ({
      id: log.id,
      userId: log.userId,
      action: log.action,
      details: log.details,
      createdAt: log.createdAt,
      user: {
        name: log.user.name,
        email: log.user.email,
      },
    }));

  } catch (error) {
    console.warn("Fallo al obtener datos de administración de la DB, usando mock data. Error:", error);
    matches = mockMatches;
    leagues = mockLeagues;
    users = mockUsers;
    auditLogs = mockAuditLogs;
    isDemo = true;
  }

  return (
    <AdminView
      initialMatches={matches}
      leagues={leagues}
      users={users}
      auditLogs={auditLogs}
      isDemo={isDemo}
    />
  );
}
