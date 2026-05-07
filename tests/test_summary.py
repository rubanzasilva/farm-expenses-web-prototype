"""Tests for summary endpoint."""
import pytest


class TestSummaryEndpoint:
    """Test summary calculations and aggregations."""

    def test_summary_empty_database(self, client, admin_headers):
        """Test summary with no data."""
        response = client.get("/api/summary", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["total_expenses"] == 0
        assert data["total_income"] == 0
        assert data["net"] == 0
        assert len(data["expenses_by_category"]) > 0  # All categories present
        assert len(data["income_by_source"]) > 0  # All sources present
        # All should have zero values
        for cat in data["expenses_by_category"]:
            assert cat["n"] == 0
            assert cat["total"] == 0
            assert cat["pct"] == 0

    def test_summary_with_expenses_only(self, client, admin_headers):
        """Test summary with only expenses."""
        # Create expenses
        expenses = [
            {
                "entry_date": "2026-05-01",
                "category": "Transport",
                "description": "Transport 1",
                "amount": 10000,
                "notes": ""
            },
            {
                "entry_date": "2026-05-02",
                "category": "Transport",
                "description": "Transport 2",
                "amount": 15000,
                "notes": ""
            },
            {
                "entry_date": "2026-05-03",
                "category": "Meals",
                "description": "Lunch",
                "amount": 5000,
                "notes": ""
            }
        ]
        for expense in expenses:
            client.post("/api/expenses", json=expense, headers=admin_headers)

        response = client.get("/api/summary", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()

        assert data["total_expenses"] == 30000
        assert data["total_income"] == 0
        assert data["net"] == -30000

        # Check Transport category
        transport = next(c for c in data["expenses_by_category"] if c["category"] == "Transport")
        assert transport["n"] == 2
        assert transport["total"] == 25000
        assert abs(transport["pct"] - 0.8333) < 0.01  # ~83.33%

        # Check Meals category
        meals = next(c for c in data["expenses_by_category"] if c["category"] == "Meals")
        assert meals["n"] == 1
        assert meals["total"] == 5000
        assert abs(meals["pct"] - 0.1667) < 0.01  # ~16.67%

    def test_summary_with_income_only(self, client, admin_headers):
        """Test summary with only income."""
        # Create income
        income_records = [
            {
                "entry_date": "2026-05-01",
                "source": "Tree Sales",
                "description": "Sale 1",
                "amount": 100000,
                "notes": ""
            },
            {
                "entry_date": "2026-05-02",
                "source": "Tree Sales",
                "description": "Sale 2",
                "amount": 50000,
                "notes": ""
            },
            {
                "entry_date": "2026-05-03",
                "source": "Coffee Sales",
                "description": "Coffee beans",
                "amount": 30000,
                "notes": ""
            }
        ]
        for income in income_records:
            client.post("/api/income", json=income, headers=admin_headers)

        response = client.get("/api/summary", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()

        assert data["total_expenses"] == 0
        assert data["total_income"] == 180000
        assert data["net"] == 180000

        # Check Tree Sales
        tree_sales = next(s for s in data["income_by_source"] if s["source"] == "Tree Sales")
        assert tree_sales["n"] == 2
        assert tree_sales["total"] == 150000
        assert abs(tree_sales["pct"] - 0.8333) < 0.01  # ~83.33%

        # Check Coffee Sales
        coffee = next(s for s in data["income_by_source"] if s["source"] == "Coffee Sales")
        assert coffee["n"] == 1
        assert coffee["total"] == 30000
        assert abs(coffee["pct"] - 0.1667) < 0.01  # ~16.67%

    def test_summary_with_both_expenses_and_income(self, client, admin_headers):
        """Test summary with both expenses and income."""
        # Create expenses
        expenses = [
            {
                "entry_date": "2026-05-01",
                "category": "Transport",
                "description": "Transport",
                "amount": 20000,
                "notes": ""
            },
            {
                "entry_date": "2026-05-02",
                "category": "Labor",
                "description": "Workers",
                "amount": 50000,
                "notes": ""
            }
        ]
        for expense in expenses:
            client.post("/api/expenses", json=expense, headers=admin_headers)

        # Create income
        income_records = [
            {
                "entry_date": "2026-05-05",
                "source": "Tree Sales",
                "description": "Tree sale",
                "amount": 150000,
                "notes": ""
            }
        ]
        for income in income_records:
            client.post("/api/income", json=income, headers=admin_headers)

        response = client.get("/api/summary", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()

        assert data["total_expenses"] == 70000
        assert data["total_income"] == 150000
        assert data["net"] == 80000  # Profit

    def test_summary_negative_net(self, client, admin_headers):
        """Test summary when expenses exceed income (loss)."""
        # Create large expense
        client.post(
            "/api/expenses",
            json={
                "entry_date": "2026-05-01",
                "category": "Tools",
                "description": "Equipment",
                "amount": 200000,
                "notes": ""
            },
            headers=admin_headers
        )

        # Create smaller income
        client.post(
            "/api/income",
            json={
                "entry_date": "2026-05-02",
                "source": "Tree Sales",
                "description": "Small sale",
                "amount": 50000,
                "notes": ""
            },
            headers=admin_headers
        )

        response = client.get("/api/summary", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()

        assert data["total_expenses"] == 200000
        assert data["total_income"] == 50000
        assert data["net"] == -150000  # Loss

    def test_summary_all_categories_present(self, client, admin_headers):
        """Test that all categories are present even with zero values."""
        # Create just one expense
        client.post(
            "/api/expenses",
            json={
                "entry_date": "2026-05-01",
                "category": "Transport",
                "description": "Transport",
                "amount": 10000,
                "notes": ""
            },
            headers=admin_headers
        )

        response = client.get("/api/summary", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()

        # All expense categories should be present
        categories = [c["category"] for c in data["expenses_by_category"]]
        expected_categories = [
            "Transport", "PPE/Equipment", "Meals", "Land Preparation",
            "Community/Admin", "Supplies", "Goodwill", "Seedlings",
            "Tools", "Labor", "Other"
        ]
        for cat in expected_categories:
            assert cat in categories

    def test_summary_all_sources_present(self, client, admin_headers):
        """Test that all income sources are present even with zero values."""
        # Create just one income
        client.post(
            "/api/income",
            json={
                "entry_date": "2026-05-01",
                "source": "Tree Sales",
                "description": "Sale",
                "amount": 50000,
                "notes": ""
            },
            headers=admin_headers
        )

        response = client.get("/api/summary", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()

        # All income sources should be present
        sources = [s["source"] for s in data["income_by_source"]]
        expected_sources = [
            "Tree Sales", "Coffee Sales", "Seedling Sales", "Timber",
            "Rental", "Grant / Support", "Other"
        ]
        for src in expected_sources:
            assert src in sources

    def test_summary_percentage_calculation(self, client, admin_headers):
        """Test percentage calculations are accurate."""
        # Create expenses with known percentages
        client.post(
            "/api/expenses",
            json={
                "entry_date": "2026-05-01",
                "category": "Transport",
                "description": "Transport",
                "amount": 30000,
                "notes": ""
            },
            headers=admin_headers
        )
        client.post(
            "/api/expenses",
            json={
                "entry_date": "2026-05-02",
                "category": "Meals",
                "description": "Meals",
                "amount": 20000,
                "notes": ""
            },
            headers=admin_headers
        )
        client.post(
            "/api/expenses",
            json={
                "entry_date": "2026-05-03",
                "category": "Tools",
                "description": "Tools",
                "amount": 50000,
                "notes": ""
            },
            headers=admin_headers
        )
        # Total: 100000

        response = client.get("/api/summary", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()

        transport = next(c for c in data["expenses_by_category"] if c["category"] == "Transport")
        assert transport["pct"] == 0.3  # 30%

        meals = next(c for c in data["expenses_by_category"] if c["category"] == "Meals")
        assert meals["pct"] == 0.2  # 20%

        tools = next(c for c in data["expenses_by_category"] if c["category"] == "Tools")
        assert tools["pct"] == 0.5  # 50%

    def test_summary_requires_authentication(self, client):
        """Test summary endpoint requires authentication."""
        response = client.get("/api/summary")
        assert response.status_code == 403

    def test_summary_viewer_access(self, client, viewer_headers):
        """Test viewer can access summary."""
        response = client.get("/api/summary", headers=viewer_headers)
        assert response.status_code == 200
