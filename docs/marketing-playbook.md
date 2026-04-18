# Marketing Playbook — RaceCopilot

Versión operativa del plan. Lo que tenés que hacer cada semana y cómo invocar a los agentes Claude para que el trabajo suceda sin ejecución manual.

## Pricing en producción

- **Mensual**: $8/mes
- **Anual**: $48/año (2 meses gratis)
- **Trial**: 7 días gratis, sin cobro hasta el día 8
- **LTV neto blended**: ~$51 por usuario pago
- **CAC objetivo**: ≤ $15 · CAC techo: $25

---

## Agentes Claude disponibles

Todos en `.claude/agents/` usando modelo Haiku. Invocar con el Agent tool.

| Agente | Frecuencia | Output |
|---|---|---|
| `race-scraper` | 1x por mes | `data/races/catalog.json` con 500+ carreras |
| `seo-content-writer-bilingual` | 1-2x semana | Enriquece entradas del catálogo con `intro_es`/`intro_en` largos |
| `social-content-generator-bilingual` | Mensual | `content/social/YYYY-MM.md` con calendario de 24+ posts |
| `reddit-community-monitor` | Semanal | `content/reddit/YYYY-MM-DD.md` con 5-10 threads y borradores |
| `email-sequence-writer-bilingual` | 1x setup + ajustes | `content/emails/*.html` por secuencia |
| `marketing-analytics-reporter` | Semanal (lunes) | `docs/reports/weekly-YYYY-MM-DD.md` |
| `meta-ads-creative-writer` | Quincenal desde mes 3 | `content/ads/meta-YYYYMM-v*.md` |

### Invocación ejemplo

```
Invocá el agente race-scraper y traé las top 500 carreras 2026-2027 priorizando hispanas.
```

```
Invocá el agente seo-content-writer-bilingual con input:
{ "slug": "maraton-santiago-chile-2026", "name_es": "Maratón de Santiago 2026", ... }
Enriquecé la entrada en data/races/catalog.json con intro_es e intro_en de 250 palabras.
```

---

## Taxonomía UTMs (usar siempre)

```
?utm_source=<origen>&utm_medium=<medio>&utm_campaign=<campaña>
```

**Origen (`utm_source`)**:
- `reddit` · `instagram` · `tiktok` · `twitter` · `google` · `meta` · `email` · `direct` · `seo`

**Medio (`utm_medium`)**:
- `organic` · `paid` · `social` · `email` · `referral` · `lifecycle`

**Campaña (`utm_campaign`)** — convenciones:
- `seo-race-<slug>` — landing orgánica de una carrera
- `content-<hook>` — post social con un hook específico
- `retargeting-v1` · `retargeting-v2` — Meta ads retargeting
- `onboarding-d<N>` — emails transaccionales
- `reactivation-<fase>` — emails de reactivación churn

---

## Rutina semanal (lunes 30 min)

1. **Correr reporte** — invocar `marketing-analytics-reporter` → leer resumen
2. **Monitorear Reddit** — invocar `reddit-community-monitor` → postear 5 respuestas
3. **Publicar contenido social** — usar calendario del mes, postear 4 ES + 2 EN
4. **Revisar Google Search Console** — ver qué landings rankean, qué queries traen tráfico
5. **Revisar Stripe** — MRR, churn, nuevos paid

## Rutina mensual (primer lunes, 2h)

1. **Regenerar calendario social** — invocar `social-content-generator-bilingual` para el mes
2. **Ampliar catálogo de carreras** — invocar `race-scraper` si hay carreras nuevas
3. **Generar 10 nuevas landings** — invocar `seo-content-writer-bilingual` sobre top 10 pendientes
4. **Newsletter mensual** — invocar `email-sequence-writer-bilingual` para generar el envío
5. **Meta ads creatives** (desde mes 3) — invocar `meta-ads-creative-writer` para 2 nuevas variantes

---

## Fases del plan (recordatorio)

### Fase 0 — Setup (mes 0-1, budget $0)
- Agentes creados ✅
- Analytics instalados ✅
- 3 landings seed en el catálogo ✅
- Próximo: correr `race-scraper` para llegar a 500 entries + `seo-content-writer-bilingual` en batch

### Fase 1 — Orgánico (mes 2-3, budget $0)
- 100+ landings SEO publicadas
- Reddit + Strava clubs activos
- Blog con 3 artículos pilar publicados
- Target: 40-80 paid conversions/mes

### Fase 2 — Retargeting (mes 4-5, budget $300/mes)
- Meta Pixel con audiencia de 10k+ visitantes
- Retargeting con 3 creativos A/B
- Referral program activo
- Target: 100-180 paid/mes, CAC ≤ $20

### Fase 3 — Escalado (mes 6+, budget $300-600/mes)
- Lookalike audience sobre conversiones
- Expansión a más países
- Partnerships con carreras (si se reevalúa la política)
- Target: 250-400 paid/mes

---

## KPIs que mirar cada semana

- **North Star**: paid conversions netas (nuevos − churn)
- **Visitas únicas landings SEO**: debe crecer 15-30% mensual
- **Signup rate** (visitas → signup): target ≥ 3%
- **Trial start rate** (signup → trial con tarjeta): target ≥ 70%
- **Trial → paid**: target ≥ 40%
- **Churn mensual**: target < 8%
- **CAC por canal**: target blended ≤ $15

Si un KPI cae >10% dos semanas seguidas → alertar y pausar lo problemático.

---

## Qué NO hacer

- No hacer prospecting Meta frío antes del mes 4
- No gastar en Google Ads keywords genéricas
- No contratar influencers macro
- No contactar organizadores de carreras (política de confidencialidad)
- No postear desde cuenta personal — todo desde cuenta de marca
- No spamear Reddit — máximo 1 mención de producto por respuesta
