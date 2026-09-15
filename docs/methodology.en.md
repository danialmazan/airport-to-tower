# Methodology

Version 1.0 · 2026 edition

## Coverage

This edition contains a frozen frame of 150 urban agglomerations. The frame combines a population core based on the United Nations World Urbanization Prospects with additional cities selected to improve representation across Africa, Europe, North America, South America and Oceania. It is global in reach but is not an exhaustive list of every city.

Every release records its coverage-frame source, review cutoff, source snapshot and methodology version. Adding or removing a city is a release-level decision, not an incidental consequence of available tower data.

## Airports

An airport is included when it has publicly bookable scheduled commercial passenger service during the current season or an announced recurring season and credible sources conventionally describe it as serving the city. Airports can lie outside municipal boundaries, and distance alone neither qualifies nor disqualifies them. Recurring seasonal airports are included and labelled.

Charter-only, cargo-only, military, general-aviation, closed and proposed airports are excluded. A single airport may be associated with multiple cities when each association is independently supported. The primary-airport flag is descriptive and does not change distance or rank.

OurAirports is used for discovery and airport reference-point coordinates. Current service and city association should be checked against airport, operator, aviation-authority or airline sources before publication.

## Tallest

Tallest means the highest completed permanent vertical landmark associated with the recognised metropolitan identity of the city. Eligible types are occupied buildings, freestanding observation or telecommunications towers, monuments and church spires. Guyed masts, cranes, wind turbines, chimneys, utility pylons, temporary works, demolished structures and unfinished projects are excluded.

Height is measured to the highest permanent physical point above ground and the source's measurement basis is retained. This is deliberately broader than building-only architectural-height rankings. Exact co-tallest structures at the best published precision are all retained.

## Iconic

Iconic is an editorial selection: the permanent vertical landmark with the strongest sustained association with the city in credible tourism, cultural, architectural, municipal or equivalent sources. Height is not decisive. Every included city receives one selection, accompanied by a rationale and a confidence level. A structure may be both Tallest and Iconic.

## Coordinates and distance

Airport coordinates represent the airport reference point where available. Tower coordinates represent the footprint centre or base. Source precision is preserved without adding invented decimal places.

Distance is calculated during generation as the inverse geodesic on the WGS84 ellipsoid using GeographicLib. The generated record stores unrounded metres and kilometres. The table displays one decimal kilometre, while ranking and indexing use the unrounded metre value.

## Index

The selected observation is assigned 100:

`index = observation distance ÷ base distance × 100`

The default view has no base. Selecting a base does not create a different ranking because all positive distances are multiplied by the same constant. It provides a relative comparison scale only. Base, mode and filters are stored in the URL for sharing.

## Review and limitations

Airport schedules, city marketing, building completion and landmark associations change. Automated imports provide candidates, not final decisions. Wikidata and Wikipedia can support discovery, but authoritative evidence should be preferred for publication. Low-confidence selections remain visible rather than being presented as certain.

The detail map is illustrative. Its line samples the same WGS84 geodesic used for the calculation, but the Web Mercator basemap distorts shape and scale. Map-tile failure does not affect the ranking.
