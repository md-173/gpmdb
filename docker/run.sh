#!/bin/bash

/usr/sbin/a2enmod ssl
/usr/sbin/a2enmod proxy_http

/etc/init.d/postgresql start
/etc/init.d/apache2 start

tail -f /var/log/apache2/error.log 

#/bin/bash
