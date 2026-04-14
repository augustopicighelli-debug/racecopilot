import type { Metadata } from 'next';

// noindex: dashboard es una página privada, no queremos que aparezca en búsquedas
export const metadata: Metadata = {
  title:  'Dashboard',
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
