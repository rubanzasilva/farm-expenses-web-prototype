"""Tests for authentication endpoints and authorization."""
import pytest
from backend.auth import create_token, authenticate


class TestAuthentication:
    """Test authentication functionality."""

    def test_login_success_admin(self, client):
        """Test successful login with admin credentials."""
        response = client.post(
            "/api/auth/login",
            json={"username": "admin", "password": "admin123"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["role"] == "admin"
        assert data["username"] == "admin"

    def test_login_success_viewer(self, client):
        """Test successful login with viewer credentials."""
        response = client.post(
            "/api/auth/login",
            json={"username": "viewer", "password": "viewer123"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["role"] == "viewer"
        assert data["username"] == "viewer"

    def test_login_invalid_username(self, client):
        """Test login with invalid username."""
        response = client.post(
            "/api/auth/login",
            json={"username": "nonexistent", "password": "password"}
        )
        assert response.status_code == 401
        assert "Invalid credentials" in response.json()["detail"]

    def test_login_invalid_password(self, client):
        """Test login with invalid password."""
        response = client.post(
            "/api/auth/login",
            json={"username": "admin", "password": "wrongpassword"}
        )
        assert response.status_code == 401
        assert "Invalid credentials" in response.json()["detail"]

    def test_login_missing_username(self, client):
        """Test login with missing username."""
        response = client.post(
            "/api/auth/login",
            json={"password": "admin123"}
        )
        assert response.status_code == 422  # Validation error

    def test_login_missing_password(self, client):
        """Test login with missing password."""
        response = client.post(
            "/api/auth/login",
            json={"username": "admin"}
        )
        assert response.status_code == 422  # Validation error


class TestAuthorization:
    """Test role-based access control."""

    def test_access_without_token(self, client):
        """Test accessing protected endpoint without token."""
        response = client.get("/api/expenses")
        assert response.status_code == 403

    def test_access_with_invalid_token(self, client):
        """Test accessing protected endpoint with invalid token."""
        response = client.get(
            "/api/expenses",
            headers={"Authorization": "Bearer invalid_token"}
        )
        assert response.status_code == 401

    def test_viewer_can_read_expenses(self, client, viewer_headers):
        """Test viewer role can read expenses."""
        response = client.get("/api/expenses", headers=viewer_headers)
        assert response.status_code == 200

    def test_viewer_cannot_create_expense(self, client, viewer_headers, sample_expense):
        """Test viewer role cannot create expenses."""
        response = client.post(
            "/api/expenses",
            json=sample_expense,
            headers=viewer_headers
        )
        assert response.status_code == 403
        assert "Admin access required" in response.json()["detail"]

    def test_viewer_cannot_update_expense(self, client, admin_headers, viewer_headers, sample_expense):
        """Test viewer role cannot update expenses."""
        # First create an expense as admin
        create_response = client.post(
            "/api/expenses",
            json=sample_expense,
            headers=admin_headers
        )
        expense_id = create_response.json()["id"]

        # Try to update as viewer
        response = client.put(
            f"/api/expenses/{expense_id}",
            json={**sample_expense, "amount": 50000},
            headers=viewer_headers
        )
        assert response.status_code == 403

    def test_viewer_cannot_delete_expense(self, client, admin_headers, viewer_headers, sample_expense):
        """Test viewer role cannot delete expenses."""
        # First create an expense as admin
        create_response = client.post(
            "/api/expenses",
            json=sample_expense,
            headers=admin_headers
        )
        expense_id = create_response.json()["id"]

        # Try to delete as viewer
        response = client.delete(
            f"/api/expenses/{expense_id}",
            headers=viewer_headers
        )
        assert response.status_code == 403

    def test_admin_can_create_expense(self, client, admin_headers, sample_expense):
        """Test admin role can create expenses."""
        response = client.post(
            "/api/expenses",
            json=sample_expense,
            headers=admin_headers
        )
        assert response.status_code == 201
        assert response.json()["description"] == sample_expense["description"]

    def test_admin_can_update_expense(self, client, admin_headers, sample_expense):
        """Test admin role can update expenses."""
        # Create expense
        create_response = client.post(
            "/api/expenses",
            json=sample_expense,
            headers=admin_headers
        )
        expense_id = create_response.json()["id"]

        # Update expense
        updated_data = {**sample_expense, "amount": 35000}
        response = client.put(
            f"/api/expenses/{expense_id}",
            json=updated_data,
            headers=admin_headers
        )
        assert response.status_code == 200
        assert response.json()["amount"] == 35000

    def test_admin_can_delete_expense(self, client, admin_headers, sample_expense):
        """Test admin role can delete expenses."""
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


class TestTokenGeneration:
    """Test JWT token generation and validation."""

    def test_create_token_structure(self):
        """Test token creation returns valid JWT."""
        token = create_token("test@test.com", "admin")
        assert isinstance(token, str)
        assert len(token) > 0
        # JWT tokens have 3 parts separated by dots
        assert token.count(".") == 2

    def test_authenticate_valid_credentials(self):
        """Test authenticate function with valid credentials."""
        result = authenticate("admin", "admin123")
        assert result is not None
        assert result["username"] == "admin"
        assert result["role"] == "admin"

    def test_authenticate_invalid_credentials(self):
        """Test authenticate function with invalid credentials."""
        result = authenticate("admin", "wrongpassword")
        assert result is None
