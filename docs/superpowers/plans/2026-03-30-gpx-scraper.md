# GoAndRace GPX Scraper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Python scraper that crawls GoAndRace.com, downloads GPX files for all available races, and generates a `catalog.json` for the Next.js app.

**Architecture:** Single script with 3 phases: crawl index (with pagination via filters), extract GPX URLs from race/map pages, download GPX files. Idempotent via catalog.json lookup. Rate-limited with 1-2s random delays.

**Tech Stack:** Python 3, requests, beautifulsoup4, lxml

---

## File Structure

| File | Responsibility |
|------|---------------|
| `scripts/scrape_gpx.py` | Main scraper script — CLI entry point, orchestrates crawl/extract/download |
| `scripts/test_scrape_gpx.py` | Tests for parsing logic (index, detail, map page parsers) |
| `scripts/requirements.txt` | Python dependencies |
| `data/gpx/catalog.json` | Output: race metadata catalog |
| `data/gpx/*.gpx` | Output: downloaded GPX files |

---

### Task 1: Project setup and dependencies

**Files:**
- Create: `scripts/requirements.txt`
- Create: `scripts/scrape_gpx.py` (skeleton)
- Create: `scripts/test_scrape_gpx.py` (skeleton)

- [ ] **Step 1: Create requirements.txt**

```
requests>=2.31
beautifulsoup4>=4.12
lxml>=5.0
```

- [ ] **Step 2: Create scraper skeleton with constants**

```python
# scripts/scrape_gpx.py
"""GoAndRace.com GPX scraper for RaceCopilot."""

import json
import os
import re
import sys
import time
import random
import argparse
from pathlib import Path
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://www.goandrace.com/en/"
INDEX_URL = BASE_URL + "past-running-race-events.php"
USER_AGENT = "RaceCopilot-GPX-Scraper/1.0"
GPX_DIR = Path(__file__).resolve().parent.parent / "data" / "gpx"
CATALOG_PATH = GPX_DIR / "catalog.json"

SESSION = requests.Session()
SESSION.headers.update({"User-Agent": USER_AGENT})

DELAY_RANGE = (1.0, 2.0)


def delay():
    """Sleep a random 1-2s between requests."""
    time.sleep(random.uniform(*DELAY_RANGE))


def load_catalog() -> list[dict]:
    """Load existing catalog.json or return empty list."""
    if CATALOG_PATH.exists():
        with open(CATALOG_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return []


def save_catalog(catalog: list[dict]):
    """Save catalog to JSON."""
    GPX_DIR.mkdir(parents=True, exist_ok=True)
    with open(CATALOG_PATH, "w", encoding="utf-8") as f:
        json.dump(catalog, f, indent=2, ensure_ascii=False)


if __name__ == "__main__":
    print("scrape_gpx.py — skeleton OK")
```

- [ ] **Step 3: Create test skeleton**

```python
# scripts/test_scrape_gpx.py
"""Tests for GoAndRace GPX scraper parsing logic."""


def test_placeholder():
    assert True
```

- [ ] **Step 4: Install dependencies and run skeleton**

Run: `cd scripts && pip install -r requirements.txt && python scrape_gpx.py`
Expected: `scrape_gpx.py — skeleton OK`

- [ ] **Step 5: Run tests**

Run: `cd scripts && python -m pytest test_scrape_gpx.py -v`
Expected: 1 test PASS

- [ ] **Step 6: Commit**

```bash
git add scripts/requirements.txt scripts/scrape_gpx.py scripts/test_scrape_gpx.py
git commit -m "feat(scraper): add project skeleton and dependencies"
```

---

### Task 2: Parse race index page

The index page at `/en/past-running-race-events.php` returns max 50 races per request. Each race is a Bootstrap card with JSON-LD metadata. We iterate by country filter to get all races.

**Files:**
- Modify: `scripts/scrape_gpx.py`
- Modify: `scripts/test_scrape_gpx.py`

- [ ] **Step 1: Write failing test for index parser**

