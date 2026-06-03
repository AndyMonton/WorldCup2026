export const LEAGUE_SECTORS: Record<string, string[]> = {
  "MACENA2026": [
    "Programación",
    "Soporte Técnico",
    "Administración",
    "Recursos Humanos",
    "Ventas y Marketing",
    "Operaciones",
  ],
  "DEPORTES2026": [
    "Comisión Directiva",
    "Socios",
    "Entrenadores",
    "Preparadores Físicos",
    "Mantenimiento",
    "Administrativos",
  ],
};

export const DEFAULT_SECTORS = [
  "Administración",
  "Ventas",
  "Operaciones",
  "Otro",
];

export function getSectorsForLeague(inviteCode: string): string[] {
  const code = inviteCode.toUpperCase().trim();
  return LEAGUE_SECTORS[code] || DEFAULT_SECTORS;
}
