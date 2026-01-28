# Changelog

All notable changes to the GPMDB Modernization project will be documented in this file.

## [1.0.0] - 2026-01-29

### Added
- **Frontend Application**:
  - Initialized Next.js 16 application with Tailwind CSS 4.
  - Created modern, responsive UI components (Cards, Buttons, Inputs).
  - Implemented `GpmdbMap` component using React-Leaflet for interactive data visualization.
  - Added `DataTable` component using TanStack Table for sortable, paginated results.
  - Added data visualization charts: `AgeHistogram`, `PolePlot`, `ContinentPieChart` using Recharts.
  - Created pages: Homepage (Stats & Map), Search (Advanced filters & Results), Contribute (Data submission).
  - Added `Skeleton` loading states and `ErrorBoundary` for robust error handling.
  - Configured SEO meta tags.

- **Backend API**:
  - Added `api_views.py` with REST endpoints:
    - `GET /api/stats/`: Database statistics.
    - `GET /api/search/`: Advanced search with filtering.
    - `GET /api/references/`, `/api/continents/`, `/api/rocktypes/`: Metadata endpoints.
    - `POST /api/contribution/`: Data contribution endpoint.
  - Added `middleware.py` for Custom CORS handling (Django 2.2 compatible).
  - Updated `urls.py` to include `/api/` routes.

- **Deployment**:
  - Created `frontend/Dockerfile` for production build (multi-stage).
  - Created `docker-compose.prod.yml` for unified deployment of Django backend and Next.js frontend.
  - Updated `docker-compose.yml` for development.

### Changed
- **Django Settings**:
  - Updated `settings.py` to include `gpmdb.middleware.CorsMiddleware`.
  - Configured `CORS_ALLOWED_ORIGINS` for frontend communication.
- **Documentation**:
  - Updated `.agent/workflows/modernization-plan.md` with completed phases.

### Fixed
- Resolved dependency conflicts with Django REST Framework by implementing lightweight, native Django JSON views compatible with the existing Docker environment (Django 2.2).
