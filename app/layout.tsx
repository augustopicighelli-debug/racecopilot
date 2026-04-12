import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RaceCopilot — Tu plan de carrera inteligente',
  description: 'Plan de carrera personalizado ajustado por clima y nutrición',
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
