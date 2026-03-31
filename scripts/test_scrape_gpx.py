# scripts/test_scrape_gpx.py
"""Tests for GoAndRace GPX scraper parsing logic."""

from scrape_gpx import parse_index_page, parse_detail_page, parse_map_page

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
