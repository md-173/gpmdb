#### Website URL

https://gpmdb.net/

#### How to use this container:

**Step 1:** run the container `docker run -d -p 7777:80 --restart always edrg/gpmdb`

**Step 2:** open http://127.0.0.1:7777 i n a web browser

The container takes a few seconds to start, be patient.

#### Additional info:

The container exposes two ports 80 and 5432. One for http and the other for postgres database.

To run the container in interactive mode: `docker run -it --rm -p 7777:80 edrg/gpmdb`

#### Use the postgres database directly:

`docker run -d -p 5432:5432 --restart always edrg/gpmdb`

`psql -U gpmdb -d GD2021 -h localhost -p 5432`

The read-only password is gpmdb.

The client tool pgAdmin is highly recommended https://www.pgadmin.org

#### To build the container:

In the root diretory, run `docker build -t edrg/gpmdb . -f docker/Dockerfile`

#### Files:

* 000-default.conf  -- apache configuration file
* Dockerfile -- docker file 
* from_access_to_psql.sh -- script to convert access database to postgres  
* GD2005B.MDB -- access database
* gpmdb_django -- DJango project for the web interface
* gpmdb.wsgi  -- wsgi script 
* run.sh -- start up script

#### Development
* Step 1: go to source code folder "gpmdb/gpmdb_django"
* Step 2: run ``docker run -it -v `pwd`:/my_dev -p 5555:5555 edrg/gpmdb /bin/bash``
* Step 3: run `/etc/init.d/postgresql start`do
* Step 4: **go to /my_dev** and change DEBUG to True in **gpmdb_django/settings.py**
* Step 5: run `python3 manage.py runserver 0:5555`
* Step 6: happy debugging
*

#### The deploy machine is instance i-033fb6009caa86875 (GPMDB) on AWS.



run `docker run -d -p 80:80 -p 443:443 -p 5432:5432 --restart always edrg/gpmdb`

Contact:

michael.chin@sydney.edu.au


#### How to get data from tables

* list all table names http://localhost:5555/tables

["ALTRESULT", "CONTINENTS", "COUNTRY", "CROSSREF", "FIELDTESTS", "INFORMATION", 
"JOURNAL", "PMAGRESULT", "REFERENCE", "ROCKUNIT", "TERRANE", "TIMESCALE", "RELIABILITY"]

* http://localhost:5555/table?name=ALTRESULT
* http://localhost:5555/get_table_data?table=ALTRESULT
* http://localhost:5555/get_table_data?table=ALTRESULT&fmt=csv

#### How to update database

* Copy GD2021Clean.zip to **data** folder and commit the file to git repository if you would like
* Run `docker build -t edrg/gpmdb . -f docker/Dockerfile` in the repository root folder
* Run `docker push edrg/gpmdb`
* Go to paleoweb01p.curtin.edu.au
* Run `docker pull edrg/gpmdb`
* Stop the running docker container `docker ps` & `docker stop ${CONTAINER ID}`
* Run `docker run -d -p 80:80 -p 443:443 -p 5432:5432 --restart always edrg/gpmdb`
* Check the updates at http://paleoweb01p.curtin.edu.au

# GPMDB API Local Test Guide

## 1) Build and run the API in Docker

From repo root:

docker build -t gpmdb -f docker/Dockerfile .

docker run -d -p 7777:80 --restart always gpmdb

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



## Environment Setup
## This project uses a `.env` file to manage secrets and configuration.
**Step 1:** Copy the example env file:
cp .env.example .env
On Windows:
copy .env.example .env
**Step 2:** Open `.env` and fill in the values:
DJANGO_SECRET_KEY=<your-secret-key>
DB_NAME=GD2021
DB_USER=gpmdb
DB_PASSWORD=<your-db-password>
DB_ADMIN_USER=gpmdbadmin
DB_ADMIN_PASSWORD=<your-admin-password>
DB_HOST=127.0.0.1
DB_PORT=5432

To generate a Django secret key:
python3 -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
**Important:** Never commit `.env` — it contains secrets. Only `.env.example` should be in version control.

## Build and Run
**Step 1:** Build the Docker image (from the repo root):
docker build -t gpmdb . -f docker/Dockerfile
**Step 2:** Start the container:
docker compose up -d
**Step 3:** Open in a browser:
http://127.0.0.1:7777
The container takes a minute to start on first run (database import). Subsequent restarts are faster.To stop:
docker compose down
To rebuild after code changes:
docker build -t gpmdb . -f docker/Dockerfile
docker compose up -d