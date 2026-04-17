# scripts/scrape_gpx.py
"""GoAndRace.com GPX scraper for RaceCopilot.
Procesa los GPX en memoria y sube el perfil de elevación pre-cocinado a Supabase.
No guarda archivos GPX en disco.
"""

import json
import math
import os
import re
import sys
import time
import random
import argparse
import unicodedata
from pathlib import Path
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://www.goandrace.com/en/"
INDEX_URL = BASE_URL + "past-running-race-events.php"
USER_AGENT = "RaceCopilot-GPX-Scraper/1.0"

SESSION = requests.Session()
SESSION.headers.update({"User-Agent": USER_AGENT})

DELAY_RANGE = (1.0, 2.0)

# Supabase — leer desde env o .env.local
def _load_env():
    env_path = Path(__file__).resolve().parent.parent / ".env.local"
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            if "=" in line and not line.startswith("#"):
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())

_load_env()

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

# Countries with major running events on GoAndRace (ISO 2-letter codes)
COUNTRIES = [
    "AR", "BR", "CL", "CO", "MX", "PE", "UY",  # South America
    "US", "CA",                                    # North America
    "ES", "FR", "IT", "DE", "GB", "NL",           # Europe
    "PT", "CH", "BE", "AT",
    "JP", "CN", "KR", "AU", "NZ",                 # Asia-Pacific
    "ZA", "KE", "ET",                              # Africa
]

RACE_TYPES = [
    {"ok_marath": "ok_marath"},
    {"ok_half_marath": "ok_half_marath"},
]


# ---------------------------------------------------------------------------
# GPX parsing + elevation processing (en memoria, sin disco)
# ---------------------------------------------------------------------------

def parse_gpx_elevation(xml: str) -> list[dict]:
    """Extrae puntos lat/lon/ele de un GPX string."""
    points = []
    trkpt_re = re.compile(
        r'<trkpt[^>]+lat="([\d.\-]+)"[^>]+lon="([\d.\-]+)"[^>]*>([\s\S]*?)</trkpt>'
    )
    ele_re = re.compile(r'<ele>([\d.\-]+)</ele>')
    for m in trkpt_re.finditer(xml):
        ele_m = ele_re.search(m.group(3))
        if ele_m:
            points.append({
                "lat": float(m.group(1)),
                "lon": float(m.group(2)),
                "ele": float(ele_m.group(1)),
            })
    return points


def haversine_km(lat1, lon1, lat2, lon2) -> float:
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def smooth(arr: list[float], w: int) -> list[float]:
    """Media móvil centrada de ventana w."""
    result = []
    n = len(arr)
    for i in range(n):
        lo, hi = max(0, i - w), min(n - 1, i + w)
        result.append(sum(arr[lo:hi+1]) / (hi - lo + 1))
    return result


def build_elevation_profile(xml: str) -> dict | None:
    """Procesa GPX y retorna perfil pre-cocinado listo para DB."""
    raw = parse_gpx_elevation(xml)
    if len(raw) < 10:
        return None

    eles = smooth([p["ele"] for p in raw], 5)

    cum_km = 0.0
    gain_m = 0.0
    loss_m = 0.0
    points = [{"km": 0.0, "elevationM": round(eles[0])}]
    next_sample = 0.1  # cada 100m

    for i in range(1, len(raw)):
        seg = haversine_km(raw[i-1]["lat"], raw[i-1]["lon"], raw[i]["lat"], raw[i]["lon"])
        cum_km += seg

        delta = eles[i] - eles[i-1]
        if delta > 0:
            gain_m += delta
        else:
            loss_m += abs(delta)

        if cum_km >= next_sample:
            points.append({"km": round(cum_km, 1), "elevationM": round(eles[i])})
            next_sample += 0.1

    points.append({"km": round(cum_km, 1), "elevationM": round(eles[-1])})

    return {
        "points": points,
        "gain_m": round(gain_m),
        "loss_m": round(loss_m),
        "distance_km": round(cum_km, 2),
    }


# ---------------------------------------------------------------------------
# Supabase
# ---------------------------------------------------------------------------

def supabase_exists(slug: str) -> bool:
    """Verifica si el slug ya está en la DB."""
    if not SUPABASE_URL:
        return False
    resp = requests.get(
        f"{SUPABASE_URL}/rest/v1/gpx_catalog",
        params={"slug": f"eq.{slug}", "select": "slug"},
        headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"},
        timeout=10,
    )
    return len(resp.json()) > 0 if resp.ok else False


