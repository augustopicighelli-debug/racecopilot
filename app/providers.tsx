'use client';
import { UnitsProvider } from '@/lib/units';

// Wrapper client-side para envolver el layout (que es Server Component)
export function Providers({ children }: { children: React.ReactNode }) {
  return <UnitsProvider>{children}</UnitsProvider>;
}
