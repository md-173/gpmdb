#!/bin/bash
set -euo pipefail

# Load env vars if .env is mounted
if [ -f /work/.env ]; then
  set -a
  . /work/.env
  set +a
fi

# Require env vars for DB users
: "${DB_USER:?missing DB_USER}"
: "${DB_PASSWORD:?missing DB_PASSWORD}"
: "${DB_ADMIN_USER:?missing DB_ADMIN_USER}"
: "${DB_ADMIN_PASSWORD:?missing DB_ADMIN_PASSWORD}"

# Start postgres and update config as root
/etc/init.d/postgresql start
echo "host    all             all             0.0.0.0/0               md5" >> /etc/postgresql/12/main/pg_hba.conf
echo "listen_addresses = '*'" >> /etc/postgresql/12/main/postgresql.conf

# Run the DB init script as postgres (peer auth)
INIT_MARKER="/work/.gpmdb_initialized"
if [ ! -f "$INIT_MARKER" ]; then
  su - postgres -c "/work/from_access_to_psql.sh"
  touch "$INIT_MARKER"
else
  echo "DB already initialized, skipping import."
fi

# Continue normal startup
exec /work/run.sh