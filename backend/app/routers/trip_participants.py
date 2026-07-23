from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas import (
    TripParticipantQrTokenOut,
    TripParticipantResolveOut,
    TripParticipantResolveRequest,
)
from app.security import (
    create_trip_participant_token,
    decode_trip_participant_token,
    get_current_user,
)

router = APIRouter(
    prefix="/trip-participants",
    tags=["trip-participants"],
)


@router.post(
    "/qr-token",
    response_model=TripParticipantQrTokenOut,
)
def create_qr_token(
    current_user: User = Depends(
        get_current_user
    ),
):
    token, expires_at = (
        create_trip_participant_token(
            current_user
        )
    )

    return {
        "token": token,
        "qrValue": (
            "yakquest://trip-participant"
            f"?token={token}"
        ),
        "displayName": (
            current_user.display_name
            or "YakQuest User"
        ),
        "expiresAt": expires_at,
    }


@router.post(
    "/resolve",
    response_model=TripParticipantResolveOut,
)
def resolve_qr_token(
    payload: TripParticipantResolveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    participant_user_id = (
        decode_trip_participant_token(
            payload.token
        )
    )

    if participant_user_id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail=(
                "You are already the trip "
                "navigator."
            ),
        )

    participant = (
        db.query(User)
        .filter(
            User.id == participant_user_id
        )
        .first()
    )

    if not participant:
        raise HTTPException(
            status_code=404,
            detail=(
                "The paddler account could "
                "not be found."
            ),
        )

    return {
        "userId": participant.id,
        "displayName": (
            participant.display_name
            or "YakQuest User"
        ),
    }