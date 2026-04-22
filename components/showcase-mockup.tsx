'use client';

// Mockup estático basado en la UI real de RaceCopilot — desktop izquierda, mobile derecha.

const BG     = '#0f0f0f';
const CARD   = '#1a1a1a';
const BORDER = 'rgba(255,255,255,0.08)';
const MUTED  = '#71717a';
const ORANGE = '#f97316';
const BLUE   = '#60a5fa';
const AMBER  = '#f59e0b';
const GREEN  = '#4ade80';
const TEAL   = '#2dd4bf';

const PLAN_ROWS = [
  { km: 'Km 1–5',  pace: '4:56', time: '0:24:40', hydrat: '300 ml', nutr: '1 gel' },
  { km: 'Km 6–10', pace: '4:58', time: '0:49:29', hydrat: '300 ml', nutr: '1 gel' },
  { km: 'Km 11–15',pace: '4:55', time: '1:14:06', hydrat: '300 ml', nutr: '1 gel, 1 salt' },
  { km: 'Km 16–20',pace: '4:56', time: '1:38:47', hydrat: '300 ml', nutr: '1 gel, 1 salt' },
  { km: 'Km 21–25',pace: '4:49', time: '2:02:51', hydrat: '300 ml', nutr: '1 gel, 1 salt' },
  { km: 'Km 26–30',pace: '4:47', time: '2:26:48', hydrat: '300 ml', nutr: '1 gel, 1 salt' },
  { km: 'Km 31–35',pace: '4:48', time: '2:50:48', hydrat: '300 ml', nutr: '1 gel, 1 salt' },
];

const MOBILE_ROWS = [
  { km: 5,  time: '~25min', water: '300 ml', nutr: 'Race',    icon: '💧' },
  { km: 10, time: '~49min', water: '300 ml', nutr: 'Race',    icon: '💧' },
  { km: 15, time: '~74min', water: '300 ml', nutr: 'Nutremax',icon: '⚡' },
  { km: 20, time: '~99min', water: '300 ml', nutr: 'Race',    icon: '💧' },
  { km: 25, time: '2:03h',  water: '300 ml', nutr: 'Race',    icon: '💧' },
  { km: 30, time: '2:27h',  water: '300 ml', nutr: 'Race',    icon: '💧' },
];

