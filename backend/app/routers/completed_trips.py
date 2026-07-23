from datetime import datetime
from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)
from sqlalchemy.orm import (
    Session,
    joinedload,
)

from app.database import get_db
from app.models import (
    CompletedTrip,
    CompletedTripParticipant,
    River,
    User,
)
from app.schemas import (
    CompletedTripCreate,
    CompletedTripUpdate,
)
from app.security import get_current_user

router = APIRouter(
    prefix="/completed-trips",
    tags=["completed-trips"],
)


def get_membership(
    db: Session,
    trip_id: UUID,
    user_id: UUID,
):
    return (
        db.query(
            CompletedTripParticipant
        )
        .filter(
            CompletedTripParticipant.completed_trip_id
            == trip_id
        )
        .filter(
            CompletedTripParticipant.user_id
            == user_id
        )
        .first()
    )


def serialize_completed_trip(
    completed_trip: CompletedTrip,
    current_user_id: UUID,
):
    current_membership = next(
        (
            membership
            for membership
            in completed_trip.participants
            if membership.user_id
            == current_user_id
        ),
        None,
    )

    participants = [
        {
            "userId": membership.user_id,
            "displayName": (
                membership.display_name
            ),
            "role": membership.role,
        }
        for membership
        in completed_trip.participants
    ]

    return {
        "id": completed_trip.id,
        "user_id": completed_trip.user_id,
        "river_id": completed_trip.river_id,
        "river_name": (
            completed_trip.river_name
        ),
        "state": completed_trip.state,
        "start_name": (
            completed_trip.start_name
        ),
        "end_name": completed_trip.end_name,
        "planned_distance_miles": (
            completed_trip
            .planned_distance_miles
        ),
        "actual_distance_miles": (
            completed_trip
            .actual_distance_miles
        ),
        "elapsed_time_seconds": (
            completed_trip
            .elapsed_time_seconds
        ),
        "started_at": (
            completed_trip.started_at
        ),
        "completed_at": (
            completed_trip.completed_at
        ),
        "notes": completed_trip.notes,
        "created_at": (
            completed_trip.created_at
        ),
        "updated_at": (
            completed_trip.updated_at
        ),
        "participants": participants,
        "currentUserRole": (
            current_membership.role
            if current_membership
            else "participant"
        ),
    }


def get_accessible_trip(
    db: Session,
    trip_id: UUID,
    user_id: UUID,
):
    membership = get_membership(
        db,
        trip_id,
        user_id,
    )

    if not membership:
        return None, None

    completed_trip = (
        db.query(CompletedTrip)
        .options(
            joinedload(
                CompletedTrip.participants
            ).joinedload(
                CompletedTripParticipant.user
            )
        )
        .filter(
            CompletedTrip.id == trip_id
        )
        .first()
    )

    return completed_trip, membership


