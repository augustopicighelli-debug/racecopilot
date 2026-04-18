import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
// Pixels de analytics: GA4 + Meta Pixel + captura de UTMs
// Se montan en todas las páginas de la app. Solo disparan si hay env vars configuradas.
import { AnalyticsPixels } from '@/lib/analytics/pixels';

export const metadata: Metadata = {
  title: {
    default:  'RaceCopilot — Tu plan de carrera inteligente',
    template: '%s · RaceCopilot',
  },
  description:
    'Generá un plan personalizado de hidratación, nutrición y ritmo para tu próxima carrera — calibrado con tus tiempos reales y el clima del día.',
  keywords: [
    'plan de carrera', 'maratón', 'running', 'ritmo por km', 'hidratación carrera',
    'nutrición running', 'predictor de tiempo', 'plan personalizado running',
    'race plan', 'marathon pacing', 'running nutrition plan',
  ],
  authors: [{ name: 'RaceCopilot' }],
  creator: 'RaceCopilot',
  openGraph: {
    title:       'RaceCopilot — Tu plan de carrera inteligente',
    description: 'Hidratación, nutrición y ritmo km a km. 7 días de prueba gratis.',
    url:         'https://racecopilot.com',
    siteName:    'RaceCopilot',
    locale:      'es_AR',
    type:        'website',
    images: [{ url: '/hero-runner.jpg', width: 1200, height: 630, alt: 'RaceCopilot — plan de carrera' }],
  },
  twitter: {
    card:        'summary_large_image',
    title:       'RaceCopilot — Tu plan de carrera inteligente',
    description: 'Hidratación, nutrición y ritmo km a km. 7 días de prueba gratis.',
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
