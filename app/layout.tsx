import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DSENG Prospecção — Painel",
  description: "Painel de prospecção qualificada da DSENG DESIGNER: rodadas, leads e aprovação de lotes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
