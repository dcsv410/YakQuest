from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.models import Contribution, River, RiverPoint, SavedTrip, User
from app.database import Base, engine, SessionLocal
from app.routers import admin, admin_seed, auth, completed_trips, contributions, rivers, saved_trips

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="YakQuest API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8081",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:19006",
        "http://localhost:3000",
        "https://yakquest.com",
        "https://admin.yakquest.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(contributions.router)
app.include_router(admin_seed.router)
app.include_router(admin.router)
app.include_router(rivers.router)
app.include_router(auth.router)
app.include_router(saved_trips.router)
app.include_router(completed_trips.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8081",
        "http://localhost:19006",
        "http://localhost:3000",
        "https://yakquest.com",
        "https://admin.yakquest.com",
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