# RaceCopilot — Spec de Diseño

**Fecha:** 2026-03-21
**Status:** Design approved — pending implementation plan

---

## 1. El Problema

El runner promedio llega al race day con un plan improvisado. Sabe su ritmo pero no sabe traducirlo a estrategia ajustada por condiciones del día.

**Resultado:** arranca rápido, se deshidrata, come geles a destiempo, explota en km 30.

Las calculadoras existentes (VDOT, McMillan) dan un número estático sin ajustar por clima, sin nutrición, sin hidratación.

### Competencia y gaps

| Herramienta | Qué hace bien | Qué le falta |
|---|---|---|
| Strava | Tracking post-carrera, comunidad | Cero planificación pre-carrera |
| Garmin Coach | Planes de entrenamiento | Plan de carrera genérico, no ajusta por clima |
| McMillan / VDOT | Predicción de tiempo | Número estático, sin pacing por tramo, sin nutrición |
| TrainingPeaks | Análisis profundo | Orientado a coaches, caro, overkill para el 80% |
| Nike Run Club | Onboarding accesible | Planes genéricos, cero personalización race day |
| MetéoPace | Pacing ajustado por clima, viento por tramo, métrica MAP | No tiene nutrición ni hidratación, no tiene triple objetivo, no tiene personalización fisiológica, no tiene daily emails, precios ocultos |

### Diferencial

No es otra calculadora de pacing. Es un **plan vivo que evoluciona hasta el race day**. El clima cambia → tu plan cambia → te enterás.

### Frecuencia de uso

- **Pre-carrera (semanas antes):** crear carrera, cargar datos, volver cada día a ver updates
- **Race day:** consultar plan final, exportar
- **Post-carrera (v2):** cargar resultado real, el modelo aprende

---

## 2. Target y Scope

**Target:** Todos los runners, features que escalan en complejidad. Desde recreacional hasta competitivo.

**Distancias:** 10K, 21K, 42K como presets + cualquier distancia custom (15K, 25K, 30K, etc). La app interpola la estrategia basándose en las distancias conocidas.

**Plataforma:** Web first (Next.js), mobile después.

**Data del runner:** Input manual para MVP (carreras de referencia), integración Strava en v2.

---

## 3. MVP — Features

### Features que entran sí o sí

#### 1. Registro + carrera
Crear cuenta, crear una carrera (fecha, ciudad, distancia preset o custom).

#### 2. Perfil runner
- Peso
- Altura
- Nivel de transpiración (bajo/medio/alto con descripción: _"después de 1h corriendo tu remera está: seca / húmeda / empapada"_)
- 1-3 carreras de referencia mínimo de últimos 6 meses, hasta 10 del último año (carreras o entrenos de calidad). Por cada una: distancia, tiempo, fecha, tipo (carrera/entreno)
- **Datos avanzados opcionales:** VAM (Velocidad Aeróbica Máxima), pasadas 400m/1000m, km semanales (como indicador de capacidad aeróbica, no fatiga — un runner de 100km/semana tiene potencial mayor del que muestran sus carreras)

#### 3. Productos de nutrición
El usuario carga sus geles y sales con nombre libre + info nutricional (carbohidratos en gramos, sodio en mg, cafeína en mg). También pastillas de sales (mg de sodio/potasio por pastilla).

#### 4. Perfil de circuito
Base de datos de carreras conocidas globales (scrapeables de OpenStreetMap, marathons.ahotu.com, webs oficiales) + upload de GPX como fallback universal.

#### 5. Predictor con triple objetivo
- **Pronóstico:** lo que el modelo predice basado en datos reales
- **Target:** lo que el runner quiere hacer (objetivo personal)
- **Consenso:** punto medio inteligente entre ambos. Si el target es absurdo, el consenso lo baja a tierra.
- Cada objetivo genera su propio plan de pacing, hidratación y nutrición.

