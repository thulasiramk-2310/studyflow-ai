"""Test configuration for study-service.

Environment defaults are set before any app module is imported so
`app.core.config.Settings` constructs without real credentials. Tests run
against an in-memory SQLite database and never touch Postgres or the network.
"""

from __future__ import annotations

import os

os.environ.setdefault("DB_PASSWORD", "test-password")
os.environ.setdefault("INTERNAL_API_KEY", "test-internal-key")
os.environ.setdefault("JWT_SECRET", "test-jwt-secret")

import pytest  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

from app.core.database import Base  # noqa: E402
import app.models  # noqa: E402,F401  (registers every table on Base)


@pytest.fixture
def db():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSession()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()
