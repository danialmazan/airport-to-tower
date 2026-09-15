# Airport to Tower Distance Global Index

A static, bilingual data-visualisation ranking airport–city–tower combinations by WGS84 geodesic distance. The site has no backend and no runtime dependency on research APIs.

## Release status

The current 150-city dataset is a **research preview**, not a publication-ready editorial edition. Coverage, relational structure, calculations, and interfaces are complete; airport eligibility and tower selections were machine-assisted candidate discoveries and still require source-by-source verification against the methodology. This status is encoded in `metadata.json` and shown in the interface so the preview cannot be mistaken for the reviewed public release.

## Commands

```bash
npm install
npm run dev
npm run check
npm run build
```

`data/curated/` is the editable source of truth. `npm run generate` validates the relationships and writes deterministic browser-ready files to `data/generated/` and `public/data/`.

The one-off `research:seed` command is intentionally outside the build. It accepts a downloaded OurAirports `airports.csv`, resolves candidate Wikidata entities, and rewrites the curated CSVs. Do not run it during routine builds; review all generated changes before accepting them.

## Add or update a city

1. Add the city and its coverage-frame source.
2. Add airports, then associate and document them in `city_airports.csv`.
3. Add tower candidates and city associations.
4. Add exactly one Iconic selection and one or more co-tallest Tallest selections.
5. Add each evidence record to `sources.csv` and any ambiguity to `research_log.csv`.
6. Run `npm run check`, review the generated diff, then run `npm run build`.

The full methodology is available in [English](docs/methodology.en.md) and [Spanish](docs/methodology.es.md). Field definitions are in [the data dictionary](docs/data-dictionary.md).

## Deployment

The included GitHub Actions workflow builds and deploys `dist/` to GitHub Pages at `https://danielalmazan.com/airport-to-tower/`. The production base path is fixed to `/airport-to-tower/`; local development continues to use `/`.

Code is intended for release under MIT. Curated data retains source-level attribution and licence notes in `sources.csv`; review those notes before redistributing source-derived records.
