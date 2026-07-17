from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Contribution, User
from app.schemas import (
    ContributionCreate,
    ContributionOut,
)
from app.security import get_current_user

router = APIRouter(prefix="/contributions", tags=["contributions"])

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

@router.post(
    "",
    response_model=ContributionOut,
)
def create_contribution(
    payload: ContributionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    contribution = Contribution(
        user_id=current_user.id,
        kind=payload.kind,
        river_id=payload.riverId,
        river_name=payload.riverName,
        state=payload.state,
        description=payload.description,
        points=[
            {
                **point.model_dump(),
                "type": normalize_point_type(
                    point.type
                ),
            }
            for point in payload.points
        ],
        target_point_id=payload.targetPointId,
        target_point_name=payload.targetPointName,
        removal_reason=payload.removalReason,
        photo_uri=payload.photoUri,
        photo_caption=payload.photoCaption,
    )

    db.add(contribution)
    db.commit()
    db.refresh(contribution)

    return contribution