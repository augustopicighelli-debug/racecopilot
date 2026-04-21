'use client';

// Mockup estático de la pantalla real del plan — replica la UI real con datos de ejemplo.
// Usado en la landing para mostrar cómo se ve el plan km a km.

const CHUNKS = [
  { label: 'Km 1–5',   pace: '5:32', time: '0:27:40', hydration: '250ml',  nutrition: null,            notes: 'largada' },
  { label: 'Km 6–10',  pace: '5:28', time: '0:55:00', hydration: '300ml',  nutrition: '1 gel (45g)',    notes: 'ritmo crucero' },
  { label: 'Km 11–15', pace: '5:25', time: '1:22:05', hydration: '300ml',  nutrition: null,             notes: null },
  { label: 'Km 16–21', pace: '5:28', time: '1:54:53', hydration: '350ml',  nutrition: '1 gel + sal',    notes: 'hidratación' },
  { label: 'Km 22–28', pace: '5:30', time: '2:33:23', hydration: '350ml',  nutrition: '1 gel (45g)',    notes: 'zona de esfuerzo' },
  { label: 'Km 29–35', pace: '5:35', time: '3:14:08', hydration: '400ml',  nutrition: '1 gel + sal',    notes: 'fatiga · calor' },
  { label: 'Km 36–42', pace: '5:28', time: '3:52:24', hydration: '250ml',  nutrition: null,             notes: 'final progresivo' },
];

const MOBILE_KMS = [
  { km: 21, pace: '5:28', water: '350ml', gel: '1 gel + sal', alert: true  },
  { km: 25, pace: '5:30', water: '200ml', gel: null,          alert: false },
  { km: 30, pace: '5:35', water: '400ml', gel: '1 gel',       alert: true  },
  { km: 35, pace: '5:35', water: '200ml', gel: '1 sal',       alert: true  },
  { km: 38, pace: '5:28', water: '150ml', gel: null,          alert: false },
  { km: 42, pace: '5:15', water: null,    gel: null,          alert: false },
];

