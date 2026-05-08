"""Tests for income CRUD operations."""
import pytest


class TestIncomeCreation:
    """Test creating income records."""

    def test_create_income_success(self, client, admin_headers, sample_income):
        """Test successful income creation."""
        response = client.post(
            "/api/income",
            json=sample_income,
            headers=admin_headers
        )
        assert response.status_code == 201
        data = response.json()
        assert data["source"] == sample_income["source"]
        assert data["description"] == sample_income["description"]
        assert data["amount"] == sample_income["amount"]
        assert data["notes"] == sample_income["notes"]
        assert data["entry_date"] == sample_income["entry_date"]
        assert "id" in data

    def test_create_income_without_date(self, client, admin_headers):
        """Test creating income without date (should be allowed)."""
        income_data = {
            "entry_date": None,
            "source": "Tree Sales",
            "description": "Undated sale",
            "amount": 50000,
            "notes": ""
        }
        response = client.post(
            "/api/income",
            json=income_data,
            headers=admin_headers
        )
        assert response.status_code == 201
        assert response.json()["entry_date"] is None

    def test_create_income_missing_source(self, client, admin_headers):
        """Test creating income without required source field."""
        income_data = {
            "entry_date": "2026-05-01",
            "description": "Test income",
            "amount": 50000,
            "notes": ""
        }
        response = client.post(
            "/api/income",
            json=income_data,
            headers=admin_headers
        )
        assert response.status_code == 422

    def test_create_income_missing_description(self, client, admin_headers):
        """Test creating income without required description field."""
        income_data = {
            "entry_date": "2026-05-01",
            "source": "Tree Sales",
            "amount": 50000,
            "notes": ""
        }
        response = client.post(
            "/api/income",
            json=income_data,
            headers=admin_headers
        )
        assert response.status_code == 422

    def test_create_income_missing_amount(self, client, admin_headers):
        """Test creating income without required amount field."""
        income_data = {
            "entry_date": "2026-05-01",
            "source": "Tree Sales",
            "description": "Test income",
            "notes": ""
        }
        response = client.post(
            "/api/income",
            json=income_data,
            headers=admin_headers
        )
        assert response.status_code == 422

    def test_create_income_invalid_date(self, client, admin_headers):
        """Test creating income with invalid date format."""
        income_data = {
            "entry_date": "invalid-date",
            "source": "Tree Sales",
            "description": "Test income",
            "amount": 50000,
            "notes": ""
        }
        response = client.post(
            "/api/income",
            json=income_data,
            headers=admin_headers
        )
        assert response.status_code == 422


