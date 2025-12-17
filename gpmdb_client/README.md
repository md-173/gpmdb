# GPMDB

Python client for the [Global Paleomagnetic Database](https://gpmdb.net).

## Installation

pip install gpmdb## Quick Start

import gpmdb

# Query Australian intrusives from 150-450 Ma
df = gpmdb.get_data(
    CONTINENT="Australia",
    AGE_MIN=150,
    AGE_MAX=450,
    ROCKTYPE="intrusives"
)

print(df.head())## Available Filters

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