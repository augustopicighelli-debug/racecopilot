import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RaceCopilot — Maratón de Mendoza 2026',
  description: 'Plan de carrera personalizado',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased">
        {children}
      </body>
    </html>
  );
}
