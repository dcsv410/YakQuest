from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from geoalchemy2.shape import from_shape
from geoalchemy2.elements import WKTElement
from shapely.geometry import Point
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Contribution, Review, River, RiverPoint, User, CompletedTrip, SavedTrip
from app.schemas import AttachRiverRequest, ContributionOut, ReviewCreate
from app.security import require_admin
from app.models import User, Outfitter
from app.security import get_current_user
from app.schemas import RiverUpdate, RiverPointUpdate, RiverPointCreate, RiverCreate, OutfitterCreate, OutfitterUpdate
from app.routers.rivers import serialize_river, serialize_coordinates, serialize_point, serialize_outfitter

router = APIRouter(prefix="/admin", tags=["admin"])

def require_admin_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_admin:
        raise HTTPException(
            status_code=403,
            detail="Admin privileges required",
        )

    return current_user

def serialize_admin_point(point: RiverPoint):
    data = serialize_point(point)
    data["isActive"] = point.is_active
    return data

@router.get("/contributions", response_model=list[ContributionOut])
def list_contributions(db: Session = Depends(get_db), current_admin: User = Depends(require_admin)):
    return (
        db.query(Contribution)
        .order_by(Contribution.created_at.desc())
        .all()
    )


@router.post("/contributions/{contribution_id}/attach-river", response_model=ContributionOut)
def attach_contribution_to_river(
    contribution_id: UUID,
    payload: AttachRiverRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    contribution = db.query(Contribution).filter(Contribution.id == contribution_id).first()

    if not contribution:
        raise HTTPException(status_code=404, detail="Contribution not found")

    if contribution.status != "pending":
        raise HTTPException(
            status_code=400,
            detail="Only pending contributions can be attached to a river",
        )

    river = db.query(River).filter(River.id == payload.riverId).first()

    if not river:
        raise HTTPException(status_code=404, detail="River not found")

    contribution.river_id = river.id
    contribution.river_name = river.name
    contribution.state = river.state

    db.commit()
    db.refresh(contribution)

    return contribution


def add_contribution_points_to_river(
    contribution: Contribution,
    db: Session,
):
    if not contribution.river_id:
        raise HTTPException(
            status_code=400,
            detail="Contribution must be attached to a river before approval",
        )

    river = db.query(River).filter(River.id == contribution.river_id).first()

    if not river:
        raise HTTPException(status_code=404, detail="Attached river not found")

    created_points = []

    for point in contribution.points or []:
        location = from_shape(
            Point(point["longitude"], point["latitude"]),
            srid=4326,
        )

        river_point = RiverPoint(
            river_id=river.id,
            name=point["name"],
            type=point["type"],
            latitude=point["latitude"],
            longitude=point["longitude"],
            location=location,
            description=point.get("description"),
            parking=point.get("parking", False),
            restroom=point.get("restroom", False),
            camping=point.get("camping", False),
            photos=point.get("photos", []),
            website=point.get("website"),
            phone=point.get("phone"),
            is_active=True,
        )

        db.add(river_point)
        created_points.append(river_point)

    return created_points


def deactivate_removed_point(
    contribution: Contribution,
    db: Session,
):
    if not contribution.target_point_id:
        raise HTTPException(
            status_code=400,
            detail="Removal contribution is missing targetPointId",
        )

    river_point = (
        db.query(RiverPoint)
        .filter(RiverPoint.id == contribution.target_point_id)
        .first()
    )

    if not river_point:
        raise HTTPException(status_code=404, detail="Target point not found")

    river_point.is_active = False


@router.post("/contributions/{contribution_id}/approve", response_model=ContributionOut)
def approve_contribution(
    contribution_id: UUID,
    payload: ReviewCreate | None = None,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    contribution = db.query(Contribution).filter(Contribution.id == contribution_id).first()

    if not contribution:
        raise HTTPException(status_code=404, detail="Contribution not found")

    if contribution.status != "pending":
        raise HTTPException(status_code=400, detail="Contribution already reviewed")

    if contribution.kind in ["new-river", "existing-river-point"]:
        add_contribution_points_to_river(contribution, db)

    elif contribution.kind == "remove-existing-point":
        deactivate_removed_point(contribution, db)

    else:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported contribution kind: {contribution.kind}",
        )

    contribution.status = "approved"

    review = Review(
        contribution_id=contribution.id,
        decision="approved",
        notes=payload.notes if payload else None,
    )

    db.add(review)
    db.commit()
    db.refresh(contribution)

    return contribution


@router.post("/contributions/{contribution_id}/reject", response_model=ContributionOut)
def reject_contribution(
    contribution_id: UUID,
    payload: ReviewCreate | None = None,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    contribution = db.query(Contribution).filter(Contribution.id == contribution_id).first()

    if not contribution:
        raise HTTPException(status_code=404, detail="Contribution not found")

    if contribution.status != "pending":
        raise HTTPException(status_code=400, detail="Contribution already reviewed")

    contribution.status = "rejected"

    review = Review(
        contribution_id=contribution.id,
        decision="rejected",
        notes=payload.notes if payload else None,
    )

    db.add(review)
    db.commit()
    db.refresh(contribution)

    return contribution

@router.patch("/rivers/{river_id}")
def update_river(
    river_id: str,
    payload: RiverUpdate,
    db: Session = Depends(get_db),
    admin_user=Depends(require_admin_user),
):
    river = db.query(River).filter(River.id == river_id).first()

    if not river:
        raise HTTPException(status_code=404, detail="River not found")

    updates = payload.model_dump(exclude_unset=True)

    if "name" in updates:
        river.name = updates["name"]

    if "state" in updates:
        river.state = updates["state"]

    if "difficulty" in updates:
        river.difficulty = updates["difficulty"]

    if "cleanliness" in updates:
        river.cleanliness = updates["cleanliness"]

    if "fishing" in updates:
        river.fishing = updates["fishing"]

    if "usgsGaugeId" in updates:
        river.usgs_gauge_id = updates["usgsGaugeId"] or None

    if "flowStats" in updates:
        river.flow_stats = updates["flowStats"]

    db.commit()
    db.refresh(river)

    return serialize_river(river)


@router.patch("/river-points/{point_id}")
def update_river_point(
    point_id: str,
    payload: RiverPointUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin_user),
):
    point = db.query(RiverPoint).filter(RiverPoint.id == point_id).first()

    if not point:
        raise HTTPException(status_code=404, detail="River point not found")

    updates = payload.model_dump(exclude_unset=True)

    if "type" in updates:
        allowed_types = {
            "public_access",
            "private_access",
            "poi",
            "hazard",
        }

    if "website" in updates:
        point.website = updates["website"] or None

    if "phone" in updates:
        point.phone = updates["phone"] or None

    if "type" in updates and updates["type"] is not None:
        allowed_types = {
            "public_access",
            "private_access",
            "poi",
            "hazard",
        }

        if updates["type"] not in allowed_types:
            raise HTTPException(status_code=400, detail="Invalid point type")

        point.type = updates["type"]

    if "name" in updates:
        point.name = updates["name"]

    if "description" in updates:
        point.description = updates["description"]

    latitude = updates.get("latitude")
    longitude = updates.get("longitude")

    if latitude is not None:
        point.latitude = latitude

    if longitude is not None:
        point.longitude = longitude

    if latitude is not None or longitude is not None:
        final_latitude = point.latitude
        final_longitude = point.longitude

        point.location = WKTElement(
            f"POINT({final_longitude} {final_latitude})",
            srid=4326,
        )

    if "parking" in updates:
        point.parking = updates["parking"]

    if "restroom" in updates:
        point.restroom = updates["restroom"]

    if "camping" in updates:
        point.camping = updates["camping"]

    if "isActive" in updates:
        point.is_active = updates["isActive"]

    db.commit()
    db.refresh(point)

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
        "isActive": point.is_active,
    }


