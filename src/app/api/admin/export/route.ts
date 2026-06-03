import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import * as XLSX from "xlsx";

export async function GET(req: NextRequest) {
  try {
    // 1. Validar autenticación y rol de administrador
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return new NextResponse("Acceso denegado. Se requiere ser administrador.", { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // 'rankings' | 'predictions'
    const format = searchParams.get("format") || "csv"; // 'csv' | 'xlsx'
    const leagueId = searchParams.get("leagueId");

    if (!type) {
      return new NextResponse("Falta el parámetro 'type'", { status: 400 });
    }

    let dataToExport: any[] = [];
    let filename = "";

    // 2. Obtener datos según la solicitud
    if (type === "rankings") {
      if (!leagueId) {
        return new NextResponse("Falta el parámetro 'leagueId' para exportar rankings", { status: 400 });
      }

      const league = await prisma.league.findUnique({
        where: { id: leagueId },
      });

      if (!league) {
        return new NextResponse("La liga especificada no existe", { status: 404 });
      }

      const memberships = await prisma.leagueMembership.findMany({
        where: { leagueId },
        include: { user: true },
        orderBy: [
          { points: "desc" },
          { exactCount: "desc" },
        ],
      });

      dataToExport = memberships.map((m, index) => ({
        Puesto: index + 1,
        Nombre: m.user.name || "Invitado",
        Email: m.user.email,
        Sector: m.department,
        "Grupo Interno": m.internalGroup || "Ninguno",
        "Aciertos Exactos (10 pts)": m.exactCount,
        "Diferencias de Gol (7 pts)": m.differenceCount,
        "Tendencias (5 pts)": m.tendencyCount,
        "Consuelos (2 pts)": m.consolationCount,
        "Puntos Grupos": m.pointsPhase1,
        "Puntos Eliminatorias 1": m.pointsPhase2,
        "Puntos Eliminatorias 2": m.pointsPhase3,
        "Puntos Totales": m.points,
      }));

      filename = `Rankings_${league.name.replace(/\s+/g, "_")}`;

    } else if (type === "predictions") {
      // Obtener todas las predicciones registradas
      const predictions = await prisma.prediction.findMany({
        include: {
          user: {
            include: {
              memberships: {
                include: { league: true }
              }
            }
          },
          match: {
            include: {
              homeTeam: true,
              awayTeam: true,
            }
          }
        },
        orderBy: { match: { date: "asc" } }
      });

      dataToExport = predictions.map((p) => {
        const homeName = p.match.homeTeam?.name || p.match.homeTeamPlaceholder || "Por definir";
        const awayName = p.match.awayTeam?.name || p.match.awayTeamPlaceholder || "Por definir";
        
        return {
          Usuario: p.user.name || p.user.email,
          Email: p.user.email,
          Liga: p.user.memberships[0]?.league?.name || "Sin liga",
          Sector: p.user.memberships[0]?.department || "Sin sector",
          Partido: `${homeName} vs ${awayName}`,
          Fase: p.match.stage,
          "Pronóstico Local": p.homeScore,
          "Pronóstico Visitante": p.awayScore,
          "Resultado Real Local": p.match.homeScore ?? "-",
          "Resultado Real Visitante": p.match.awayScore ?? "-",
          "Puntos Obtenidos": p.points ?? 0,
          Explicación: p.detail || "Pendiente de juego",
          "Fecha Partido": p.match.date.toISOString(),
          "Fecha Pronóstico": p.createdAt.toISOString(),
        };
      });

      filename = "Auditoria_Predicciones";
    } else {
      return new NextResponse("Tipo de exportación inválido", { status: 400 });
    }

    // 3. Generar y retornar el archivo en el formato solicitado
    if (format === "xlsx") {
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, type === "rankings" ? "Clasificación" : "Pronósticos");
      
      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename=${filename}.xlsx`,
        },
      });
    } else {
      // CSV
      const headers = Object.keys(dataToExport[0] || {}).join(",");
      const rows = dataToExport.map((item) =>
        Object.values(item)
          .map((value) => {
            // Escapar comillas y comas en valores de texto
            const strVal = String(value ?? "");
            if (strVal.includes(",") || strVal.includes('"') || strVal.includes("\n")) {
              return `"${strVal.replace(/"/g, '""')}"`;
            }
            return strVal;
          })
          .join(",")
      );
      
      const csvContent = "\ufeff" + [headers, ...rows].join("\n"); // Añadimos BOM para soporte UTF-8 en Excel

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename=${filename}.csv`,
        },
      });
    }
  } catch (error: any) {
    console.error("Error al exportar datos:", error);
    return new NextResponse("Error interno al exportar datos: " + error.message, { status: 500 });
  }
}
