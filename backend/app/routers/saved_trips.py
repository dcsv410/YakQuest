from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import River, SavedTrip, User
from app.schemas import SavedTripCreate, SavedTripOut
from app.security import get_current_user

router = APIRouter(prefix="/trips", tags=["saved-trips"])


@router.get("", response_model=list[SavedTripOut])
def list_saved_trips(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(SavedTrip)
        .filter(SavedTrip.user_id == current_user.id)
        .order_by(SavedTrip.created_at.desc())
        .all()
    )


@router.post("", response_model=SavedTripOut)
def create_saved_trip(
    payload: SavedTripCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    river = db.query(River).filter(River.id == payload.riverId).first()

    if not river:
        raise HTTPException(status_code=404, detail="River not found")

    saved_trip = SavedTrip(
        user_id=current_user.id,
        river_id=river.id,

        name=payload.name,

        start_name=payload.startName,
        start_latitude=payload.startLatitude,
        start_longitude=payload.startLongitude,

        end_name=payload.endName,
        end_latitude=payload.endLatitude,
        end_longitude=payload.endLongitude,

        planned_distance_miles=payload.plannedDistanceMiles,
        estimated_time_min=payload.estimatedTimeMin,

        notes=payload.notes,
    )

    db.add(saved_trip)
    db.commit()
    db.refresh(saved_trip)

    return saved_trip


@router.get("/{trip_id}", response_model=SavedTripOut)
def get_saved_trip(
    trip_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    saved_trip = (
        db.query(SavedTrip)
        .filter(SavedTrip.id == trip_id)
        .filter(SavedTrip.user_id == current_user.id)
        .first()
    )

    if not saved_trip:
        raise HTTPException(status_code=404, detail="Saved trip not found")

    return saved_trip


@router.delete("/{trip_id}")
def delete_saved_trip(
    trip_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    saved_trip = (
        db.query(SavedTrip)
        .filter(SavedTrip.id == trip_id)
        .filter(SavedTrip.user_id == current_user.id)
        .first()
    )

    if not saved_trip:
        raise HTTPException(status_code=404, detail="Saved trip not found")

    db.delete(saved_trip)
    db.commit()

    return {"status": "deleted", "id": str(trip_id)}


@router.patch("/{trip_id}", response_model=SavedTripOut)
def update_saved_trip_notes(
    trip_id: UUID,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    saved_trip = (
        db.query(SavedTrip)
        .filter(SavedTrip.id == trip_id)
        .filter(SavedTrip.user_id == current_user.id)
        .first()
    )

    if not saved_trip:
        raise HTTPException(status_code=404, detail="Saved trip not found")

    if "notes" in payload:
        saved_trip.notes = payload["notes"]

    if "name" in payload:
        saved_trip.name = payload["name"]

    saved_trip.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(saved_trip)

    return saved_trip