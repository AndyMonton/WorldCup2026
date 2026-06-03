"use server";

import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  inviteCode: z.string().min(1, "El código de invitación es requerido"),
  department: z.string().optional().default("PENDIENTE"),
  internalGroup: z.string().optional().nullable(),
});

export async function registerUser(prevState: any, formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const inviteCode = formData.get("inviteCode") as string;
  const department = (formData.get("department") as string) || "PENDIENTE";
  const internalGroup = formData.get("internalGroup") as string;

  const result = registerSchema.safeParse({
    name,
    email,
    password,
    inviteCode,
    department,
    internalGroup,
  });

  if (!result.success) {
    return {
      error: result.error.issues[0].message,
      success: false,
    };
  }

  const data = result.data;

  try {
    // 1. Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return {
        error: "El correo electrónico ya está registrado.",
        success: false,
      };
    }

    // 2. Verificar que la liga exista por el código de invitación (insensible a mayúsculas/minúsculas)
    const league = await prisma.league.findUnique({
      where: { inviteCode: data.inviteCode.toUpperCase().trim() },
    });

    if (!league) {
      return {
        error: "El código de invitación no corresponde a ninguna liga activa.",
        success: false,
      };
    }

    // 3. Hashear la contraseña
    const passwordHash = await bcrypt.hash(data.password, 10);

    // 4. Crear el usuario y su membresía a la liga en una transacción
    await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          passwordHash,
          role: "USER",
        },
      });

      await tx.leagueMembership.create({
        data: {
          userId: newUser.id,
          leagueId: league.id,
          department: data.department,
          internalGroup: data.internalGroup || null,
          role: "MEMBER",
        },
      });
    });

    return {
      success: true,
      error: null,
    };
  } catch (error: any) {
    console.error("Error en registro:", error);
    return {
      error: "Ocurrió un error inesperado al registrar el usuario.",
      success: false,
    };
  }
}
