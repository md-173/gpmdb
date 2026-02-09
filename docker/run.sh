#!/bin/bash

service postgresql start
python3 /work/manage.py migrate

/usr/sbin/a2enmod ssl
/usr/sbin/a2enmod proxy_http

/etc/init.d/apache2 start

tail -f /var/log/apache2/error.log 