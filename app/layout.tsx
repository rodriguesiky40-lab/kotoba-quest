import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kotoba Quest — Aprenda idiomas vivendo uma aventura",
  description: "Aprenda idiomas com tutores inteligentes, aulas interativas, histórias, desafios e uma jornada feita para você.",
  manifest: "/manifest.webmanifest"
};

export const viewport: Viewport = {
  themeColor: "#f8f7fc"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