@router.post("/rivers/{river_id}/points")
def create_river_point(
    river_id: str,
    payload: RiverPointCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin_user),
):
    river = db.query(River).filter(River.id == river_id).first()

    if not river:
        raise HTTPException(status_code=404, detail="River not found")

    allowed_types = {
        "public_access",
        "private_access",
        "poi",
        "hazard",
    }

    if payload.type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid point type")

    point = RiverPoint(
        river_id=river.id,
        name=payload.name,
        type=payload.type,
        latitude=payload.latitude,
        longitude=payload.longitude,
        location=WKTElement(
            f"POINT({payload.longitude} {payload.latitude})",
            srid=4326,
        ),
        description=payload.description,
        parking=payload.parking,
        restroom=payload.restroom,
        camping=payload.camping,
        is_active=True,
    )

    db.add(point)
    db.commit()
    db.refresh(point)

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
        "isActive": point.is_active,
    }


@router.post("/rivers")
def create_river(
    payload: RiverCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin_user),
):
    if len(payload.coordinates) < 2:
        raise HTTPException(
            status_code=400,
            detail="River must have at least two coordinates",
        )

    line_coordinates = ", ".join(
        f"{coord.longitude} {coord.latitude}"
        for coord in payload.coordinates
    )

    river = River(
        name=payload.name.strip(),
        state=payload.state.strip().upper(),
        difficulty=payload.difficulty,
        cleanliness=payload.cleanliness,
        fishing=payload.fishing,
        usgs_gauge_id=payload.usgsGaugeId or None,
        flow_stats=payload.flowStats.model_dump() if payload.flowStats else None,
        route=WKTElement(
            f"LINESTRING({line_coordinates})",
            srid=4326,
        ),
    )

    db.add(river)
    db.commit()
    db.refresh(river)

    return serialize_river(river)


