from uuid import UUID
from datetime import date, datetime, time, timedelta

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
)
from geoalchemy2.shape import from_shape
from geoalchemy2.elements import WKTElement
from shapely.geometry import Point
from sqlalchemy.orm import Session
from sqlalchemy import case, func, or_
from sqlalchemy.orm.attributes import flag_modified

from app.database import get_db
from app.models import Contribution, Review, River, RiverPoint, User, CompletedTrip, SavedTrip
from app.schemas import AttachRiverRequest, ContributionOut, ReviewCreate
from app.security import require_admin
from app.models import User, Outfitter
from app.security import get_current_user
from app.schemas import (
    AdminUserUpdate,
    RiverUpdate,
    RiverPointUpdate,
    RiverPointCreate,
    RiverCreate,
    RiverRouteReplace,
    OutfitterCreate,
    OutfitterUpdate,
)
from app.routers.rivers import serialize_river, serialize_coordinates, serialize_point, serialize_outfitter

VALID_US_STATE_CODES = {
    "AL", "AK", "AZ", "AR", "CA", "CO",
    "CT", "DE", "FL", "GA", "HI", "ID",
    "IL", "IN", "IA", "KS", "KY", "LA",
    "ME", "MD", "MA", "MI", "MN", "MS",
    "MO", "MT", "NE", "NV", "NH", "NJ",
    "NM", "NY", "NC", "ND", "OH", "OK",
    "OR", "PA", "RI", "SC", "SD", "TN",
    "TX", "UT", "VT", "VA", "WA", "WV",
    "WI", "WY",
}

router = APIRouter(prefix="/admin", tags=["admin"])

def serialize_admin_completed_trip(
    trip: CompletedTrip,
    user: User,
):
    return {
        "id": str(trip.id),
        "completedAt":
            trip.completed_at.isoformat(),
        "userId": str(user.id),
        "userEmail": user.email,
        "userDisplayName": (
            user.display_name
            or "YakQuest User"
        ),
        "userHomeState": (
            user.home_state or "AL"
        ),
        "riverId": str(trip.river_id),
        "riverName": trip.river_name,
        "riverState": trip.state,
        "startName": trip.start_name,
        "endName": trip.end_name,
        "plannedMiles": float(
            trip.planned_distance_miles
            or 0
        ),
        "actualMiles": float(
            trip.actual_distance_miles
            or 0
        ),
        "elapsedTimeSeconds": int(
            trip.elapsed_time_seconds
            or 0
        ),
    }

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


def add_photo_to_point(
    contribution: Contribution,
    db: Session,
):
    if not contribution.target_point_id:
        raise HTTPException(
            status_code=400,
            detail="Photo contribution is missing targetPointId",
        )

    if not contribution.photo_uri:
        raise HTTPException(
            status_code=400,
            detail="Photo contribution is missing photoUri",
        )

    river_point = (
        db.query(RiverPoint)
        .filter(RiverPoint.id == contribution.target_point_id)
        .first()
    )

    if not river_point:
        raise HTTPException(status_code=404, detail="Target point not found")

    photos = list(river_point.photos or [])

    if contribution.photo_uri in photos:
        return

    if len(photos) >= 3:
        raise HTTPException(
            status_code=400,
            detail="This point already has 3 photos. Remove one before adding another.",
        )

    photos.append(contribution.photo_uri)

    river_point.photos = photos
    flag_modified(river_point, "photos")


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

    if contribution.kind == "new-river":
        # A new-river request is informational only.
        # Approval acknowledges the request without creating a River
        # or requiring an existing river_id.
        pass

    elif contribution.kind == "existing-river-point":
        add_contribution_points_to_river(
            contribution,
            db,
        )

    elif contribution.kind == "remove-existing-point":
        deactivate_removed_point(
            contribution,
            db,
        )

    elif contribution.kind == "point-photo":
        add_photo_to_point(
            contribution,
            db,
        )

    else:
        raise HTTPException(
            status_code=400,
            detail=(
                "Unsupported contribution kind: "
                f"{contribution.kind}"
            ),
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


@router.put("/rivers/{river_id}/route")
def replace_river_route(
    river_id: str,
    payload: RiverRouteReplace,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin_user),
):
    river = db.query(River).filter(River.id == river_id).first()

    if not river:
        raise HTTPException(
            status_code=404,
            detail="River not found",
        )

    if len(payload.coordinates) < 2:
        raise HTTPException(
            status_code=400,
            detail="River route must contain at least two coordinates",
        )

    for index, coordinate in enumerate(payload.coordinates):
        if not -90 <= coordinate.latitude <= 90:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Coordinate {index + 1} has an invalid latitude: "
                    f"{coordinate.latitude}"
                ),
            )

        if not -180 <= coordinate.longitude <= 180:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Coordinate {index + 1} has an invalid longitude: "
                    f"{coordinate.longitude}"
                ),
            )

    line_coordinates = ", ".join(
        f"{coordinate.longitude} {coordinate.latitude}"
        for coordinate in payload.coordinates
    )

    river.route = WKTElement(
        f"LINESTRING({line_coordinates})",
        srid=4326,
    )

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


