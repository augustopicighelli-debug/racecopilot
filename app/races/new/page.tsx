'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Flag, Zap, Target, TrendingDown, ArrowRight, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
import { useLang } from '@/lib/lang';
import { useUnits } from '@/lib/units';
import RaceCatalogPicker, { type CatalogRace } from '@/components/race-catalog-picker';

export default function NewRacePage() {
  const router = useRouter();
  const { t } = useLang();
  const { units, distUnit } = useUnits();
  const imp = units === 'imperial';
  const [runnerId, setRunnerId] = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  // Campos del formulario
  const [name, setName]             = useState('');
  const [distanceKm, setDistanceKm] = useState('');
  const [raceDate, setRaceDate]     = useState('');
  const [city, setCity]             = useState('');
  const [targetTime, setTargetTime] = useState('');
  const [targetPace, setTargetPace] = useState(''); // mm:ss por km (o mi en imperial)
  const [elevGain, setElevGain]     = useState('');
  const [elevLoss, setElevLoss]     = useState('');
  const [goalType, setGoalType]     = useState<'finish' | 'pr' | 'target'>('pr');
  const [splitType, setSplitType]   = useState<'positive' | 'even' | 'negative'>('negative');
  const [distPreset, setDistPreset] = useState<'10' | '21.1' | '42.195' | 'custom'>('custom');
  // Slug del catálogo GPX si se eligió una carrera conocida
  const [gpxSlug, setGpxSlug]       = useState<string | null>(null);

  // Controla si mostrar los campos del form (false = solo se ve el buscador)
  const [formVisible, setFormVisible] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }
      const { data } = await supabase.from('runners').select('id').eq('user_id', session.user.id).maybeSingle();
      if (!data) { router.push('/onboarding'); return; }
      setRunnerId(data.id);
    };
    init();
  }, [router]);

  // Selección desde el catálogo: prellenar todo y mostrar form
  const handleCatalogSelect = (m: CatalogRace) => {
    setGpxSlug(m.slug);   // guardar slug para el mapa
    setName(m.name);
    const distKm = m.distance_km;
    const dispDist = imp ? (distKm / 1.60934).toFixed(2) : distKm.toString();
    setDistanceKm(dispDist);
    const presets = ['10', '21.1', '42.195'] as const;
    const matched = presets.find(p => Math.abs(parseFloat(p) - distKm) < 0.5);
    setDistPreset(matched ?? 'custom');
    if (m.city) setCity(m.city);
    setElevGain(m.gain_m ? (imp ? Math.round(m.gain_m * 3.28084).toString() : m.gain_m.toString()) : '');
    setElevLoss(m.loss_m ? (imp ? Math.round(m.loss_m * 3.28084).toString() : m.loss_m.toString()) : '');
    setFormVisible(true);
  };

  // "Mi carrera no figura": limpiar campos y mostrar form en blanco
  const handleManual = () => {
    setGpxSlug(null);   // sin GPX
    setName('');
    setDistanceKm('');
    setRaceDate('');
    setCity('');
    setTargetTime('');
    setElevGain('');
    setElevLoss('');
    setDistPreset('custom');
    setFormVisible(true);
  };

  const parseTime = (t: string): number | null => {
    const parts = t.trim().split(':').map(Number);
    if (parts.some(isNaN)) return null;
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return null;
  };

  // Convierte segundos totales → "H:MM:SS"
  const secsToTime = (s: number): string => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  };

  // Convierte ritmo "mm:ss" → segundos/km
  const parsePace = (p: string): number | null => {
    const parts = p.trim().split(':').map(Number);
    if (parts.length === 2 && !parts.some(isNaN)) return parts[0] * 60 + parts[1];
    return null;
  };

  // Convierte segundos/km → "m:ss"
  const secsToMss = (s: number): string => {
    const m = Math.floor(s / 60);
    const sec = Math.round(s % 60);
    return `${m}:${String(sec).padStart(2,'0')}`;
  };

  // Al cambiar tiempo: calcular ritmo si hay distancia
  const handleTimeChange = (val: string) => {
    setTargetTime(val);
    const secs = parseTime(val);
    const dist = parseFloat(distanceKm);
    if (secs && dist > 0) {
      const paceS = secs / (imp ? dist * 1.60934 : dist);
      setTargetPace(secsToMss(paceS));
    }
  };

  // Al cambiar ritmo: calcular tiempo si hay distancia
  const handlePaceChange = (val: string) => {
    setTargetPace(val);
    const paceS = parsePace(val);
    const dist = parseFloat(distanceKm);
    if (paceS && dist > 0) {
      const totalS = Math.round(paceS * (imp ? dist * 1.60934 : dist));
      setTargetTime(secsToTime(totalS));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!runnerId) return;
    setLoading(true);
    setError('');
    try {
      let targetTimeSec: number | null = null;
      if (targetTime.trim()) {
        targetTimeSec = parseTime(targetTime);
        if (!targetTimeSec) throw new Error(t.raceForm.invalidTime);
      }
      // Convertir a métrico antes de guardar (DB siempre en km y metros)
      const distKm    = imp ? parseFloat(distanceKm) * 1.60934 : parseFloat(distanceKm);
      const elevM     = elevGain ? (imp ? parseFloat(elevGain) / 3.28084 : parseFloat(elevGain)) : null;
      const elevLossM = elevLoss ? (imp ? parseFloat(elevLoss) / 3.28084 : parseFloat(elevLoss)) : null;

      const { data: newRace, error: err } = await supabase.from('races').insert({
        runner_id:      runnerId,
        name:           name.trim(),
        distance_km:    distKm,
        race_date:      raceDate,
        city:           city.trim() || null,
        target_time_s:  targetTimeSec,
        elevation_gain: elevM,
        elevation_loss: elevLossM,
        goal_type:      goalType,
        split_type:     splitType,
        gpx_slug:       gpxSlug,
      }).select('id').single();
      if (err) throw err;
      router.push(`/races/${newRace.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { background: 'var(--input)', borderColor: 'var(--border)', color: 'var(--foreground)' };
  const labelStyle = { color: 'var(--muted-foreground)' };

  return (
    <div className="min-h-screen px-4 py-10" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <div className="max-w-md mx-auto">

        <button onClick={() => router.push('/dashboard')} className="text-sm mb-6 block" style={{ color: 'var(--muted-foreground)' }}>
          {t.common.back}
        </button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold">{t.raceForm.titleNew}</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
            {t.raceForm.subtitleNew}
          </p>
        </div>

        <div className="rounded-xl border p-6" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: '#7f1d1d33', color: '#fca5a5', border: '1px solid #991b1b' }}>
              {error}
            </div>
          )}

          {/* Buscador de catálogo — siempre visible arriba */}
          <RaceCatalogPicker
            onSelect={handleCatalogSelect}
            onManual={handleManual}
          />

          {/* Campos del form: solo se muestran después de elegir catálogo o manual */}
          {formVisible && (
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">

              <div>
                <label className="block text-sm font-medium mb-1" style={labelStyle}>{t.raceForm.fieldName}</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Maratón de Mendoza 2026"
                  className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none" style={inputStyle} required />
              </div>

              {/* Presets de distancia */}
              <div>
                <label className="block text-sm font-medium mb-2" style={labelStyle}>{t.raceForm.fieldDistance}</label>
                <div className="grid grid-cols-4 gap-1.5 mb-2">
                  {(['10', '21.1', '42.195', 'custom'] as const).map((p) => {
                    const label = p === '10' ? '10K' : p === '21.1' ? 'Media' : p === '42.195' ? 'Maratón' : 'Otra';
                    return (
                      <button
                        key={p} type="button"
                        onClick={() => {
                          setDistPreset(p);
                          if (p !== 'custom') setDistanceKm(p);
                        }}
                        className="py-1.5 rounded-lg text-xs font-semibold border transition-colors"
                        style={{
                          background:  distPreset === p ? 'rgba(249,115,22,0.12)' : 'var(--muted)',
                          color:       distPreset === p ? '#f97316'               : 'var(--muted-foreground)',
                          borderColor: distPreset === p ? 'rgba(249,115,22,0.5)'  : 'var(--border)',
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                <div className="relative">
                  <input type="number" step="0.001" min="0.1" value={distanceKm}
                    onChange={(e) => { setDistanceKm(e.target.value); setDistPreset('custom'); }}
                    placeholder={imp ? '26.2' : '42.195'}
                    className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none pr-10" style={inputStyle} required />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--muted-foreground)' }}>{distUnit}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={labelStyle}>{t.raceForm.fieldDate}</label>
                <input type="date" value={raceDate} onChange={(e) => setRaceDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none" style={inputStyle} required />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={labelStyle}>
                  {t.raceForm.fieldCity}
                </label>
                <input type="text" value={city} onChange={(e) => setCity(e.target.value)}
                  placeholder="Mendoza"
                  className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none" style={inputStyle} required />
                <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>Necesaria para obtener el pronóstico de clima real.</p>
              </div>

              {/* Objetivo de la carrera */}
              <div>
                <label className="block text-sm font-medium mb-2" style={labelStyle}>{t.goal.label}</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'finish' as const, Icon: Flag,   title: t.goal.finishTitle, desc: t.goal.finishDesc },
                    { value: 'pr'     as const, Icon: Zap,    title: t.goal.prTitle,     desc: t.goal.prDesc },
                    { value: 'target' as const, Icon: Target, title: t.goal.targetTitle, desc: t.goal.targetDesc },
                  ].map(({ value, Icon, title, desc }) => (
                    <button
                      key={value} type="button" onClick={() => setGoalType(value)}
                      className="py-3 px-2 rounded-xl text-left border transition-colors"
                      style={{
                        background:  goalType === value ? 'rgba(249,115,22,0.12)' : 'var(--muted)',
                        borderColor: goalType === value ? 'rgba(249,115,22,0.5)'  : 'var(--border)',
                      }}
                    >
                      <div className="flex justify-center mb-1"><Icon size={16} style={{ color: goalType === value ? '#f97316' : 'var(--muted-foreground)' }} /></div>
                      <p className="text-xs font-semibold text-center" style={{ color: goalType === value ? '#f97316' : 'var(--foreground)' }}>
                        {title}
                      </p>
                      <p className="text-xs text-center mt-0.5 leading-tight opacity-60" style={{ color: 'var(--muted-foreground)' }}>
                        {desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tiempo y ritmo — se calculan mutuamente */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1" style={labelStyle}>
                    {t.race.targetTime} <span style={{ color: 'var(--border)' }}>{goalType === 'target' ? t.goal.timeRequired : `(${t.common.optional})`}</span>
                  </label>
                  <input type="text" value={targetTime} onChange={(e) => handleTimeChange(e.target.value)}
                    placeholder="3:45:00"
                    className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none" style={inputStyle} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={labelStyle}>
                    {t.raceForm.fieldPace} <span style={{ color: 'var(--border)' }}>({t.common.optional})</span>
                  </label>
                  <div className="relative">
                    <input type="text" value={targetPace} onChange={(e) => handlePaceChange(e.target.value)}
                      placeholder="5:20"
                      className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none pr-12" style={inputStyle} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--muted-foreground)' }}>/{distUnit}</span>
                  </div>
                </div>
              </div>

              {/* Ascenso y descenso */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1" style={labelStyle}>
                    {t.raceForm.fieldElevGain} <span style={{ color: 'var(--border)' }}>({t.common.optional})</span>
                  </label>
                  <div className="relative">
                    <input type="number" min="0" value={elevGain} onChange={(e) => setElevGain(e.target.value)}
                      placeholder={imp ? '820' : '250'}
                      className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none pr-8" style={inputStyle} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--muted-foreground)' }}>{imp ? 'ft' : 'm'}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={labelStyle}>
                    {t.raceForm.fieldElevLoss} <span style={{ color: 'var(--border)' }}>({t.common.optional})</span>
                  </label>
                  <div className="relative">
                    <input type="number" min="0" value={elevLoss} onChange={(e) => setElevLoss(e.target.value)}
                      placeholder={imp ? '820' : '250'}
                      className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none pr-8" style={inputStyle} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--muted-foreground)' }}>{imp ? 'ft' : 'm'}</span>
                  </div>
                </div>
              </div>

              {/* Selector de estrategia de split — estilo ObjectiveCards */}
              <div>
                <label className="block text-sm font-medium mb-2" style={labelStyle}>
                  Estrategia de ritmo
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {([
                    { val: 'negative' as const, label: 'Negativo', Icon: TrendingDown, desc: 'Arrancá conservador, acelerá al final' },
                    { val: 'even'     as const, label: 'Neutro',   Icon: ArrowRight,   desc: 'Ritmo parejo de principio a fin' },
                    { val: 'positive' as const, label: 'Positivo', Icon: TrendingUp,   desc: 'Arrancá fuerte, administrá al final' },
                  ]).map(opt => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setSplitType(opt.val)}
                      className={`rounded-xl border p-3 text-left transition-all ${splitType === opt.val ? 'ring-2 ring-[var(--primary)] border-[var(--primary)]' : 'opacity-60 hover:opacity-90'}`}
                      style={{ background: 'var(--card)', borderColor: splitType === opt.val ? 'var(--primary)' : 'var(--border)' }}
                    >
                      <div className="mb-1"><opt.Icon size={16} style={{ color: splitType === opt.val ? 'var(--primary)' : 'var(--muted-foreground)' }} /></div>
                      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>{opt.label}</p>
                      <p className="text-xs mt-1 leading-tight" style={{ color: 'var(--foreground)' }}>{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={loading || !runnerId}
                className="w-full py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
                style={{ background: 'var(--primary)', color: '#fff' }}>
                {loading ? t.common.saving : t.raceForm.submitNew}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
