# Kisongi Farm Tracker

A full-stack web application for managing farm expenses and income tracking. Built with FastAPI backend and React frontend, designed specifically for agricultural financial management.

## Features

- **Expense Tracking**: Record and categorize farm expenses with automatic classification
- **Income Management**: Track various income sources including crop sales, livestock, and other revenue
- **Financial Summary**: View comprehensive financial reports and analytics
- **User Authentication**: Secure login with role-based access (admin/viewer)
- **Smart Classification**: AI-powered expense and income categorization
- **Responsive Design**: Mobile-friendly interface built with Tailwind CSS
- **Real-time Updates**: Dynamic data visualization with charts and tables

## Tech Stack

### Backend
- **FastAPI**: Modern Python web framework
- **SQLAlchemy**: SQL toolkit and ORM
- **PostgreSQL**: Primary database (SQLite supported for development)
- **JWT**: Token-based authentication
- **Pydantic**: Data validation

### Frontend
- **React 18**: UI library
- **Tailwind CSS**: Utility-first CSS framework
- **Recharts**: Data visualization
- **Babel Standalone**: JSX transformation

## Prerequisites

- Python 3.8+
- PostgreSQL (or SQLite for development)
- pip (Python package manager)

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/rubanzasilva/farm-expenses-web-prototype.git
cd farm-expenses-web-prototype
```

### 2. Create a virtual environment

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Set up environment variables

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/kisongi
SECRET_KEY=your-secret-key-here
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-admin-password
VIEWER_USERNAME=viewer
VIEWER_PASSWORD=your-viewer-password
```

### 5. Initialize the database

```bash
python -m backend.seed
```

## Running the Application

### Development Mode

```bash
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

The application will be available at `http://localhost:8000`

### Production Mode

```bash
uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

## Project Structure

```
farm-expenses-web-prototype/
├── backend/
│   ├── __init__.py
│   ├── main.py              # FastAPI application entry point
│   ├── auth.py              # Authentication logic
│   ├── categories.py        # Expense and income categories
│   ├── classifier.py        # Auto-classification logic
│   ├── config.py            # Configuration settings
│   ├── database.py          # Database connection and setup
│   ├── models.py            # SQLAlchemy models
│   ├── schemas.py           # Pydantic schemas
│   ├── seed.py              # Database seeding script
│   └── routers/
│       ├── __init__.py
│       ├── expenses.py      # Expense endpoints
│       ├── income.py        # Income endpoints
│       └── summary.py       # Summary/analytics endpoints
├── frontend/
│   ├── index.html           # Main HTML file
│   ├── app.jsx              # Main React application
│   ├── shell.jsx            # App shell/layout
│   ├── tables.jsx           # Data tables component
│   ├── summary.jsx          # Summary/dashboard component
│   ├── ui.jsx               # UI components
│   ├── tweaks-panel.jsx     # Settings panel
│   └── data.js              # Data management
├── .env.example             # Example environment variables
├── .gitignore               # Git ignore rules
├── Procfile                 # Deployment configuration
├── requirements.txt         # Python dependencies
└── README.md               # This file
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login

### Expenses
- `GET /api/expenses` - List all expenses
- `POST /api/expenses` - Create new expense
- `PUT /api/expenses/{id}` - Update expense
- `DELETE /api/expenses/{id}` - Delete expense

### Income
- `GET /api/income` - List all income records
- `POST /api/income` - Create new income record
- `PUT /api/income/{id}` - Update income record
- `DELETE /api/income/{id}` - Delete income record

### Analytics
- `GET /api/summary` - Get financial summary and analytics

### Utilities
- `GET /api/categories` - Get expense categories and income sources
- `POST /api/classify` - Auto-classify expense/income text

## User Roles

### Admin
- Full access to all features
- Can create, edit, and delete records
- Access to all financial data

### Viewer
- Read-only access
- View expenses, income, and reports
- Cannot modify data

## Default Credentials

**Admin User:**
- Username: `admin`
- Password: `admin123`

**Viewer User:**
- Username: `viewer`
- Password: `viewer123`

> ⚠️ **Important**: Change these default credentials in production!

## Deployment

### Heroku

The application includes a `Procfile` for Heroku deployment:

```bash
heroku create your-app-name
heroku addons:create heroku-postgresql:hobby-dev
git push heroku main
heroku run python -m backend.seed
heroku open
```

### Docker (Optional)

Create a `Dockerfile` for containerized deployment:

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Development

### Creating a new branch

```bash
git checkout -b feature/your-feature-name
```

### Running tests

The project includes a comprehensive test suite for all backend endpoints.

#### Install test dependencies

```bash
pip install -r requirements.txt
```

#### Run all tests

```bash
pytest
```

#### Run with verbose output

```bash
pytest -v
```

#### Run specific test file

```bash
pytest tests/test_auth.py
pytest tests/test_expenses.py
pytest tests/test_income.py
pytest tests/test_summary.py
```

#### Run specific test

```bash
pytest tests/test_auth.py::TestAuthentication::test_login_success_admin
```

#### Generate coverage report

```bash
pip install pytest-cov
pytest --cov=backend --cov-report=html
```

#### Test structure

```
tests/
├── __init__.py
├── conftest.py          # Test fixtures and configuration
├── test_auth.py         # Authentication and authorization tests
├── test_expenses.py     # Expense CRUD operation tests
├── test_income.py       # Income CRUD operation tests
└── test_summary.py      # Summary/analytics endpoint tests
```

#### What's tested

- **Authentication**: Login, token generation, invalid credentials
- **Authorization**: Role-based access control (admin vs viewer)
- **Expense CRUD**: Create, read, update, delete operations
- **Income CRUD**: Create, read, update, delete operations
- **Validation**: Field validation, date format, missing required fields
- **Filtering**: Date ranges, categories, search queries
- **Summary**: Aggregations, percentages, financial calculations

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues, questions, or contributions, please open an issue on GitHub.

## Acknowledgments

Built with modern web technologies for efficient farm financial management.