def supabase_upsert(entry: dict) -> bool:
    """Inserta o actualiza una entrada en gpx_catalog. Reintenta hasta 3 veces."""
    if not SUPABASE_URL:
        print("    WARN: SUPABASE_URL no configurado")
        return False
    # Limitar puntos a máx 500 para evitar payloads enormes
    if isinstance(entry.get("elevation_profile"), list):
        pts = entry["elevation_profile"]
        if len(pts) > 500:
            step = len(pts) // 500
            entry["elevation_profile"] = pts[::step][:500]

    for attempt in range(3):
        try:
            resp = requests.post(
                f"{SUPABASE_URL}/rest/v1/gpx_catalog",
                json=entry,
                headers={
                    "apikey": SUPABASE_KEY,
                    "Authorization": f"Bearer {SUPABASE_KEY}",
                    "Content-Type": "application/json",
                    "Prefer": "resolution=merge-duplicates",
                },
                timeout=20,
            )
            return resp.ok
        except requests.RequestException as e:
            print(f"    Retry {attempt+1}/3: {e}")
            time.sleep(2 * (attempt + 1))
    return False


# ---------------------------------------------------------------------------
# Scraping
# ---------------------------------------------------------------------------

def fetch_index(country: str, race_type_params: dict) -> str:
    delay()
    params = {"Country": country, **race_type_params}
    resp = SESSION.get(INDEX_URL, params=params, timeout=30)
    resp.raise_for_status()
    return resp.text


def fetch_page(url: str) -> str:
    delay()
    resp = SESSION.get(url, timeout=30)
    resp.raise_for_status()
    return resp.text


def delay():
    time.sleep(random.uniform(*DELAY_RANGE))


def parse_index_page(html: str) -> list[dict]:
    soup = BeautifulSoup(html, "lxml")
    races = []
    for card in soup.select(".card"):
        title_link = card.select_one("h5.card-title a")
        if not title_link:
            continue
        name = title_link.get_text(strip=True)
        href = title_link["href"]
        slug = href.replace("running-events/", "").replace(".php", "")

        flag_img = card.select_one("p.card-text img[src*='flags']")
        country = ""
        if flag_img:
            country = flag_img["src"].split("/")[-1].replace(".png", "").replace("-", " ")

        city_p = card.select_one("p.card-text")
        city = city_p.get_text(strip=True) if city_p else ""

        races.append({"name": name, "slug": slug, "detail_url": href, "country": country, "city": city})
    return races


def parse_detail_page(html: str) -> list[dict]:
    soup = BeautifulSoup(html, "lxml")
    maps = []
    for item in soup.select(".race-course-item"):
        map_link = item.select_one("a[href*='course-map']")
        if not map_link:
            continue
        h5 = item.select_one("h5")
        distance, race_num = "", 0
        if h5:
            m = re.match(r"Race\s+(\d+)\s*-\s*(.+)", h5.get_text(strip=True))
            if m:
                race_num = int(m.group(1))
                distance = m.group(2).strip()
        maps.append({"distance": distance, "race_num": race_num, "map_url": map_link["href"]})
    return maps


def parse_map_page(html: str) -> str | None:
    soup = BeautifulSoup(html, "lxml")
    gpx_div = soup.select_one("div#gpx")
    if gpx_div:
        link = gpx_div.select_one("a[href$='.gpx'], a[href*='.gpx?']")
        if link:
            return link["href"]
    link = soup.select_one("a[href$='.gpx'], a[href*='.gpx?']")
    return link["href"] if link else None


def _strip_accents(text: str) -> str:
    nfkd = unicodedata.normalize("NFKD", text)
    return "".join(c for c in nfkd if not unicodedata.combining(c))


def make_gpx_slug(name: str, year: int, distance: str, race_num: int = 0) -> str:
    dist_short = ""
    dist_match = re.match(r"([\d.]+)", distance)
    if dist_match:
        dist_short = str(int(float(dist_match.group(1)))) + "k"
    slug = _strip_accents(name).lower()
    slug = re.sub(r"[^a-z0-9]+", "-", slug).strip("-")
    parts = [slug]
    if str(year) not in slug:
        parts.append(str(year))
    if dist_short:
        parts.append(dist_short)
    if race_num > 1:
        parts.append(f"r{race_num}")
    return "-".join(parts)


def parse_distance_km(distance_str: str) -> float | None:
    """Convierte '42.2 km', '21.1 km', '10 km' a float."""
    m = re.match(r"([\d.]+)", distance_str.strip())
    return float(m.group(1)) if m else None