```python
# scripts/test_scrape_gpx.py
from scrape_gpx import parse_index_page

INDEX_HTML = """
<html><body>
<div class="card">
  <div class="card-body d-flex flex-column p-3">
    <div class="small text-muted">Sun 29 March 2026</div>
    <h5 class="card-title pt-2 mb-1">
      <a href="running-events/buenos-aires-marathon-2026-buenos-aires.php">Buenos Aires Marathon 2026</a>
    </h5>
    <p class="card-text mb-2">
      <img src="../new_flag/flags/shiny/16/Argentina.png"> Buenos Aires
    </p>
    <div class="d-flex flex-wrap gap-1">
      <div class="div_cal_icon_M">42.195 km</div>
    </div>
  </div>
</div>
<div class="card">
  <div class="card-body d-flex flex-column p-3">
    <div class="small text-muted">Sat 28 March 2026</div>
    <h5 class="card-title pt-2 mb-1">
      <a href="running-events/maraton-de-mendoza-2026.php">Maratón de Mendoza 2026</a>
    </h5>
    <p class="card-text mb-2">
      <img src="../new_flag/flags/shiny/16/Argentina.png"> Mendoza
    </p>
    <div class="d-flex flex-wrap gap-1">
      <div class="div_cal_icon_HM">21.1 km</div>
    </div>
  </div>
</div>
</body></html>
"""


def test_parse_index_page():
    races = parse_index_page(INDEX_HTML)
    assert len(races) == 2
    assert races[0]["name"] == "Buenos Aires Marathon 2026"
    assert races[0]["slug"] == "buenos-aires-marathon-2026-buenos-aires"
    assert races[0]["detail_url"] == "running-events/buenos-aires-marathon-2026-buenos-aires.php"
    assert races[0]["country"] == "Argentina"
    assert races[0]["city"] == "Buenos Aires"
    assert races[1]["name"] == "Maratón de Mendoza 2026"
    assert races[1]["country"] == "Argentina"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd scripts && python -m pytest test_scrape_gpx.py::test_parse_index_page -v`
Expected: FAIL — `ImportError: cannot import name 'parse_index_page'`

- [ ] **Step 3: Implement parse_index_page**

Add to `scripts/scrape_gpx.py`:

```python
def parse_index_page(html: str) -> list[dict]:
    """Parse race index HTML, return list of race info dicts."""
    soup = BeautifulSoup(html, "lxml")
    races = []
    for card in soup.select(".card"):
        title_link = card.select_one("h5.card-title a")
        if not title_link:
            continue
        name = title_link.get_text(strip=True)
        href = title_link["href"]
        slug = href.replace("running-events/", "").replace(".php", "")

        # Country from flag image filename
        flag_img = card.select_one("p.card-text img[src*='flags']")
        country = ""
        if flag_img:
            # e.g. "../new_flag/flags/shiny/16/Argentina.png" -> "Argentina"
            country = flag_img["src"].split("/")[-1].replace(".png", "").replace("-", " ")

        # City from text after flag image
        city_p = card.select_one("p.card-text")
        city = ""
        if city_p:
            city = city_p.get_text(strip=True)

        races.append({
            "name": name,
            "slug": slug,
            "detail_url": href,
            "country": country,
            "city": city,
        })
    return races
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd scripts && python -m pytest test_scrape_gpx.py::test_parse_index_page -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/scrape_gpx.py scripts/test_scrape_gpx.py
git commit -m "feat(scraper): parse race index page"
```

---

### Task 3: Parse race detail page for map links

Each race detail page (`/en/running-events/{slug}.php`) has a `#DettagliPercorsi` section. Each `.race-course-item` may contain a link to the 2D course map, or text "No course map available."

**Files:**
- Modify: `scripts/scrape_gpx.py`
- Modify: `scripts/test_scrape_gpx.py`

- [ ] **Step 1: Write failing test**

```python
# Add to scripts/test_scrape_gpx.py
from scrape_gpx import parse_detail_page

DETAIL_HTML = """
<html><body>
<div id="DettagliPercorsi">
  <div class="race-course-item">
    <h5>Race 1 - 42.195 km</h5>
    <div class="race-course-actions">
      <a href="../../en/map/2026/buenos-aires-marathon-2026-course-map-1.php">2D Map</a>
    </div>
  </div>
  <div class="race-course-item">
    <h5>Race 2 - 21.1 km</h5>
    <p>No course map available.</p>
  </div>
  <div class="race-course-item">
    <h5>Race 3 - 10.0 km</h5>
    <div class="race-course-actions">
      <a href="../../en/map/2026/buenos-aires-marathon-2026-course-map-3.php">2D Map</a>
    </div>
  </div>
</div>
</body></html>
"""


def test_parse_detail_page():
    maps = parse_detail_page(DETAIL_HTML)
    assert len(maps) == 2
    assert maps[0]["distance"] == "42.195 km"
    assert maps[0]["race_num"] == 1
    assert "course-map-1.php" in maps[0]["map_url"]
    assert maps[1]["distance"] == "10.0 km"
    assert maps[1]["race_num"] == 3
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd scripts && python -m pytest test_scrape_gpx.py::test_parse_detail_page -v`
Expected: FAIL — `ImportError`

