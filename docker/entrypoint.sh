#!/bin/sh
set -e

# Database setup
echo "Setting up the database..."
npx prisma migrate deploy
npm run db:seed

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
    echo "Unknown TYPE: ${TEST_TYPE}"
    exit 1
    ;;
esac