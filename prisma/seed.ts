import "dotenv/config";
import { PrismaClient, MatchStage, MatchStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL no está definida en las variables de entorno.");
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Iniciando la siembra de la base de datos (Seed)...");

  // 1. Reglas de Puntuación (ScoringRules)
  console.log("Sembrando reglas de puntuación...");
  const scoringRules = [
    { ruleName: "EXACT", points: 10, description: "Marcador exacto del partido (90 min + adición)" },
    { ruleName: "DIFFERENCE", points: 7, description: "Ganador y diferencia de goles correcta (excluye empates no exactos)" },
    { ruleName: "TENDENCY", points: 5, description: "Ganador o empate acertado, pero no marcador ni diferencia exacta" },
    { ruleName: "CONSOLATION", points: 2, description: "No acertó tendencia, pero sí los goles de un equipo" },
    { ruleName: "PLAYOFF_QUALIFIED_BONUS", points: 3, description: "Acierto del equipo clasificado a la siguiente ronda (playoffs)" },
    { ruleName: "CHAMPION", points: 20, description: "Acierto del Campeón del Mundial (predicción a largo plazo)" },
    { ruleName: "RUNNER_UP", points: 15, description: "Acierto del Subcampeón del Mundial (predicción a largo plazo)" },
    { ruleName: "TOP_SCORER", points: 15, description: "Acierto del Goleador del Mundial (predicción a largo plazo)" },
  ];

  for (const rule of scoringRules) {
    await prisma.scoringRule.upsert({
      where: { ruleName: rule.ruleName },
      update: { points: rule.points, description: rule.description },
      create: rule,
    });
  }

  // 2. Estadios (Stadiums)
  console.log("Sembrando estadios...");
  const stadiumsData = [
    { name: "Mercedes-Benz Stadium", city: "Atlanta", country: "EE.UU." },
    { name: "Gillette Stadium", city: "Boston", country: "EE.UU." },
    { name: "AT&T Stadium", city: "Dallas", country: "EE.UU." },
    { name: "NRG Stadium", city: "Houston", country: "EE.UU." },
    { name: "Arrowhead Stadium", city: "Kansas City", country: "EE.UU." },
    { name: "SoFi Stadium", city: "Los Angeles", country: "EE.UU." },
    { name: "Hard Rock Stadium", city: "Miami", country: "EE.UU." },
    { name: "MetLife Stadium", city: "Nueva York/Nueva Jersey", country: "EE.UU." },
    { name: "Lincoln Financial Field", city: "Filadelfia", country: "EE.UU." },
    { name: "Levi's Stadium", city: "San Francisco", country: "EE.UU." },
    { name: "Lumen Field", city: "Seattle", country: "EE.UU." },
    { name: "Estadio Akron", city: "Guadalajara", country: "México" },
    { name: "Estadio Azteca", city: "Ciudad de México", country: "México" },
    { name: "Estadio BBVA", city: "Monterrey", country: "México" },
    { name: "BMO Field", city: "Toronto", country: "Canadá" },
    { name: "BC Place", city: "Vancouver", country: "Canadá" },
  ];

  const stadiumMap: Record<string, string> = {};
  for (const s of stadiumsData) {
    const stadium = await prisma.stadium.upsert({
      where: { name: s.name },
      update: { city: s.city, country: s.country },
      create: s,
    });
    stadiumMap[stadium.name] = stadium.id;
  }

  // 3. Equipos (Teams) por Grupo
  console.log("Sembrando equipos del Mundial 2026...");
  const groupsData: Record<string, { name: string; code: string }[]> = {
    A: [
      { name: "México", code: "MEX" },
      { name: "Sudáfrica", code: "RSA" },
      { name: "Corea del Sur", code: "KOR" },
      { name: "República Checa", code: "CZE" },
    ],
    B: [
      { name: "Canadá", code: "CAN" },
      { name: "Bosnia y Herzegovina", code: "BIH" },
      { name: "Catar", code: "QAT" },
      { name: "Suiza", code: "SUI" },
    ],
    C: [
      { name: "Brasil", code: "BRA" },
      { name: "Marruecos", code: "MAR" },
      { name: "Haití", code: "HAI" },
      { name: "Escocia", code: "SCO" },
    ],
    D: [
      { name: "Estados Unidos", code: "USA" },
      { name: "Paraguay", code: "PAR" },
      { name: "Australia", code: "AUS" },
      { name: "Turquía", code: "TUR" },
    ],
    E: [
      { name: "Alemania", code: "GER" },
      { name: "Curazao", code: "CUW" },
      { name: "Costa de Marfil", code: "CIV" },
      { name: "Ecuador", code: "ECU" },
    ],
    F: [
      { name: "Países Bajos", code: "NED" },
      { name: "Japón", code: "JPN" },
      { name: "Suecia", code: "SWE" },
      { name: "Túnez", code: "TUN" },
    ],
    G: [
      { name: "Bélgica", code: "BEL" },
      { name: "Egipto", code: "EGY" },
      { name: "Irán", code: "IRN" },
      { name: "Nueva Zelanda", code: "NZL" },
    ],
    H: [
      { name: "España", code: "ESP" },
      { name: "Cabo Verde", code: "CPV" },
      { name: "Arabia Saudita", code: "KSA" },
      { name: "Uruguay", code: "URU" },
    ],
    I: [
      { name: "Francia", code: "FRA" },
      { name: "Senegal", code: "SEN" },
      { name: "Irak", code: "IRQ" },
      { name: "Noruega", code: "NOR" },
    ],
    J: [
      { name: "Argentina", code: "ARG" },
      { name: "Argelia", code: "ALG" },
      { name: "Austria", code: "AUT" },
      { name: "Jordania", code: "JOR" },
    ],
    K: [
      { name: "Portugal", code: "POR" },
      { name: "RD del Congo", code: "COD" },
      { name: "Uzbekistán", code: "UZB" },
      { name: "Colombia", code: "COL" },
    ],
    L: [
      { name: "Inglaterra", code: "ENG" },
      { name: "Croacia", code: "CRO" },
      { name: "Ghana", code: "GHA" },
      { name: "Panamá", code: "PAN" },
    ],
  };

  const teamMap: Record<string, string> = {};
  const teamsByGroup: Record<string, string[]> = {};

  for (const [groupLetter, teams] of Object.entries(groupsData)) {
    teamsByGroup[groupLetter] = [];
    for (const t of teams) {
      const team = await prisma.team.upsert({
        where: { code: t.code },
        update: { name: t.name, group: groupLetter },
        create: { name: t.name, code: t.code, group: groupLetter },
      });
      teamMap[t.code] = team.id;
      teamsByGroup[groupLetter].push(team.id);
    }
  }

  // 4. Partidos de Fase de Grupos (72 Partidos)
  console.log("Sembrando fixture de fase de grupos...");
  const stadiumNames = Object.keys(stadiumMap);
  let stadiumIndex = 0;

  // Fecha base de inicio del Mundial: 11 de Junio, 2026
  const tournamentStartDate = new Date("2026-06-11T12:00:00Z");

  const groupOffsets: Record<string, number> = {
    A: 0, B: 0, C: 1, D: 1, E: 2, F: 2, G: 3, H: 3, I: 4, J: 5, K: 6, L: 7
  };

  // Para cada grupo, programar partidos round-robin
  for (const [groupLetter, teamIds] of Object.entries(teamsByGroup)) {
    const offsetDays = groupOffsets[groupLetter];

    // Enfrentamientos round robin para 4 equipos (0, 1, 2, 3)
    const matchesRoundRobin = [
      // Ronda 1
      { home: teamIds[0], away: teamIds[1], dayDelta: 0, hour: 13 },
      { home: teamIds[2], away: teamIds[3], dayDelta: 0, hour: 16 },
      // Ronda 2
      { home: teamIds[0], away: teamIds[2], dayDelta: 4, hour: 13 },
      { home: teamIds[1], away: teamIds[3], dayDelta: 4, hour: 16 },
      // Ronda 3
      { home: teamIds[0], away: teamIds[3], dayDelta: 8, hour: 13 },
      { home: teamIds[1], away: teamIds[2], dayDelta: 8, hour: 16 },
    ];

    for (const m of matchesRoundRobin) {
      const matchDate = new Date(tournamentStartDate);
      matchDate.setDate(tournamentStartDate.getDate() + offsetDays + m.dayDelta);
      matchDate.setHours(m.hour, 0, 0, 0);

      const stadiumName = stadiumNames[stadiumIndex % stadiumNames.length];
      const stadiumId = stadiumMap[stadiumName];
      stadiumIndex++;

      // Usar findFirst o similar para evitar duplicados en re-seed
      const existingMatch = await prisma.match.findFirst({
        where: {
          homeTeamId: m.home,
          awayTeamId: m.away,
          stage: MatchStage.GROUPS,
        },
      });

      if (!existingMatch) {
        await prisma.match.create({
          data: {
            homeTeamId: m.home,
            awayTeamId: m.away,
            date: matchDate,
            stage: MatchStage.GROUPS,
            group: groupLetter,
            status: MatchStatus.SCHEDULED,
            stadiumId,
          },
        });
      } else {
        await prisma.match.update({
          where: { id: existingMatch.id },
          data: { date: matchDate, stadiumId },
        });
      }
    }
  }

  // 5. Partidos Eliminatorios (Knockout Playoff - 32 Partidos)
  console.log("Sembrando estructura de fase eliminatoria...");
  
  // 16avos de Final (32 equipos -> 16 partidos)
  // Fechas: 28 de junio al 1 de julio
  const r32StartDate = new Date("2026-06-28T14:00:00Z");
  const r32Placeholders = [
    { home: "1° Grupo A", away: "3° Grupo C/D/E/F" },
    { home: "2° Grupo A", away: "2° Grupo B" },
    { home: "1° Grupo B", away: "3° Grupo A/C/D/E" },
    { home: "1° Grupo C", away: "3° Grupo A/B/F/G" },
    { home: "2° Grupo C", away: "2° Grupo D" },
    { home: "1° Grupo D", away: "3° Grupo B/E/F/G" },
    { home: "1° Grupo E", away: "3° Grupo H/I/J/K" },
    { home: "2° Grupo E", away: "2° Grupo F" },
    { home: "1° Grupo F", away: "3° Grupo G/H/I/J" },
    { home: "1° Grupo G", away: "3° Grupo H/I/J/L" },
    { home: "2° Grupo G", away: "2° Grupo H" },
    { home: "1° Grupo H", away: "3° Grupo I/J/K/L" },
    { home: "1° Grupo I", away: "2° Grupo J" },
    { home: "1° Grupo J", away: "2° Grupo I" },
    { home: "1° Grupo K", away: "2° Grupo L" },
    { home: "1° Grupo L", away: "2° Grupo K" },
  ];

  for (let i = 0; i < r32Placeholders.length; i++) {
    const placeholder = r32Placeholders[i];
    const matchDate = new Date(r32StartDate);
    matchDate.setDate(r32StartDate.getDate() + Math.floor(i / 4)); // 4 partidos por día
    matchDate.setHours(14 + (i % 4) * 3, 0, 0, 0); // Escalonado cada 3 horas

    const stadiumName = stadiumNames[stadiumIndex % stadiumNames.length];
    const stadiumId = stadiumMap[stadiumName];
    stadiumIndex++;

    const existingMatch = await prisma.match.findFirst({
      where: {
        stage: MatchStage.ROUND_32,
        homeTeamPlaceholder: placeholder.home,
        awayTeamPlaceholder: placeholder.away,
      },
    });

    if (!existingMatch) {
      await prisma.match.create({
        data: {
          homeTeamPlaceholder: placeholder.home,
          awayTeamPlaceholder: placeholder.away,
          date: matchDate,
          stage: MatchStage.ROUND_32,
          status: MatchStatus.SCHEDULED,
          stadiumId,
        },
      });
    } else {
      await prisma.match.update({
        where: { id: existingMatch.id },
        data: { date: matchDate, stadiumId },
      });
    }
  }

  // Octavos de Final (16 equipos -> 8 partidos)
  // Fechas: 2 de julio al 5 de julio
  const r16StartDate = new Date("2026-07-02T15:00:00Z");
  for (let i = 0; i < 8; i++) {
    const matchDate = new Date(r16StartDate);
    matchDate.setDate(r16StartDate.getDate() + Math.floor(i / 2)); // 2 partidos por día
    matchDate.setHours(15 + (i % 2) * 4, 0, 0, 0);

    const stadiumName = stadiumNames[stadiumIndex % stadiumNames.length];
    const stadiumId = stadiumMap[stadiumName];
    stadiumIndex++;

    const homePlaceholder = `Ganador 16avos #${2 * i + 1}`;
    const awayPlaceholder = `Ganador 16avos #${2 * i + 2}`;

    const existingMatch = await prisma.match.findFirst({
      where: {
        stage: MatchStage.ROUND_16,
        homeTeamPlaceholder: homePlaceholder,
        awayTeamPlaceholder: awayPlaceholder,
      },
    });

    if (!existingMatch) {
      await prisma.match.create({
        data: {
          homeTeamPlaceholder: homePlaceholder,
          awayTeamPlaceholder: awayPlaceholder,
          date: matchDate,
          stage: MatchStage.ROUND_16,
          status: MatchStatus.SCHEDULED,
          stadiumId,
        },
      });
    } else {
      await prisma.match.update({
        where: { id: existingMatch.id },
        data: { date: matchDate, stadiumId },
      });
    }
  }

  // Cuartos de Final (8 equipos -> 4 partidos)
  // Fechas: 7 de julio al 9 de julio
  const qfStartDate = new Date("2026-07-07T15:00:00Z");
  for (let i = 0; i < 4; i++) {
    const matchDate = new Date(qfStartDate);
    matchDate.setDate(qfStartDate.getDate() + Math.floor(i / 2)); // 2 partidos por día el 7 y 8, o 9
    matchDate.setHours(15 + (i % 2) * 4, 0, 0, 0);

    const stadiumName = stadiumNames[stadiumIndex % stadiumNames.length];
    const stadiumId = stadiumMap[stadiumName];
    stadiumIndex++;

    const homePlaceholder = `Ganador Octavos #${2 * i + 1}`;
    const awayPlaceholder = `Ganador Octavos #${2 * i + 2}`;

    const existingMatch = await prisma.match.findFirst({
      where: {
        stage: MatchStage.QUARTER_FINALS,
        homeTeamPlaceholder: homePlaceholder,
        awayTeamPlaceholder: awayPlaceholder,
      },
    });

    if (!existingMatch) {
      await prisma.match.create({
        data: {
          homeTeamPlaceholder: homePlaceholder,
          awayTeamPlaceholder: awayPlaceholder,
          date: matchDate,
          stage: MatchStage.QUARTER_FINALS,
          status: MatchStatus.SCHEDULED,
          stadiumId,
        },
      });
    } else {
      await prisma.match.update({
        where: { id: existingMatch.id },
        data: { date: matchDate, stadiumId },
      });
    }
  }

  // Semifinales (4 equipos -> 2 partidos)
  // Fechas: 12 y 13 de julio
  const sfStartDate = new Date("2026-07-12T19:00:00Z");
  for (let i = 0; i < 2; i++) {
    const matchDate = new Date(sfStartDate);
    matchDate.setDate(sfStartDate.getDate() + i);
    matchDate.setHours(19, 0, 0, 0);

    const stadiumName = stadiumNames[stadiumIndex % stadiumNames.length];
    const stadiumId = stadiumMap[stadiumName];
    stadiumIndex++;

    const homePlaceholder = `Ganador Cuartos #${2 * i + 1}`;
    const awayPlaceholder = `Ganador Cuartos #${2 * i + 2}`;

    const existingMatch = await prisma.match.findFirst({
      where: {
        stage: MatchStage.SEMI_FINALS,
        homeTeamPlaceholder: homePlaceholder,
        awayTeamPlaceholder: awayPlaceholder,
      },
    });

    if (!existingMatch) {
      await prisma.match.create({
        data: {
          homeTeamPlaceholder: homePlaceholder,
          awayTeamPlaceholder: awayPlaceholder,
          date: matchDate,
          stage: MatchStage.SEMI_FINALS,
          status: MatchStatus.SCHEDULED,
          stadiumId,
        },
      });
    } else {
      await prisma.match.update({
        where: { id: existingMatch.id },
        data: { date: matchDate, stadiumId },
      });
    }
  }

  // Partido por el Tercer Puesto
  // Fecha: 18 de julio
  const thirdPlaceDate = new Date("2026-07-18T15:00:00Z");
  const tpHomePlaceholder = "Perdedor Semifinal #1";
  const tpAwayPlaceholder = "Perdedor Semifinal #2";
  const tpStadiumId = stadiumMap["Hard Rock Stadium"] || stadiumNames[0]; // Estadios premium para finales

  const existingTPMatch = await prisma.match.findFirst({
    where: {
      stage: MatchStage.THIRD_PLACE,
    },
  });

  if (!existingTPMatch) {
    await prisma.match.create({
      data: {
        homeTeamPlaceholder: tpHomePlaceholder,
        awayTeamPlaceholder: tpAwayPlaceholder,
        date: thirdPlaceDate,
        stage: MatchStage.THIRD_PLACE,
        status: MatchStatus.SCHEDULED,
        stadiumId: tpStadiumId,
      },
    });
  } else {
    await prisma.match.update({
      where: { id: existingTPMatch.id },
      data: { date: thirdPlaceDate, stadiumId: tpStadiumId },
    });
  }

  // Gran Final
  // Fecha: 19 de julio
  const finalDate = new Date("2026-07-19T15:00:00Z");
  const finalHomePlaceholder = "Ganador Semifinal #1";
  const finalAwayPlaceholder = "Ganador Semifinal #2";
  const finalStadiumId = stadiumMap["MetLife Stadium"] || stadiumNames[0];

  const existingFinalMatch = await prisma.match.findFirst({
    where: {
      stage: MatchStage.FINAL,
    },
  });

  if (!existingFinalMatch) {
    await prisma.match.create({
      data: {
        homeTeamPlaceholder: finalHomePlaceholder,
        awayTeamPlaceholder: finalAwayPlaceholder,
        date: finalDate,
        stage: MatchStage.FINAL,
        status: MatchStatus.SCHEDULED,
        stadiumId: finalStadiumId,
      },
    });
  } else {
    await prisma.match.update({
      where: { id: existingFinalMatch.id },
      data: { date: finalDate, stadiumId: finalStadiumId },
    });
  }

  // 6. Liga por defecto (Macena SA)
  console.log("Sembrando liga por defecto...");
  const defaultLeague = await prisma.league.upsert({
    where: { inviteCode: "MACENA2026" },
    update: { name: "Macena SA" },
    create: {
      name: "Macena SA",
      inviteCode: "MACENA2026",
    },
  });
  console.log(`Liga por defecto creada: ${defaultLeague.name} (Código: ${defaultLeague.inviteCode})`);

  // 7. Administrador por defecto
  console.log("Sembrando administrador por defecto...");
  const adminEmail = "admin@macena.com.ar";
  const bcrypt = await import("bcryptjs");
  const passwordHash = await bcrypt.default.hash("MacenaAdmin2026!", 10);
  
  const defaultAdmin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash, role: "ADMIN" },
    create: {
      email: adminEmail,
      name: "Administrador Macena",
      passwordHash,
      role: "ADMIN",
    },
  });
  
  // Asociar admin a la liga
  await prisma.leagueMembership.upsert({
    where: {
      userId_leagueId: {
        userId: defaultAdmin.id,
        leagueId: defaultLeague.id,
      },
    },
    update: {},
    create: {
      userId: defaultAdmin.id,
      leagueId: defaultLeague.id,
      department: "Administración",
      role: "OWNER",
    },
  });
  console.log(`Administrador creado: ${defaultAdmin.email}`);

  // 8. Usuario estándar por defecto (no administrador)
  console.log("Sembrando usuario estándar por defecto...");
  const userEmail = "usuario@macena.com.ar";
  const userPasswordHash = await bcrypt.default.hash("MacenaUser2026!", 10);

  const defaultUser = await prisma.user.upsert({
    where: { email: userEmail },
    update: { passwordHash: userPasswordHash, role: "USER" },
    create: {
      email: userEmail,
      name: "Juan Pérez",
      passwordHash: userPasswordHash,
      role: "USER",
    },
  });

  // Asociar usuario regular a la liga
  await prisma.leagueMembership.upsert({
    where: {
      userId_leagueId: {
        userId: defaultUser.id,
        leagueId: defaultLeague.id,
      },
    },
    update: {},
    create: {
      userId: defaultUser.id,
      leagueId: defaultLeague.id,
      department: "Soporte Técnico",
      role: "MEMBER",
    },
  });
  console.log(`Usuario regular creado: ${defaultUser.email}`);

  console.log("¡Siembra de base de datos finalizada con éxito!");
}

main()
  .catch((e) => {
    console.error("Error ejecutando el seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
