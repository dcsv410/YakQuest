from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.models import Contribution, River, RiverPoint, SavedTrip, User
from app.database import Base, engine, SessionLocal
from app.routers import (
    admin,
    admin_seed,
    auth,
    completed_trips,
    contributions,
    rivers,
    saved_trips,
    trip_participants,
    trip_plans,
)

Base.metadata.create_all(bind=engine)

from sqlalchemy import text

with engine.begin() as conn:
    conn.execute(text("""
        ALTER TABLE contributions
        ADD COLUMN IF NOT EXISTS photo_uri VARCHAR(1000)
    """))

    conn.execute(text("""
        ALTER TABLE contributions
        ADD COLUMN IF NOT EXISTS photo_caption TEXT
    """))

    conn.execute(text("""
        ALTER TABLE contributions
        ALTER COLUMN photo_uri TYPE TEXT
    """))

    conn.execute(text("""
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS
        password_reset_token_hash VARCHAR(255)
    """))

    conn.execute(text("""
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS
        password_reset_expires_at TIMESTAMP
    """))

    conn.execute(text("""
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS
        home_state VARCHAR(2)
    """))

    conn.execute(text("""
        UPDATE users
        SET display_name = 'YakQuest User'
        WHERE display_name IS NULL
           OR TRIM(display_name) = ''
    """))

    conn.execute(text("""
        UPDATE users
        SET home_state = 'AL'
        WHERE home_state IS NULL
           OR TRIM(home_state) = ''
    """))

    conn.execute(text("""
        ALTER TABLE users
        ALTER COLUMN display_name
        SET DEFAULT 'YakQuest User'
    """))

    conn.execute(text("""
        ALTER TABLE users
        ALTER COLUMN home_state
        SET DEFAULT 'AL'
    """))

    conn.execute(text("""
        ALTER TABLE users
        ALTER COLUMN display_name
        SET NOT NULL
    """))

    conn.execute(text("""
        ALTER TABLE users
        ALTER COLUMN home_state
        SET NOT NULL
    """))

    conn.execute(text("""
        CREATE EXTENSION IF NOT EXISTS pgcrypto
    """))

    conn.execute(text("""
        INSERT INTO completed_trip_participants (
            id,
            completed_trip_id,
            user_id,
            role,
            added_at
        )
        SELECT
            gen_random_uuid(),
            completed_trips.id,
            completed_trips.user_id,
            'navigator',
            COALESCE(
                completed_trips.created_at,
                CURRENT_TIMESTAMP
            )
        FROM completed_trips
        WHERE NOT EXISTS (
            SELECT 1
            FROM completed_trip_participants
            WHERE
                completed_trip_participants.completed_trip_id
                    = completed_trips.id
                AND completed_trip_participants.user_id
                    = completed_trips.user_id
        )
    """))

app = FastAPI(
    title="YakQuest API",
    version="0.1.0",
)

app.include_router(contributions.router)
app.include_router(admin_seed.router)
app.include_router(admin.router)
app.include_router(rivers.router)
app.include_router(auth.router)
app.include_router(saved_trips.router)
app.include_router(completed_trips.router)
app.include_router(trip_participants.router)
app.include_router(trip_plans.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8081",
        "http://localhost:19006",
        "http://localhost:3000",
        "https://yakquest.com",
        "https://www.yakquest.com",
        "https://admin.yakquest.com",
        "https://yak-quest-web-one.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    db = SessionLocal()

    try:
        db.execute(text("SELECT 1"))

        return {
            "status": "healthy",
            "database": "connected",
            "counts": {
                "users": db.query(User).count(),
                "rivers": db.query(River).count(),
                "riverPoints": db.query(RiverPoint).count(),
                "savedTrips": db.query(SavedTrip).count(),
                "contributions": db.query(Contribution).count(),
            },
        }
    finally:
        db.close()


@app.get("/db-health")
def db_health_check():
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    return {"status": "ok", "database": "connected"}