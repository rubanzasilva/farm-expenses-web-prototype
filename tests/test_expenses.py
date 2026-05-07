"""Tests for expense CRUD operations."""
import pytest


class TestExpenseCreation:
    """Test creating expenses."""

    def test_create_expense_success(self, client, admin_headers, sample_expense):
        """Test successful expense creation."""
        response = client.post(
            "/api/expenses",
            json=sample_expense,
            headers=admin_headers
        )
        assert response.status_code == 201
        data = response.json()
        assert data["category"] == sample_expense["category"]
        assert data["description"] == sample_expense["description"]
        assert data["amount"] == sample_expense["amount"]
        assert data["notes"] == sample_expense["notes"]
        assert data["entry_date"] == sample_expense["entry_date"]
        assert "id" in data

    def test_create_expense_without_date(self, client, admin_headers):
        """Test creating expense without date (should be allowed)."""
        expense_data = {
            "entry_date": None,
            "category": "Transport",
            "description": "Undated expense",
            "amount": 10000,
            "notes": ""
        }
        response = client.post(
            "/api/expenses",
            json=expense_data,
            headers=admin_headers
        )
        assert response.status_code == 201
        assert response.json()["entry_date"] is None

    def test_create_expense_missing_category(self, client, admin_headers):
        """Test creating expense without required category field."""
        expense_data = {
            "entry_date": "2026-05-01",
            "description": "Test expense",
            "amount": 10000,
            "notes": ""
        }
        response = client.post(
            "/api/expenses",
            json=expense_data,
            headers=admin_headers
        )
        assert response.status_code == 422

    def test_create_expense_missing_description(self, client, admin_headers):
        """Test creating expense without required description field."""
        expense_data = {
            "entry_date": "2026-05-01",
            "category": "Transport",
            "amount": 10000,
            "notes": ""
        }
        response = client.post(
            "/api/expenses",
            json=expense_data,
            headers=admin_headers
        )
        assert response.status_code == 422

    def test_create_expense_missing_amount(self, client, admin_headers):
        """Test creating expense without required amount field."""
        expense_data = {
            "entry_date": "2026-05-01",
            "category": "Transport",
            "description": "Test expense",
            "notes": ""
        }
        response = client.post(
            "/api/expenses",
            json=expense_data,
            headers=admin_headers
        )
        assert response.status_code == 422

    def test_create_expense_invalid_date(self, client, admin_headers):
        """Test creating expense with invalid date format."""
        expense_data = {
            "entry_date": "7 May 2026",  # Invalid format
            "category": "Transport",
            "description": "Test expense",
            "amount": 10000,
            "notes": ""
        }
        response = client.post(
            "/api/expenses",
            json=expense_data,
            headers=admin_headers
        )
        assert response.status_code == 422

    def test_create_expense_negative_amount(self, client, admin_headers):
        """Test creating expense with negative amount."""
        expense_data = {
            "entry_date": "2026-05-01",
            "category": "Transport",
            "description": "Test expense",
            "amount": -10000,
            "notes": ""
        }
        response = client.post(
            "/api/expenses",
            json=expense_data,
            headers=admin_headers
        )
        # Should be accepted by API (no validation for negative)
        assert response.status_code == 201


