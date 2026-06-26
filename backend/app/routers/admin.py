from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from geoalchemy2.shape import from_shape
from shapely.geometry import Point
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Contribution, Review, River, RiverPoint
from app.schemas import AttachRiverRequest, ContributionOut, ReviewCreate
from app.security import require_admin
from app.models import User
from app.security import get_current_user
from app.schemas import RiverUpdate
from app.routers.rivers import serialize_river

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