@router.delete("/river-points/{point_id}/photos/{photo_index}")
def delete_river_point_photo(
    point_id: str,
    photo_index: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin_user),
):
    point = (
        db.query(RiverPoint)
        .filter(RiverPoint.id == point_id)
        .first()
    )

    if not point:
        raise HTTPException(
            status_code=404,
            detail="River point not found",
        )

    photos = list(point.photos or [])

    if photo_index < 0 or photo_index >= len(photos):
        raise HTTPException(
            status_code=404,
            detail="Photo not found",
        )

    removed_photo = photos.pop(photo_index)

    point.photos = photos
    flag_modified(point, "photos")

    db.commit()
    db.refresh(point)

    return {
        "id": str(point.id),
        "photos": point.photos or [],
        "removedPhoto": removed_photo,
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
    admin_user: User = Depends(
        require_admin_user
    ),
):
    user_rows = (
        db.query(
            User,
            func.coalesce(
                func.sum(
                    case(
                        (
                            Contribution.status
                            == "approved",
                            1,
                        ),
                        else_=0,
                    )
                ),
                0,
            ).label(
                "approved_contributions"
            ),
            func.coalesce(
                func.sum(
                    case(
                        (
                            Contribution.status
                            == "rejected",
                            1,
                        ),
                        else_=0,
                    )
                ),
                0,
            ).label(
                "rejected_contributions"
            ),
        )
        .outerjoin(
            Contribution,
            Contribution.user_id == User.id,
        )
        .group_by(User.id)
        .order_by(
            User.trust_score.desc(),
            User.is_admin.desc(),
            User.email.asc(),
        )
        .all()
    )

    users = []

    for (
        user,
        approved_contributions,
        rejected_contributions,
    ) in user_rows:
        approved_count = int(
            approved_contributions
        )

        rejected_count = int(
            rejected_contributions
        )

        total_reviewed = (
            approved_count + rejected_count
        )

        approval_rate = (
            round(
                approved_count
                / total_reviewed
                * 100,
                1,
            )
            if total_reviewed > 0
            else None
        )

        users.append(
            {
                "id": str(user.id),
                "email": user.email,
                "displayName":
                    user.display_name,
                "homeState":
                    user.home_state or "AL",
                "isAdmin": user.is_admin,
                "trustScore":
                    user.trust_score,
                "approvedContributions":
                    approved_count,
                "rejectedContributions":
                    rejected_count,
                "approvalRate":
                    approval_rate,
            }
        )

    return users


@router.patch("/users/{user_id}")
def update_admin_user(
    user_id: UUID,
    payload: AdminUserUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(
        require_admin_user
    ),
):
    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    updates = payload.model_dump(
        exclude_unset=True
    )

    if "homeState" in updates:
        home_state = (
            updates["homeState"] or ""
        ).strip().upper()

        if home_state not in VALID_US_STATE_CODES:
            raise HTTPException(
                status_code=400,
                detail="Please select a valid home state",
            )

    user.home_state = home_state

    if not updates:
        raise HTTPException(
            status_code=400,
            detail="No user updates were provided",
        )

    if "trustScore" in updates:
        trust_score = updates["trustScore"]

        if trust_score is None:
            raise HTTPException(
                status_code=400,
                detail="Trust score cannot be null",
            )

        if trust_score < 0 or trust_score > 100:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Trust score must be between "
                    "0 and 100"
                ),
            )

        user.trust_score = trust_score

    if "isAdmin" in updates:
        is_admin = updates["isAdmin"]

        if is_admin is None:
            raise HTTPException(
                status_code=400,
                detail="Admin status cannot be null",
            )

        if (
            user.id == current_admin.id
            and not is_admin
        ):
            raise HTTPException(
                status_code=400,
                detail=(
                    "You cannot remove your own "
                    "administrator access"
                ),
            )

        user.is_admin = is_admin

    db.commit()
    db.refresh(user)

    approved_count = (
        db.query(Contribution)
        .filter(
            Contribution.user_id == user.id,
            Contribution.status == "approved",
        )
        .count()
    )

    rejected_count = (
        db.query(Contribution)
        .filter(
            Contribution.user_id == user.id,
            Contribution.status == "rejected",
        )
        .count()
    )

    total_reviewed = (
        approved_count + rejected_count
    )

    approval_rate = (
        round(
            approved_count
            / total_reviewed
            * 100,
            1,
        )
        if total_reviewed > 0
        else None
    )

    return {
        "id": str(user.id),
        "email": user.email,
        "displayName": user.display_name,
        "homeState": user.home_state or "AL",
        "isAdmin": user.is_admin,
        "trustScore": user.trust_score,
        "approvedContributions":
            approved_count,
        "rejectedContributions":
            rejected_count,
        "approvalRate": approval_rate,
    }


