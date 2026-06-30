from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from geoalchemy2.shape import to_shape
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import River, RiverPoint, Outfitter

router = APIRouter(prefix="/rivers", tags=["rivers"])

def serialize_coordinates(river: River):
    if not river.route:
        return []

    line = to_shape(river.route)

    return [
        {
            "latitude": lat,
            "longitude": lon,
        }
        for lon, lat in line.coords
    ]

def serialize_point(point: RiverPoint):
    return {
        "id": str(point.id),
        "name": point.name,
        "type": point.type,
        "latitude": point.latitude,
        "longitude": point.longitude,
        "description": point.description,
        "parking": point.parking,
        "restroom": point.restroom,
        "camping": point.camping,
        "photos": point.photos or [],
        "website": point.website,
        "phone": point.phone,
    }

def serialize_river(river: River):
    active_points = [point for point in river.points if point.is_active]

    public_points = [
        serialize_point(point)
        for point in active_points
        if point.type == "public_access"
    ]

    private_points = [
        serialize_point(point)
        for point in active_points
        if point.type == "private_access"
    ]

    pois = [
        serialize_point(point)
        for point in active_points
        if point.type == "poi"
    ]

    hazards = [
        serialize_point(point)
        for point in active_points
        if point.type == "hazard"
    ]

    return {
        "id": str(river.id),
        "name": river.name,
        "state": river.state,
        "usgsGaugeId": river.usgs_gauge_id,
        "flowStats": river.flow_stats,
        "difficulty": river.difficulty,
        "cleanliness": river.cleanliness,
        "fishing": river.fishing,
        "coordinates": serialize_coordinates(river),
        "accessPoints": {
            "public": public_points,
            "private": private_points,
        },
        "pois": pois,
        "hazards": hazards,
    }

def serialize_outfitter(outfitter: Outfitter):
    return {
        "id": str(outfitter.id),
        "riverId": str(outfitter.river_id),
        "name": outfitter.name,
        "website": outfitter.website,
        "phone": outfitter.phone,
        "email": outfitter.email,
        "description": outfitter.description,
        "highestPutInPointId": (
            str(outfitter.highest_put_in_point_id)
            if outfitter.highest_put_in_point_id
            else None
        ),
        "lowestTakeOutPointId": (
            str(outfitter.lowest_take_out_point_id)
            if outfitter.lowest_take_out_point_id
            else None
        ),
        "accessPointIds": outfitter.access_point_ids or [],
        "isActive": outfitter.is_active,
    }

@router.get("")
def list_rivers(db: Session = Depends(get_db)):
    rivers = db.query(River).order_by(River.state, River.name).all()
    return [serialize_river(river) for river in rivers]


@router.get("/{river_id}")
def get_river(river_id: UUID, db: Session = Depends(get_db)):
    river = db.query(River).filter(River.id == river_id).first()

    if not river:
        raise HTTPException(status_code=404, detail="River not found")

    return serialize_river(river)


@router.get("/{river_id}/outfitters")
def list_river_outfitters(river_id: UUID, db: Session = Depends(get_db)):
    outfitters = (
        db.query(Outfitter)
        .filter(
            Outfitter.river_id == river_id,
            Outfitter.is_active == True,
        )
        .order_by(Outfitter.name)
        .all()
    )

    return [serialize_outfitter(outfitter) for outfitter in outfitters]