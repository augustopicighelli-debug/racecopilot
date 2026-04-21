'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Flag, Zap, Target, TrendingDown, ArrowRight, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
import { useLang } from '@/lib/lang';
import { useUnits } from '@/lib/units';
import RaceCatalogPicker, { type CatalogRace } from '@/components/race-catalog-picker';

// Convierte segundos → "H:MM:SS" para mostrar en el input
function fmtTime(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}

// Convierte "H:MM:SS" o "M:SS" → segundos totales
function parseTime(t: string): number | null {
  const parts = t.trim().split(':').map(Number);
  if (parts.some(isNaN)) return null;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return null;
}

export default function EditRacePage() {
  const router = useRouter();
  const params = useParams();
  const id     = params?.id as string;
  const { t } = useLang();
  const { units, distUnit } = useUnits();
  const imp = units === 'imperial';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  // Campos del form
  const [name, setName]             = useState('');
  const [distanceKm, setDistanceKm] = useState('');
  const [raceDate, setRaceDate]     = useState('');
  const [city, setCity]             = useState('');
  const [targetTime, setTargetTime] = useState('');
  const [targetPace, setTargetPace] = useState('');
  const [elevGain, setElevGain]     = useState('');
  const [elevLoss, setElevLoss]     = useState('');
  const [goalType, setGoalType]     = useState<'finish' | 'pr' | 'target'>('pr');
  const [splitType, setSplitType]   = useState<'positive' | 'even' | 'negative'>('negative');
  const [gpxSlug, setGpxSlug]       = useState<string | null>(null);
  const [gpxFile, setGpxFile]       = useState<File | null>(null);
  const [gpxUrl, setGpxUrl]         = useState<string | null>(null); // path en Storage si ya existe
  const [timezone, setTimezone]     = useState<string>('America/Argentina/Buenos_Aires');

  // Cargar datos actuales de la carrera
  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }

      const { data, error: err } = await supabase
        .from('races')
        .select('name,distance_km,race_date,city,target_time_s,elevation_gain,elevation_loss,goal_type,split_type,gpx_slug,gpx_url,timezone')
        .eq('id', id)
        .maybeSingle();

      if (err || !data) { setError(t.raceForm.notFound); setLoading(false); return; }

      // Poblar el form — convertir a imperial si es necesario para mostrar al usuario
      setName(data.name);
      // Distancia: convertir km → millas si imperial
      const distVal = imp ? (data.distance_km * 0.621371) : data.distance_km;
      setDistanceKm(String(parseFloat(distVal.toFixed(3))));
      setRaceDate(data.race_date);
      setCity(data.city ?? '');
      setTargetTime(data.target_time_s ? fmtTime(data.target_time_s) : '');
      if (data.target_time_s && data.distance_km) {
        const paceS = data.target_time_s / data.distance_km;
        const m = Math.floor(paceS / 60), s = Math.round(paceS % 60);
        setTargetPace(`${m}:${String(s).padStart(2,'0')}`);
      }
      // Elevación: convertir m → ft si imperial
      const gainVal = data.elevation_gain ? (imp ? Math.round(data.elevation_gain * 3.28084) : data.elevation_gain) : '';
      const lossVal = data.elevation_loss ? (imp ? Math.round(data.elevation_loss * 3.28084) : data.elevation_loss) : '';
      setElevGain(gainVal ? String(gainVal) : '');
      setElevLoss(lossVal ? String(lossVal) : '');
      setGoalType((data.goal_type as 'finish' | 'pr' | 'target') ?? 'pr');
      setSplitType((data.split_type as 'positive' | 'even' | 'negative') ?? 'negative');
      setGpxSlug(data.gpx_slug ?? null);
      setGpxUrl((data as any).gpx_url ?? null);
      if ((data as any).timezone) setTimezone((data as any).timezone);
      setLoading(false);
    };
    load();
  }, [id, router]);

  // Aplicar una carrera del catálogo (actualiza nombre, distancia, ciudad, elevación, slug)
  const applyGpxMatch = (m: CatalogRace) => {
    setGpxSlug(m.slug);
    setName(m.name);
    const distVal = imp ? (m.distance_km / 1.60934).toFixed(2) : m.distance_km.toString();
    setDistanceKm(distVal);
    if (m.city) setCity(m.city);
    if (m.gain_m) setElevGain(imp ? Math.round(m.gain_m * 3.28084).toString() : m.gain_m.toString());
    if (m.loss_m) setElevLoss(imp ? Math.round(m.loss_m * 3.28084).toString() : m.loss_m.toString());
  };

  const secsToTime = (s: number) => { const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=s%60; return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`; };
  const parsePace  = (p: string) => { const pts=p.trim().split(':').map(Number); return pts.length===2&&!pts.some(isNaN)?pts[0]*60+pts[1]:null; };
  const secsToMss  = (s: number) => { const m=Math.floor(s/60),sec=Math.round(s%60); return `${m}:${String(sec).padStart(2,'0')}`; };

  const handleTimeChange = (val: string) => {
    setTargetTime(val);
    const secs = parseTime(val), dist = parseFloat(distanceKm);
    if (secs && dist > 0) setTargetPace(secsToMss(secs / (imp ? dist*1.60934 : dist)));
  };
  const handlePaceChange = (val: string) => {
    setTargetPace(val);
    const paceS = parsePace(val), dist = parseFloat(distanceKm);
    if (paceS && dist > 0) setTargetTime(secsToTime(Math.round(paceS * (imp ? dist*1.60934 : dist))));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      let targetTimeSec: number | null = null;
      if (targetTime.trim()) {
        targetTimeSec = parseTime(targetTime);
        if (!targetTimeSec) throw new Error(t.raceForm.invalidTime);
      }

      // Convertir a métrico antes de guardar
      const distKm   = imp ? parseFloat(distanceKm) * 1.60934 : parseFloat(distanceKm);
      const elevM    = elevGain ? (imp ? parseFloat(elevGain) / 3.28084 : parseFloat(elevGain)) : null;
      const elevLossM = elevLoss ? (imp ? parseFloat(elevLoss) / 3.28084 : parseFloat(elevLoss)) : null;

      // Si el usuario subió un GPX nuevo, subirlo primero
      let newGpxUrl = gpxUrl;
      if (gpxFile) {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user.id;
        if (userId) {
          const path = `${userId}/${id}.gpx`;
          const { error: uploadErr } = await supabase.storage
            .from('user-gpx')
            .upload(path, gpxFile, { contentType: 'application/gpx+xml', upsert: true });
          if (!uploadErr) newGpxUrl = path;
        }
      }

      const { error: err } = await supabase.from('races').update({
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
        gpx_url:        newGpxUrl,
        timezone:       timezone,
      }).eq('id', id);

      if (err) throw err;
      router.push(`/races/${id}?updated=1`);
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  const inputStyle = { background: 'var(--input)', borderColor: 'var(--border)', color: 'var(--foreground)' };
  const labelStyle = { color: 'var(--muted-foreground)' };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--background)', color: 'var(--muted-foreground)' }}>
      {t.common.loading}
    </div>
  );

  return (
    <div className="min-h-screen px-4 py-10" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <div className="max-w-md mx-auto">

        <button onClick={() => router.push(`/races/${id}`)} className="text-sm mb-6 block" style={{ color: 'var(--muted-foreground)' }}>
          {t.common.back}
        </button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold">{t.raceForm.titleEdit}</h1>
        </div>

        <div className="rounded-xl border p-6" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: '#7f1d1d33', color: '#fca5a5', border: '1px solid #991b1b' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Picker: permite reemplazar con una carrera del catálogo; "no figura" no hace nada (campos ya visibles) */}
            <RaceCatalogPicker
              onSelect={applyGpxMatch}
              onManual={() => {/* campos ya visibles, no hacer nada */}}
            />

            <div>
              <label className="block text-sm font-medium mb-1" style={labelStyle}>{t.raceForm.fieldName}</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none" style={inputStyle} required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1" style={labelStyle}>{t.raceForm.fieldDistance}</label>
                <div className="relative">
                  <input type="number" step="0.001" min="0.1" value={distanceKm}
                    onChange={(e) => setDistanceKm(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none pr-10" style={inputStyle} required />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--muted-foreground)' }}>{distUnit}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={labelStyle}>{t.raceForm.fieldDate}</label>
                <input type="date" value={raceDate} onChange={(e) => setRaceDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none" style={inputStyle} required />
              </div>
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

            {/* Zona horaria */}
            <div>
              <label className="block text-sm font-medium mb-1" style={labelStyle}>Zona horaria</label>
              <select value={timezone} onChange={e => setTimezone(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none" style={inputStyle}>
                <option value="America/Argentina/Buenos_Aires">Argentina (UTC-3)</option>
                <option value="America/Sao_Paulo">Brasil — São Paulo (UTC-3)</option>
                <option value="America/Santiago">Chile — Santiago (UTC-3/-4)</option>
                <option value="America/Lima">Perú / Colombia (UTC-5)</option>
                <option value="America/Mexico_City">México — Ciudad de México (UTC-6)</option>
                <option value="America/Bogota">Colombia (UTC-5)</option>
                <option value="America/New_York">EE.UU. — Este (UTC-5/-4)</option>
                <option value="America/Chicago">EE.UU. — Centro (UTC-6/-5)</option>
                <option value="America/Denver">EE.UU. — Montaña (UTC-7/-6)</option>
                <option value="America/Los_Angeles">EE.UU. — Pacífico (UTC-8/-7)</option>
                <option value="Europe/Madrid">España (UTC+1/+2)</option>
                <option value="Europe/Lisbon">Portugal (UTC+0/+1)</option>
                <option value="Europe/London">Reino Unido (UTC+0/+1)</option>
                <option value="Europe/Paris">Francia / Alemania (UTC+1/+2)</option>
                <option value="Europe/Rome">Italia (UTC+1/+2)</option>
                <option value="UTC">UTC</option>
              </select>
              <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>Para enviarte el email de race day a las 5am hora local.</p>
            </div>

            {/* Objetivo */}
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

            {/* Tiempo objetivo + Ritmo (se calculan mutuamente) */}
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
                    placeholder={imp ? '8:34' : '5:19'}
                    className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none pr-12" style={inputStyle} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--muted-foreground)' }}>/{distUnit}</span>
                </div>
              </div>
            </div>

            {/* Desnivel positivo + negativo */}
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

              {/* GPX personal */}
              <div>
                <label className="block text-sm font-medium mb-1" style={labelStyle}>
                  Recorrido GPX <span style={{ color: 'var(--border)' }}>({t.common.optional})</span>
                </label>
                <input
                  type="file"
                  accept=".gpx,application/gpx+xml,application/xml,text/xml"
                  onChange={(e) => setGpxFile(e.target.files?.[0] ?? null)}
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                  style={inputStyle}
                />
                {gpxFile && <p className="text-xs mt-1" style={{ color: '#4ade80' }}>✓ {gpxFile.name}</p>}
                {!gpxFile && gpxUrl && <p className="text-xs mt-1" style={{ color: '#4ade80' }}>✓ GPX guardado</p>}
                <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                  Subí el GPX de tu carrera para un análisis de elevación real.
                </p>
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

            <button type="submit" disabled={saving}
              className="w-full py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
              style={{ background: 'var(--primary)', color: '#fff' }}>
              {saving ? t.common.saving : t.common.save}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
