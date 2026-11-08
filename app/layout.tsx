import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kotoba Quest — Aprenda japonês com a Aiko",
  description: "Aprenda japonês com lições, histórias interativas, missões e a tutora Aiko.",
  manifest: "/manifest.webmanifest"
};

export const viewport: Viewport = {
  themeColor: "#f8f7fc"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
