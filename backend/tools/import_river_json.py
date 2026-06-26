import json
import sys
from pathlib import Path

from geoalchemy2.shape import from_shape
from shapely.geometry import LineString, Point

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.database import SessionLocal
from app.models import River, RiverPoint


POINT_TYPE_MAP = {
    "public": "public_access",
    "private": "private_access",
    "public_access": "public_access",
    "private_access": "private_access",
    "poi": "poi",
    "hazard": "hazard",
}


def normalize_point_type(point_type: str) -> str:
    if point_type not in POINT_TYPE_MAP:
        raise ValueError(f"Unsupported point type: {point_type}")

    return POINT_TYPE_MAP[point_type]


def collect_points(data: dict) -> list[dict]:
    points = []

    for point in data.get("accessPoints", {}).get("public", []):
        points.append({**point, "type": normalize_point_type(point.get("type", "public"))})

    for point in data.get("accessPoints", {}).get("private", []):
        points.append({**point, "type": normalize_point_type(point.get("type", "private"))})

    for point in data.get("pois", []):
        points.append({**point, "type": normalize_point_type(point.get("type", "poi"))})

    for point in data.get("hazards", []):
        points.append({**point, "type": normalize_point_type(point.get("type", "hazard"))})

    return points


def import_river(json_path: str):
    path = Path(json_path)

    if not path.exists():
        raise FileNotFoundError(f"File not found: {json_path}")

    data = json.loads(path.read_text(encoding="utf-8"))

    db = SessionLocal()

    try:
        existing = (
            db.query(River)
            .filter(River.name == data["name"])
            .filter(River.state == data["state"])
            .first()
        )

        if existing:
            print(f"River already exists: {existing.name} ({existing.id})")
            return

        coordinates = data.get("coordinates", [])

        route = None
        if len(coordinates) >= 2:
            route = from_shape(
                LineString(
                    [
                        (coord["longitude"], coord["latitude"])
                        for coord in coordinates
                    ]
                ),
                srid=4326,
            )

        river = River(
            name=data["name"],
            state=data["state"],
            usgs_gauge_id=data.get("usgsGaugeId"),
            flow_stats=data.get("flowStats"),
            difficulty=data.get("difficulty", 1),
            cleanliness=data.get("cleanliness", 1),
            fishing=data.get("fishing", 1),
            route=route,
        )

        db.add(river)
        db.flush()

        points = collect_points(data)

        for point in points:
            river_point = RiverPoint(
                river_id=river.id,
                name=point["name"],
                type=point["type"],
                latitude=point["latitude"],
                longitude=point["longitude"],
                location=from_shape(
                    Point(point["longitude"], point["latitude"]),
                    srid=4326,
                ),
                description=point.get("description"),
                parking=point.get("parking", False),
                restroom=point.get("restroom", False),
                camping=point.get("camping", False),
                website=point.get("website"),
                phone=point.get("phone"),
                photos=point.get("photos", []),
                is_active=True,
            )

            db.add(river_point)

        db.commit()

        print("Imported river successfully")
        print(f"River: {river.name}")
        print(f"ID: {river.id}")
        print(f"Coordinates: {len(coordinates)}")
        print(f"Points: {len(points)}")

    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage:")
        print("  python tools/import_river_json.py imports/rivers/alabama/foxwood-river.json")
        sys.exit(1)

    import_river(sys.argv[1])