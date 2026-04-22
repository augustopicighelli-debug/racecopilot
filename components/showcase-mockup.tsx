'use client';

// Mockup estático del plan real — layout desktop (izquierda) + mobile (derecha), side-by-side.

const CHUNKS = [
  { label: 'Km 1–5',   pace: '5:32', time: '0:27:40', hydration: '250ml', nutrition: null,          notes: 'largada' },
  { label: 'Km 6–10',  pace: '5:28', time: '0:55:00', hydration: '300ml', nutrition: '1 gel (45g)', notes: 'ritmo crucero' },
  { label: 'Km 11–15', pace: '5:25', time: '1:22:05', hydration: '300ml', nutrition: null,          notes: null },
  { label: 'Km 16–21', pace: '5:28', time: '1:54:53', hydration: '350ml', nutrition: '1 gel + sal', notes: 'hidratación' },
  { label: 'Km 22–28', pace: '5:30', time: '2:33:23', hydration: '350ml', nutrition: '1 gel (45g)', notes: 'zona de esfuerzo' },
  { label: 'Km 29–35', pace: '5:35', time: '3:14:08', hydration: '400ml', nutrition: '1 gel + sal', notes: 'fatiga · calor' },
  { label: 'Km 36–42', pace: '5:28', time: '3:52:24', hydration: '250ml', nutrition: null,          notes: 'final progresivo' },
];

const MOBILE_KMS = [
  { km: 21, pace: '5:28', water: '350ml', extra: '1 gel + sal', alert: true  },
  { km: 25, pace: '5:30', water: '200ml', extra: null,          alert: false },
  { km: 30, pace: '5:35', water: '400ml', extra: '1 gel',       alert: true  },
  { km: 35, pace: '5:35', water: '200ml', extra: '1 sal',       alert: true  },
  { km: 38, pace: '5:28', water: '150ml', extra: null,          alert: false },
  { km: 42, pace: '5:15', water: null,    extra: null,          alert: false },
];

const BG      = '#0a0a0a';
const CARD    = '#111111';
const BORDER  = 'rgba(255,255,255,0.07)';
const MUTED   = '#52525b';
const ORANGE  = '#f97316';
const BLUE    = '#60a5fa';
const AMBER   = '#f59e0b';
const GREEN   = '#4ade80';

