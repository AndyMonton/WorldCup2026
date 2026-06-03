"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";

export async function loginWithCredentials(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return {
      error: "Por favor, ingresá tu correo y contraseña.",
      success: false,
    };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false, // Manejamos la redirección en el cliente para mejor UX
    });

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
        case "CallbackRouteError":
          return { error: "Correo electrónico o contraseña incorrectos.", success: false };
        default:
          return { error: "Error de inicio de sesión: " + error.message, success: false };
      }
    }
    // Si es un error desconocido de redirección de Next.js, lo relanzamos
    if ((error as any).message?.includes("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("Error al iniciar sesión:", error);
    return { error: "Ocurrió un error inesperado.", success: false };
  }
}

export async function loginWithGoogle() {
  try {
    await signIn("google", { redirectTo: "/dashboard" });
  } catch (error) {
    if ((error as any).message?.includes("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("Error al iniciar sesión con Google:", error);
  }
}