#### 6. Plan de pacing
Splits por km ajustados por elevación (GPX) y clima, para cada objetivo. Los primeros 5km son subida → baja el ritmo. Bajada → sube.

#### 7. Plan de hidratación
Cada cuántos km tomar agua, cuánto (basado en transpiración, peso, clima). Personalizado por fisiología del runner.

#### 8. Plan de nutrición
Cuándo tomar geles/carbos, cuántos gramos, basado en los productos reales del usuario. Primer gel ~45min, después cada 30-45min. Sales proporcional a pérdida de fluidos.

> **Disclaimer médico siempre visible:** "Este plan es orientativo. Consultá siempre a tu médico."

#### 9. Clima progresivo
- Cuando falta mucho: promedio histórico de ese día/ciudad
- A medida que se acerca: forecast real que se va afinando
- Siempre con **% de confianza** (basado en concordancia entre 2-3 fuentes de clima)
- Confianza baja cuando fuentes no coinciden, alta cuando coinciden

#### 10. Notificaciones por email
- **Daily update** que solo dice que hay novedades (no revela el tiempo, obliga el click para generar reingreso)
- **Alerta de impacto:** cuando cambio mueve predicción más de X minutos o aparece viento fuerte. Tono más urgente.
- El viento aparece los últimos 2-3 días con precisión → notificación con más punch
- Solo enviar cuando hay delta real. Si no cambió nada → silencio (o resumen semanal breve)

#### 11. Exportar plan
PDF, vista mobile-friendly, imagen (para fondo de pantalla o reloj).

### Features que quedan AFUERA del MVP

- Race mode en tiempo real
- Integración Strava/Garmin
- Test de sudoración avanzado (guía para pesarse antes y después de correr 1h)
- Post-carrera analytics / modelo que aprende
- Training suggestions pre-carrera
- Social / compartir plan
- Base de datos de marcas/productos de geles (en MVP el usuario carga info manual)
- Métrica tipo "Adjusted Pace" (estilo MAP de MetéoPace) — diseñar el espacio pero no implementar en v1

---

## 4. "Aha Moment"

Cuando el runner carga sus datos, sube el GPX, y ve un plan que dice:

> _"Km 1-3: subida, andá a 5:25/km. Km 4-8: bajada, 4:55/km. Gel #1 en km 12. Agua cada 4km (200ml). Pronóstico: 1:42. Tu target 1:38 es agresivo pero alcanzable si controlás km 15-18."_

Eso no existe hoy en ningún lado gratis.

---

## 5. UX / Flujo del Usuario

### Onboarding (una sola vez, progresivo)

- **Cuenta:** Email + password o Google OAuth
- **Datos obligatorios:** Peso + Altura + nivel transpiración + 1 carrera de referencia (mínimo para arrancar)
- **Datos que se piden después:** más carreras, VAM, pasadas, km semanales, productos de nutrición
- Onboarding progresivo para no abrumar

### Crear Carrera

- Nombre, fecha, ciudad, distancia (preset o custom)
- Circuito: buscar en base conocida o subir GPX
- Target opcional (si no pone, plan se basa 100% en pronóstico)

### Plan de Carrera (pantalla principal)

- 3 cards grandes: Pronóstico / Target / Consenso
- Por default mostrar solo **Consenso** (los otros se expanden con tap — para no confundir al recreacional)
- Clima actual con % de confianza y días restantes
- Tabs: **Splits / Hidratación / Nutrición / Elevación**
- Cada tab muestra plan para el objetivo seleccionado

### Daily Emails

- Solo notifican que hay novedades, no revelan el tiempo
- Obliga el click → reingreso a la web
- Alerta de alto impacto para viento y cambios grandes

### Race Day — Exportar

- Plan final con clima confirmado (confianza ~95%)
- Formatos: PDF (imprimir), vista mobile (sin scroll), imagen (reloj/fondo)
- Vista mobile resume solo hitos: km, ritmo, agua, gel. Una línea por tramo.

### Puntos de fricción y mitigación

