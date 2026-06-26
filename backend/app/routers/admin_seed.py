from fastapi import APIRouter, Depends
from geoalchemy2.shape import from_shape
from shapely.geometry import LineString, Point
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import River, RiverPoint, User
from app.security import require_admin
from app.seeds.rivers.alabama.foxwood import FOXWOOD_RIVER

router = APIRouter(prefix="/admin/seed", tags=["admin-seed"])


@router.post("/foxwood")
def seed_foxwood(db: Session = Depends(get_db), current_admin: User = Depends(require_admin),):
    existing = (
        db.query(River)
        .filter(River.name == FOXWOOD_RIVER["name"])
        .filter(River.state == FOXWOOD_RIVER["state"])
        .first()
    )

    if existing:
        return {
            "status": "already_exists",
            "river_id": str(existing.id),
            "name": existing.name,
        }

    coordinates = FOXWOOD_RIVER["coordinates"]

    route = None
    if len(coordinates) >= 2:
        route = from_shape(
            LineString([
                (coord["longitude"], coord["latitude"])
                for coord in coordinates
            ]),
            srid=4326,
        )

    river = River(
        name=FOXWOOD_RIVER["name"],
        state=FOXWOOD_RIVER["state"],
        usgs_gauge_id=FOXWOOD_RIVER["usgs_gauge_id"],
        difficulty=FOXWOOD_RIVER["difficulty"],
        cleanliness=FOXWOOD_RIVER["cleanliness"],
        fishing=FOXWOOD_RIVER["fishing"],
        route=route,
    )

    db.add(river)
    db.flush()

    points_created = 0

    for point in FOXWOOD_RIVER["points"]:
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
        points_created += 1

    db.commit()
    db.refresh(river)

    return {
        "status": "created",
        "river_id": str(river.id),
        "name": river.name,
        "points_created": points_created,
        "coordinates_count": len(coordinates),
    }