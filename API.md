# GPMDB API Documentation

This API provides access to the Global Paleomagnetic Database (GPMDB). It is served by the Django backend.

**Base URL:** `http://localhost:8000/api` (Development) / `http://localhost:8080/api` (Docker)

## Endpoints

### 1. Database Statistics
Get summary statistics of the database content.

- **URL:** `/stats/`
- **Method:** `GET`
- **Response:**
  ```json
  {
    "poles": 10254,
    "rockUnits": 8472,
    "references": 4331
  }
  ```

### 2. Search Data
Search for paleomagnetic results with various filters.

- **URL:** `/search/`
- **Method:** `GET`
- **Query Parameters:**
  - `continent` (string): Filter by continent name
  - `rocktype` (string): Filter by rock type
  - `rockage-min` / `rockage-max` (number): Rock unit age range (Ma)
  - `magage-min` / `magage-max` (number): Magnetization age range (Ma)
  - `rockname` (string): Partial match on rock unit name
  - `refno` (number): Exact match on Reference ID
  - `resultno` (number): Exact match on Result ID
  - `lat-min` / `lat-max` (number): Latitude range
  - `lon-min` / `lon-max` (number): Longitude range
  - `qsum-min` (number): Minimum QSUM quality factor
  - `rsum-min` (number): Minimum RSUM quality factor
  - `k-min` / `k-max` (number): Precision parameter K range
  - `a95-max` (number): Maximum A95 confidence circle
  - `b-min` (number): Minimum B value
  - `n-min` (number): Minimum N (number of samples)

- **Response:**
  ```json
  {
    "columns": ["REFNO", "RESULTNO", "ROCKNAME", ...],
    "data": [
      {
        "refNo": 123,
        "resultNo": 456,
        "rockName": "Example Rock",
        "continent": "Africa",
        "sLat": -25.5,
        "sLon": 130.2,
        ...
      }
    ],
    "count": 1
  }
  ```

### 3. Metadata: Continents
Get a list of all available continents in the database.

- **URL:** `/continents/`
- **Method:** `GET`
- **Response:**
  ```json
  {
    "continents": ["Africa", "Antarctica", "Asia", ...]
  }
  ```

### 4. Metadata: Rock Types
Get a list of all available rock types.

- **URL:** `/rocktypes/`
- **Method:** `GET`
- **Response:**
  ```json
  {
    "rockTypes": ["Basalt", "Granite", "Limestone", ...]
  }
  ```

### 5. References
Get a list of bibliographic references.

- **URL:** `/references/`
- **Method:** `GET`
- **Query Parameters:**
  - `limit` (number): Number of results (default: 100)
  - `offset` (number): Pagination offset (default: 0)
  - `year` (number): Filter by publication year
  - `author` (string): Filter by author name
- **Response:**
  ```json
  {
    "data": [
      {
        "refNo": 1,
        "authors": "Smith et al.",
        "year": 2020,
        "title": "Paleomagnetism of...",
        "journal": "JGR"
      }
    ],
    "count": 100
  }
  ```

### 6. Submit Contribution
Submit new data for inclusion in the database.

- **URL:** `/contribution/`
- **Method:** `POST`
- **Body:**
  ```json
  {
    "doi": "https://doi.org/10.1016/...",
    "email": "user@example.com",
    "lat": -30.5,      // optional
    "lon": 140.2,      // optional
    "age": 500,        // optional
    "comments": "..."  // optional
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Contribution submitted successfully..."
  }
  ```
