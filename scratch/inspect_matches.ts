import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL no está definida.");
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Obteniendo todos los partidos de la base de datos...");
  const matches = await prisma.match.findMany({
    include: {
      homeTeam: true,
      awayTeam: true,
    },
    orderBy: {
      date: "asc",
    },
  });

  console.log(`Total de partidos encontrados: ${matches.length}`);
  
  // Agrupar por fecha formateada (YYYY-MM-DD en hora local de Argentina, que es UTC-3)
  const groups: Record<string, typeof matches> = {};
  for (const m of matches) {
    const arDate = new Date(m.date.getTime() - 3 * 60 * 60 * 1000);
    const dateStr = arDate.toISOString().split("T")[0];
    if (!groups[dateStr]) {
      groups[dateStr] = [];
    }
    groups[dateStr].push(m);
  }

  for (const [dateStr, list] of Object.entries(groups)) {
    console.log(`\nFecha: ${dateStr} (Total: ${list.length})`);
    for (const m of list) {
      const homeName = m.homeTeam?.name || m.homeTeamPlaceholder || "TBD";
      const awayName = m.awayTeam?.name || m.awayTeamPlaceholder || "TBD";
      // Convertir a hora de Argentina (restar 3 horas a UTC)
      const arDate = new Date(m.date.getTime() - 3 * 60 * 60 * 1000);
      const hours = arDate.getUTCHours().toString().padStart(2, "0");
      const minutes = arDate.getUTCMinutes().toString().padStart(2, "0");
      console.log(`  - [${m.stage}] ${hours}:${minutes} ARG - ${homeName} vs ${awayName} (ID: ${m.id})`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
