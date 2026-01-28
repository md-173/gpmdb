---
description: GPMDB Frontend Modernization - Django + Next.js + Tailwind CSS Architecture
---

# GPMDB Frontend Modernization Plan

**Created:** 2026-01-28
**Last Updated:** 2026-01-28
**Status:** Phase 1 - COMPLETE ✅

## Overview

Modernize the GPMDB (Global Paleomagnetic Database) website from Bootstrap + jQuery to a modern Next.js + Tailwind CSS architecture while keeping the Django backend for API services.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Users / Browsers                      │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│              Next.js Frontend (React + Tailwind)         │
│  Location: /gpmdb/frontend                               │
│  Port: 3000 (dev)                                        │
└─────────────────────────┬───────────────────────────────┘
                          │ REST API calls
┌─────────────────────────▼───────────────────────────────┐
│              Django Backend (API Only)                   │
│  Location: /gpmdb/gpmdb_django                          │
│  Port: 8000                                              │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                 SQLite/PostgreSQL Database               │
└─────────────────────────────────────────────────────────┘
```

## Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Frontend Framework | Next.js | 16.x |
| UI Library | React | 19.x |
| Styling | Tailwind CSS | 4.x |
| Animations | Framer Motion | 11.x |
| Icons | Lucide React | - |
| Maps | React-Leaflet | 5.x |
| Data Tables | TanStack Table | 8.x |
| Charts | Recharts | 2.x |
| HTTP Client | Axios | - |
| Backend | Django + DRF | existing |

---

## Phase 1: Setup & Core Pages ✅ COMPLETE

### Checklist:
- [x] Create Next.js project in `/gpmdb/frontend`
- [x] Configure Tailwind CSS v4
- [x] Create design system (colors, typography, spacing)
- [x] Build layout components (Header, Footer, Navigation)
- [x] Create stunning homepage with:
  - [x] Hero section with animated compass
  - [x] Stats display (poles, rock units, references)
  - [x] Feature cards (Search, Tools, Resources)
  - [x] Welcome section
  - [x] News section
  - [x] Footer with metadata link
- [x] Create Search page with full filter form
- [x] Create About page with history and team
- [x] Add responsive design
- [x] Implement dark mode (default dark theme)
- [x] Add Framer Motion animations

### Files Created:
```
frontend/
├── src/
│   ├── app/
│   │   ├── globals.css          # Design system with CSS variables
│   │   ├── layout.tsx           # Root layout with Header/Footer
│   │   ├── page.tsx             # Homepage
│   │   ├── search/page.tsx      # Search page with filters
│   │   └── about/page.tsx       # About page
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx       # Responsive header with nav
│   │   │   ├── Footer.tsx       # Footer with links
│   │   │   └── index.ts
│   │   └── ui/
│   │       ├── Button.tsx       # Reusable button component
│   │       ├── Card.tsx         # Card components
│   │       └── index.ts
│   └── lib/
│       └── api.ts               # API client (placeholder)
└── package.json
```

### To Run:
```bash
cd /Users/282488j/Dropbox/Code/GPMDB_code/gpmdb/frontend
npm run dev
# Visit http://localhost:3000
```

---

## Phase 2: API Integration ⬅️ NEXT

### Checklist:
- [ ] Install Django REST Framework in Django backend
- [ ] Create API endpoints:
  - [ ] `GET /api/stats/` - Database statistics
  - [ ] `GET /api/poles/` - Paleomagnetic poles (with filtering)
  - [ ] `GET /api/rockunits/` - Rock units
  - [ ] `GET /api/references/` - References/studies
  - [ ] `POST /api/search/` - Advanced search
  - [ ] `POST /api/contributions/` - Data contributions
- [ ] Set up CORS for frontend access
- [ ] Create API documentation
- [ ] Connect Next.js to Django APIs
- [ ] Update frontend components to fetch real data

### Django REST Framework Setup:
```bash
cd /Users/282488j/Dropbox/Code/GPMDB_code/gpmdb/gpmdb_django
pip install djangorestframework django-cors-headers

# Add to settings.py:
# INSTALLED_APPS += ['rest_framework', 'corsheaders']
# MIDDLEWARE.insert(0, 'corsheaders.middleware.CorsMiddleware')
# CORS_ALLOWED_ORIGINS = ['http://localhost:3000']
```

---

## Phase 3: Feature Parity

### Checklist:
- [ ] Search functionality:
  - [x] Search page with all filter options (UI complete)
  - [ ] Connect to API for actual search
  - [ ] Results display with data table
- [ ] Results display:
  - [ ] Interactive data table with sorting/pagination
  - [ ] CSV export functionality
  - [ ] Statistics calculation
- [ ] Map integration:
  - [ ] React-Leaflet map component
  - [ ] Projection selector
  - [ ] Drawing tools for area selection
  - [ ] Data point markers
- [ ] Visualizations:
  - [ ] Stereonet plot
  - [ ] World map with D3
  - [ ] Age distribution charts
- [ ] Data contribution form
- [ ] User authentication (if needed)

---

## Phase 4: Polish & Deploy

### Checklist:
- [ ] Add loading states and skeletons
- [ ] Implement error boundaries
- [x] Add micro-animations (Framer Motion) - done in Phase 1
- [ ] Performance optimization:
  - [ ] Image optimization
  - [ ] Code splitting
  - [ ] Caching strategies
- [x] SEO optimization (basic meta tags added)
- [ ] Update Docker configuration:
  - [ ] Frontend Dockerfile
  - [ ] docker-compose for both services
- [ ] Testing
- [ ] Production deployment

---

## File Structure (Frontend)

```
frontend/
├── src/
│   ├── app/
│   │   ├── globals.css         # Design system
│   │   ├── layout.tsx          # Root layout with header/footer
│   │   ├── page.tsx            # Homepage
│   │   ├── search/
│   │   │   └── page.tsx        # Search page
│   │   ├── about/
│   │   │   └── page.tsx        # About page
│   │   └── contribute/
│   │       └── page.tsx        # Data contribution (TODO)
│   ├── components/
│   │   ├── ui/                 # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   └── index.ts
│   │   ├── layout/             # Header, Footer, Nav
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── index.ts
│   │   ├── map/                # Map components (TODO)
│   │   ├── charts/             # Visualization components (TODO)
│   │   └── forms/              # Form components (TODO)
│   └── lib/
│       └── api.ts              # API client
├── public/
│   └── images/                 # Static images
├── package.json
├── next.config.ts
└── tsconfig.json
```

---

## Design Tokens (Implemented)

### Colors (Dark Theme)
```css
--background: #030712
--background-secondary: #0f172a
--foreground: #f8fafc
--primary: #1e40af (dark) / #3b82f6 (light)
--primary-light: #3b82f6
--accent: #d97706 (amber)
--card: #0f172a
--border: #1e293b
```

### Typography
- Font: Geist Sans (system)
- Monospace: Geist Mono

---

## Resume Instructions

To resume this project:

1. Check current phase status above
2. Navigate to project: `cd /Users/282488j/Dropbox/Code/GPMDB_code/gpmdb`
3. Start frontend: `cd frontend && npm run dev`
4. Start Django (if needed): `cd gpmdb_django && python manage.py runserver`
5. Visit http://localhost:3000 for frontend
6. Continue with unchecked items in current phase

---

## Notes

- Keep Django templates as fallback during migration
- Test API endpoints with Postman/Thunder Client before frontend integration
- Use environment variables for API URLs (dev vs prod)
- The frontend uses Framer Motion for smooth animations
- All components are TypeScript with proper types
