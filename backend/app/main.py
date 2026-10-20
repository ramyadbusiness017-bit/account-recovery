from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.routes import auth_recovery, emails, admin, presence
from app.seed import seed_database

# Initialize database schema and default seeds
Base.metadata.create_all(bind=engine)
seed_database()

app = FastAPI(
    title="Gonnit Identity & Account Recovery Service",
    description="High-security account recovery API supporting Google-style matching number challenges, OTP, and real-time visitor presence.",
    version="1.0.0"
)

# CORS Configuration
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    settings.FRONTEND_URL,
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_recovery.router)
app.include_router(emails.router)
app.include_router(admin.router)
app.include_router(presence.router)

# Mount local static flags directory
import os
from fastapi.staticfiles import StaticFiles

static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")
    flags_dir = os.path.join(static_dir, "flags")
    if os.path.exists(flags_dir):
        app.mount("/flags", StaticFiles(directory=flags_dir), name="flags")

@app.get("/")
def root():
    return {
        "service": "Gonnit Identity & Account Recovery",
        "status": "online",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}
