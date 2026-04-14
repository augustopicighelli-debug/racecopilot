import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: {
    default:  'RaceCopilot — Tu plan de carrera inteligente',
    template: '%s · RaceCopilot',
  },
  description:
    'Generá un plan personalizado de hidratación, nutrición y ritmo para tu próxima carrera — calibrado con tus tiempos reales y el clima del día.',
  openGraph: {
    title:       'RaceCopilot — Tu plan de carrera inteligente',
    description: 'Hidratación, nutrición y ritmo km a km. 7 días de prueba gratis.',
    url:         'https://racecopilot.vercel.app',
    siteName:    'RaceCopilot',
    locale:      'es_AR',
    type:        'website',
    images: [{ url: '/hero-runner.jpg', width: 1200, height: 630, alt: 'RaceCopilot' }],
  },
  twitter: {
    card:        'summary_large_image',
    title:       'RaceCopilot — Tu plan de carrera inteligente',
    description: 'Hidratación, nutrición y ritmo km a km. 7 días de prueba gratis.',
    images:      ['/hero-runner.jpg'],
  },
  metadataBase: new URL('https://racecopilot.vercel.app'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
