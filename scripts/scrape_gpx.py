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


if __name__ == "__main__":
    print("scrape_gpx.py — skeleton OK")
