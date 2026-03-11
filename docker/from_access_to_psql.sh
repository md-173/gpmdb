#!/bin/bash

/etc/init.d/postgresql start

#psql -U postgres -c "alter user postgres with password 'x';"

#echo "localhost:5432:GD2021:postgres:x" > ~/.pgpass
echo "host    all             all             0.0.0.0/0               md5" >> /etc/postgresql/12/main/pg_hba.conf
echo "listen_addresses = '*'" >> /etc/postgresql/12/main/postgresql.conf
#chmod 0600 ~/.pgpass

#echo "importing database GD2005B"
#dropdb  GD2005B
#createdb GD2005B

#mdb-schema GD2005B.MDB postgres | psql -d GD2005B -U postgres -h localhost -p 5432 > /dev/null

#IFS=';' read -ra tables <<< $(mdb-tables -d \; GD2005B.MDB)
#the order is important
#IFS=';' read -ra tables <<< "ALTRESULT;CONTINENTS;COUNTRY;CROSSREF;FIELDTESTS;INFORMATION;JOURNAL;REFERENCE;ROCKUNIT;PMAGRESULT;SUMMARY;VERSION;Paste Errors;TERRANE;TIMESCALE;pr1;new-paleoz;new340-260poles_gondw;poles2009a;McElhinny;"
#for i in "${tables[@]}"; do
#    mdb-export -I postgres -q \' GD2005B.MDB "$i" | psql -d GD2005B -U postgres  -h localhost -p 5432 > /dev/null
#    echo "importing $i"
#done

#mdb-export -I postgres -q \' GD2005B.MDB "PMAGRESULT" | psql -d GD2005B -U mchin -h localhost -p 5433

#echo "importing database GD2020"
#dropdb GD2020
#createdb GD2020

#mdb-schema GD2020.MDB postgres | psql -d GD2020 -U postgres -h localhost -p 5432 > /dev/null

#IFS=';' read -ra tables <<< $(mdb-tables -d \; GD2020.MDB)
#the order is important
#IFS=';' read -ra tables <<< "ALTRESULT;CONTINENTS;COUNTRY;CROSSREF;FIELDTESTS;INFORMATION;JOURNAL;REFERENCE;ROCKUNIT;PMAGRESULT;SUMMARY;VERSION;Paste Errors;TERRANE;TIMESCALE;pr1;new-paleoz;new340-260poles_gondw;poles2009a;McElhinny;Character;lips_older180;Young_plumes;Yebo1;Yebo2;pallats2017;pallats2017-2;pallats2017-3;bad;pallats2017-4;pallat2017-fin;pallars2017-rocktype;sam-new;sam-new2;afr-new;ind-new;aus-new;asia-new;eur-new;ant-new;n-amer-new;gre-new;m-east-new;asia-new2;2000-1800;poles2017a;100-170;pallats2017b;pallats2017c;2016-17;poles2017b;"
#IFS=';' read -ra tables <<< "ALTRESULT;CONTINENTS;COUNTRY;CROSSREF;FIELDTESTS;INFORMATION;JOURNAL;REFERENCE;ROCKUNIT;PMAGRESULT;SUMMARY;VERSION;"
#for i in "${tables[@]}"; do
#    mdb-export -I postgres -q \' GD2020.MDB "$i" | psql -d GD2020 -U postgres  -h localhost -p 5432 > /dev/null
#    echo "importing $i"
#done

#ALTRESULT;CONTINENTS;COUNTRY;CROSSREF;FIELDTESTS;INFORMATION;JOURNAL;PMAGRESULT;REFERENCE;ROCKUNIT;TERRANE;TIMESCALE;
psql -U postgres -c "DROP DATABASE IF EXISTS GD2021;"
echo "importing database GD2021"
#dropdb GD2021
createdb GD2021

mdb-schema GD2021Clean.mdb postgres | psql -d GD2021 -U postgres > /dev/null

IFS=';' read -ra tables <<< $(mdb-tables -d \; GD2021Clean.mdb)
#the order is important
#IFS=';' read -ra tables <<< "ALTRESULT;CONTINENTS;COUNTRY;CROSSREF;FIELDTESTS;INFORMATION;JOURNAL;REFERENCE;ROCKUNIT;PMAGRESULT;SUMMARY;VERSION;Paste Errors;TERRANE;TIMESCALE;pr1;new-paleoz;new340-260poles_gondw;poles2009a;McElhinny;Character;lips_older180;Young_plumes;Yebo1;Yebo2;pallats2017;pallats2017-2;pallats2017-3;bad;pallats2017-4;pallat2017-fin;pallars2017-rocktype;sam-new;sam-new2;afr-new;ind-new;aus-new;asia-new;eur-new;ant-new;n-amer-new;gre-new;m-east-new;asia-new2;2000-1800;poles2017a;100-170;pallats2017b;pallats2017c;2016-17;poles2017b;"
#IFS=';' read -ra tables <<< "ALTRESULT;CONTINENTS;COUNTRY;CROSSREF;FIELDTESTS;INFORMATION;JOURNAL;REFERENCE;ROCKUNIT;PMAGRESULT;SUMMARY;VERSION;"
for i in "${tables[@]}"; do
    mdb-export -I postgres -q \' GD2021Clean.mdb "$i" | psql -d GD2021 -U postgres  > /dev/null
    echo "importing $i"
done

#create read-only user, the password is supposed to be public.
psql -U postgres -c "CREATE USER gpmdb WITH PASSWORD 'gpmdb';"
psql -U postgres -c "GRANT CONNECT ON DATABASE \"GD2021\" TO gpmdb;"
psql -U postgres -d GD2021 -c "GRANT USAGE ON SCHEMA public TO gpmdb;"
psql -U postgres -d GD2021 -c "GRANT SELECT ON ALL TABLES IN SCHEMA public TO gpmdb;"
psql -U postgres -c "CREATE USER gpmdbadmin WITH PASSWORD 'admin';"
psql -U postgres -c "GRANT CONNECT ON DATABASE \"GD2021\" TO gpmdbadmin;"
psql -U postgres -d GD2021 -c "GRANT USAGE ON SCHEMA public TO gpmdbadmin;"
psql -U postgres -d GD2021 -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO gpmdbadmin;"
psql -U postgres -d GD2021 -c "ALTER SCHEMA public OWNER TO gpmdbadmin;"
psql -U postgres -d GD2021 -c "CREATE EXTENSION postgis;"
psql -U postgres -d GD2021 -c "ALTER TABLE \"ROCKUNIT\" ADD COLUMN geom geometry(Point, 4326);"
psql -U postgres -d GD2021 -c "UPDATE \"ROCKUNIT\" SET geom = ST_SetSRID(ST_MakePoint(\"RLONG\", \"RLAT\"), 4326) WHERE \"RLONG\" IS NOT NULL AND \"RLAT\" IS NOT NULL;"

#Be aware, the Apache user name is www-data or apache or httpd... 
#psql -U postgres -c "CREATE USER root;"
#psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE \"GD2021\" TO root;"
#psql -U postgres -d GD2021 -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO root;"