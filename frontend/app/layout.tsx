import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

// Police du logo (le reste du site garde la police système).
const logoFont = Manrope({ subsets: ["latin"], weight: ["800"], variable: "--font-manrope", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Snow Wild — location de matériel de ski", template: "%s | Snow Wild" },
  description: "Réservez votre matériel de ski en ligne : skis, snowboards, chaussures, casques.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={logoFont.variable}>
      <body className="min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
