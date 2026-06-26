from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Contribution
from app.schemas import ContributionCreate, ContributionOut

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

@router.post("", response_model=ContributionOut)
def create_contribution(payload: ContributionCreate, db: Session = Depends(get_db)):
    contribution = Contribution(
        kind=payload.kind,
        river_id=payload.riverId,
        river_name=payload.riverName,
        state=payload.state,
        points=[
            {
                **point.model_dump(),
                "type": normalize_point_type(point.type),
            }
            for point in payload.points
        ],
        target_point_id=payload.targetPointId,
        target_point_name=payload.targetPointName,
        removal_reason=payload.removalReason,
    )

    db.add(contribution)
    db.commit()
    db.refresh(contribution)

    return contribution