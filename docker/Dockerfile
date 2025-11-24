#in the root diretory, run "docker build -t gpmdb_dev -f docker/Dockerfile ."

FROM ubuntu:20.04

RUN apt-get update

RUN apt-get update && apt-get install -y mdbtools

RUN apt-get install -y postgresql postgresql-contrib
RUN apt-get install -y apache2 zip unzip
RUN apt-get install -y python3-django libapache2-mod-wsgi-py3 python3-psycopg2

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
ADD docker/ssl.conf /etc/apache2/sites-enabled/
RUN mkdir /etc/apache2/ssl/
ADD docker/*.pem /etc/apache2/ssl/

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

RUN cd /work/ && python3 manage.py migrate

CMD ["/work/run.sh"]
