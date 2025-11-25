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