// ── Desktop ────────────────────────────────────────────────────────────────────
function Desktop() {
  return (
    <div style={{ background: BG, fontFamily: 'system-ui,sans-serif', color: '#fff', fontSize: 13 }}>

      {/* Header */}
      <div style={{ padding: '18px 22px', background: 'linear-gradient(135deg,rgba(249,115,22,.13),rgba(234,88,12,.03))', borderBottom: `1px solid rgba(249,115,22,.18)` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 16 }}>Maratón de Buenos Aires 2026</p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: MUTED }}>42.2 km · Buenos Aires · 20 sep 2026</p>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: 'rgba(249,115,22,.18)', color: ORANGE }}>
            Faltan 152 días
          </span>
        </div>
        <div style={{ display: 'flex', gap: 18 }}>
          {[['🌡','16°→21°C'],['💧','65%'],['💨','11 km/h'],['⛰','85m+']].map(([icon,val]) => (
            <span key={val as string} style={{ fontSize: 12 }}>
              <span style={{ color: MUTED }}>{icon} </span>
              <span style={{ fontWeight: 600 }}>{val}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Objetivos A/B/C */}
      <div style={{ padding: '14px 22px' }}>
        <p style={{ margin: '0 0 10px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: MUTED }}>Objetivos de carrera</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {[
            { label:'A', name:'Máximo',      time:'3:51:00', pace:'5:28/km', c:ORANGE, b:'rgba(249,115,22,.08)', br:'rgba(249,115,22,.4)' },
            { label:'B', name:'Realista',    time:'3:58:00', pace:'5:38/km', c:BLUE,   b:'rgba(96,165,250,.08)',  br:'rgba(96,165,250,.4)'  },
            { label:'C', name:'Conservador', time:'4:10:00', pace:'5:55/km', c:GREEN,  b:'rgba(74,222,128,.08)', br:'rgba(74,222,128,.4)'  },
          ].map(o => (
            <div key={o.label} style={{ borderRadius: 10, border: `1px solid ${o.br}`, background: o.b, padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ width: 16, height: 16, borderRadius: '50%', background: o.c, color: '#fff', fontSize: 10, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{o.label}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: o.c }}>{o.name}</span>
              </div>
              <p style={{ margin: 0, fontSize: 21, fontWeight: 800, letterSpacing: '-.02em', fontVariantNumeric: 'tabular-nums' }}>{o.time}</p>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: MUTED }}>{o.pace}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabla plan */}
      <div style={{ padding: '0 22px 18px' }}>
        <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: MUTED }}>Plan km a km</p>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
              {['Tramo','Ritmo','Tiempo acum.','Hidrat.','Nutrición','Notas'].map(h => (
                <th key={h} style={{ padding: '5px 8px', textAlign: 'left', color: MUTED, fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CHUNKS.map((c, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${BORDER}`, background: i % 2 ? 'rgba(255,255,255,.015)' : 'transparent' }}>
                <td style={{ padding: '7px 8px', fontWeight: 600 }}>{c.label}</td>
                <td style={{ padding: '7px 8px', color: ORANGE, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{c.pace}</td>
                <td style={{ padding: '7px 8px', color: '#a1a1aa', fontVariantNumeric: 'tabular-nums' }}>{c.time}</td>
                <td style={{ padding: '7px 8px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: BLUE, display: 'inline-block' }} />
                    <span style={{ color: '#a1a1aa' }}>{c.hydration}</span>
                  </span>
                </td>
                <td style={{ padding: '7px 8px' }}>
                  {c.nutrition
                    ? <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: 'rgba(245,158,11,.13)', color: AMBER }}>{c.nutrition}</span>
                    : <span style={{ color: '#2e2e2e' }}>—</span>}
                </td>
                <td style={{ padding: '7px 8px', color: '#3f3f46', fontSize: 11 }}>{c.notes ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Mobile ─────────────────────────────────────────────────────────────────────
function Mobile() {
  return (
    <div style={{ background: BG, fontFamily: 'system-ui,sans-serif', color: '#fff', fontSize: 12 }}>

      {/* Header compacto */}
      <div style={{ padding: '10px 12px', background: 'rgba(249,115,22,.1)', borderBottom: `1px solid rgba(249,115,22,.2)` }}>
        <p style={{ margin: 0, fontWeight: 700, fontSize: 12 }}>Maratón BA 2026</p>
        <p style={{ margin: '2px 0 0', fontSize: 10, color: MUTED }}>42.2km · 20 sep · 16→21°C</p>
      </div>

      {/* Objetivo A */}
      <div style={{ padding: '10px 12px', borderBottom: `1px solid ${BORDER}` }}>
        <p style={{ margin: '0 0 6px', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: MUTED }}>Objetivo A — Máximo</p>
        <p style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: '-.02em', color: ORANGE }}>3:51:00</p>
        <p style={{ margin: '1px 0 0', fontSize: 11, color: MUTED }}>5:28 /km</p>
      </div>

      {/* Timeline km a km */}
      <div style={{ padding: '10px 12px' }}>
        <p style={{ margin: '0 0 8px', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: MUTED }}>Plan km a km</p>
        <div style={{ position: 'relative', paddingLeft: 20 }}>
          <div style={{ position: 'absolute', left: 8, top: 5, bottom: 5, width: 1, background: BORDER }} />
          {MOBILE_KMS.map((r, i) => (
            <div key={i} style={{ position: 'relative', marginBottom: 7, display: 'flex', alignItems: 'center' }}>
              {/* dot */}
              <div style={{
                position: 'absolute', left: -16, width: 8, height: 8, borderRadius: '50%',
                background: BG, border: `2px solid ${r.km === 42 ? ORANGE : r.alert ? AMBER : BORDER}`,
              }} />
              <div style={{
                flex: 1, background: 'rgba(255,255,255,.025)', border: `1px solid ${BORDER}`,
                borderRadius: 8, padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6,
              }}>
                <span style={{ fontWeight: 700, color: r.km === 42 ? ORANGE : '#fff', minWidth: 30, fontSize: 12 }}>
                  {r.km === 42 ? '🏅' : `km ${r.km}`}
                </span>
                <span style={{ color: ORANGE, fontWeight: 700, fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>{r.pace}</span>
                <div style={{ textAlign: 'right' }}>
                  {r.water && <p style={{ margin: 0, fontSize: 10, color: BLUE }}>{r.water}</p>}
                  {r.extra && <p style={{ margin: 0, fontSize: 10, color: AMBER }}>{r.extra}</p>}
                  {!r.water && !r.extra && <p style={{ margin: 0, fontSize: 10, color: '#2e2e2e' }}>—</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Componente exportado ───────────────────────────────────────────────────────
export function ShowcaseMockup() {
  const FRAME_HEIGHT = 520;
  const MOBILE_W     = 168;

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, maxWidth: 900, margin: '0 auto' }}>

      {/* ── Desktop ── */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          borderRadius: 14,
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,.09)',
          boxShadow: '0 28px 70px rgba(0,0,0,.65)',
          height: FRAME_HEIGHT,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Chrome del browser */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', background: 'rgba(255,255,255,.04)', borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 5 }}>
            <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#ef4444' }} />
            <div style={{ width: 11, height: 11, borderRadius: '50%', background: AMBER }} />
            <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#22c55e' }} />
          </div>
          <div style={{ flex: 1, background: 'rgba(255,255,255,.055)', borderRadius: 6, padding: '4px 10px', fontSize: 11, color: MUTED }}>
            racecopilot.com/races/maraton-ba-2026
          </div>
        </div>
        {/* Contenido — se recorta naturalmente con overflow:hidden */}
        <div style={{ flex: 1, overflowY: 'hidden' }}>
          <Desktop />
        </div>
      </div>

      {/* ── Mobile ── */}
      <div
        style={{
          width: MOBILE_W,
          flexShrink: 0,
          borderRadius: 28,
          overflow: 'hidden',
          border: '7px solid #1c1c1c',
          boxShadow: '0 28px 70px rgba(0,0,0,.75)',
          outline: '1px solid rgba(255,255,255,.06)',
          height: FRAME_HEIGHT,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Notch */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '7px 0 5px', background: '#1c1c1c', flexShrink: 0 }}>
          <div style={{ width: 38, height: 4, borderRadius: 4, background: '#2e2e2e' }} />
        </div>
        {/* Contenido */}
        <div style={{ flex: 1, overflowY: 'hidden' }}>
          <Mobile />
        </div>
      </div>

    </div>
  );
}
