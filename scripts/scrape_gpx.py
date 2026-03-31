# scripts/scrape_gpx.py
"""GoAndRace.com GPX scraper for RaceCopilot."""

import json
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
GPX_DIR = Path(__file__).resolve().parent.parent / "data" / "gpx"
CATALOG_PATH = GPX_DIR / "catalog.json"

SESSION = requests.Session()
SESSION.headers.update({"User-Agent": USER_AGENT})

DELAY_RANGE = (1.0, 2.0)

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


if __name__ == "__main__":
    print("scrape_gpx.py — skeleton OK")