- [ ] **Step 3: Implement parse_detail_page**

Add to `scripts/scrape_gpx.py`:

```python
def parse_detail_page(html: str) -> list[dict]:
    """Parse race detail HTML, return list of map links with distance info."""
    soup = BeautifulSoup(html, "lxml")
    maps = []
    for item in soup.select(".race-course-item"):
        map_link = item.select_one("a[href*='course-map']")
        if not map_link:
            continue
        h5 = item.select_one("h5")
        distance = ""
        race_num = 0
        if h5:
            text = h5.get_text(strip=True)
            # "Race 1 - 42.195 km" -> distance="42.195 km", race_num=1
            m = re.match(r"Race\s+(\d+)\s*-\s*(.+)", text)
            if m:
                race_num = int(m.group(1))
                distance = m.group(2).strip()
        maps.append({
            "distance": distance,
            "race_num": race_num,
            "map_url": map_link["href"],
        })
    return maps
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd scripts && python -m pytest test_scrape_gpx.py::test_parse_detail_page -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/scrape_gpx.py scripts/test_scrape_gpx.py
git commit -m "feat(scraper): parse race detail page for map links"
```

---

### Task 4: Parse map page for GPX download URL

Map pages (`/en/map/{YYYY}/{slug}-course-map-{N}.php`) have a `div#gpx` containing an `<a>` tag with the `.gpx` download link.

**Files:**
- Modify: `scripts/scrape_gpx.py`
- Modify: `scripts/test_scrape_gpx.py`

- [ ] **Step 1: Write failing test**

```python
# Add to scripts/test_scrape_gpx.py
from scrape_gpx import parse_map_page

MAP_HTML = """
<html><body>
<div id="gpx">
  <a href="../../../gpx/2026/03/29/gpx_20260329_id10802_race1_20260317223947.gpx?t=1711700000" download>.gpx file</a>
</div>
</body></html>
"""

MAP_HTML_NO_GPX = """
<html><body>
<div id="gpx"></div>
</body></html>
"""


def test_parse_map_page():
    url = parse_map_page(MAP_HTML)
    assert url is not None
    assert url.endswith(".gpx?t=1711700000")
    assert "gpx_20260329_id10802_race1" in url


def test_parse_map_page_no_gpx():
    url = parse_map_page(MAP_HTML_NO_GPX)
    assert url is None
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd scripts && python -m pytest test_scrape_gpx.py -k "map_page" -v`
Expected: 2 FAIL

- [ ] **Step 3: Implement parse_map_page**

Add to `scripts/scrape_gpx.py`:

```python
def parse_map_page(html: str) -> str | None:
    """Parse map page HTML, return GPX download URL or None."""
    soup = BeautifulSoup(html, "lxml")
    gpx_div = soup.select_one("div#gpx")
    if not gpx_div:
        return None
    link = gpx_div.select_one("a[href$='.gpx'], a[href*='.gpx?']")
    if not link:
        return None
    return link["href"]
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd scripts && python -m pytest test_scrape_gpx.py -k "map_page" -v`
Expected: 2 PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/scrape_gpx.py scripts/test_scrape_gpx.py
git commit -m "feat(scraper): parse map page for GPX download URL"
```

---

### Task 5: Slug generation and catalog helpers

Generate clean filenames from race data and manage the catalog for idempotent downloads.

**Files:**
- Modify: `scripts/scrape_gpx.py`
- Modify: `scripts/test_scrape_gpx.py`

- [ ] **Step 1: Write failing tests**

```python
# Add to scripts/test_scrape_gpx.py
from scrape_gpx import make_gpx_slug, is_already_downloaded, load_catalog

def test_make_gpx_slug():
    assert make_gpx_slug("Buenos Aires Marathon", 2026, "42.195 km") == "buenos-aires-marathon-2026-42k"
    assert make_gpx_slug("Maratón de Mendoza", 2026, "21.1 km") == "maraton-de-mendoza-2026-21k"
    assert make_gpx_slug("Berlin Marathon", 2025, "42.195 km") == "berlin-marathon-2025-42k"


