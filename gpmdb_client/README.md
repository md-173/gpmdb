# GPMDB

Python client for the [Global Paleomagnetic Database](https://gpmdb.net).

## Installation

pip install gpmdb

## Quick Start

import gpmdb

# Query Australian intrusives from 150-450 Ma
df = gpmdb.get_data(
    CONTINENT="Australia",
    AGE_MIN=150,
    AGE_MAX=450,
    ROCKTYPE="intrusives"
)

print(df.head())

## Available Filters

| Filter | Type | Description |
|--------|------|-------------|
| `CONTINENT` | str | Continent name |
| `ROCKTYPE` | str | Rock type |
| `AGE_MIN`, `AGE_MAX` | float | Rock age in Ma |
| `QSUM_MIN` | float | Minimum quality score |
| `AUTHORS` | str | Author name |

See `help(gpmdb.get_data)` for all options.

## License

MIT

# GPMDB API Local Test Guide

## 1) Build and run the API in Docker

From repo root:

docker build -t gpmdb -f docker/Dockerfile .docker run -d -p 7777:80 --restart always gpmdb

Confirm online:
http://127.0.0.1:7777/api/v1/metadata/

## 2) Install the Python client (editable)

From C:\Dev\gpmd\merged\gpmdb_client:

python -m pip install -e .

## 3) Create a test file (test.py)

Create C:\Dev\gpmd\merged\gpmdb_client\test.py with following or custom tests using query parameters below:

import gpmdb

### Point to local API
gpmdb.set_base_url("http://127.0.0.1:7777")

print(gpmdb.get_metadata())

### Simple query
df = gpmdb.get_data(limit=5

print(df)

### Query with filters
df = gpmdb.get_data(CONTINENT="Australia", AGE_MIN=100, AGE_MAX=200, limit=10)

print(df)

print(f"Got {len(df)} results")

### Run it:

python C:\Dev\gpmd\merged\gpmdb_client\test.py

## 4) Searchable query parameters
These map directly to /api/v1/query/ params:

### Location Filters
CONTINENT
LAT_MIN, LAT_MAX
LON_MIN, LON_MAX

### Rock Property Filters
ROCKTYPE
ROCKNAME

### Age Filters
AGE_MIN, AGE_MAX
MAGAGE_MIN, MAGAGE_MAX

### Paleomagnetic Data Filters
DEC_MIN, DEC_MAX
INC_MIN, INC_MAX
PLAT_MIN, PLAT_MAX
PLON_MIN, PLON_MAX
K_MIN, K_MAX
A95_MIN, A95_MAX
DP_MIN, DP_MAX
DM_MIN, DM_MAX

### Quality Filters
QSUM_MIN
RSUM_MIN

###Reference Filters
REFNO
RESULTNO
YEAR_MIN, YEAR_MAX
AUTHORS
JOURNAL

###Pagination
limit
offset