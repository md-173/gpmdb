# in the root diretory, run "docker build -t gpmdb_dev -f docker/Dockerfile ."
# SSL Currently Disabled for local dev without certs. Termination of
# HTTPS must be determined for deployment to decide on re-enabling

FROM ubuntu:20.04

RUN apt-get update

RUN apt-get update && apt-get install -y mdbtools

RUN apt-get install -y postgresql postgresql-contrib

RUN apt-get install -y postgis postgresql-12-postgis-3 postgresql-12-postgis-3-scripts


RUN apt-get install -y apache2 zip unzip
RUN apt-get install -y python3-django libapache2-mod-wsgi-py3 python3-psycopg2

RUN apt-get install -y gdal-bin libgdal-dev python3-gdal
ENV GDAL_LIBRARY_PATH=/usr/lib/libgdal.so

RUN apt-get install -y python3-pip
RUN pip3 install pmagpy
RUN pip3 install pandas

RUN apt-get install -y python3-pip python3-dev libfreetype6-dev libpng-dev pkg-config

RUN pip3 install matplotlib

RUN apt-get install -y python3-pip python3-dev \
    build-essential \
    gfortran \
    libopenblas-dev \
    liblapack-dev \
    libatlas-base-dev

RUN pip3 install scipy

RUN pip3 install mplstereonet

RUN pip3 install sphstat

RUN apt-get update && apt-get install -y \
    libproj-dev \
    proj-data \
    proj-bin \
    libgeos-dev \
    libgeos-c1v5

RUN pip3 install cartopy

RUN mkdir /work 

WORKDIR /work

ADD docker/from_access_to_psql.sh data/GD2005B.MDB docker/run.sh docker/gpmdb.wsgi /work/
ADD data/GD2020.zip /work/
ADD data/GD2021Clean.zip /work/
ADD gpmdb_django /work/

RUN unzip GD2020.zip
RUN unzip GD2021Clean.zip
RUN rm GD2020.zip
RUN rm GD2021Clean.zip
RUN rm /etc/apache2/sites-available/000-default.conf

ADD docker/000-default.conf /etc/apache2/sites-available/

# SSL DISABLED FOR LOCAL DEV WITHOUT CERTS
#ADD docker/ssl.conf /etc/apache2/sites-enabled/
#RUN mkdir /etc/apache2/ssl/
#ADD docker/*.pem /etc/apache2/ssl/

# Add Tini
ENV TINI_VERSION v0.9.0
ADD https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini /tini
RUN chmod +x /tini
ENTRYPOINT ["/tini", "--"]

EXPOSE 5432 80 443

RUN chmod 755 /work/from_access_to_psql.sh

USER postgres

RUN /work/from_access_to_psql.sh

USER root

RUN chmod 755 /work/run.sh


CMD ["/work/run.sh"]