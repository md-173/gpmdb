# Converting GPMDB to React

This guide outlines how to convert the current jQuery/Django-template frontend to React while keeping the Django backend and existing JSON APIs.

---

## 1. Strategy: Incremental vs full rewrite

**Recommended: incremental (hybrid)**

1. Keep Django serving the main HTML and auth.
2. Add a React app that loads on the main page (or a dedicated route).
3. Migrate one feature at a time: search form → results table → map → stats/charts.
4. Use Django’s existing JSON endpoints; no backend changes required for the API.

**Alternative: full SPA**

- React app is the only frontend; Django only serves API + static files.
- All pages become React routes; Django’s `index` view returns a shell HTML that loads the React bundle.

---

## 2. Project layout

Two common layouts:

**Option A – React app beside Django (recommended for incremental)**

```
gpmdb_django/
├── frontend/                 # React app (Vite)
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── api/               # API client for Django endpoints
│   │   ├── components/
│   │   ├── pages/
│   │   └── hooks/
│   └── public/
├── gpmdb/
├── gpmdb_django/
├── manage.py
└── static/
```

**Option B – React app as sole frontend**

- `frontend/` (or `client/`) is the only UI; Django only exposes API routes and serves `index.html` for `/*`.

---

## 3. Step-by-step conversion

### Phase 1: Setup (once)

1. **Create React app** (e.g. in `gpmdb_django/frontend/`):
   ```bash
   npm create vite@latest frontend -- --template react
   cd frontend && npm install
   ```

2. **API base URL**  
   In dev, React runs on Vite’s port (e.g. 5173) and Django on 5555. Use env for API base:
   - `.env.development`: `VITE_API_BASE=http://localhost:5555`
   - In production, same origin or your Django domain.

3. **Django: serve React in dev or production**
   - **Dev:** Run Django (5555) and Vite (5173); use Vite’s dev server for React, proxy API to Django if needed.
   - **Prod:** Run `npm run build`, put `frontend/dist` into Django static (or serve via nginx); one Django view returns the shell HTML that loads the React bundle.

4. **CSRF**  
   For POST requests, send Django’s CSRF token (e.g. from a cookie or a meta tag). Your API client should attach it (e.g. `X-CSRFToken` header).

### Phase 2: API layer

Your backend already returns JSON. Add a small API client in React:

- `get_query_data(params)` → `GET /get_query_data/`
- `get_stats(statsData)` → `POST /get_stats/` with `{ data: statsData }`
- `get_data()` → `GET /get_data/` (map points)
- `get_query_data_for_map(params)` → `GET /get_query_data_for_map/`
- `get_data_within_polygon(polygon)` → `GET /get_data_within_polygon/?polygon=...`

Use `fetch` or `axios`; centralize base URL and CSRF handling.

### Phase 3: State

Replace the single `gpmdbQueryResult` object with React state:

- **Option A – One context:** e.g. `QueryResultContext` holding `{ searchData, statsData }` and setters. Search/polygon handlers set this; Stats and CSV read from it.
- **Option B – Data in parent:** Top-level page component holds `searchData` and `statsData`; passes them (and setters) down to Search, Table, Map, Stats, CSV.

Either way, “query result” lives in React state instead of a global object.

### Phase 4: Components (order to migrate)

1. **Search form**  
   Form state (continent, rock type, ages, etc.) in component state or a form library; on submit call `get_query_data()`, then update query-result state. Easiest first step.

2. **Results table**  
   Replace jQuery DataTables with a React table (e.g. TanStack Table or a simple `<table>`). Data comes from query-result state (`searchData`).

3. **Map**  
   Use `react-leaflet`.  
   - Load base layer and markers from `get_data()` or `get_query_data_for_map()`.  
   - Polygon draw: use `react-leaflet` + Leaflet Draw or a small hook that captures drawn shapes and calls `get_data_within_polygon()`, then updates query-result state.  
   - Map and table share the same query-result state.

