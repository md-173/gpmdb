# Changelog

All notable changes to the GPMDB project will be documented in this file.

## [2.0.0] - 2026-01-28

### Added - Next.js Frontend (Phase 1)

This release introduces a modern React-based frontend using Next.js and Tailwind CSS, 
while preserving the original visual design and styling.

#### New Frontend Structure (`/frontend`)
- **Next.js 16** with App Router for modern React architecture
- **Tailwind CSS 4** for utility-first styling
- **TypeScript** for type-safe development

#### Pages Created
- `src/app/page.tsx` - Homepage with stats sidebar, map placeholder, welcome/news sections
- `src/app/search/page.tsx` - Full search form with all original filter options
- `src/app/about/page.tsx` - About page with history, team, and citation info

#### Components Created
- `src/components/layout/Header.tsx` - Responsive header with dark navbar
- `src/components/layout/Footer.tsx` - Simple footer matching original design
- `src/components/ui/Button.tsx` - Reusable button component with variants
- `src/components/ui/Card.tsx` - Card and SectionHeader components

#### Styling
- `src/app/globals.css` - Design system matching original custom.css
  - Light theme with subtle grid background
  - JetBrains Mono font
  - Coral (#cc7a60) accent color
  - Clean, minimal aesthetic

#### API Layer
- `src/lib/api.ts` - API client prepared for Django REST Framework integration

#### Dependencies Added
- react-leaflet, leaflet - For interactive maps (Phase 2)
- @tanstack/react-table - For data tables (Phase 3)
- recharts - For charts (Phase 3)
- axios - For API calls
- lucide-react - For icons
- framer-motion - For subtle animations (simplified)

### Added - Workflow Documentation
- `.agent/workflows/modernization-plan.md` - Complete 4-phase implementation plan

### Preserved
- All original Django templates remain functional
- Original custom.css styling preserved
- Database and backend unchanged

### Technical Notes
- Frontend runs on port 3000: `cd frontend && npm run dev`
- Django backend continues on port 8000
- Phase 2 will connect frontend to Django via REST API
