from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import CompletedTrip, River, User
from app.schemas import CompletedTripCreate, CompletedTripOut, CompletedTripUpdate
from app.security import get_current_user

router = APIRouter(prefix="/completed-trips", tags=["completed-trips"])


@router.get("", response_model=list[CompletedTripOut])
def list_completed_trips(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(CompletedTrip)
        .filter(CompletedTrip.user_id == current_user.id)
        .order_by(CompletedTrip.completed_at.desc())
        .all()
    )


@router.post("", response_model=CompletedTripOut)
def create_completed_trip(
    payload: CompletedTripCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    river = db.query(River).filter(River.id == payload.riverId).first()

    if not river:
        raise HTTPException(status_code=404, detail="River not found")

    completed_trip = CompletedTrip(
        user_id=current_user.id,
        river_id=river.id,
        river_name=payload.riverName,
        state=payload.state,
        start_name=payload.startName,
        end_name=payload.endName,
        planned_distance_miles=payload.plannedDistanceMiles,
        actual_distance_miles=payload.actualDistanceMiles,
        elapsed_time_seconds=payload.elapsedTimeSeconds,
        started_at=payload.startedAt,
        completed_at=payload.completedAt,
        notes=payload.notes,
    )

    db.add(completed_trip)
    db.commit()
    db.refresh(completed_trip)

    return completed_trip


@router.get("/{trip_id}", response_model=CompletedTripOut)
def get_completed_trip(
    trip_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    completed_trip = (
        db.query(CompletedTrip)
        .filter(CompletedTrip.id == trip_id)
        .filter(CompletedTrip.user_id == current_user.id)
        .first()
    )

    if not completed_trip:
        raise HTTPException(status_code=404, detail="Completed trip not found")

    return completed_trip


@router.patch("/{trip_id}", response_model=CompletedTripOut)
def update_completed_trip(
    trip_id: UUID,
    payload: CompletedTripUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    completed_trip = (
        db.query(CompletedTrip)
        .filter(CompletedTrip.id == trip_id)
        .filter(CompletedTrip.user_id == current_user.id)
        .first()
    )

    if not completed_trip:
        raise HTTPException(status_code=404, detail="Completed trip not found")

    if payload.notes is not None:
        completed_trip.notes = payload.notes

    completed_trip.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(completed_trip)

    return completed_trip


@router.delete("/{trip_id}")
def delete_completed_trip(
    trip_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    completed_trip = (
        db.query(CompletedTrip)
        .filter(CompletedTrip.id == trip_id)
        .filter(CompletedTrip.user_id == current_user.id)
        .first()
    )

    if not completed_trip:
        raise HTTPException(status_code=404, detail="Completed trip not found")

    db.delete(completed_trip)
    db.commit()

    return {"status": "deleted", "id": str(trip_id)}