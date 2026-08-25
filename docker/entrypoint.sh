#!/bin/sh
set -e

# The unit/e2e/coverage databases are created empty by docker-compose and the
# local dev database may be a fresh volume, so those still need the schema and
# reference data applied at boot. Production migrations run once per deploy
# from CI instead — re-running migrate+seed on every cold start is wasted work
# against a scale-to-zero container and a shared-CPU database.
case ${TYPE:-production} in
  "unit" | "e2e" | "coverage" | "development")
    echo "Setting up the database..."
    npx prisma migrate deploy
    npm run db:seed
    ;;
esac

# Check the TYPE environment variable
case ${TYPE:-production} in
 "unit")
   echo "Running unit tests..."
   npm run test:unit
   ;;
 "e2e")
   echo "Running e2e tests..."
   npm run test:e2e
   ;;
 "coverage")
   echo "Running coverage tests..."
   npm run test:cov
   ;;
 "production")
   echo "Starting production server..."
   npm run start:prod
   ;;
 "development")
   echo "Starting development server..."
   npm run start:dev
   ;;
 *)
   echo "Unknown TYPE: ${TYPE}"
   exit 1
   ;;
esac
