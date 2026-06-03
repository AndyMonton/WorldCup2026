import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Prode Mundial de Fútbol 2026 | Macena SA",
  description: "Plataforma de pronósticos para el Mundial de Fútbol 2026. Jugá, competí en ligas privadas y seguí las clasificaciones en tiempo real.",
  keywords: "Prode, Mundial 2026, Fútbol, Macena SA, Pronósticos, Clasificación, Ligas",
  authors: [{ name: "Macena SA" }],
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${outfit.variable} dark h-full antialiased`} style={{ colorScheme: "dark" }}>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