// ── Desktop ────────────────────────────────────────────────────────────────────
function Desktop() {
  return (
    <div style={{ background: BG, fontFamily: 'system-ui,sans-serif', color: '#fff', fontSize: 12 }}>

      {/* Tres métricas: Forecast / Target / Consensus */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, padding: '14px 16px 10px' }}>
        {[
          { label: 'FORECAST',  time: '3:32:02', pace: '4:59 /km', highlight: false },
          { label: 'TARGET',    time: '3:25:00', pace: '4:49 /km', highlight: false },
          { label: 'CONSENSUS', time: '3:28:15', pace: '4:54 /km', highlight: true  },
        ].map(c => (
          <div key={c.label} style={{
            border: `1px solid ${c.highlight ? '#3b82f6' : BORDER}`,
            borderRadius: 10,
            padding: '10px 12px',
            background: c.highlight ? 'rgba(59,130,246,0.07)' : CARD,
          }}>
            <p style={{ margin: '0 0 4px', fontSize: 9, fontWeight: 700, letterSpacing: '.08em', color: MUTED }}>{c.label}</p>
            <p style={{ margin: '0', fontSize: 20, fontWeight: 800, letterSpacing: '-.02em', fontVariantNumeric: 'tabular-nums' }}>{c.time}</p>
            <p style={{ margin: '2px 0 0', fontSize: 11, fontWeight: 700, color: BLUE }}>{c.pace}</p>
            {c.highlight && (
              <p style={{ margin: '6px 0 0', fontSize: 9, background: 'rgba(245,158,11,0.15)', color: AMBER, padding: '2px 6px', borderRadius: 4 }}>
                Tu target es ambicioso, te sugerimos este ritmo
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Effort level slider */}
      <div style={{ padding: '0 16px 10px' }}>
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '10px 12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <p style={{ margin: 0, fontSize: 11, color: MUTED }}>Effort level · <span style={{ color: '#fff' }}>Consensus</span></p>
            <span style={{ fontSize: 10, fontWeight: 700, background: 'rgba(74,222,128,0.15)', color: GREEN, padding: '2px 8px', borderRadius: 10 }}>Balanced</span>
          </div>
          {/* Barra gradiente con punto */}
          <div style={{ position: 'relative', height: 8, borderRadius: 4, background: 'linear-gradient(to right, #ef4444, #f97316, #eab308, #84cc16, #22c55e)', marginBottom: 6 }}>
            <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 14, height: 14, borderRadius: '50%', background: '#fff', border: '2px solid #22c55e', boxShadow: '0 1px 4px rgba(0,0,0,0.5)' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 9, color: '#ef4444' }}>Very ambitious</span>
            <span style={{ fontSize: 9, color: GREEN }}>Conservative</span>
          </div>
        </div>
      </div>

      {/* Clima */}
      <div style={{ padding: '0 16px 10px' }}>
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '10px 12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }}>🌤</span>
              <div>
                <p style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>9.5°C → 13.3°C</p>
                <p style={{ margin: '1px 0 0', fontSize: 10, color: MUTED }}>Start → Finish</p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 9, fontWeight: 700, background: 'rgba(245,158,11,0.15)', color: AMBER, padding: '2px 7px', borderRadius: 6 }}>Confidence Medium</span>
              <p style={{ margin: '4px 0 0', fontSize: 10, color: MUTED }}>12 days to go</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, borderTop: `1px solid ${BORDER}`, paddingTop: 8 }}>
            {[['52%','Humidity'],['4.4 km/h','Wind'],['SE','Direction']].map(([v,l]) => (
              <div key={l} style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>{v}</p>
                <p style={{ margin: '1px 0 0', fontSize: 9, color: MUTED }}>{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Race plan tabla */}
      <div style={{ padding: '0 16px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700 }}>Race plan</p>
            <p style={{ margin: '1px 0 0', fontSize: 9, color: MUTED }}>Sweat rate: 1744 ml/h — Pre-race: Banana o membrillo (25g)</p>
          </div>
          <span style={{ fontSize: 10, color: BLUE, fontWeight: 600 }}>View km by km</span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
              {['Km','Pace','Time','Hydrat.','Nutrition'].map(h => (
                <th key={h} style={{ padding: '4px 6px', textAlign: 'left', fontSize: 9, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PLAN_ROWS.map((r, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${BORDER}` }}>
                <td style={{ padding: '5px 6px', fontWeight: 600, fontSize: 10 }}>{r.km}</td>
                <td style={{ padding: '5px 6px', color: ORANGE, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{r.pace}</td>
                <td style={{ padding: '5px 6px', color: MUTED, fontVariantNumeric: 'tabular-nums' }}>{r.time}</td>
                <td style={{ padding: '5px 6px', color: BLUE }}>{r.hydrat}</td>
                <td style={{ padding: '5px 6px', color: TEAL }}>{r.nutr}</td>
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

      {/* Consensus destacado */}
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${BORDER}` }}>
        <p style={{ margin: '0 0 2px', fontSize: 10, fontWeight: 700, letterSpacing: '.08em', color: MUTED }}>CONSENSUS</p>
        <p style={{ margin: 0, fontSize: 30, fontWeight: 800, letterSpacing: '-.02em' }}>3:28:15</p>
        <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 700, color: BLUE }}>4:54 /km</p>
      </div>

      {/* Clima compacto */}
      <div style={{ padding: '10px 16px', borderBottom: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>🌤</span>
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>9.5° → 13.3°C</p>
            <p style={{ margin: 0, fontSize: 10, color: MUTED }}>52% hum · 4.4 km/h</p>
          </div>
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, background: 'rgba(245,158,11,0.15)', color: AMBER, padding: '3px 8px', borderRadius: 6 }}>12 días</span>
      </div>

      {/* Hydration & Fuel timeline */}
      <div style={{ padding: '10px 16px' }}>
        <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: MUTED }}>Hydration & Fuel</p>
        <p style={{ margin: '0 0 10px', fontSize: 9, color: MUTED }}>Sweat rate: 1744 ml/h · 260g carbs</p>

        {/* PRE-RACE */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: ORANGE, width: 32 }}>PRE</span>
          <span style={{ flex: 1, fontSize: 10, color: '#fff' }}>⚡ Banana o membrillo</span>
        </div>

        {/* Filas km */}
        {MOBILE_ROWS.map((r, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '5px 0',
            borderTop: `1px solid ${BORDER}`,
          }}>
            <span style={{ width: 32, fontSize: 10, color: MUTED, flexShrink: 0 }}>Km {r.km}</span>
            <span style={{ flex: 1, fontSize: 10, fontWeight: 600, color: BLUE }}>{r.icon} {r.water}</span>
            <span style={{ fontSize: 10, color: TEAL }}>{r.nutr}</span>
            <span style={{ fontSize: 9, color: MUTED, width: 30, textAlign: 'right' }}>{r.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Componente exportado ───────────────────────────────────────────────────────
export function ShowcaseMockup() {
  const FRAME_HEIGHT = 520;
  // iPhone 16: 393×852 → ratio 0.461 → 520×0.461 ≈ 240px
  const MOBILE_W     = 240;

  return (
    <>
      {/* ── Layout desktop: lado a lado (visible en sm+) ── */}
      <div className="hidden sm:flex" style={{ alignItems: 'flex-start', gap: 12, maxWidth: 900, margin: '0 auto' }}>

        {/* Desktop frame */}
        <div style={{
          flex: 1, minWidth: 0,
          borderRadius: 14, overflow: 'hidden',
          border: '1px solid rgba(255,255,255,.09)',
          boxShadow: '0 28px 70px rgba(0,0,0,.65)',
          height: FRAME_HEIGHT,
          display: 'flex', flexDirection: 'column',
        }}>
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
          <div style={{ flex: 1, overflowY: 'hidden' }}>
            <Desktop />
          </div>
        </div>

        {/* Mobile frame */}
        <div style={{
          width: MOBILE_W, flexShrink: 0,
          borderRadius: 44, overflow: 'hidden',
          border: '9px solid #1c1c1c',
          boxShadow: '0 28px 70px rgba(0,0,0,.75)',
          outline: '1px solid rgba(255,255,255,.06)',
          height: FRAME_HEIGHT,
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 8px', background: BG, flexShrink: 0 }}>
            <div style={{ width: 90, height: 26, borderRadius: 20, background: '#000', boxShadow: '0 0 0 1px rgba(255,255,255,.08)' }} />
          </div>
          <div style={{ flex: 1, overflowY: 'hidden' }}>
            <Mobile />
          </div>
        </div>
      </div>

      {/* ── Layout mobile: solo el teléfono centrado (visible en <sm) ── */}
      <div className="flex sm:hidden justify-center">
        <div style={{
          width: 260, flexShrink: 0,
          borderRadius: 44, overflow: 'hidden',
          border: '9px solid #1c1c1c',
          boxShadow: '0 20px 50px rgba(0,0,0,.8)',
          outline: '1px solid rgba(255,255,255,.06)',
          height: 480,
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 8px', background: BG, flexShrink: 0 }}>
            <div style={{ width: 90, height: 26, borderRadius: 20, background: '#000', boxShadow: '0 0 0 1px rgba(255,255,255,.08)' }} />
          </div>
          <div style={{ flex: 1, overflowY: 'hidden' }}>
            <Mobile />
          </div>
        </div>
      </div>
    </>
  );
}