def test_is_already_downloaded():
    catalog = [
        {"source_url": "https://goandrace.com/gpx/2026/test.gpx"},
    ]
    assert is_already_downloaded(catalog, "https://goandrace.com/gpx/2026/test.gpx") is True
    assert is_already_downloaded(catalog, "https://goandrace.com/gpx/2026/other.gpx") is False
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd scripts && python -m pytest test_scrape_gpx.py -k "slug or already" -v`
Expected: FAIL

- [ ] **Step 3: Implement helpers**

Add to `scripts/scrape_gpx.py`:

```python
import unicodedata

def _strip_accents(text: str) -> str:
    """Remove accents from text."""
    nfkd = unicodedata.normalize("NFKD", text)
    return "".join(c for c in nfkd if not unicodedata.combining(c))


def make_gpx_slug(name: str, year: int, distance: str) -> str:
    """Generate a clean slug for a GPX filename."""
    # Normalize distance: "42.195 km" -> "42k", "21.1 km" -> "21k"
    dist_short = ""
    dist_match = re.match(r"([\d.]+)", distance)
    if dist_match:
        dist_short = str(int(float(dist_match.group(1)))) + "k"

    slug = _strip_accents(name).lower()
    slug = re.sub(r"[^a-z0-9]+", "-", slug).strip("-")
    return f"{slug}-{year}-{dist_short}" if dist_short else f"{slug}-{year}"


def is_already_downloaded(catalog: list[dict], source_url: str) -> bool:
    """Check if a GPX source URL already exists in the catalog."""
    return any(entry["source_url"] == source_url for entry in catalog)
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd scripts && python -m pytest test_scrape_gpx.py -k "slug or already" -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/scrape_gpx.py scripts/test_scrape_gpx.py
git commit -m "feat(scraper): add slug generation and catalog helpers"
```

---

### Task 6: Country list and index fetching logic

GoAndRace returns max 50 races per request. We iterate by country to get broader coverage. Also filter by race type (marathon, half-marathon).

**Files:**
- Modify: `scripts/scrape_gpx.py`

- [ ] **Step 1: Add country list and fetch_index function**

```python
# Add to scripts/scrape_gpx.py

# Countries with major running events on GoAndRace
COUNTRIES = [
    "Argentina", "Brazil", "Chile", "Colombia", "Mexico", "Peru", "Uruguay",
    "United-States", "Canada",
    "Spain", "France", "Italy", "Germany", "United-Kingdom", "Netherlands",
    "Portugal", "Switzerland", "Belgium", "Austria",
    "Japan", "China", "South-Korea", "Australia", "New-Zealand",
    "South-Africa", "Kenya", "Ethiopia",
]

# Race type filters
RACE_TYPES = [
    {"ok_marath": "ok_marath"},          # Marathon
    {"ok_half_marath": "ok_half_marath"}, # Half-marathon
]


def fetch_index(country: str, race_type_params: dict) -> str:
    """Fetch race index page for a country and race type."""
    params = {"Country": country, **race_type_params}
    resp = SESSION.get(INDEX_URL, params=params, timeout=30)
    resp.raise_for_status()
    return resp.text


def fetch_page(url: str) -> str:
    """Fetch any page with rate limiting."""
    delay()
    resp = SESSION.get(url, timeout=30)
    resp.raise_for_status()
    return resp.text
```

- [ ] **Step 2: Commit**

```bash
git add scripts/scrape_gpx.py
git commit -m "feat(scraper): add country list and fetch helpers"
```

---

### Task 7: Main orchestration and CLI

Wire everything together: iterate countries, parse pages, download GPX, update catalog. Add `--dry-run` flag.

**Files:**
- Modify: `scripts/scrape_gpx.py`

- [ ] **Step 1: Implement download_gpx function**

```python
# Add to scripts/scrape_gpx.py

def download_gpx(gpx_url: str, slug: str) -> str:
    """Download a GPX file, return the local filename."""
    filename = f"{slug}.gpx"
    filepath = GPX_DIR / filename
    delay()
    resp = SESSION.get(gpx_url, timeout=60)
    resp.raise_for_status()
    GPX_DIR.mkdir(parents=True, exist_ok=True)
    with open(filepath, "wb") as f:
        f.write(resp.content)
    return filename
```

- [ ] **Step 2: Implement scrape_race function**

```python
# Add to scripts/scrape_gpx.py

