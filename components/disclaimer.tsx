'use client';

import { useLang } from '@/lib/lang';

export function Disclaimer() {
  const { t } = useLang();
  const p = t.plan;

  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-200/80">
      <p className="font-medium text-amber-300 mb-1">{p.disclaimerTitle}</p>
      <p>{p.disclaimerBody}</p>
    </div>
  );
}