class TestIncomeRetrieval:
    """Test reading income records."""

    def test_get_income_empty_list(self, client, admin_headers):
        """Test getting income when none exist."""
        response = client.get("/api/income", headers=admin_headers)
        assert response.status_code == 200
        assert response.json() == []

    def test_get_income_list(self, client, admin_headers, sample_income):
        """Test getting list of income records."""
        # Create multiple income records
        client.post("/api/income", json=sample_income, headers=admin_headers)
        second_income = {**sample_income, "description": "Second sale", "amount": 75000}
        client.post("/api/income", json=second_income, headers=admin_headers)

        response = client.get("/api/income", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2

    def test_filter_income_by_date_range(self, client, admin_headers):
        """Test filtering income by date range."""
        # Create income records with different dates
        income1 = {
            "entry_date": "2026-05-01",
            "source": "Tree Sales",
            "description": "May sale",
            "amount": 50000,
            "notes": ""
        }
        income2 = {
            "entry_date": "2026-06-01",
            "source": "Tree Sales",
            "description": "June sale",
            "amount": 75000,
            "notes": ""
        }
        client.post("/api/income", json=income1, headers=admin_headers)
        client.post("/api/income", json=income2, headers=admin_headers)

        # Filter for May only
        response = client.get(
            "/api/income?from=2026-05-01&to=2026-05-31",
            headers=admin_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["description"] == "May sale"

    def test_filter_income_by_source(self, client, admin_headers):
        """Test filtering income by source."""
        # Create income records with different sources
        income1 = {
            "entry_date": "2026-05-01",
            "source": "Tree Sales",
            "description": "Tree sale",
            "amount": 50000,
            "notes": ""
        }
        income2 = {
            "entry_date": "2026-05-01",
            "source": "Coffee Sales",
            "description": "Coffee sale",
            "amount": 30000,
            "notes": ""
        }
        client.post("/api/income", json=income1, headers=admin_headers)
        client.post("/api/income", json=income2, headers=admin_headers)

        # Filter for Tree Sales only
        response = client.get(
            "/api/income?source=Tree Sales",
            headers=admin_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["source"] == "Tree Sales"

    def test_filter_income_by_multiple_sources(self, client, admin_headers):
        """Test filtering income by multiple sources."""
        # Create income records
        for source in ["Tree Sales", "Coffee Sales", "Timber"]:
            income = {
                "entry_date": "2026-05-01",
                "source": source,
                "description": f"{source} record",
                "amount": 50000,
                "notes": ""
            }
            client.post("/api/income", json=income, headers=admin_headers)

        # Filter for Tree Sales and Coffee Sales
        response = client.get(
            "/api/income?source=Tree Sales|Coffee Sales",
            headers=admin_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        sources = [i["source"] for i in data]
        assert "Tree Sales" in sources
        assert "Coffee Sales" in sources
        assert "Timber" not in sources

    def test_search_income_by_query(self, client, admin_headers):
        """Test searching income by description/notes."""
        # Create income records
        income1 = {
            "entry_date": "2026-05-01",
            "source": "Tree Sales",
            "description": "Coffee trees to local buyer",
            "amount": 50000,
            "notes": ""
        }
        income2 = {
            "entry_date": "2026-05-01",
            "source": "Coffee Sales",
            "description": "Beans harvest",
            "amount": 30000,
            "notes": "Premium quality coffee"
        }
        client.post("/api/income", json=income1, headers=admin_headers)
        client.post("/api/income", json=income2, headers=admin_headers)

        # Search for "coffee"
        response = client.get(
            "/api/income?q=coffee",
            headers=admin_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2  # Both match (case-insensitive)


class TestIncomeUpdate:
    """Test updating income records."""

    def test_update_income_success(self, client, admin_headers, sample_income):
        """Test successful income update."""
        # Create income
        create_response = client.post(
            "/api/income",
            json=sample_income,
            headers=admin_headers
        )
        income_id = create_response.json()["id"]

        # Update income
        updated_data = {
            **sample_income,
            "amount": 175000,
            "description": "Updated tree sale"
        }
        response = client.put(
            f"/api/income/{income_id}",
            json=updated_data,
            headers=admin_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["amount"] == 175000
        assert data["description"] == "Updated tree sale"

    def test_update_nonexistent_income(self, client, admin_headers, sample_income):
        """Test updating income that doesn't exist."""
        response = client.put(
            "/api/income/99999",
            json=sample_income,
            headers=admin_headers
        )
        assert response.status_code == 404

    def test_update_income_invalid_data(self, client, admin_headers, sample_income):
        """Test updating income with invalid data."""
        # Create income
        create_response = client.post(
            "/api/income",
            json=sample_income,
            headers=admin_headers
        )
        income_id = create_response.json()["id"]

        # Try to update with missing required field
        invalid_data = {
            "entry_date": "2026-05-01",
            "source": "Tree Sales",
            "amount": 50000,
            # Missing description
            "notes": ""
        }
        response = client.put(
            f"/api/income/{income_id}",
            json=invalid_data,
            headers=admin_headers
        )
        assert response.status_code == 422


class TestIncomeDeletion:
    """Test deleting income records."""

    def test_delete_income_success(self, client, admin_headers, sample_income):
        """Test successful income deletion."""
        # Create income
        create_response = client.post(
            "/api/income",
            json=sample_income,
            headers=admin_headers
        )
        income_id = create_response.json()["id"]

        # Delete income
        response = client.delete(
            f"/api/income/{income_id}",
            headers=admin_headers
        )
        assert response.status_code == 204

        # Verify it's gone
        get_response = client.get("/api/income", headers=admin_headers)
        assert len(get_response.json()) == 0

    def test_delete_nonexistent_income(self, client, admin_headers):
        """Test deleting income that doesn't exist."""
        response = client.delete(
            "/api/income/99999",
            headers=admin_headers
        )
        assert response.status_code == 404


class TestIncomeAuthorization:
    """Test role-based access for income operations."""

    def test_viewer_can_read_income(self, client, viewer_headers):
        """Test viewer role can read income."""
        response = client.get("/api/income", headers=viewer_headers)
        assert response.status_code == 200

    def test_viewer_cannot_create_income(self, client, viewer_headers, sample_income):
        """Test viewer role cannot create income."""
        response = client.post(
            "/api/income",
            json=sample_income,
            headers=viewer_headers
        )
        assert response.status_code == 403

    def test_viewer_cannot_update_income(self, client, admin_headers, viewer_headers, sample_income):
        """Test viewer role cannot update income."""
        # Create income as admin
        create_response = client.post(
            "/api/income",
            json=sample_income,
            headers=admin_headers
        )
        income_id = create_response.json()["id"]

        # Try to update as viewer
        response = client.put(
            f"/api/income/{income_id}",
            json={**sample_income, "amount": 100000},
            headers=viewer_headers
        )
        assert response.status_code == 403

    def test_viewer_cannot_delete_income(self, client, admin_headers, viewer_headers, sample_income):
        """Test viewer role cannot delete income."""
        # Create income as admin
        create_response = client.post(
            "/api/income",
            json=sample_income,
            headers=admin_headers
        )
        income_id = create_response.json()["id"]

        # Try to delete as viewer
        response = client.delete(
            f"/api/income/{income_id}",
            headers=viewer_headers
        )
        assert response.status_code == 403