| Fricción | Mitigación |
|---|---|
| Onboarding largo | Progresivo (solo peso + 1 carrera para arrancar) |
| GPX desconocido | Buscador de carreras primero, GPX es fallback |
| 3 objetivos confunden | Default Consenso, los otros expandibles |
| PDF largo en carrera | Vista mobile con solo hitos |

---

## 6. Modelo de Predicción

### Capa 1 — Base: Riegel ajustado

```
T2 = T1 × (D2/D1)^exponente
```

Con 3-10 carreras de referencia, ajustamos el **exponente al runner real** (en vez de usar 1.06 fijo). Ponderamos por fecha (recientes pesan más).

### Capa 2 — Ajuste por clima

Basado en Ely et al., 2007: ~0.3-0.5% degradación por grado arriba de 12°C.

```
factor_clima = 1 + ((temp - 12) × 0.004) + ((humedad - 50) × 0.001)
```

3 fuentes de clima cruzadas para confianza.

### Capa 3 — Ajuste por elevación

Con GPX: desnivel positivo/negativo por km.

- `+6 seg/km` por cada 1% pendiente positiva
- `-3 seg/km` por cada 1% pendiente negativa (bajar no compensa subir)

### Capa 4 — Ajuste por viento (v1.5)

Dirección de viento del forecast + orientación de cada tramo del GPX. Diseñar el slot en MVP, simplificar implementación.

### Capa 5 — Datos avanzados

- Km semanales como indicador de capacidad aeróbica (ponderar techo de rendimiento hacia arriba)
- VAM y pasadas de 400/1000 → techo de rendimiento
- Más datos → mejor predicción → mayor % confianza

### Plan de hidratación

```
Pérdida ml/h = peso_kg × factor_transpiración × factor_clima
```

| Nivel transpiración | Factor |
|---|---|
| Bajo | 8 ml/kg/h |
| Medio | 10 ml/kg/h |
| Alto | 14 ml/kg/h |

Resultado: cada cuántos km tomar agua y cuánto (150-300ml por toma).

### Plan de nutrición

- 60-90g carbos/hora para esfuerzos >90min
- Distancia × ritmo → duración total → gramos totales → dividido por carbos de cada gel del usuario → cuántos geles y cuándo
- Sales: sodio proporcional a pérdida de fluidos
- **Disclaimer médico siempre visible**

### Sistema de confianza

El % de confianza se basa en:

- Cantidad de carreras de referencia (3=base, 10=alta)
- Qué tan recientes (últimos 6 meses=alta)
- Concordancia entre fuentes de clima
- Días para la carrera (más lejos=menos confianza clima)
- Si tiene GPX o no (con GPX=más confianza en splits)

---

## 7. Análisis Competitivo: MetéoPace

Competidor directo. App móvil (iOS/Android), fundada 2025, UK.

### Lo que hacen bien

- 3 fuentes de clima (Meteoblue, Open-Meteo, Apple Weather)
- Viento modelado por orientación de tramo
- Métrica MAP (Meteo Adjusted Pace) genera lock-in
- Integración Strava
- Pricing: Race Pass (por carrera) + suscripciones

### Dónde RaceCopilot se diferencia

| RaceCopilot | MetéoPace |
|---|---|
| Plan integral (pacing + nutrición + hidratación + sales) | Solo pacing ajustado por clima |
| Triple objetivo (pronóstico / target / consenso) | Un único pronóstico |
| Personalización fisiológica (transpiración, peso) | No tiene |
| Daily emails con engagement loop | No tiene |
| Web first (menor barrera de entrada) | Solo mobile |
| Precios transparentes | Precios ocultos |

### Aprendizajes a incorporar

- Cruzar 2-3 fuentes de clima para confianza (como ellos)
- Diseñar espacio para métrica tipo "adjusted pace" (v2)
- Modelar viento por orientación de tramo (v1.5)

### Filosofía del fundador de MetéoPace (Phil Richardson)