@router.get("/analytics")
def get_admin_analytics(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin_user),
):
    completed_trip_totals = (
        db.query(
            func.count(CompletedTrip.id).label(
                "trips_completed"
            ),
            func.coalesce(
                func.sum(
                    CompletedTrip.actual_distance_miles
                ),
                0.0,
            ).label("actual_miles"),
            func.coalesce(
                func.sum(
                    CompletedTrip.planned_distance_miles
                ),
                0.0,
            ).label("planned_miles"),
            func.coalesce(
                func.sum(
                    CompletedTrip.elapsed_time_seconds
                ),
                0,
            ).label("elapsed_time_seconds"),
            func.count(
                func.distinct(
                    CompletedTrip.river_id
                )
            ).label("rivers_explored"),
        )
        .one()
    )

    unique_contributors = (
        db.query(
            func.count(
                func.distinct(
                    Contribution.user_id
                )
            )
        )
        .filter(
            Contribution.user_id.isnot(None)
        )
        .scalar()
        or 0
    )

    completed_trip_rows = (
        db.query(
            CompletedTrip,
            User,
        )
        .join(
            User,
            CompletedTrip.user_id == User.id,
        )
        .order_by(
            CompletedTrip.completed_at.desc()
        )
        .limit(250)
        .all()
    )

    return {
        "rivers": db.query(River).count(),
        "users": db.query(User).count(),
        "uniqueContributors": (
            unique_contributors
        ),
        "pendingContributions": (
            db.query(Contribution)
            .filter(
                Contribution.status == "pending"
            )
            .count()
        ),
        "approvedContributions": (
            db.query(Contribution)
            .filter(
                Contribution.status == "approved"
            )
            .count()
        ),
        "rejectedContributions": (
            db.query(Contribution)
            .filter(
                Contribution.status == "rejected"
            )
            .count()
        ),
        "completedTrips": (
            completed_trip_totals.trips_completed
        ),
        "savedTrips": db.query(
            SavedTrip
        ).count(),
        "completedTripSummary": {
            "tripsCompleted": (
                completed_trip_totals
                .trips_completed
            ),
            "actualMiles": float(
                completed_trip_totals
                .actual_miles
                or 0
            ),
            "plannedMiles": float(
                completed_trip_totals
                .planned_miles
                or 0
            ),
            "elapsedTimeSeconds": int(
                completed_trip_totals
                .elapsed_time_seconds
                or 0
            ),
            "riversExplored": (
                completed_trip_totals
                .rivers_explored
            ),
        },
        "completedTripRows": [
            serialize_admin_completed_trip(
                trip,
                user,
            )
            for trip, user in completed_trip_rows
        ],
    }