class TestExpenseRetrieval:
    """Test reading expenses."""

    def test_get_expenses_empty_list(self, client, admin_headers):
        """Test getting expenses when none exist."""
        response = client.get("/api/expenses", headers=admin_headers)
        assert response.status_code == 200
        assert response.json() == []

    def test_get_expenses_list(self, client, admin_headers, sample_expense):
        """Test getting list of expenses."""
        # Create multiple expenses
        client.post("/api/expenses", json=sample_expense, headers=admin_headers)
        second_expense = {**sample_expense, "description": "Second expense", "amount": 15000}
        client.post("/api/expenses", json=second_expense, headers=admin_headers)

        response = client.get("/api/expenses", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2

    def test_filter_expenses_by_date_range(self, client, admin_headers):
        """Test filtering expenses by date range."""
        # Create expenses with different dates
        expense1 = {
            "entry_date": "2026-05-01",
            "category": "Transport",
            "description": "May expense",
            "amount": 10000,
            "notes": ""
        }
        expense2 = {
            "entry_date": "2026-06-01",
            "category": "Transport",
            "description": "June expense",
            "amount": 15000,
            "notes": ""
        }
        client.post("/api/expenses", json=expense1, headers=admin_headers)
        client.post("/api/expenses", json=expense2, headers=admin_headers)

        # Filter for May only
        response = client.get(
            "/api/expenses?from=2026-05-01&to=2026-05-31",
            headers=admin_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["description"] == "May expense"

    def test_filter_expenses_by_category(self, client, admin_headers):
        """Test filtering expenses by category."""
        # Create expenses with different categories
        expense1 = {
            "entry_date": "2026-05-01",
            "category": "Transport",
            "description": "Transport expense",
            "amount": 10000,
            "notes": ""
        }
        expense2 = {
            "entry_date": "2026-05-01",
            "category": "Meals",
            "description": "Meal expense",
            "amount": 5000,
            "notes": ""
        }
        client.post("/api/expenses", json=expense1, headers=admin_headers)
        client.post("/api/expenses", json=expense2, headers=admin_headers)

        # Filter for Transport only
        response = client.get(
            "/api/expenses?category=Transport",
            headers=admin_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["category"] == "Transport"

    def test_filter_expenses_by_multiple_categories(self, client, admin_headers):
        """Test filtering expenses by multiple categories."""
        # Create expenses
        for cat in ["Transport", "Meals", "Tools"]:
            expense = {
                "entry_date": "2026-05-01",
                "category": cat,
                "description": f"{cat} expense",
                "amount": 10000,
                "notes": ""
            }
            client.post("/api/expenses", json=expense, headers=admin_headers)

        # Filter for Transport and Meals
        response = client.get(
            "/api/expenses?category=Transport|Meals",
            headers=admin_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        categories = [e["category"] for e in data]
        assert "Transport" in categories
        assert "Meals" in categories
        assert "Tools" not in categories

    def test_search_expenses_by_query(self, client, admin_headers):
        """Test searching expenses by description/notes."""
        # Create expenses
        expense1 = {
            "entry_date": "2026-05-01",
            "category": "Transport",
            "description": "Taxi to Kisongi",
            "amount": 10000,
            "notes": ""
        }
        expense2 = {
            "entry_date": "2026-05-01",
            "category": "Meals",
            "description": "Lunch",
            "amount": 5000,
            "notes": "At Kisongi market"
        }
        client.post("/api/expenses", json=expense1, headers=admin_headers)
        client.post("/api/expenses", json=expense2, headers=admin_headers)

        # Search for "Kisongi"
        response = client.get(
            "/api/expenses?q=Kisongi",
            headers=admin_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2  # Both match


class TestExpenseUpdate:
    """Test updating expenses."""

    def test_update_expense_success(self, client, admin_headers, sample_expense):
        """Test successful expense update."""
        # Create expense
        create_response = client.post(
            "/api/expenses",
            json=sample_expense,
            headers=admin_headers
        )
        expense_id = create_response.json()["id"]

        # Update expense
        updated_data = {
            **sample_expense,
            "amount": 35000,
            "description": "Updated transport"
        }
        response = client.put(
            f"/api/expenses/{expense_id}",
            json=updated_data,
            headers=admin_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["amount"] == 35000
        assert data["description"] == "Updated transport"

    def test_update_nonexistent_expense(self, client, admin_headers, sample_expense):
        """Test updating expense that doesn't exist."""
        response = client.put(
            "/api/expenses/99999",
            json=sample_expense,
            headers=admin_headers
        )
        assert response.status_code == 404

    def test_update_expense_invalid_data(self, client, admin_headers, sample_expense):
        """Test updating expense with invalid data."""
        # Create expense
        create_response = client.post(
            "/api/expenses",
            json=sample_expense,
            headers=admin_headers
        )
        expense_id = create_response.json()["id"]

        # Try to update with missing required field
        invalid_data = {
            "entry_date": "2026-05-01",
            "category": "Transport",
            "amount": 10000,
            # Missing description
            "notes": ""
        }
        response = client.put(
            f"/api/expenses/{expense_id}",
            json=invalid_data,
            headers=admin_headers
        )
        assert response.status_code == 422


class TestExpenseDeletion:
    """Test deleting expenses."""

    def test_delete_expense_success(self, client, admin_headers, sample_expense):
        """Test successful expense deletion."""
        # Create expense
        create_response = client.post(
            "/api/expenses",
            json=sample_expense,
            headers=admin_headers
        )
        expense_id = create_response.json()["id"]

        # Delete expense
        response = client.delete(
            f"/api/expenses/{expense_id}",
            headers=admin_headers
        )
        assert response.status_code == 204

        # Verify it's gone
        get_response = client.get("/api/expenses", headers=admin_headers)
        assert len(get_response.json()) == 0

    def test_delete_nonexistent_expense(self, client, admin_headers):
        """Test deleting expense that doesn't exist."""
        response = client.delete(
            "/api/expenses/99999",
            headers=admin_headers
        )
        assert response.status_code == 404
