import type { Metadata } from 'next';

export const metadata: Metadata = {
  title:       'Iniciar sesión',
  description: 'Ingresá a tu cuenta de RaceCopilot.',
  robots:      { index: false, follow: false },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
