import json
from sqlalchemy.orm import Session
from app.database import engine, Base, SessionLocal
from app.models import User
from app.security import hash_password

def seed_database():
    """Initializes tables and seeds default test users."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if users already exist
        existing = db.query(User).first()
        if existing:
            print("[Seed] Database already contains users. Skipping seed.")
            return

        print("[Seed] Creating initial test accounts...")

        # 1. Main account from user screenshot
        past_hashes = [
            hash_password("OldPassword2025!"),
            hash_password("SummerPassword2024#")
        ]

        jerome_user = User(
            email="igwikejerome@gmail.com",
            username="igwikejerome",
            full_name="Jerome Igwike",
            avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
            hashed_password=hash_password("GonnitSecure2026!"),
            previous_passwords=json.dumps(past_hashes),
            is_active=True,
            is_admin=False
        )
        db.add(jerome_user)

        # 2. Company Admin account
        admin_user = User(
            email="admin@gonnit.com",
            username="admin",
            full_name="Gonnit Security Officer",
            avatar_url=None,
            hashed_password=hash_password("AdminGonnit2026!"),
            previous_passwords="[]",
            is_active=True,
            is_admin=True
        )
        db.add(admin_user)

        # 3. Teammate test account
        team_user = User(
            email="alex@gonnit.com",
            username="alex",
            full_name="Alex Mercer",
            avatar_url=None,
            hashed_password=hash_password("AlexPass2026!"),
            previous_passwords="[]",
            is_active=True,
            is_admin=False
        )
        db.add(team_user)

        db.commit()
        print("[Seed] Successfully seeded initial test users.")

    except Exception as e:
        db.rollback()
        print(f"[Seed] Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
