require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const pg = require("pg");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL no está definida.");
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const nameCorrections = {
  "Livnl Msi": "Lionel Messi",
  "Arling Halnd": "Erling Haaland",
  "K. Mbappé": "Kylian Mbappé",
  "Jvd Blingham": "Jude Bellingham",
  "Markvs Rshfvrd": "Marcus Rashford",
  "Hri Kin": "Harry Kane",
  "Ptar Mvsa": "Petar Musa",
  "Martin Batvrina": "Martin Baturina",
  "Abas Bk Fiz Allh Af": "Abbosbek Fayzullaev",
  "Dnil Mvnvz": "Daniel Muñoz",
  "Lviiz Diaz": "Luis Díaz",
  "Khamintvn Kampaz": "Jaminton Campaz",
  "Abdallh Alamri": "Abdulelah Al-Amri",
  "Maksimilianv Araivkhv": "Maximiliano Araújo",
  "Rvmanv Ashmid": "Romano Schmid",
  "Izn Alarb": "Yazan Al-Arab",
  "Ali Avlvan": "Ali Olwan",
  "Aimn Hsin": "Aymen Hussein",
  "Kalb Iirnki": "Caleb Wiley",
  "Ramin Rzaiian": "Ramin Rezaeian",
  "Mohamed Mhbi": "Mohammad Mohebi",
  "Ali Jast": "Elijah Just",
  "J. Quiñones": "Julián Quiñones",
  "R. Jiménez": "Raúl Jiménez",
  "Felix Nmecha": "Felix Nmecha",
  "N. Schlotterbeck": "Nico Schlotterbeck",
  "K. Havertz": "Kai Havertz",
  "J. Musiala": "Jamal Musiala",
  "N. Brown": "Noah Brown",
  "D. Undav": "Deniz Undav",
  "L. Comenencia": "Livano Comenencia",
  "I.B. Hwang": "In-beom Hwang",
  "H.G. Oh": "Hyeon-gyu Oh",
  "L. Krejčí": "Ladislav Krejčí",
  "C. Larin": "Cyle Larin",
  "Jovo Lukić": "Jovo Lukić",
  "B. Khoukhi": "Boualem Khoukhi",
  "Breel Embolo": "Breel Embolo",
  "J. McGinn": "John McGinn",
  "V. Júnior": "Vinícius Júnior",
  "I. Saibari": "Ismael Saibari",
  "Nestory Irankunda": "Nestory Irankunda",
  "C. Metcalfe": "Connor Metcalfe",
  "J. Neves": "João Neves",
  "Y. Wissa": "Yoane Wissa",
  "B. Barcola": "Bradley Barcola",
  "I. Mbaye": "Ibrahima Mbaye",
  "Virgil van Dijk": "Virgil van Dijk",
  "C. Summerville": "Crysencio Summerville",
  "K. Nakamura": "Keito Nakamura",
  "K. Ogawa": "Koki Ogawa",
  "Y.Ayari": "Yasin Ayari",
  "A. Isak": "Alexander Isak",
  "V. Gyökeres": "Viktor Gyökeres",
  "M. Svanberg": "Mattias Svanberg",
  "O. Rekik": "Omar Rekik"
};

function parseScorersString(scorersStr) {
  if (!scorersStr || scorersStr === "null" || scorersStr.trim() === "") {
    return [];
  }

  let clean = scorersStr.replace(/[{}]/g, "");
  clean = clean.replace(/[“”"']/g, "");

  const parts = clean.split(",");
  const scorersMap = {};

  let lastPlayerName = "";

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const hasLetters = /[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(trimmed);

    if (hasLetters) {
      const match = trimmed.match(/^([^0-9]+)/);
      if (match) {
        let name = match[1].trim();
        if (nameCorrections[name]) {
          name = nameCorrections[name];
        }
        const goalsCount = 1;

        scorersMap[name] = (scorersMap[name] || 0) + goalsCount;
        lastPlayerName = name;
      }
    } else {
      if (lastPlayerName) {
        const goalsCount = 1;
        scorersMap[lastPlayerName] = (scorersMap[lastPlayerName] || 0) + goalsCount;
      }
    }
  }

  return Object.entries(scorersMap).map(([name, goals]) => ({ name, goals }));
}

async function main() {
  console.log("Recalculando tabla de goleadores...");
  
  await prisma.scorer.deleteMany();

  const finishedMatches = await prisma.match.findMany({
    where: { status: "FINISHED" },
  });

  const scorersMap = {};

  for (const match of finishedMatches) {
    if (match.homeTeamId && match.homeScorers) {
      const parsedHome = parseScorersString(match.homeScorers);
      for (const p of parsedHome) {
        const key = `${p.name}_${match.homeTeamId}`;
        if (!scorersMap[key]) {
          scorersMap[key] = { teamId: match.homeTeamId, goals: 0 };
        }
        scorersMap[key].goals += p.goals;
      }
    }
    if (match.awayTeamId && match.awayScorers) {
      const parsedAway = parseScorersString(match.awayScorers);
      for (const p of parsedAway) {
        const key = `${p.name}_${match.awayTeamId}`;
        if (!scorersMap[key]) {
          scorersMap[key] = { teamId: match.awayTeamId, goals: 0 };
        }
        scorersMap[key].goals += p.goals;
      }
    }
  }

  for (const [key, val] of Object.entries(scorersMap)) {
    const name = key.substring(0, key.lastIndexOf("_"));
    await prisma.scorer.create({
      data: {
        name,
        teamId: val.teamId,
        goals: val.goals,
      },
    });
  }

  console.log("¡Recalculado con éxito!");

  const scorers = await prisma.scorer.findMany({
    include: { team: true },
    orderBy: { goals: "desc" }
  });

  console.log("Goleadores actuales en DB:");
  scorers.forEach((s) => {
    console.log(`- ${s.name} (${s.team.name}): ${s.goals} goles`);
  });

  await prisma.$disconnect();
  await pool.end();
}

main().catch(console.error);
