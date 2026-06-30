from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

from pydantic import BaseModel
from typing import Optional, List


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


class FlowStatsUpdate(BaseModel):
    lowPercentile: Optional[float] = None
    median: Optional[float] = None
    highPercentile: Optional[float] = None
    max: Optional[float] = None


class RiverUpdate(BaseModel):
    name: Optional[str] = None
    state: Optional[str] = None
    difficulty: Optional[int] = None
    cleanliness: Optional[int] = None
    fishing: Optional[int] = None
    usgsGaugeId: Optional[str] = None
    flowStats: Optional[FlowStatsUpdate] = None


class RiverPointUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

    parking: Optional[bool] = None
    restroom: Optional[bool] = None
    camping: Optional[bool] = None

    isActive: Optional[bool] = None


class RiverPointCreate(BaseModel):
    name: str
    type: str
    latitude: float
    longitude: float

    description: Optional[str] = None

    parking: Optional[bool] = False
    restroom: Optional[bool] = False
    camping: Optional[bool] = False


class CoordinateIn(BaseModel):
    latitude: float
    longitude: float


class FlowStatsIn(BaseModel):
    lowPercentile: float
    median: float
    highPercentile: float
    max: float


class RiverCreate(BaseModel):
    name: str
    state: str
    difficulty: int
    cleanliness: int
    fishing: int
    usgsGaugeId: Optional[str] = None
    flowStats: Optional[FlowStatsIn] = None
    coordinates: List[CoordinateIn]


class RiverPointUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    description: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    parking: Optional[bool] = None
    restroom: Optional[bool] = None
    camping: Optional[bool] = None
    website: Optional[str] = None
    phone: Optional[str] = None
    isActive: Optional[bool] = None


class OutfitterOut(BaseModel):
    id: str
    riverId: str
    name: str
    website: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    description: Optional[str] = None
    highestPutInPointId: Optional[str] = None
    lowestTakeOutPointId: Optional[str] = None
    accessPointIds: list[str] = []
    isActive: bool


class OutfitterCreate(BaseModel):
    riverId: str
    name: str
    website: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    description: Optional[str] = None
    highestPutInPointId: Optional[str] = None
    lowestTakeOutPointId: Optional[str] = None
    accessPointIds: list[str] = []


class OutfitterUpdate(BaseModel):
    name: Optional[str] = None
    website: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    description: Optional[str] = None
    highestPutInPointId: Optional[str] = None
    lowestTakeOutPointId: Optional[str] = None
    accessPointIds: Optional[list[str]] = None
    isActive: Optional[bool] = None


class AdminUserOut(BaseModel):
    id: str
    email: str
    displayName: Optional[str] = None
    isAdmin: bool
    trustScore: int


class AdminAnalyticsOut(BaseModel):
    rivers: int
    users: int
    pendingContributions: int
    approvedContributions: int
    rejectedContributions: int
    completedTrips: int
    savedTrips: int