// ── Vista desktop ──────────────────────────────────────────────────────────────
function DesktopView() {
  return (
    <div style={{ background: '#0a0a0a', fontFamily: 'system-ui, sans-serif', color: '#fff' }}>

      {/* Header carrera */}
      <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg,rgba(249,115,22,.14) 0%,rgba(234,88,12,.04) 100%)', borderBottom: '1px solid rgba(249,115,22,.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 17 }}>Maratón de Buenos Aires 2026</p>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: '#71717a' }}>42.2 km · Buenos Aires · 20 sep 2026</p>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: 'rgba(249,115,22,.2)', color: '#f97316' }}>
            Faltan 152 días
          </span>
        </div>
        <div style={{ display: 'flex', gap: 20, marginTop: 14 }}>
          {[['🌡', '16°→21°C'],['💧','65%'],['💨','11 km/h'],['⛰','85m+']].map(([icon, val]) => (
            <div key={val as string} style={{ fontSize: 12 }}>
              <span style={{ color: '#71717a' }}>{icon} </span>
              <span style={{ fontWeight: 600 }}>{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Objetivos A/B/C */}
      <div style={{ padding: '16px 24px' }}>
        <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: '#52525b' }}>
          Objetivos de carrera
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {[
            { label:'A', name:'Máximo',      time:'3:51:00', pace:'5:28/km', color:'#f97316', border:'rgba(249,115,22,.5)', bg:'rgba(249,115,22,.08)' },
            { label:'B', name:'Realista',    time:'3:58:00', pace:'5:38/km', color:'#60a5fa', border:'rgba(96,165,250,.5)',  bg:'rgba(96,165,250,.08)'  },
            { label:'C', name:'Conservador', time:'4:10:00', pace:'5:55/km', color:'#4ade80', border:'rgba(74,222,128,.5)',  bg:'rgba(74,222,128,.08)'  },
          ].map(o => (
            <div key={o.label} style={{ borderRadius: 10, border: `1px solid ${o.border}`, background: o.bg, padding: '10px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <span style={{ width: 18, height: 18, borderRadius: '50%', background: o.color, color: '#fff', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{o.label}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: o.color }}>{o.name}</span>
              </div>
              <p style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: '-.02em' }}>{o.time}</p>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: '#71717a' }}>{o.pace}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabla plan km a km */}
      <div style={{ padding: '0 24px 20px' }}>
        <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: '#52525b' }}>
          Plan km a km
        </p>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,.06)' }}>
              {['Tramo','Ritmo','Tiempo','Hidrat.','Nutrición','Notas'].map(h => (
                <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: '#52525b', fontWeight: 600, fontSize: 11 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CHUNKS.map((c, i) => (
              <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,.04)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,.02)' }}>
                <td style={{ padding: '8px 8px', fontWeight: 600 }}>{c.label}</td>
                <td style={{ padding: '8px 8px', color: '#f97316', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{c.pace}</td>
                <td style={{ padding: '8px 8px', color: '#a1a1aa', fontVariantNumeric: 'tabular-nums' }}>{c.time}</td>
                <td style={{ padding: '8px 8px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#60a5fa' }} />
                    <span style={{ color: '#a1a1aa' }}>{c.hydration}</span>
                  </span>
                </td>
                <td style={{ padding: '8px 8px' }}>
                  {c.nutrition
                    ? <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: 'rgba(245,158,11,.12)', color: '#f59e0b' }}>{c.nutrition}</span>
                    : <span style={{ color: '#3f3f46' }}>—</span>
                  }
                </td>
                <td style={{ padding: '8px 8px' }}>
                  {c.notes
                    ? <span style={{ fontSize: 11, color: '#52525b' }}>{c.notes}</span>
                    : null
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}

// ── Vista mobile ───────────────────────────────────────────────────────────────
function MobileView() {
  return (
    <div style={{ background: '#0a0a0a', fontFamily: 'system-ui, sans-serif', color: '#fff', fontSize: 12 }}>

      {/* Header compacto */}
      <div style={{ padding: '12px 14px', background: 'rgba(249,115,22,.12)', borderBottom: '1px solid rgba(249,115,22,.2)' }}>
        <p style={{ margin: 0, fontWeight: 700, fontSize: 13 }}>Maratón BA 2026</p>
        <p style={{ margin: '2px 0 0', fontSize: 11, color: '#71717a' }}>42k · 20 sep · 16→21°C</p>
      </div>

      {/* Objetivo principal */}
      <div style={{ padding: '10px 14px', display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, background: 'rgba(249,115,22,.1)', border: '1px solid rgba(249,115,22,.3)', borderRadius: 8, padding: '8px 10px' }}>
          <p style={{ margin: 0, fontSize: 10, color: '#f97316', fontWeight: 600 }}>OBJETIVO A</p>
          <p style={{ margin: '2px 0 0', fontSize: 20, fontWeight: 800 }}>3:51:00</p>
          <p style={{ margin: 0, fontSize: 10, color: '#71717a' }}>5:28 /km</p>
        </div>
        <div style={{ flex: 1, background: 'rgba(96,165,250,.08)', border: '1px solid rgba(96,165,250,.3)', borderRadius: 8, padding: '8px 10px' }}>
          <p style={{ margin: 0, fontSize: 10, color: '#60a5fa', fontWeight: 600 }}>OBJETIVO B</p>
          <p style={{ margin: '2px 0 0', fontSize: 20, fontWeight: 800 }}>3:58:00</p>
          <p style={{ margin: 0, fontSize: 10, color: '#71717a' }}>5:38 /km</p>
        </div>
      </div>

      {/* Timeline km a km */}
      <div style={{ padding: '0 14px 14px' }}>
        <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: '#52525b' }}>Plan km a km</p>
        <div style={{ position: 'relative', paddingLeft: 24 }}>
          <div style={{ position: 'absolute', left: 10, top: 6, bottom: 6, width: 1, background: 'rgba(255,255,255,.08)' }} />
          {MOBILE_KMS.map((r, i) => (
            <div key={i} style={{ position: 'relative', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                position: 'absolute', left: -18, width: 8, height: 8, borderRadius: '50%',
                background: '#0a0a0a', border: `2px solid ${r.alert ? '#f59e0b' : r.km === 42 ? '#f97316' : 'rgba(255,255,255,.2)'}`,
              }} />
              <div style={{
                flex: 1, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)',
                borderRadius: 8, padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{ fontWeight: 700, color: r.km === 42 ? '#f97316' : '#fff', minWidth: 28 }}>
                  {r.km === 42 ? '🏅' : `km ${r.km}`}
                </span>
                <span style={{ color: '#f97316', fontWeight: 700 }}>{r.pace}</span>
                <div style={{ textAlign: 'right' }}>
                  {r.water && <p style={{ margin: 0, fontSize: 10, color: '#60a5fa' }}>{r.water}</p>}
                  {r.gel && <p style={{ margin: 0, fontSize: 10, color: '#f59e0b' }}>{r.gel}</p>}
                  {!r.water && !r.gel && <p style={{ margin: 0, fontSize: 10, color: '#3f3f46' }}>—</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

// ── Componente principal exportado ─────────────────────────────────────────────
export function ShowcaseMockup() {
  return (
    <div className="relative flex justify-center" style={{ paddingBottom: 60 }}>

      {/* Desktop frame */}
      <div
        className="w-full max-w-3xl rounded-2xl overflow-hidden"
        style={{ border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}
      >
        {/* Barra navegador */}
        <div
          className="flex items-center gap-2 px-4 py-3"
          style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: '#ef4444' }} />
            <div className="w-3 h-3 rounded-full" style={{ background: '#f59e0b' }} />
            <div className="w-3 h-3 rounded-full" style={{ background: '#22c55e' }} />
          </div>
          <div className="flex-1 rounded-md px-3 py-1 text-xs" style={{ background: 'rgba(255,255,255,0.05)', color: '#52525b' }}>
            racecopilot.com/races/maraton-ba-2026
          </div>
        </div>
        <DesktopView />
      </div>

      {/* Mobile frame — superpuesto abajo a la derecha */}
      <div
        className="absolute w-40 rounded-3xl overflow-hidden"
        style={{
          bottom: -16,
          right: 0,
          border: '8px solid #181818',
          boxShadow: '0 24px 60px rgba(0,0,0,0.8)',
          outline: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        {/* Notch */}
        <div className="flex justify-center pt-2 pb-1" style={{ background: '#181818' }}>
          <div className="w-10 h-1 rounded-full" style={{ background: '#2a2a2a' }} />
        </div>
        <MobileView />
      </div>

    </div>
  );
}
