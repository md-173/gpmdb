#!/bin/bash
/etc/init.d/postgresql start

psql -c "DROP DATABASE IF EXISTS GD2021;"
createdb GD2021

mdb-schema GD2021Clean.mdb postgres | psql -d GD2021 > /dev/null

IFS=';' read -ra tables <<< $(mdb-tables -d \; GD2021Clean.mdb)
for i in "${tables[@]}"; do
    mdb-export -I postgres -q \' GD2021Clean.mdb "$i" | psql -d GD2021 > /dev/null
    echo "importing $i"
done

psql -d GD2021 -c "CREATE EXTENSION postgis;"
psql -d GD2021 -c "ALTER TABLE \"ROCKUNIT\" ADD COLUMN geom geometry(Point, 4326);"
psql -d GD2021 -c "UPDATE \"ROCKUNIT\" SET geom = ST_SetSRID(ST_MakePoint(\"RLONG\", \"RLAT\"), 4326) WHERE \"RLONG\" IS NOT NULL AND \"RLAT\" IS NOT NULL;"

/etc/init.d/postgresql stop