@router.get("")
def list_completed_trips(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    trips = (
        db.query(CompletedTrip)
        .join(
            CompletedTripParticipant,
            (
                CompletedTripParticipant
                .completed_trip_id
                == CompletedTrip.id
            ),
        )
        .options(
            joinedload(
                CompletedTrip.participants
            ).joinedload(
                CompletedTripParticipant.user
            )
        )
        .filter(
            CompletedTripParticipant.user_id
            == current_user.id
        )
        .order_by(
            CompletedTrip.completed_at.desc()
        )
        .all()
    )

    return [
        serialize_completed_trip(
            trip,
            current_user.id,
        )
        for trip in trips
    ]


@router.post("")
def create_completed_trip(
    payload: CompletedTripCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    river = (
        db.query(River)
        .filter(
            River.id == payload.riverId
        )
        .first()
    )

    if not river:
        raise HTTPException(
            status_code=404,
            detail="River not found",
        )

    requested_participant_ids = set(
        payload.participantUserIds
    )

    requested_participant_ids.discard(
        current_user.id
    )

    valid_participants = []

    if requested_participant_ids:
        valid_participants = (
            db.query(User)
            .filter(
                User.id.in_(
                    requested_participant_ids
                )
            )
            .all()
        )

        valid_participant_ids = {
            participant.id
            for participant
            in valid_participants
        }

        if (
            valid_participant_ids
            != requested_participant_ids
        ):
            raise HTTPException(
                status_code=400,
                detail=(
                    "One or more paddlers "
                    "could not be verified."
                ),
            )

    completed_trip = CompletedTrip(
        user_id=current_user.id,
        river_id=river.id,
        river_name=payload.riverName,
        state=payload.state,
        start_name=payload.startName,
        end_name=payload.endName,
        planned_distance_miles=(
            payload.plannedDistanceMiles
        ),
        actual_distance_miles=(
            payload.actualDistanceMiles
        ),
        elapsed_time_seconds=(
            payload.elapsedTimeSeconds
        ),
        started_at=payload.startedAt,
        completed_at=payload.completedAt,
        notes=payload.notes,
    )

    try:
        db.add(completed_trip)
        db.flush()

        db.add(
            CompletedTripParticipant(
                completed_trip_id=(
                    completed_trip.id
                ),
                user_id=current_user.id,
                role="navigator",
            )
        )

        for participant in valid_participants:
            db.add(
                CompletedTripParticipant(
                    completed_trip_id=(
                        completed_trip.id
                    ),
                    user_id=participant.id,
                    role="participant",
                )
            )

        db.commit()

    except Exception:
        db.rollback()
        raise

    completed_trip = (
        db.query(CompletedTrip)
        .options(
            joinedload(
                CompletedTrip.participants
            ).joinedload(
                CompletedTripParticipant.user
            )
        )
        .filter(
            CompletedTrip.id
            == completed_trip.id
        )
        .first()
    )

    return serialize_completed_trip(
        completed_trip,
        current_user.id,
    )


@router.get("/{trip_id}")
def get_completed_trip(
    trip_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    completed_trip, membership = (
        get_accessible_trip(
            db,
            trip_id,
            current_user.id,
        )
    )

    if not completed_trip or not membership:
        raise HTTPException(
            status_code=404,
            detail=(
                "Completed trip not found"
            ),
        )

    return serialize_completed_trip(
        completed_trip,
        current_user.id,
    )


@router.patch("/{trip_id}")
def update_completed_trip(
    trip_id: UUID,
    payload: CompletedTripUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    completed_trip, membership = (
        get_accessible_trip(
            db,
            trip_id,
            current_user.id,
        )
    )

    if not completed_trip or not membership:
        raise HTTPException(
            status_code=404,
            detail=(
                "Completed trip not found"
            ),
        )

    if membership.role != "navigator":
        raise HTTPException(
            status_code=403,
            detail=(
                "Only the trip navigator "
                "can edit this trip."
            ),
        )

    if payload.notes is not None:
        completed_trip.notes = (
            payload.notes
        )

    completed_trip.updated_at = (
        datetime.utcnow()
    )

    db.commit()
    db.refresh(completed_trip)

    return serialize_completed_trip(
        completed_trip,
        current_user.id,
    )


@router.delete("/{trip_id}")
def delete_completed_trip(
    trip_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    completed_trip, membership = (
        get_accessible_trip(
            db,
            trip_id,
            current_user.id,
        )
    )

    if not completed_trip or not membership:
        raise HTTPException(
            status_code=404,
            detail=(
                "Completed trip not found"
            ),
        )

    if membership.role == "navigator":
        db.delete(completed_trip)

        result = {
            "status": "deleted",
            "scope": "entire-trip",
            "id": str(trip_id),
        }

    else:
        db.delete(membership)

        result = {
            "status": "deleted",
            "scope": "participant-only",
            "id": str(trip_id),
        }

    db.commit()

    return result