De su contenido público ("Why I built MetéoPace"):

> "Because too many runners blow up chasing a number. You train for 12 weeks, taper, show up ready → then race like the weather doesn't exist. We obsess over pace on Strava with zero context. This isn't about making you look fast. It's about stopping you from running too fast just because your watch says so."

Su posicionamiento es claro: MetéoPace te muestra contra qué estás corriendo realmente (viento, calor, exposición, el circuito). No es perfecto, pero tampoco lo es tu reloj ni el pronóstico que leíste y no supiste interpretar.

**Sobre "Meteo Adjusted Time" — reglas que definen:**
1. Meteo Adjusted Time ≠ tu tiempo real (no es para decir "soy sub-3" si hiciste 3:10)
2. Actual Time ≠ Chip Time en carreras (el reloj arranca en la línea, no en tu muñeca)
3. En el pelotón de punta, el gun time manda — MetéoPace no discute con el podio
4. Meteo Adjusted Time = "lo que podrías haber hecho" — para construir confianza, no para buscar excusas
5. No abusar: nada de "técnicamente corrí sub-3" o "habría ganado sin el viento". Planificá para las condiciones, no las culpes.

**Implicancia para RaceCopilot:** Nuestra métrica equivalente (v2) debe seguir esta misma filosofía. El adjusted pace es una herramienta de aprendizaje y planificación, no de autoengaño. El tono del producto debe ser honesto y realista — "tu plan para estas condiciones" y no "lo que podrías haber hecho".

---

## 8. Monetización

### Pricing

| Plan | Precio | Para quién |
|---|---|---|
| 1ra carrera | Gratis | Sin tarjeta, sin compromiso |
| Pay per race | 5 USD | Runner ocasional |
| Suscripción anual | 20 USD/año | 4+ carreras/año |

La decisión es obvia: 4+ carreras/año → suscripción se paga sola. 20 USD/año es suficientemente barato para no doler.

### Anti-fraude (multi-account)

No invertir en esto en MVP. Crear cuenta nueva = rehacer todo (datos, carreras, productos). La fricción natural es suficiente. El 95% que valora el producto paga.

### Revenue adicional por reingreso

- **Data para mejorar el modelo:** micro-inputs cuando vuelve
- **Post-carrera:** cargar resultado real → calibrar modelo + upsell siguiente carrera
- **Affiliate revenue:** recomendaciones contextuales basadas en el plan del runner (geles, hidratación, gear) — no banners, contenido útil
- **Comunidad liviana:** _"1,243 runners preparan el Maratón de Buenos Aires con vos"_
- **Referral:** _"Regalale una carrera gratis a un amigo"_
- **Preview de features nuevos**

---

## 9. Riesgos y Tradeoffs

### Riesgos principales

| Riesgo | Mitigación |
|---|---|
| Predicción mala → pérdida de confianza | % de confianza honesto, mostrar rangos en vez de absolutos |
| Plan de nutrición sale mal → riesgo legal | Disclaimer médico siempre visible, ser conservador en recomendaciones |
| MetéoPace agrega nutrición → comen el diferencial | Velocidad de lanzamiento, capturar usuarios, generar lock-in con data |
| Runner no vuelve entre carreras | Daily emails, post-carrera loop, adjusted pace (v2) |
| Base de carreras pobre al inicio | GPX upload fácil + scrapeo agresivo pre-launch |

### Qué rompe la confianza

- Predicción muy lejos del resultado sin advertir
- Plan de nutrición que no tiene sentido
- Emails sin novedades reales
- Clima que no matchea con lo que el runner ve en su weather app

### Difícil vs fácil

| Parece fácil, es difícil | Parece difícil, es fácil |
|---|---|
| Calibrar modelo | GPX parsing (trivial) |
| Base de carreras curada | Predicción base (Riegel) |
| Decidir cuándo enviar emails | Enviar emails (Resend) |
| Personalizar nutrición | — |
| % de confianza honesto | — |