def dedup_latest(races: list[dict]) -> list[dict]:
    """Keep only the most recent edition of each race."""
    groups: dict[str, tuple[dict, int]] = {}
    for race in races:
        base = re.sub(r'\s*\d{4}\s*', ' ', race['name']).strip()
        year_match = re.search(r'(\d{4})', race['slug'])
        year = int(year_match.group(1)) if year_match else 0
        if base not in groups or year > groups[base][1]:
            groups[base] = (race, year)
    return [v[0] for v in groups.values()]


def scrape_race(race: dict, known_slugs: set[str], dry_run: bool) -> int:
    """Procesa una carrera: descarga GPX, extrae elevación, sube a Supabase.
    Retorna cantidad de entradas nuevas."""
    detail_url = urljoin(INDEX_URL, race["detail_url"])
    print(f"  Checking: {race['name']}")

    try:
        detail_html = fetch_page(detail_url)
    except requests.RequestException as e:
        print(f"    SKIP (detail error): {e}")
        return 0

    maps = parse_detail_page(detail_html)
    if not maps:
        print(f"    No maps found")
        return 0

    new = 0
    for map_info in maps:
        map_url = urljoin(detail_url, map_info["map_url"])
        try:
            map_html = fetch_page(map_url)
        except requests.RequestException as e:
            print(f"    SKIP map {map_info['race_num']}: {e}")
            continue

        gpx_relative = parse_map_page(map_html)
        if not gpx_relative:
            print(f"    No GPX for race {map_info['race_num']}")
            continue

        gpx_url = urljoin(map_url, gpx_relative).split("?")[0]
        year_match = re.search(r"(\d{4})", race["slug"])
        year = int(year_match.group(1)) if year_match else 0
        slug = make_gpx_slug(race["name"], year, map_info["distance"], map_info["race_num"])

        if slug in known_slugs:
            print(f"    Already in DB: {slug}")
            continue

        if dry_run:
            print(f"    [DRY RUN] Would process: {gpx_url} -> {slug}")
            new += 1
            continue

        # Descargar GPX en memoria
        try:
            delay()
            gpx_resp = SESSION.get(gpx_url, timeout=60)
            gpx_resp.raise_for_status()
            xml = gpx_resp.text
        except requests.RequestException as e:
            print(f"    SKIP download: {e}")
            continue

        # Procesar elevación
        profile = build_elevation_profile(xml)
        if not profile:
            print(f"    SKIP: GPX sin datos de elevación")
            continue

        dist_km = parse_distance_km(map_info["distance"]) or profile["distance_km"]

        entry = {
            "slug": slug,
            "name": race["name"],
            "year": year,
            "country": race["country"],
            "city": race.get("city", ""),
            "distance_km": dist_km,
            "gain_m": profile["gain_m"],
            "loss_m": profile["loss_m"],
            "elevation_profile": profile["points"],
        }

        try:
            ok = supabase_upsert(entry)
        except Exception as e:
            print(f"    FAIL upsert exception: {e}")
            ok = False
        if ok:
            known_slugs.add(slug)
            print(f"    OK Uploaded: {slug} | +{profile['gain_m']}m -{profile['loss_m']}m")
            new += 1
        else:
            print(f"    FAIL upsert: {slug}")

    return new


def load_known_slugs() -> set[str]:
    """Carga los slugs ya existentes en Supabase para evitar re-procesar."""
    if not SUPABASE_URL:
        return set()
    resp = requests.get(
        f"{SUPABASE_URL}/rest/v1/gpx_catalog",
        params={"select": "slug"},
        headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"},
        timeout=15,
    )
    if resp.ok:
        return {r["slug"] for r in resp.json()}
    return set()


def main():
    parser = argparse.ArgumentParser(description="Scrape GPX from GoAndRace → Supabase")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--countries", nargs="+", help="e.g. --countries AR BR CL")
    args = parser.parse_args()

    countries = [c.upper() for c in args.countries] if args.countries else COUNTRIES
    known_slugs = load_known_slugs()
    print(f"DB actual: {len(known_slugs)} carreras")
    print(f"Scanning {len(countries)} países x {len(RACE_TYPES)} tipos...\n")

    total_new = 0
    for country in countries:
        for race_type in RACE_TYPES:
            type_name = list(race_type.keys())[0].replace("ok_", "")
            print(f"\n[{country} / {type_name}]")
            try:
                index_html = fetch_index(country, race_type)
            except requests.RequestException as e:
                print(f"  SKIP: {e}")
                continue

            races = dedup_latest(parse_index_page(index_html))
            print(f"  {len(races)} carreras (última edición)")

            for race in races:
                total_new += scrape_race(race, known_slugs, args.dry_run)

    action = "procesaría" if args.dry_run else "subidas"
    print(f"\nDone! {total_new} nuevas {action}. DB total: {len(known_slugs)}")


if __name__ == "__main__":
    main()
