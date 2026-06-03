import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { RankingView } from "@/components/ranking-view";
import { cookies } from "next/headers";

// Mock data en caso de que falle la base de datos (Modo Demostración)
const mockMembers = [
  {
    id: "m-user-1",
    name: "Sofía Rodríguez",
    department: "Ventas y Marketing",
    internalGroup: null,
    points: 37,
    pointsPhase1: 22,
    pointsPhase2: 15,
    pointsPhase3: 0,
    exactCount: 3,
    differenceCount: 1,
    tendencyCount: 0,
    consolationCount: 0,
  },
  {
    id: "m-user-2",
    name: "Martín Gómez",
    department: "Programación",
    internalGroup: "Amigos del Gym",
    points: 32,
    pointsPhase1: 20,
    pointsPhase2: 12,
    pointsPhase3: 0,
    exactCount: 2,
    differenceCount: 1,
    tendencyCount: 1,
    consolationCount: 0,
  },
  {
    id: "m-user-3",
    name: "Ana Clara Silva",
    department: "Soporte Técnico",
    internalGroup: "Asado",
    points: 25,
    pointsPhase1: 15,
    pointsPhase2: 10,
    pointsPhase3: 0,
    exactCount: 2,
    differenceCount: 0,
    tendencyCount: 1,
    consolationCount: 0,
  },
  {
    id: "m-user-current", // El usuario logueado en modo demo
    name: "Sergio Fernandez",
    department: "Programación",
    internalGroup: "Amigos del Gym",
    points: 20,
    pointsPhase1: 11,
    pointsPhase2: 9,
    pointsPhase3: 0,
    exactCount: 2,
    differenceCount: 0,
    tendencyCount: 0,
    consolationCount: 2,
  },
  {
    id: "m-user-5",
    name: "Carlos Bianchi",
    department: "Operaciones",
    internalGroup: null,
    points: 22,
    pointsPhase1: 12,
    pointsPhase2: 10,
    pointsPhase3: 0,
    exactCount: 1,
    differenceCount: 1,
    tendencyCount: 1,
    consolationCount: 1,
  },
  {
    id: "m-user-6",
    name: "Lucía Fernández",
    department: "Recursos Humanos",
    internalGroup: "Asado",
    points: 20,
    pointsPhase1: 11,
    pointsPhase2: 9,
    pointsPhase3: 0,
    exactCount: 1,
    differenceCount: 0,
    tendencyCount: 2,
    consolationCount: 2,
  },
  {
    id: "m-user-7",
    name: "Esteban Quito",
    department: "Soporte Técnico",
    internalGroup: "Amigos del Gym",
    points: 15,
    pointsPhase1: 10,
    pointsPhase2: 5,
    pointsPhase3: 0,
    exactCount: 1,
    differenceCount: 0,
    tendencyCount: 1,
    consolationCount: 3,
  },
  {
    id: "m-user-8",
    name: "Gabriela Sabatini",
    department: "Administración",
    internalGroup: null,
    points: 19,
    pointsPhase1: 14,
    pointsPhase2: 5,
    pointsPhase3: 0,
    exactCount: 0,
    differenceCount: 2,
    tendencyCount: 1,
    consolationCount: 0,
  },
  {
    id: "m-user-9",
    name: "Diego Maradona",
    department: "Programación",
    internalGroup: "Amigos del Gym",
    points: 15,
    pointsPhase1: 15,
    pointsPhase2: 0,
    pointsPhase3: 0,
    exactCount: 1,
    differenceCount: 0,
    tendencyCount: 1,
    consolationCount: 0,
  },
];

export default async function RankingPage() {
  const session = await auth();
  
  let members: any[] = [];
  let currentUserId: string | undefined = undefined;
  let isDemo = false;

  try {
    const userId = session?.user?.id;
    if (!userId) {
      throw new Error("No session");
    }
    currentUserId = userId;

    // 1. Obtener la membresía del usuario según liga activa (cookies)
    const cookieStore = await cookies();
    const activeLeagueId = cookieStore.get("active_league_id")?.value;

    let userMembership = null;
    if (activeLeagueId) {
      userMembership = await prisma.leagueMembership.findUnique({
        where: {
          userId_leagueId: {
            userId,
            leagueId: activeLeagueId,
          },
        },
      });
    }

    if (!userMembership) {
      userMembership = await prisma.leagueMembership.findFirst({
        where: { userId },
      });
    }

    if (!userMembership) {
      throw new Error("No league membership");
    }

    // 2. Obtener todas las membresías de esa liga ordenadas provisionalmente (excluyendo administradores y usuarios sin pago confirmado)
    const dbMemberships = await prisma.leagueMembership.findMany({
      where: {
        leagueId: userMembership.leagueId,
        hasPaid: true,
        user: { role: { not: "ADMIN" } }
      },
      include: { user: true },
    });

    if (dbMemberships.length === 0) {
      throw new Error("No members in database league");
    }

    members = dbMemberships.map((m) => ({
      id: m.userId,
      name: m.user.name || m.user.email,
      department: m.department,
      internalGroup: m.internalGroup,
      points: m.points,
      pointsPhase1: m.pointsPhase1,
      pointsPhase2: m.pointsPhase2,
      pointsPhase3: m.pointsPhase3,
      exactCount: m.exactCount,
      differenceCount: m.differenceCount,
      tendencyCount: m.tendencyCount,
      consolationCount: m.consolationCount,
    }));

  } catch (error) {
    console.warn("Fallo al obtener datos del ranking de la DB, usando mock data. Error:", error);
    members = mockMembers;
    isDemo = true;
    
    // Asignar el id del usuario de sesión actual al elemento actual en el mock
    if (session?.user?.id) {
      currentUserId = "m-user-current";
      const currentMock = mockMembers.find((m) => m.id === "m-user-current");
      if (currentMock && session.user.name) {
        currentMock.name = session.user.name;
      }
    }
  }

  return (
    <RankingView
      members={members}
      currentUserId={currentUserId}
      isDemo={isDemo}
    />
  );
}
