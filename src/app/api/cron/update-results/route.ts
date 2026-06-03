import { NextRequest, NextResponse } from "next/server";
import { runAutomatedResultsUpdate } from "@/lib/results-loader";

// Forzar ejecución dinâmica
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // 1. Validar autorización de Vercel Cron Job
    // Vercel envía una cabecera "Authorization: Bearer <CRON_SECRET>"
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // Solo validar si está configurada la variable en producción
    if (process.env.NODE_ENV === "production" && cronSecret) {
      if (authHeader !== `Bearer ${cronSecret}`) {
        return new NextResponse("Acceso no autorizado", { status: 401 });
      }
    }

    console.log("[CRON JOB] Iniciando ejecución de actualización de resultados...");
    
    // 2. Ejecutar actualización
    const result = await runAutomatedResultsUpdate();
    
    console.log("[CRON JOB] Ejecución finalizada con éxito.");
    
    return NextResponse.json({
      success: true,
      message: "Proceso de actualización ejecutado correctamente.",
      data: result,
    });
  } catch (error: any) {
    console.error("[CRON JOB ERROR] Falló la ejecución:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Ocurrió un error inesperado.",
      },
      { status: 500 }
    );
  }
}
