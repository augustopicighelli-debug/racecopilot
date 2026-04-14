import type { Metadata } from 'next';

export const metadata: Metadata = {
  title:       'Precios',
  description: 'Planes y precios de RaceCopilot. Probá 7 días gratis y generá tu primer plan personalizado de running.',
  openGraph: {
    title:       'Precios · RaceCopilot',
    description: 'Probá 7 días gratis. Plan personalizado de ritmo, hidratación y nutrición para tu próxima carrera.',
    url:         'https://racecopilot.vercel.app/pricing',
  },
  alternates: {
    canonical: 'https://racecopilot.vercel.app/pricing',
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