### Tradeoff principal

**Precisión vs velocidad de lanzamiento.**

Recomendación: lanzar imperfecto pero transparente. _"Confianza 55%"_ y acertar es mejor que _"vas a hacer 3:48"_ y equivocarse.

---

## 10. Propuesta Técnica

### Stack

| Capa | Tecnología | Por qué |
|---|---|---|
| Frontend | Next.js (React) | SSR para SEO, PWA-ready, deploy rápido en Vercel |
| Backend/API | Next.js API Routes | Monolito primero, separar después |
| DB | PostgreSQL (Supabase o Neon) | Relacional, gratis tier bajo, auth incluido |
| Auth | Supabase Auth o NextAuth | Google OAuth + email/password |
| Clima | Open-Meteo (gratis) + WeatherAPI + backup | 2-3 fuentes, cruzar para confianza |
| Emails | Resend o SendGrid free tier | Transaccionales + daily updates |
| Cron/Jobs | Vercel Cron | Actualizar clima diario, disparar emails |
| GPX | Librería JS (gpxparser) | Client-side, sin costo de infra |
| Pagos | Stripe | Pay per race + suscripción anual |
| Deploy | Vercel | Gratis para arrancar, escala solo |

**Costo de infra MVP: ~0 USD/mes hasta tracción real.**

### Arquitectura

```
[Usuario] → [Next.js Frontend + API]
                    │
         ┌──────────┼──────────┐
         │          │          │
    [Supabase]  [Clima APIs]  [Stripe]
    (DB + Auth)  (cron daily)  (pagos)
         │          │
         └────┬─────┘
              │
        [Motor de cálculo]
        - Predictor (Riegel ajustado)
        - Pacing por elevación
        - Plan hidratación
        - Plan nutrición
              │
        [Resend]
        (daily emails)
```

### Estructura de código

```
/app                    → páginas Next.js
  /dashboard            → carreras del usuario
  /race/[id]            → plan de carrera
  /onboarding           → perfil runner
/lib
  /engine               → EL CORE (separable a microservicio)
    /predictor.ts       → modelo de predicción
    /pacing.ts          → splits por elevación + clima
    /hydration.ts       → plan de hidratación
    /nutrition.ts       → plan de nutrición
    /confidence.ts      → cálculo de % confianza
  /weather
    /sources.ts         → fetchers para cada API de clima
    /aggregator.ts      → cruce de fuentes + confianza
  /gpx
    /parser.ts          → parseo de GPX
    /elevation.ts       → perfil de elevación
  /email
    /templates.ts       → templates de daily update
    /triggers.ts        → lógica de cuándo enviar
/jobs
  /update-weather.ts    → cron diario
  /send-updates.ts      → evaluar cambios y enviar emails
```

### Decisiones técnicas clave

1. **Monolito primero.** Next.js hace todo. No separar backend hasta que haya razón real.
2. **Engine como módulo puro.** Funciones que reciben data y devuelven plan. Sin DB, sin HTTP, sin side effects. Testeable con unit tests.
3. **GPX client-side.** Parseo liviano, no necesita server.
4. **Emails solo cuando hay delta.** Lógica: ¿cambió predicción más de 1 min? ¿Apareció viento? ¿Cambió confianza más de 10 puntos?
5. **Stripe desde día 1.** Pricing es parte de la experiencia.

---

## 11. Resoluciones del Review

### 11.1 Nutrición en carreras cortas (<75 min)
- Umbral: 75 minutos de duración estimada
- Si duración <75min: el tab de nutrición existe pero muestra mensaje educativo: "Para esta distancia y ritmo no necesitás suplementar durante la carrera. Hidratación normal alcanza."
- Siempre sugerir un gel 5 minutos antes de largar si el desayuno fue más de 2 horas antes de la carrera

### 11.2 Fórmula de hidratación — Modelo de Sawka
Se adopta la ecuación validada de Sawka et al. (2009) en lugar de factores inventados:

