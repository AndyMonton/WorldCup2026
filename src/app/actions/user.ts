"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function updateUserImage(base64Image: string) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: "No autenticado." };
    }

    if (!base64Image.startsWith("data:image/")) {
      return { success: false, error: "Formato de imagen no válido." };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { image: base64Image },
    });

    revalidatePath("/dashboard");
    revalidatePath("/predictions");
    revalidatePath("/ranking");

    return { success: true, error: null };
  } catch (error) {
    console.error("Error al actualizar la foto de perfil:", error);
    return { success: false, error: "Error al actualizar la foto de perfil." };
  }
}

export async function changeUserPassword(prevState: any, formData: FormData) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: "No autenticado." };
    }

    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: "La nueva contraseña debe tener al menos 6 caracteres." };
    }

    if (newPassword !== confirmPassword) {
      return { success: false, error: "Las contraseñas no coinciden." };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { success: false, error: "Usuario no encontrado." };
    }

    // Validar contraseña actual si el usuario se registró con credenciales
    if (user.passwordHash) {
      if (!currentPassword) {
        return { success: false, error: "Es necesario ingresar tu contraseña actual." };
      }
      const match = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!match) {
        return { success: false, error: "La contraseña actual es incorrecta." };
      }
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    return { success: true, error: null };
  } catch (error) {
    console.error("Error al cambiar contraseña de usuario:", error);
    return { success: false, error: "Ocurrió un error inesperado al cambiar la contraseña." };
  }
}