def scrape_race(race: dict, catalog: list[dict], dry_run: bool) -> list[dict]:
    """Scrape a single race: fetch detail page, find maps, download GPX files.
    Returns list of new catalog entries."""
    detail_url = urljoin(INDEX_URL, race["detail_url"])
    print(f"  Checking: {race['name']} ({detail_url})")

    try:
        detail_html = fetch_page(detail_url)
    except requests.RequestException as e:
        print(f"    SKIP (detail page error): {e}")
        return []

    maps = parse_detail_page(detail_html)
    if not maps:
        print(f"    No maps found")
        return []

    new_entries = []
    for map_info in maps:
        map_url = urljoin(detail_url, map_info["map_url"])
        try:
            map_html = fetch_page(map_url)
        except requests.RequestException as e:
            print(f"    SKIP map {map_info['race_num']} (error): {e}")
            continue

        gpx_relative = parse_map_page(map_html)
        if not gpx_relative:
            print(f"    No GPX on map page for race {map_info['race_num']}")
            continue

        # Build absolute GPX URL (strip query params for catalog matching)
        gpx_url = urljoin(map_url, gpx_relative).split("?")[0]

        if is_already_downloaded(catalog, gpx_url):
            print(f"    Already have: {gpx_url}")
            continue

        # Extract year from slug or URL
        year_match = re.search(r"(\d{4})", race["slug"])
        year = int(year_match.group(1)) if year_match else 0

        slug = make_gpx_slug(race["name"], year, map_info["distance"])

        if dry_run:
            print(f"    [DRY RUN] Would download: {gpx_url} -> {slug}.gpx")
        else:
            try:
                filename = download_gpx(gpx_url, slug)
                entry = {
                    "slug": slug,
                    "name": race["name"],
                    "year": year,
                    "country": race["country"],
                    "city": race.get("city", ""),
                    "distance": map_info["distance"],
                    "source_url": gpx_url,
                    "gpx_file": filename,
                }
                new_entries.append(entry)
                catalog.append(entry)
                save_catalog(catalog)
                print(f"    Downloaded: {filename}")
            except requests.RequestException as e:
                print(f"    SKIP download (error): {e}")

    return new_entries
```

- [ ] **Step 3: Implement main function with CLI**

Replace the `if __name__` block in `scripts/scrape_gpx.py`:

```python
def main():
    parser = argparse.ArgumentParser(description="Scrape GPX files from GoAndRace.com")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be downloaded without downloading")
    args = parser.parse_args()

    catalog = load_catalog()
    total_new = 0

    print(f"Existing catalog: {len(catalog)} entries")
    print(f"Scanning {len(COUNTRIES)} countries x {len(RACE_TYPES)} race types...\n")

    for country in COUNTRIES:
        for race_type in RACE_TYPES:
            type_name = list(race_type.keys())[0].replace("ok_", "")
            print(f"\n[{country} / {type_name}]")
            try:
                index_html = fetch_index(country, race_type)
                delay()
            except requests.RequestException as e:
                print(f"  SKIP (index error): {e}")
                continue

            races = parse_index_page(index_html)
            print(f"  Found {len(races)} races")

            for race in races:
                new_entries = scrape_race(race, catalog, args.dry_run)
                total_new += len(new_entries)

    action = "would download" if args.dry_run else "downloaded"
    print(f"\nDone! {action} {total_new} new GPX files. Catalog total: {len(catalog)}")


if __name__ == "__main__":
    main()
```

- [ ] **Step 4: Test manually with dry-run on one country**

Run: `cd scripts && python scrape_gpx.py --dry-run`
Expected: Iterates countries, prints race names and what it would download. No files created.

- [ ] **Step 5: Commit**

```bash
git add scripts/scrape_gpx.py
git commit -m "feat(scraper): main orchestration with dry-run CLI"
```

---

### Task 8: End-to-end test run and cleanup

**Files:**
- Modify: `scripts/test_scrape_gpx.py` (remove placeholder test)

- [ ] **Step 1: Remove placeholder test**

Remove the `test_placeholder` function from `scripts/test_scrape_gpx.py`.

- [ ] **Step 2: Run full test suite**

Run: `cd scripts && python -m pytest test_scrape_gpx.py -v`
Expected: All tests PASS (test_parse_index_page, test_parse_detail_page, test_parse_map_page, test_parse_map_page_no_gpx, test_make_gpx_slug, test_is_already_downloaded)

- [ ] **Step 3: Run a real limited test**

Run: `cd scripts && python scrape_gpx.py --dry-run 2>&1 | head -60`
Expected: Shows races being discovered and GPX URLs that would be downloaded.

- [ ] **Step 4: Final commit**

```bash
git add scripts/test_scrape_gpx.py
git commit -m "test(scraper): finalize test suite, remove placeholder"
```
