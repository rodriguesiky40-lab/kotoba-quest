import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kotoba Quest — Aprenda Idiomas com Tutoras Anime",
  description: "Aprenda idiomas com tutoras anime com personalidades tsundere, kuudere, genki girl e ojou-sama em uma jornada estilo Amor Doce e Duolingo.",
  manifest: "/manifest.webmanifest"
};

export const viewport: Viewport = {
  themeColor: "#152332"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
