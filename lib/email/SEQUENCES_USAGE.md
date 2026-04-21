# RaceCopilot Email Sequences — Usage Guide

Archivo: `lib/email/sequences.ts`

Todas las funciones siguen el patrón:
- `send{Sequence}{DayOrType}{Language}(to, firstName?, ...params)`
- Ej: `sendOnboardingDay1Es(to, firstName)`

## Onboarding (Trial 7 días)

### Day 1 - Cargar primera carrera
```typescript
await sendOnboardingDay1Es('user@email.com', 'Juan');
await sendOnboardingDay1En('user@email.com', 'Juan');
```

### Day 3 - Cómo funciona el plan
```typescript
// hasRace = true si el usuario ya cargó una carrera
await sendOnboardingDay3Es('user@email.com', 'Juan', hasRace: true);
await sendOnboardingDay3En('user@email.com', 'Juan', hasRace: true);
```

### Day 5 - Cómo leer tu plan
```typescript
await sendOnboardingDay5Es('user@email.com', 'Juan');
await sendOnboardingDay5En('user@email.com', 'Juan');
```

### Day 7 - Last chance
```typescript
await sendOnboardingDay7Es('user@email.com', 'Juan');
await sendOnboardingDay7En('user@email.com', 'Juan');
```

---

## Reactivación Post-Churn

### Day 3 - Feedback (sin oferta)
```typescript
await sendReactivationDay3Es('user@email.com', 'Juan');
await sendReactivationDay3En('user@email.com', 'Juan');
```

### Day 14 - Oferta 30% off 3 meses
```typescript
// discountCode opcional; por defecto "VUELVE30" (ES) o "COMEBACK30" (EN)
await sendReactivationDay14Es('user@email.com', 'Juan', 'VUELVE30');
await sendReactivationDay14En('user@email.com', 'Juan', 'COMEBACK30');
```

### Day 45 - Último recordatorio
```typescript
await sendReactivationDay45Es('user@email.com', 'Juan');
await sendReactivationDay45En('user@email.com', 'Juan');
```

---

## Post-Race Upsell

Usuario free con carrera pasada (race_date < hoy).

```typescript
await sendPostRaceUpsellEs('user@email.com', 'Juan', 'Maratón de Buenos Aires');
await sendPostRaceUpsellEn('user@email.com', 'John', 'Boston Marathon');
```

---

## Monthly Newsletter

Variables opcionales; todos tienen defaults.

```typescript
await sendMonthlyNewsletterEs(
  to: 'user@email.com',
  firstName: 'Juan',
  tipTitle: 'Hidratación en calor extremo',
  tipBody: 'En climas calurosos, la hidratación debe ser cada 15 min...',
  featureTitle: 'Integración con Strava',
  featureBody: 'Ahora tu plan se sincroniza automáticamente con Strava.'
);

await sendMonthlyNewsletterEn(
  to: 'user@email.com',
  firstName: 'John',
  tipTitle: 'Pacing for negative splits',
  tipBody: 'Run the first half conservatively...',
  featureTitle: 'Garmin sync',
  featureBody: 'Your plan now syncs with Garmin devices.'
);
```

---

## Notas

- **Todos los emails son mobile-first**: una columna, texto > 14px
- **Dark theme**: fondo `#0a0a0a`, cards `#111111`, botones `#f97316`
- **Sin traducción literal**: ES e EN tienen copy adaptado, no traducido palabra por palabra
- **Variables resueltas en TypeScript**: no Handlebars. Si `firstName` es undefined, usa fallback ("corredor", "runner")
- **Errores**: lanzan `Error` si Resend falla. El caller debe capturlo.
- **FROM**: `onboarding@resend.dev` (hasta verificar dominio)
- **UTM**: no están incluidos en esta versión (agregar si necesario en URLs específicas)

---

## Integración en rutas

Ejemplo en una API route:

```typescript
// app/api/send-onboarding/route.ts
import { sendOnboardingDay1Es } from '@/lib/email/sequences';

export async function POST(req: Request) {
  const { email, firstName } = await req.json();

  try {
    await sendOnboardingDay1Es(email, firstName);
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
```
