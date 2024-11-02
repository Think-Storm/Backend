#!/bin/bash

# entrypoint.sh

set -e

# Database setup
echo "Setting up the database..."
npx prisma migrate dev
npm run db:seed

# Function to run tests
run_tests() {
    local test_type=$1

    case $test_type in
        unit)
            echo "Running unit tests..."
            npm run test:unit
            ;;
        e2e)
            echo "Running e2e tests..."
            npm run test:e2e
            ;;
        coverage)
            echo "Running coverage tests..."
            npm run test:cov
            ;;
        *)
            echo "Invalid test type specified: $test_type"
            echo "Valid options are: unit, e2e, coverage"
            exit 1
            ;;
    esac
}

# Run the tests based on TEST_TYPE
run_tests "$TEST_TYPE"
