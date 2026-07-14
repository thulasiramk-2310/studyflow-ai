import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5433/study_db")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def upgrade():
    try:
        with engine.connect() as conn:
            # Create Enum Type if it doesn't exist
            try:
                conn.execute(text("CREATE TYPE meetingtype AS ENUM ('NONE', 'GOOGLE_MEET', 'ZOOM', 'MICROSOFT_TEAMS', 'DISCORD', 'OTHER');"))
            except Exception as e:
                print("Enum MeetingType might already exist or failed:", e)

            try:
                conn.execute(text("CREATE TYPE attendancestatus AS ENUM ('PRESENT', 'ABSENT');"))
            except Exception as e:
                print("Enum AttendanceStatus might already exist or failed:", e)

            try:
                conn.execute(text("ALTER TABLE study_sessions ADD COLUMN meeting_type meetingtype NOT NULL DEFAULT 'NONE';"))
                conn.execute(text("ALTER TABLE study_sessions ADD COLUMN meeting_url VARCHAR(512);"))
                conn.execute(text("ALTER TABLE study_sessions ADD COLUMN start_time TIMESTAMP WITHOUT TIME ZONE;"))
                conn.execute(text("ALTER TABLE study_sessions ADD COLUMN end_time TIMESTAMP WITHOUT TIME ZONE;"))
                print("Columns added to study_sessions.")
            except Exception as e:
                print("Columns might already exist or failed:", e)
                
            try:
                conn.execute(text("""
                CREATE TABLE session_attendance (
                    id SERIAL PRIMARY KEY,
                    session_id INTEGER NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
                    user_id INTEGER NOT NULL,
                    status attendancestatus NOT NULL,
                    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
                """))
                print("Table session_attendance created.")
            except Exception as e:
                print("Table session_attendance might already exist or failed:", e)

            conn.commit()

    except Exception as e:
        print("Failed to connect or execute:", e)

if __name__ == "__main__":
    upgrade()
