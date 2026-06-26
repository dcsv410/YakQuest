from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


RiverPointType = Literal[
    "public",
    "private",
    "public_access",
    "private_access",
    "poi",
    "hazard",
]

ContributionKind = Literal[
    "new-river",
    "existing-river-point",
    "remove-existing-point",
]

ContributionStatus = Literal[
    "pending",
    "approved",
    "rejected",
]

class AttachRiverRequest(BaseModel):
    riverId: UUID

class CoordinateSchema(BaseModel):
    latitude: float
    longitude: float


class RiverPointCreate(BaseModel):
    id: str | None = None
    name: str
    type: RiverPointType
    latitude: float
    longitude: float
    description: str | None = None
    parking: bool | None = False
    restroom: bool | None = False
    camping: bool | None = False
    photos: list[str] = Field(default_factory=list)
    website: str | None = None
    phone: str | None = None


class ContributionCreate(BaseModel):
    kind: ContributionKind

    riverId: str | None = None
    riverName: str | None = None
    state: str | None = None

    points: list[RiverPointCreate] = Field(default_factory=list)

    targetPointId: str | None = None
    targetPointName: str | None = None
    removalReason: str | None = None


class ContributionOut(BaseModel):
    id: UUID
    created_at: datetime
    kind: str
    status: str

    river_id: UUID | None = None
    river_name: str | None = None
    state: str | None = None

    points: list = Field(default_factory=list)

    target_point_id: UUID | None = None
    target_point_name: str | None = None
    removal_reason: str | None = None

    class Config:
        from_attributes = True


class ReviewCreate(BaseModel):
    notes: str | None = None

class UserCreate(BaseModel):
    email: str
    password: str
    displayName: str | None = None


class UserOut(BaseModel):
    id: UUID
    email: str
    display_name: str | None = None
    is_admin: bool
    trust_score: int

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    accessToken: str
    tokenType: str = "bearer"
    user: UserOut


class SavedTripCreate(BaseModel):
    riverId: UUID
    name: str | None = None

    startName: str | None = None
    startLatitude: float
    startLongitude: float

    endName: str | None = None
    endLatitude: float
    endLongitude: float

    plannedDistanceMiles: float | None = None
    estimatedTimeMin: int | None = None

    notes: str | None = None


class SavedTripOut(BaseModel):
    id: UUID
    user_id: UUID
    river_id: UUID

    name: str | None = None

    start_name: str | None = None
    start_latitude: float
    start_longitude: float

    end_name: str | None = None
    end_latitude: float
    end_longitude: float

    planned_distance_miles: float | None = None
    estimated_time_min: int | None = None

    notes: str | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CompletedTripCreate(BaseModel):
    riverId: UUID
    riverName: str
    state: str | None = None

    startName: str | None = None
    endName: str | None = None

    plannedDistanceMiles: float | None = None
    actualDistanceMiles: float | None = None

    elapsedTimeSeconds: int | None = None

    startedAt: datetime | None = None
    completedAt: datetime

    notes: str | None = None


class CompletedTripUpdate(BaseModel):
    notes: str | None = None


class CompletedTripOut(BaseModel):
    id: UUID
    user_id: UUID
    river_id: UUID

    river_name: str
    state: str | None = None

    start_name: str | None = None
    end_name: str | None = None

    planned_distance_miles: float | None = None
    actual_distance_miles: float | None = None

    elapsed_time_seconds: int | None = None

    started_at: datetime | None = None
    completed_at: datetime

    notes: str | None = None

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True