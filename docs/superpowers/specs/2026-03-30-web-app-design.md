# RaceCopilot Web App — Design Spec

**Fecha:** 2026-03-30
**Status:** Approved — pending implementation plan

---

## 1. Contexto

RaceCopilot tiene un engine de predicción completo (TypeScript, ~1800 LOC, 13 módulos, 99+ tests).
Genera planes de carrera con: predicción Riegel + intervalos, splits por km ajustados por elevación/clima/viento/fatiga, hidratación (Sawka), nutrición, triple objetivo (pronóstico/target/consenso), waterfall de ajustes y % de confianza.

**Objetivo:** Convertirlo en una web pública y rentable.

**Beta test:** Maratón de Mendoza, 3 de mayo 2026 (usuario: Augusto).

---

## 2. Fases de entrega

### Fase 1 — Beta personal (esta sesión)
- Una sola página web con el plan de Mendoza
- Sin auth, sin DB, sin pagos
- Datos hardcodeados del runner (Augusto)
- GPX real del recorrido
- Visualización completa: objetivos, waterfall, splits, elevación, hidratación, nutrición
- Mobile-first, dark mode

### Fase 2 — Multi-usuario
- Auth (Supabase: Google OAuth + email/password)
- Onboarding wizard (4 pasos)
- Dashboard con lista de carreras
- DB PostgreSQL (Supabase)
- Upload de GPX
- Input de weather manual (luego automático)

### Fase 3 — Monetización y engagement
- Stripe: suscripción mensual + anual, 14 días trial
- Weather APIs automáticas (Open-Meteo + WeatherAPI)
- Daily emails (Resend)
- Paywall: trial completo → después bloquea splits/nutrición/hidratación
- Landing page pública con SEO

---

## 3. Stack técnico

| Capa | Tecnología | Justificación |
|---|---|---|
| Framework | Next.js 15 (App Router) | Full-stack, SSR, deploy gratis en Vercel |
| Styling | Tailwind CSS + shadcn/ui | Componentes pro, dark mode, zero design effort |
| DB | Supabase (PostgreSQL) | Auth + DB + storage, free tier generoso |
| Auth | Supabase Auth | Google OAuth + email/password |
| Pagos | Stripe | Suscripciones + checkout hosted |
| Emails | Resend | 3000/mes gratis, templates React |
| Weather | Open-Meteo + WeatherAPI | 2 fuentes para cruzar confianza, gratis |
| Deploy | Vercel | Git push → deploy, gratis |

**Costo de infra: $0/mes hasta tracción real.**

---

## 4. Pricing

| Plan | Precio |
|---|---|
| Free trial | 14 días, acceso completo |
| Mensual | $4.99 USD/mes |
| Anual | $29.99 USD/año (~$2.50/mes, 50% ahorro) |

Primera carrera siempre visible (objetivos + confianza). Splits detallados, nutrición e hidratación requieren suscripción activa.

---

## 5. Arquitectura

```
/app                          → Páginas Next.js (App Router)
  /page.tsx                   → Landing page pública
  /dashboard/                 → Lista de carreras del usuario
  /race/[id]/                 → Plan de carrera completo
  /onboarding/                → Perfil runner (wizard)
  /api/
    /weather/                 → Cron: actualizar clima
    /emails/                  → Cron: daily updates
    /stripe/                  → Webhooks de pago

/components                   → UI reutilizable
  /race-plan/                 → Cards de pronóstico, splits, hidratación, nutrición
  /charts/                    → Gráficos de elevación, pacing
  /onboarding/                → Steps del wizard

/lib
  /engine/                    → Core de cálculo (existente, intacto)
  /weather/                   → Fetchers + agregador
  /email/                     → Templates + triggers
  /db/                        → Queries Supabase
  /stripe/                    → Helpers pagos

/jobs                         → Cron jobs
```

**Principio:** El engine (`/lib/engine`) no se modifica. La web lo consume como librería pura.

### Fase 1 simplificada

```
/app
  /page.tsx                   → Plan de Mendoza (todo en una página)
/components
  /race-plan/                 → Visualización del plan
/lib
  /engine/                    → Existente
```

