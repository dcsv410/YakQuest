import uuid
from datetime import datetime

from geoalchemy2 import Geometry
from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base

class River(Base):
    __tablename__ = "rivers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    state = Column(String(50), nullable=False)

    usgs_gauge_id = Column(String(50), nullable=True)
    flow_stats = Column(JSON, nullable=True)

    difficulty = Column(Integer, default=1)
    cleanliness = Column(Integer, default=1)
    fishing = Column(Integer, default=1)

    route = Column(Geometry("LINESTRING", srid=4326), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    points = relationship("RiverPoint", back_populates="river")

class RiverPoint(Base):
    __tablename__ = "river_points"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    river_id = Column(UUID(as_uuid=True), ForeignKey("rivers.id"), nullable=False)

    name = Column(String(255), nullable=False)
    type = Column(String(50), nullable=False)

    description = Column(Text, nullable=True)

    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

    location = Column(Geometry("POINT", srid=4326), nullable=False)

    parking = Column(Boolean, default=False)
    restroom = Column(Boolean, default=False)
    camping = Column(Boolean, default=False)

    website = Column(String(500), nullable=True)
    phone = Column(String(50), nullable=True)
    photos = Column(JSON, default=list)

    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    river = relationship("River", back_populates="points")

class Contribution(Base):
    __tablename__ = "contributions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    created_at = Column(DateTime, default=datetime.utcnow)

    kind = Column(String(50), nullable=False)
    status = Column(String(50), default="pending")

    river_id = Column(UUID(as_uuid=True), nullable=True)
    river_name = Column(String(255), nullable=True)
    state = Column(String(50), nullable=True)

    points = Column(JSON, default=list)

    target_point_id = Column(UUID(as_uuid=True), nullable=True)
    target_point_name = Column(String(255), nullable=True)
    removal_reason = Column(Text, nullable=True)

class Review(Base):
    __tablename__ = "reviews"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    contribution_id = Column(UUID(as_uuid=True), ForeignKey("contributions.id"), nullable=False)

    decision = Column(String(50), nullable=False)
    notes = Column(Text, nullable=True)

    reviewed_at = Column(DateTime, default=datetime.utcnow)

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    email = Column(String(255), unique=True, nullable=False, index=True)
    display_name = Column(String(255), nullable=True)

    hashed_password = Column(String(255), nullable=False)

    is_admin = Column(Boolean, default=False)
    trust_score = Column(Integer, default=0)

    created_at = Column(DateTime, default=datetime.utcnow)

class SavedTrip(Base):
    __tablename__ = "saved_trips"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    river_id = Column(UUID(as_uuid=True), ForeignKey("rivers.id"), nullable=False)

    name = Column(String(255), nullable=True)

    start_name = Column(String(255), nullable=True)
    start_latitude = Column(Float, nullable=False)
    start_longitude = Column(Float, nullable=False)

    end_name = Column(String(255), nullable=True)
    end_latitude = Column(Float, nullable=False)
    end_longitude = Column(Float, nullable=False)

    planned_distance_miles = Column(Float, nullable=True)
    estimated_time_min = Column(Integer, nullable=True)

    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)


class CompletedTrip(Base):
    __tablename__ = "completed_trips"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    river_id = Column(UUID(as_uuid=True), ForeignKey("rivers.id"), nullable=False)

    river_name = Column(String(255), nullable=False)
    state = Column(String(50), nullable=True)

    start_name = Column(String(255), nullable=True)
    end_name = Column(String(255), nullable=True)

    planned_distance_miles = Column(Float, nullable=True)
    actual_distance_miles = Column(Float, nullable=True)

    elapsed_time_seconds = Column(Integer, nullable=True)

    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=False)

    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)


class Outfitter(Base):
    __tablename__ = "outfitters"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    river_id = Column(UUID(as_uuid=True), ForeignKey("rivers.id"), nullable=False)

    name = Column(String, nullable=False)
    website = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    description = Column(Text, nullable=True)

    highest_put_in_point_id = Column(UUID(as_uuid=True), ForeignKey("river_points.id"), nullable=True)
    lowest_take_out_point_id = Column(UUID(as_uuid=True), ForeignKey("river_points.id"), nullable=True)

    access_point_ids = Column(JSON, nullable=False, default=list)

    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)