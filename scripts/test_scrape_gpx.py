# scripts/test_scrape_gpx.py
"""Tests for GoAndRace GPX scraper parsing logic."""

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


def test_placeholder():
    assert True


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