```
msw (g/m²/h) = 147 + 1.527 × Ereq - 0.87 × Emax
```

Donde:
- Ereq = calor que el cuerpo necesita disipar (función de metabolic rate / intensidad del ejercicio)
- Emax = capacidad máxima de evaporación del ambiente (función de temperatura, humedad, viento)
- Se aplica sobre BSA calculado con DuBois: BSA (m²) = 0.007184 × peso(kg)^0.425 × altura(cm)^0.725

Esto requiere agregar **altura** al onboarding (además de peso).

Inputs necesarios:
- BSA (peso + altura → DuBois)
- Metabolic rate (estimable desde ritmo de carrera — hay tablas publicadas para running)
- Temperatura, humedad, viento del forecast

Fuentes: Sawka et al. 2009 "Expanded prediction equations of human sweat loss and water needs", Journal of Applied Physiology.

### 11.3 Sistema de confianza — Fórmula

Cada factor produce un score parcial:

| Factor | Valores |
|---|---|
| Carreras de referencia | 1=50%, 3=70%, 5=85%, 10=95% |
| Recencia | Todas <6 meses=100%, >6 meses=-15%, >1 año=-25% |
| Clima: días para carrera | 0-2 días=95%, 3-7=80%, 8-14=60%, 15-30=40%, >30=25% |
| Concordancia fuentes clima | 3 coinciden (<2°C diff)=100%, 2 coinciden=85%, divergen=60% |
| GPX disponible | Sí=100%, No=75% |

Confianza final = promedio ponderado:
```
confianza = (carreras × 0.20) + (recencia × 0.15) + (clima_dias × 0.25) + (clima_fuentes × 0.25) + (gpx × 0.15)
```

### 11.4 Viento entra en MVP
El viento viene incluido en el forecast de las APIs de clima (sin costo marginal) y la orientación de cada tramo ya se tiene del GPX. No hay razón para diferirlo. Se implementa en MVP, no en v1.5.

### 11.5 Regla del Consenso (target "absurdo")
La regla usa segundos por km, no porcentajes (más intuitivo para runners):

- **Hasta 5s/km más rápido que pronóstico:** Consenso = target. Etiqueta: "Agresivo pero realista"
- **Entre 5 y 10s/km:** Consenso = punto medio entre pronóstico y target. Etiqueta: "Tu target es ambicioso, te sugerimos X"
- **Más de 10s/km:** Consenso = pronóstico + 5s/km. Etiqueta: "Tu target está lejos de tu forma actual"
- **En todos los casos:** se muestra el pronóstico detallado completo al lado

### 11.6 Distancia custom sin GPX
- Riegel extrapola el tiempo predicho sin problema desde las carreras de referencia
- Splits por km se ajustan con GPX si lo tiene
- Sin GPX: splits uniformes + warning "Sin perfil de elevación, los splits son estimados en terreno plano. Subí el GPX para mejor precisión"
- Opción de agregar **desnivel positivo total** como corrector global (ej: "350m D+"). El modelo distribuye el impacto uniformemente a lo largo de la carrera. No es tan preciso como GPX pero mucho mejor que asumir plano.

### 11.7 Transición clima histórico → forecast
Transición gradual en 3 fases:
- **>14 días antes:** clima histórico puro (promedio de ese día/ciudad). Confianza baja.
- **7 a 14 días:** blend histórico + forecast. Confianza media.
- **<7 días:** forecast puro de las APIs. Confianza alta.

### 11.8 Paywall — dónde aparece
En la segunda carrera (la primera es gratis):
- El usuario crea la carrera y ve: predicción de tiempo, los 3 objetivos (pronóstico/target/consenso), perfil de elevación
- Los splits detallados, plan de nutrición y plan de hidratación están **bloqueados/borrosos**
- El "aha moment" le pega antes de pagar — entiende qué está comprando
- Al pagar (5 USD por carrera o 20 USD/año) se desbloquea todo + daily emails