---

## 6. UX — Pantallas

### Fase 1: Una página, todo el plan

Secciones verticales con scroll, mobile-first:

1. **Header** — Nombre carrera, fecha, distancia, D+/D-, confianza %
2. **Objetivos** — 3 cards: Pronóstico / Target / Consenso (consenso destacado por default)
3. **Waterfall** — Descomposición visual: Riegel → intervalos → blend → clima → elevación → viento → final
4. **Splits** — Tabla por km: ritmo, tiempo acumulado, notas elevación/viento. Color: verde (rápido) / neutro / rojo (lento)
5. **Elevación** — Gráfico del perfil del circuito
6. **Hidratación** — Timeline con puntos de hidratación, ml por toma, acumulado
7. **Nutrición** — Timeline con geles y sales, timing y producto exacto
8. **Disclaimer médico** al pie

### Interacción

- Default muestra Consenso (no confunde al usuario casual)
- Click en Pronóstico o Target recalcula splits/hidratación/nutrición para ese objetivo
- Responsive: funciona perfecto en celular (race day se consulta del teléfono)

### Fase 2+: Multi-usuario

- **Landing:** Propuesta de valor, CTA "Creá tu plan gratis"
- **Onboarding:** Wizard 4 pasos (datos básicos → carreras referencia → productos nutrición → crear carrera)
- **Dashboard:** Lista de carreras con countdown y confianza
- **Race plan:** Misma estructura fase 1, dinámico por usuario
- **Perfil:** Editar datos, productos, carreras

---

## 7. Modelo de datos (Fase 2+)

### users
- id, email, name, created_at
- weight_kg, height_cm, sweat_level, max_heart_rate
- weekly_km, vam

### reference_races
- id, user_id, distance_km, time_seconds, date, type
- avg_heart_rate?, temperature_c?, humidity_percent?

### interval_sessions
- id, user_id, distance_m, reps, pace_seconds_per_km, date
- avg_heart_rate?, temperature_c?, humidity_percent?

### nutrition_products
- id, user_id, name, carbs_grams, sodium_mg, caffeine_mg, type

### races
- id, user_id, name, date, city, distance_km
- gpx_path?, target_pace?, strategy_type?, strategy_segments?, strategy_delta?
- weather_json?, plan_json? (cached)

### subscriptions
- id, user_id, stripe_customer_id, stripe_subscription_id
- plan (monthly/annual), status, trial_end, current_period_end

---

## 8. Engine → Web: contrato

La web construye los inputs del engine desde la DB:

```typescript
// Web construye esto desde DB
const input: GenerateRacePlanInput = {
  runner: { /* desde users + reference_races + interval_sessions + nutrition_products */ },
  course: { /* desde GPX upload o buildFlatProfile */ },
  weather: { /* desde weather APIs o input manual */ },
  targetPacePerKm: /* desde race.target_pace */,
  breakfastHoursAgo: /* input pre-carrera */,
  pacingStrategy: /* desde race.strategy_* */,
};

// Engine devuelve plan completo
const plan: TripleObjectivePlan = generateRacePlan(input);
```

El plan se cachea en `races.plan_json` y se recalcula cuando cambia clima o datos del runner.

---

## 9. Decisiones de diseño

1. **Engine intacto.** No se modifica para la web. Si necesita cambios, se hacen como mejoras al engine, no como adaptaciones web.
2. **Server-side rendering.** El plan se calcula en el server (Next.js), no en el browser. El engine usa Node.js APIs (fs para GPX en fase 1).
3. **Mobile-first.** Todo se diseña para celular primero. Desktop es bonus.
4. **Dark mode default.** Runners consultan de noche/madrugada pre-carrera.
5. **Español primero.** UI en español, internacionalización en v2+.
6. **GPX client-side en fase 2+.** Upload y parseo en browser, envío de puntos al server.

---

## 10. Nombre y dominio

Pendiente. Se define antes de fase 2 (cuando sea público). Fase 1 corre en localhost / preview URL de Vercel.
