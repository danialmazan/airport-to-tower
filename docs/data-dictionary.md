# Data dictionary

All files are UTF-8 CSV with one fact per field. IDs are lowercase stable slugs and must not be changed when a display name changes.

| File | Purpose | Important constraints |
|---|---|---|
| `cities.csv` | Release coverage frame and bilingual place names | Exactly 150 approved cities in edition 1 |
| `airports.csv` | Airport entities and reference-point coordinates | Valid WGS84 coordinates; uppercase IATA/ICAO where present |
| `city_airports.csv` | Many-to-many city service relationships | One primary airport per city; included relations must be approved |
| `towers.csv` | Physical structure entities | Positive height; completed permanent structures only |
| `city_towers.csv` | Candidate and eligibility relationship | Association and review source required |
| `tower_selections.csv` | Tallest/Iconic editorial decisions | Exactly one Iconic and at least one Tallest per city |
| `sources.csv` | Evidence registry | Stable ID, URL, access date and licence note |
| `research_log.csv` | Ambiguities and waivers | Blocking open issues prevent publication |

Generated observation IDs are `city_id--airport_id--mode--tower_id`. Distances are generated from coordinates and must never be entered manually.
