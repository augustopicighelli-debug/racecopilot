import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Precios',
  description: 'Planes y precios de RaceCopilot. 7 días de prueba gratis.',
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