@router.get("/rivers/{river_id}")
def get_admin_river(
    river_id: str,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin_user),
):
    river = db.query(River).filter(River.id == river_id).first()

    if not river:
        raise HTTPException(status_code=404, detail="River not found")

    points = [serialize_admin_point(point) for point in river.points]

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
        "points": points,
    }


@router.get("/rivers/{river_id}/outfitters")
def list_admin_river_outfitters(
    river_id: str,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin_user),
):
    outfitters = (
        db.query(Outfitter)
        .filter(Outfitter.river_id == river_id)
        .order_by(Outfitter.name)
        .all()
    )

    return [serialize_outfitter(outfitter) for outfitter in outfitters]


@router.post("/outfitters")
def create_outfitter(
    payload: OutfitterCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin_user),
):
    outfitter = Outfitter(
        river_id=payload.riverId,
        name=payload.name.strip(),
        website=payload.website or None,
        phone=payload.phone or None,
        email=payload.email or None,
        description=payload.description or None,
        highest_put_in_point_id=payload.highestPutInPointId or None,
        lowest_take_out_point_id=payload.lowestTakeOutPointId or None,
        access_point_ids=payload.accessPointIds,
        is_active=True,
    )

    db.add(outfitter)
    db.commit()
    db.refresh(outfitter)

    return serialize_outfitter(outfitter)


@router.patch("/outfitters/{outfitter_id}")
def update_outfitter(
    outfitter_id: str,
    payload: OutfitterUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin_user),
):
    outfitter = db.query(Outfitter).filter(Outfitter.id == outfitter_id).first()

    if not outfitter:
        raise HTTPException(status_code=404, detail="Outfitter not found")

    updates = payload.model_dump(exclude_unset=True)

    if "name" in updates:
        outfitter.name = updates["name"].strip()

    if "website" in updates:
        outfitter.website = updates["website"] or None

    if "phone" in updates:
        outfitter.phone = updates["phone"] or None

    if "email" in updates:
        outfitter.email = updates["email"] or None

    if "description" in updates:
        outfitter.description = updates["description"] or None

    if "highestPutInPointId" in updates:
        outfitter.highest_put_in_point_id = updates["highestPutInPointId"] or None

    if "lowestTakeOutPointId" in updates:
        outfitter.lowest_take_out_point_id = updates["lowestTakeOutPointId"] or None

    if "accessPointIds" in updates:
        outfitter.access_point_ids = updates["accessPointIds"]

    if "isActive" in updates:
        outfitter.is_active = updates["isActive"]

    db.commit()
    db.refresh(outfitter)

    return serialize_outfitter(outfitter)


@router.get("/dashboard")
def get_admin_dashboard(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin_user),
):
    return {
        "rivers": db.query(River).count(),
        "pendingContributions": db.query(Contribution)
        .filter(Contribution.status == "pending")
        .count(),
        "users": db.query(User).count(),
        "completedTrips": db.query(CompletedTrip).count(),
    }


@router.get("/users")
def list_admin_users(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin_user),
):
    users = db.query(User).order_by(User.email).all()

    return [
        {
            "id": str(user.id),
            "email": user.email,
            "displayName": user.display_name,
            "isAdmin": user.is_admin,
            "trustScore": user.trust_score,
        }
        for user in users
    ]


@router.get("/analytics")
def get_admin_analytics(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin_user),
):
    return {
        "rivers": db.query(River).count(),
        "users": db.query(User).count(),
        "pendingContributions": db.query(Contribution)
        .filter(Contribution.status == "pending")
        .count(),
        "approvedContributions": db.query(Contribution)
        .filter(Contribution.status == "approved")
        .count(),
        "rejectedContributions": db.query(Contribution)
        .filter(Contribution.status == "rejected")
        .count(),
        "completedTrips": db.query(CompletedTrip).count(),
        "savedTrips": db.query(SavedTrip).count(),
    }