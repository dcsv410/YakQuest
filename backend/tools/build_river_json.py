import argparse
import json
import xml.etree.ElementTree as ET
from pathlib import Path


STATE_DIRS = {
    "AL": "alabama",
    "TN": "tennessee",
}


def parse_kml_coordinates(kml_path: Path) -> list[dict]:
    tree = ET.parse(kml_path)
    root = tree.getroot()

    ns = {"k": "http://www.opengis.net/kml/2.2"}

    coordinates = []

    for coord_node in root.findall(".//k:coordinates", ns):
        raw_text = coord_node.text or ""

        for item in raw_text.strip().split():
            parts = item.split(",")

            if len(parts) < 2:
                continue

            longitude = float(parts[0])
            latitude = float(parts[1])

            coordinates.append({
                "latitude": latitude,
                "longitude": longitude,
            })

    return coordinates


def build_river_json(args):
    kml_path = Path(args.kml)

    if not kml_path.exists():
        raise FileNotFoundError(f"KML file not found: {kml_path}")

    coordinates = parse_kml_coordinates(kml_path)

    if not coordinates:
        raise ValueError("No coordinates found in KML file")

    state_dir = STATE_DIRS.get(args.state, args.state.lower())

    output_path = Path("imports") / "rivers" / state_dir / f"{args.slug}.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)

    river = {
        "id": f"{args.state.lower()}-{args.slug}",
        "name": args.name,
        "slug": args.slug,
        "state": args.state,
        "stateName": args.state_name,
        "difficulty": args.difficulty,
        "cleanliness": args.cleanliness,
        "fishing": args.fishing,
        "usgsGaugeId": args.usgs_gauge_id,
        "flowStats": {
            "lowPercentile": args.flow_low,
            "median": args.flow_median,
            "highPercentile": args.flow_high,
            "max": args.flow_max,
        },
        "coordinates": coordinates,
        "accessPoints": {
            "public": [],
            "private": [],
        },
        "pois": [],
        "hazards": [],
    }

    output_path.write_text(
        json.dumps(river, indent=2),
        encoding="utf-8",
    )

    print("Created river JSON")
    print(f"Output: {output_path}")
    print(f"Coordinates: {len(coordinates)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()

    parser.add_argument("--kml", required=True)
    parser.add_argument("--name", required=True)
    parser.add_argument("--slug", required=True)
    parser.add_argument("--state", required=True)
    parser.add_argument("--state-name", required=True)

    parser.add_argument("--difficulty", type=int, default=1)
    parser.add_argument("--cleanliness", type=int, default=1)
    parser.add_argument("--fishing", type=int, default=1)

    parser.add_argument("--usgs-gauge-id", default=None)

    parser.add_argument("--flow-low", type=int, default=None)
    parser.add_argument("--flow-median", type=int, default=None)
    parser.add_argument("--flow-high", type=int, default=None)
    parser.add_argument("--flow-max", type=int, default=None)

    build_river_json(parser.parse_args())