4. **Stats / charts**  
   - “Stats” button: take `statsData` from query-result state, POST to `get_stats/`, then show mean and circles.  
   - D3: use a ref to a DOM node and run D3 in `useEffect` (same as current logic, but driven by React state).  
   - Chart.js: use `react-chartjs-2` with data from state.  
   - Stereonet: keep existing library, render in a component that receives `statsData` and API response; run in `useEffect` when data changes.

5. **CSV export**  
   Button reads `searchData` from state and builds the CSV string (same logic as current `save_csv`), then triggers download.

### Phase 5: Integrate with Django

**Incremental:**  
- Keep `gpmdb.html` as the main template.  
- Add a single root div, e.g. `<div id="root"></div>`.  
- Build React app and include the bundle in the template; in `main.jsx` do `createRoot(document.getElementById('root')).render(<App />)`.  
- You can leave existing jQuery for parts you haven’t migrated yet (e.g. map or stats), and gradually move behavior into React.

**Full SPA:**  
- Django view for `"/"` (and optionally all app routes) returns a minimal HTML that only loads the React bundle and has `<div id="root"></div>`.  
- React Router handles routes; Django only serves API and this shell.

---

## 4. Key mappings (current → React)

| Current (jQuery)        | React equivalent |
|-------------------------|-------------------|
| `gpmdbQueryResult`      | React state or Context (`searchData`, `statsData`) |
| `$.ajax('/get_query_data/', ...)` | `fetch`/`axios` in a function or hook |
| `$('#stats').click(...)` | `<button onClick={showStats}>` |
| `$('#table-div').empty().append(...)` | Render `<table>` from state |
| Leaflet map in a div   | `<MapContainer>` from `react-leaflet` |
| D3 in `#chart2`        | `useRef` + `useEffect` that runs D3 when data changes |
| DataTables              | TanStack Table or custom table component |

---

## 5. Example: query result state + one API call

```jsx
// Simple state in a top-level component
const [queryResult, setQueryResult] = useState({ searchData: null, statsData: null });

// After search or polygon
const runSearch = async (params) => {
  const res = await fetch(`/get_query_data/?${new URLSearchParams(params)}`);
  const json = await res.json();
  setQueryResult({ searchData: json.data, statsData: json.stats_data });
};

// Stats button
const showStats = async () => {
  const { statsData } = queryResult;
  if (!statsData?.length) return;
  const res = await fetch('/get_stats/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
    body: JSON.stringify({ data: statsData }),
  });
  const result = await res.json();
  // set state or pass result to a Stats/Chart component
};
```

---

## 6. Checklist

- [ ] Create React app (Vite) under `frontend/` (or chosen folder).
- [ ] Add `.env` for `VITE_API_BASE` and use it in API client.
- [ ] Implement API client for `get_query_data`, `get_stats`, `get_data`, `get_query_data_for_map`, `get_data_within_polygon`.
- [ ] Add CSRF handling for POST (e.g. from cookie or meta tag).
- [ ] Introduce query-result state (or Context) and replace `gpmdbQueryResult` usage.
- [ ] Migrate search form → table → map → stats → CSV in that order.
- [ ] Wire Django to serve React (incremental: one page with `#root` + bundle; SPA: shell view + static build).
- [ ] Remove or phase out jQuery from migrated pages.

---

## 7. Running both in development

- **Django:** `python manage.py runserver 0:5555`
- **React (Vite):** `cd frontend && npm run dev` (e.g. port 5173)
- In Vite, proxy `/get_query_data/`, `/get_stats/`, etc. to `http://localhost:5555` so the React app can call Django APIs without CORS issues (or enable CORS on Django for 5173).

Example `vite.config.js` proxy:

```js
export default defineConfig({
  server: {
    proxy: {
      '/get_query_data': 'http://localhost:5555',
      '/get_stats': 'http://localhost:5555',
      '/get_data': 'http://localhost:5555',
      '/get_query_data_for_map': 'http://localhost:5555',
      '/get_data_within_polygon': 'http://localhost:5555',
      '/get_map_within_polygon': 'http://localhost:5555',
    },
  },
  // ...
});
```

Then in React use relative URLs (e.g. `fetch('/get_query_data/?...')`) so they go through the proxy to Django.
