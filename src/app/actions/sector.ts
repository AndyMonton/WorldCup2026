"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const sectorSchema = z.object({
  department: z.string().min(1, "El sector/departamento es requerido"),
});

export async function saveUserSector(prevState: any, formData: FormData) {
  const department = formData.get("department") as string;
  const result = sectorSchema.safeParse({ department });

  if (!result.success) {
    return {
      error: result.error.issues[0].message,
      success: false,
    };
  }

  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return {
        error: "Sesión no válida o expirada. Por favor, iniciá sesión nuevamente.",
        success: false,
      };
    }

    // Actualizar el sector en la membresía de la liga
    const membership = await prisma.leagueMembership.findFirst({
      where: { userId },
    });

    if (!membership) {
      return {
        error: "No se encontró tu membresía de liga activa.",
        success: false,
      };
    }

    if (membership.department !== "PENDIENTE") {
      return {
        error: "Ya has seleccionado tu sector y no puedes cambiarlo.",
        success: false,
      };
    }

    await prisma.leagueMembership.update({
      where: { id: membership.id },
      data: { department: result.data.department },
    });

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    console.error("Error al guardar el sector:", error);
    return {
      error: "Ocurrió un error al guardar el sector. Por favor, reintentá.",
      success: false,
    };
  }
}
