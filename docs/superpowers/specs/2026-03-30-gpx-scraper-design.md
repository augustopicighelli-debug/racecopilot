# GoAndRace GPX Scraper — Design Spec

## Objetivo

Script Python que crawlea GoAndRace.com, descarga todos los archivos GPX de carreras disponibles, y genera un catálogo JSON centralizado para consumir desde la app Next.js.

## Arquitectura

Un solo script `scripts/scrape_gpx.py` con 3 fases secuenciales:

1. **Crawl** — Parsear el índice de carreras (`/en/past-running-race-events.php`), extraer links a páginas individuales de carreras.
2. **Extract** — De cada página de carrera, encontrar el link de descarga del GPX y extraer metadata (nombre, año, ubicación, distancia si disponible).
3. **Download** — Descargar cada GPX a `data/gpx/`, generar/actualizar `data/gpx/catalog.json`.

## Idempotencia

- Antes de descargar, chequea si la `source_url` ya existe en `catalog.json`.
- Si existe, skip. Si no, descarga y agrega al catálogo.
- Esto permite re-ejecutar el script para capturar carreras nuevas sin duplicar.

## Rate Limiting

- 1-2 segundos de delay aleatorio entre requests.
- User-Agent descriptivo: `RaceCopilot-GPX-Scraper/1.0`.

## Estructura de Salida

```
data/gpx/
  catalog.json
  buenos-aires-marathon-2024.gpx
  maraton-de-mendoza-2024.gpx
  ...
```

### catalog.json schema

```json
[
  {
    "slug": "buenos-aires-marathon-2024",
    "name": "Buenos Aires Marathon",
    "year": 2024,
    "country": "Argentina",
    "source_url": "https://goandrace.com/en/map/2024/buenos-aires-marathon-2024-course-map-1.php",
    "gpx_file": "buenos-aires-marathon-2024.gpx"
  }
]
```

## Dependencias Python

- `requests` — HTTP client
- `beautifulsoup4` — HTML parsing
- `lxml` — parser backend rápido para BeautifulSoup

## CLI

```bash
pip install requests beautifulsoup4 lxml
python scripts/scrape_gpx.py          # descarga todo lo nuevo
python scripts/scrape_gpx.py --dry-run # muestra qué descargaría sin descargar
```

## Decisiones Explícitas

- **Solo GoAndRace** como fuente. Fuentes secundarias quedan para iteración futura.
- **Sin conversión KML** en esta versión.
- **Sin login/auth** — GoAndRace no lo requiere.
- **Flat file structure** — todos los GPX en `data/gpx/`, metadata en `catalog.json`.
- **Python separado del stack Node** — script standalone, no integrado al build de Next.js.
