import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let prismaInstance: PrismaClient;

const connectionString = process.env.DATABASE_URL;

if (globalForPrisma.prisma) {
  prismaInstance = globalForPrisma.prisma;
} else {
  // En fase de compilación/build de Next.js, DATABASE_URL puede no estar disponible.
  // Usamos una conexión dummy para evitar que el compilador falle al instanciar el cliente.
  const pool = new pg.Pool({
    connectionString: connectionString || "postgresql://dummy:dummy@localhost:5432/dummy",
  });
  const adapter = new PrismaPg(pool);

  prismaInstance = new PrismaClient({
    adapter,
  });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prismaInstance;
  }
}

export const prisma = prismaInstance;