@router.get("/analytics/filtered")
def get_filtered_admin_analytics(
    home_state: str | None = Query(
        default=None,
        alias="home_state",
    ),
    start_date: date = Query(
        alias="start_date",
    ),
    end_date: date = Query(
        alias="end_date",
    ),
    db: Session = Depends(get_db),
    admin_user: User = Depends(
        require_admin_user
    ),
):
    if end_date < start_date:
        raise HTTPException(
            status_code=400,
            detail=(
                "End date cannot be before "
                "start date"
            ),
        )

    normalized_home_state = None

    if home_state:
        normalized_home_state = (
            home_state.strip().upper()
        )

        if (
            normalized_home_state
            not in VALID_US_STATE_CODES
        ):
            raise HTTPException(
                status_code=400,
                detail=(
                    "Please select a valid "
                    "home state"
                ),
            )

    range_start = datetime.combine(
        start_date,
        time.min,
    )

    # Exclusive end boundary makes the entire
    # selected end date count.
    range_end = datetime.combine(
        end_date + timedelta(days=1),
        time.min,
    )

    def apply_user_state_filter(query):
        if normalized_home_state:
            return query.filter(
                User.home_state
                == normalized_home_state
            )

        return query

    # ----------------------------------
    # User cohort
    # ----------------------------------

    total_users_query = db.query(
        func.count(User.id)
    )

    total_users_query = (
        apply_user_state_filter(
            total_users_query
        )
    )

    total_users = (
        total_users_query.scalar() or 0
    )

    new_users_query = db.query(
        func.count(User.id)
    ).filter(
        User.created_at >= range_start,
        User.created_at < range_end,
    )

    new_users_query = (
        apply_user_state_filter(
            new_users_query
        )
    )

    new_users = (
        new_users_query.scalar() or 0
    )

    # ----------------------------------
    # Contributions
    # ----------------------------------

    contribution_query = (
        db.query(Contribution)
        .join(
            User,
            Contribution.user_id == User.id,
        )
        .filter(
            Contribution.created_at
            >= range_start,
            Contribution.created_at
            < range_end,
        )
    )

    contribution_query = (
        apply_user_state_filter(
            contribution_query
        )
    )

    contributions = (
        contribution_query.all()
    )

    submitted_contributions = len(
        contributions
    )

    pending_contributions = sum(
        1
        for contribution in contributions
        if contribution.status == "pending"
    )

    approved_contributions = sum(
        1
        for contribution in contributions
        if contribution.status == "approved"
    )

    rejected_contributions = sum(
        1
        for contribution in contributions
        if contribution.status == "rejected"
    )

    reviewed_contributions = (
        approved_contributions
        + rejected_contributions
    )

    contribution_approval_rate = (
        round(
            approved_contributions
            / reviewed_contributions
            * 100,
            1,
        )
        if reviewed_contributions > 0
        else None
    )

    contributing_user_ids = {
        contribution.user_id
        for contribution in contributions
        if contribution.user_id is not None
    }

    # ----------------------------------
    # Saved trips
    # ----------------------------------

    saved_trip_query = (
        db.query(SavedTrip)
        .join(
            User,
            SavedTrip.user_id == User.id,
        )
        .filter(
            SavedTrip.created_at >= range_start,
            SavedTrip.created_at < range_end,
        )
    )

    saved_trip_query = (
        apply_user_state_filter(
            saved_trip_query
        )
    )

    saved_trips = saved_trip_query.all()

    # ----------------------------------
    # Completed trips
    # ----------------------------------

    completed_trip_query = (
        db.query(
            CompletedTrip,
            User,
        )
        .join(
            User,
            CompletedTrip.user_id == User.id,
        )
        .filter(
            CompletedTrip.completed_at
            >= range_start,
            CompletedTrip.completed_at
            < range_end,
        )
    )

    completed_trip_query = (
        apply_user_state_filter(
            completed_trip_query
        )
    )

    completed_trip_rows = (
        completed_trip_query
        .order_by(
            CompletedTrip.completed_at.desc()
        )
        .limit(250)
        .all()
    )

    completed_trips = [
        trip
        for trip, _user
        in completed_trip_rows
    ]

    planned_miles = sum(
        float(
            trip.planned_distance_miles
            or 0
        )
        for trip in completed_trips
    )

    actual_miles = sum(
        float(
            trip.actual_distance_miles
            or 0
        )
        for trip in completed_trips
    )

    elapsed_time_seconds = sum(
        int(
            trip.elapsed_time_seconds
            or 0
        )
        for trip in completed_trips
    )

    rivers_explored = len({
        trip.river_id
        for trip in completed_trips
    })

    # ----------------------------------
    # Active users
    # ----------------------------------

    active_user_ids = set(
        contributing_user_ids
    )

    active_user_ids.update(
        trip.user_id
        for trip in saved_trips
    )

    active_user_ids.update(
        trip.user_id
        for trip in completed_trips
    )

    return {
        "filters": {
            "homeState":
                normalized_home_state,
            "startDate":
                start_date.isoformat(),
            "endDate":
                end_date.isoformat(),
        },
        "users": {
            "totalUsers": int(
                total_users
            ),
            "newUsers": int(
                new_users
            ),
            "activeUsers": len(
                active_user_ids
            ),
            "contributingUsers": len(
                contributing_user_ids
            ),
        },
        "trips": {
            "savedTrips": len(
                saved_trips
            ),
            "completedTrips": len(
                completed_trips
            ),
            "plannedMiles":
                planned_miles,
            "actualMiles":
                actual_miles,
            "elapsedTimeSeconds":
                elapsed_time_seconds,
            "riversExplored":
                rivers_explored,
        },
        "contributions": {
            "submitted":
                submitted_contributions,
            "pending":
                pending_contributions,
            "approved":
                approved_contributions,
            "rejected":
                rejected_contributions,
            "approvalRate":
                contribution_approval_rate,
        },
        "completedTripRows": [
            serialize_admin_completed_trip(
                trip,
                user,
            )
            for trip, user
            in completed_trip_rows
        ],
    }