#!/bin/bash
set -e

echo "Creating multiple databases: auth_db, study_db..."

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE auth_db;
    GRANT ALL PRIVILEGES ON DATABASE auth_db TO $POSTGRES_USER;
    
    CREATE DATABASE study_db;
    GRANT ALL PRIVILEGES ON DATABASE study_db TO $POSTGRES_USER;

    CREATE DATABASE ai_db;
    GRANT ALL PRIVILEGES ON DATABASE ai_db TO $POSTGRES_USER;
EOSQL

echo "Databases created successfully!"
