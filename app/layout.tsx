import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
// Pixels de analytics: GA4 + Meta Pixel + captura de UTMs
// Se montan en todas las páginas de la app. Solo disparan si hay env vars configuradas.
import { AnalyticsPixels } from '@/lib/analytics/pixels';

export const metadata: Metadata = {
  title: {
    default:  'RaceCopilot — Genera tu plan de maratón personalizado | Boston, NYC, Berlin',
    template: '%s · RaceCopilot',
  },
  description:
    'Plan de maratón personalizado basado en tus tiempos reales. Ritmo km a km, hidratación, geles y clima ajustados. Funciona para Boston Marathon, NYC Marathon, Berlin Marathon y 500+ carreras.',
  keywords: [
    'plan de maratón', 'plan de carrera', 'marathon pacing strategy', 'ritmo por km',
    'hidratación carrera', 'nutrición running', 'predictor de tiempo carrera',
    'Boston Marathon plan', 'NYC Marathon plan', 'Berlin Marathon plan',
    'plan personalizado running', 'race plan generator',
    'entrenamiento maratón', 'estrategia maratón',
  ],
  authors: [{ name: 'RaceCopilot' }],
  creator: 'RaceCopilot',
  openGraph: {
    title:       'RaceCopilot — Plan de maratón personalizado',
    description: 'Ritmo km a km, agua, geles y estrategia. Funciona para Boston, NYC, Berlin. Machine learning + clima real. Baja tu marca o reembolso.',
    url:         'https://racecopilot.com',
    siteName:    'RaceCopilot',
    locale:      'es_AR',
    type:        'website',
    images: [{ url: '/hero-runner.jpg', width: 1200, height: 630, alt: 'RaceCopilot — plan de maratón personalizado' }],
  },
  twitter: {
    card:        'summary_large_image',
    title:       'RaceCopilot — Plan de maratón personalizado',
    description: 'Ritmo km a km, agua, geles y clima. Genera tu plan en 2 minutos. 7 días gratis, sin tarjeta.',
    images:      ['/hero-runner.jpg'],
  },
  metadataBase: new URL('https://racecopilot.com'),
  alternates: {
    canonical: 'https://racecopilot.com',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased">
        <Providers>{children}</Providers>
        {/* Pixels cargan after-interactive, no bloquean render */}
        <AnalyticsPixels />
      </body>
    </html>
  );
}
