"""Pytest configuration and fixtures for testing."""
import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.database import Base, get_db
from backend.main import app
from backend.auth import create_token


# Use in-memory SQLite for tests
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database for each test."""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """Create a test client with database override."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def admin_token():
    """Generate a valid admin token."""
    return create_token("admin@test.com", "admin")


@pytest.fixture
def viewer_token():
    """Generate a valid viewer token."""
    return create_token("viewer@test.com", "viewer")


@pytest.fixture
def admin_headers(admin_token):
    """Headers with admin authentication."""
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture
def viewer_headers(viewer_token):
    """Headers with viewer authentication."""
    return {"Authorization": f"Bearer {viewer_token}"}


@pytest.fixture
def sample_expense():
    """Sample expense data for testing."""
    return {
        "entry_date": "2026-05-01",
        "category": "Transport",
        "description": "Transport to Kisongi",
        "amount": 27000,
        "notes": "Taxi fare"
    }


@pytest.fixture
def sample_income():
    """Sample income data for testing."""
    return {
        "entry_date": "2026-05-05",
        "source": "Tree Sales",
        "description": "Sale of 10 coffee trees",
        "amount": 150000,
        "notes": "Cash payment"
    }
