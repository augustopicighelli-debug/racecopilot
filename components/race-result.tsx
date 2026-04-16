'use client';

// Componente de comparación plan vs resultado real.
// Muestra el formulario para ingresar el tiempo real y,
// una vez guardado, la comparativa con el plan generado.
import { useState } from 'react';
import { useLang } from '@/lib/lang';

interface RaceResultProps {
  raceId:        string;
  planTimeS:     number;           // tiempo pronosticado por el plan
  planPaceS:     number;           // ritmo pronosticado (s/km)
  distanceKm:    number;
  actualTimeS:   number | null;    // resultado guardado (null = aún no registrado)
  onSave:        (s: number) => void; // callback tras guardar
}

// Formatea segundos → H:MM:SS
function fmtTime(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}

// Formatea s/km → M:SS /km
function fmtPace(sPerKm: number) {
  const m   = Math.floor(sPerKm / 60);
  const sec = Math.round(sPerKm % 60);
  return `${m}:${String(sec).padStart(2,'0')} /km`;
}

// Parsea "H:MM:SS" o "M:SS" → segundos
function parseTime(val: string): number | null {
  const parts = val.trim().split(':').map(Number);
  if (parts.some(isNaN)) return null;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return null;
}

export function RaceResult({ raceId, planTimeS, planPaceS, distanceKm, actualTimeS, onSave }: RaceResultProps) {
  const [editing, setEditing] = useState(false);
  const [input,   setInput]   = useState(actualTimeS ? fmtTime(actualTimeS) : '');
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const { t } = useLang();

  const handleSave = async () => {
    const secs = parseTime(input);
    if (!secs || secs <= 0) { setError(t.result.invalidFormat); return; }
    setSaving(true);
    setError('');
    try {
      const { supabase } = await import('@/lib/supabase-client');
      const { error: err } = await supabase.from('races').update({ actual_time_s: secs }).eq('id', raceId);
      if (err) throw err;
      onSave(secs);
      setEditing(false);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Si ya hay resultado: mostrar comparativa ──────────────────────────────
  if (actualTimeS && !editing) {
    const diffS         = actualTimeS - planTimeS;
    const diffPct       = ((diffS / planTimeS) * 100).toFixed(1);
    const actualPaceS   = actualTimeS / distanceKm;
    const paceDiffS     = actualPaceS - planPaceS;
    const faster        = diffS < 0;
    const accentColor   = faster ? '#22c55e' : diffS > 0 ? '#ef4444' : '#a1a1aa';
    const diffLabel     = faster
      ? t.result.faster(fmtTime(Math.abs(diffS)), String(Math.abs(Number(diffPct))))
      : diffS > 0
      ? t.result.slower(fmtTime(diffS), diffPct)
      : t.result.exact;

    return (
      <div className="rounded-xl border p-5" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between mb-4">
          <p className="font-semibold text-sm">{t.result.title}</p>
          <button onClick={() => setEditing(true)} className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            {t.common.edit}
          </button>
        </div>

        {/* Comparativa lado a lado */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-lg p-3 text-center" style={{ background: 'var(--muted)' }}>
            <p className="text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>{t.result.labelPlan}</p>
            <p className="text-xl font-bold tabular-nums">{fmtTime(planTimeS)}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{fmtPace(planPaceS)}</p>
          </div>
          <div className="rounded-lg p-3 text-center" style={{ background: 'var(--muted)', border: `1px solid ${accentColor}40` }}>
            <p className="text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>{t.result.labelActual}</p>
            <p className="text-xl font-bold tabular-nums" style={{ color: accentColor }}>{fmtTime(actualTimeS)}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{fmtPace(actualPaceS)}</p>
          </div>
        </div>

        {/* Diferencia */}
        <div className="rounded-lg px-4 py-3 text-center text-sm font-semibold" style={{ background: `${accentColor}15`, color: accentColor }}>
          {diffLabel}
        </div>

        {/* Barra de diferencia de ritmo */}
        <div className="mt-3 flex items-center gap-2 text-xs" style={{ color: 'var(--muted-foreground)' }}>
          <span>{t.result.actualPace}</span>
          <span className="font-mono" style={{ color: accentColor }}>
            {paceDiffS > 0 ? '+' : ''}{fmtPace(Math.abs(paceDiffS)).replace(' /km','')} /km vs plan
          </span>
        </div>
      </div>
    );
  }

  // ── Formulario para ingresar resultado ───────────────────────────────────
  return (
    <div className="rounded-xl border p-5" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
      <p className="font-semibold text-sm mb-1">{t.result.howWasIt}</p>
      <p className="text-xs mb-4" style={{ color: 'var(--muted-foreground)' }}>
        {t.result.recordTime}
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="H:MM:SS"
          className="flex-1 rounded-lg border px-3 py-2 text-sm font-mono"
          style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
          style={{ background: 'var(--primary)', color: '#fff' }}
        >
          {saving ? '...' : t.result.save}
        </button>
        {editing && (
          <button onClick={() => setEditing(false)} className="px-3 py-2 rounded-lg text-sm" style={{ color: 'var(--muted-foreground)' }}>
            ✕
          </button>
        )}
      </div>
      {error && <p className="text-xs mt-2" style={{ color: '#ef4444' }}>{error}</p>}
    </div>
  );
}
