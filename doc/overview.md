## Overview

This is a typical simple web application built upon DJango web framework. You need knowledge of HTML, CSS, Python and SQL to work on this project. You also need to know Apache server and Docker. You also need to know how to use Google to find answers.

Everything has been encapsulated in a Docker container for easier deployment.

### Data Flow

- User sends Https requests via HTML page
- Apache server recieves Http requests.
- Apache server invokes Python code.
- Python code sends DB query to PostgreSQL
- PostgreSQL returns data
- Python code sends back data via Apache server
- HTML page renders data

### Components

- Apache server
- Django web framework
- PostgreSQL database

### Files

#### HTML

HTML files are in https://bitbucket.org/EDRG/gpmdb/src/master/gpmdb_django/gpmdb/templates/

#### Python

Most of the Python code is in https://bitbucket.org/EDRG/gpmdb/src/master/gpmdb_django/gpmdb/views.py

### Tables

- ALTRESULT
- CONTINENTS
- COUNTRY
- CROSSREF
- FIELDTESTS
- INFORMATION
- JOURNAL
- PMAGRESULT
- REFERENCE
- ROCKUNIT
- TERRANE
- TIMESCALE
- RELIABILITY
