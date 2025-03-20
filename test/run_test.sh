#!/bin/bash

# Check if the Docker daemon is running
if ! docker info > /dev/null 2>&1; then
  echo "Docker daemon is not running. Please start Docker and try again."
  exit 1
fi

echo "Docker daemon is running. Proceeding with the script..."
# Continue with the rest of your script here

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEST_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export COMPOSE_FILE=${ROOT_DIR}/docker/docker-compose.db.yml
export COMPOSE_FILE=${COMPOSE_FILE}:${ROOT_DIR}/docker/docker-compose.app.yml
# Display help message
show_help() {
  echo "Usage: ./run_tests.sh [OPTIONS] [SERVICE...]"
  echo
  echo "Options:"
  echo "  -h, --help, help     Show this help message and exit"
  echo
  echo "Services:"
  echo "  unit           Run unit tests only"
  echo "  e2e            Run end-to-end tests only"
  echo "  cov            Run coverage tests only"
  echo "  (no argument)  Run all tests (unit, e2e, and coverage) in parallel"
  echo
  echo "Examples:"
  echo "  ./run_tests.sh           # Builds the image if needed and runs all tests"
  echo "  ./run_tests.sh unit       # Builds the image if needed and runs unit tests only"
  echo "  ./run_tests.sh e2e        # Builds the image if needed and runs e2e tests only"
  echo "  ./run_tests.sh coverage   # Builds the image if needed and runs coverage tests only"
}

# Check if the image already exists
check_image_exists() {
  if [[ "$(docker images -q thinkstorm-backend:latest 2> /dev/null)" == "" ]]; then
    echo "Building the image..."
    docker-compose build app
  else
    echo "Image already exists. Skipping build."
  fi
}

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help|help)
        show_help      
        exit 1
        ;;
        e2e|unit|cov)
        TEST_SERVICES+=("$1") # save positional arg
        shift # past argument
        ;;
        -*|--*|*)
        echo "Unknown option $1"
        show_help
        exit 1
        ;;
    esac
done
if [ -z "${TEST_SERVICES}" ]; then
    TEST_SERVICES+=("unit")
    TEST_SERVICES+=("cov")
    TEST_SERVICES+=("e2e")
fi
# Build the image if it doesn't already exist
check_image_exists

export COMPOSE_FILE=${COMPOSE_FILE}:docker/docker-compose.test.yml
# Run the specified services without aborting on exit
docker compose up ${TEST_SERVICES[@]} -d --force-recreate \
  --user node \
  --security-opt no-new-privileges \
  --read-only \
  --cpus 1 \
  --memory 512m \
  --memory-swap 512m \
  --ulimit nofile=1024:1024 \
  --ulimit nproc=100:100
# Capture logs for each service in separate files
mkdir -p "${TEST_DIR}"/logs
docker compose logs unit -f -t --no-color --no-log-prefix > "${TEST_DIR}"/logs/unit.log &
docker compose logs e2e -f -t --no-color --no-log-prefix > "${TEST_DIR}"/logs/e2e.log &
docker compose logs cov -f -t --no-color --no-log-prefix > "${TEST_DIR}"/logs/cov.log &
docker compose logs postgres_db -f -t --no-color --no-log-prefix > "${TEST_DIR}"/logs/postgres_db.log &
docker compose logs redis_db -f -t --no-color --no-log-prefix > "${TEST_DIR}"/logs/redis_db.log &
docker compose wait ${TEST_SERVICES[@]} > /dev/null 2>&1
for service in "${TEST_SERVICES[@]}"; do
  exit_code=$(docker compose ps -q $service | xargs docker inspect $service -f '{{.State.ExitCode}}')
    # Inform the user about the status
  if [ "$exit_code" -eq 0 ]; then
    echo "$service completed successfully."
  else
    echo "$service failed with exit code $exit_code."
  fi
  echo "You can watch the log of test in the ${TEST_DIR}/logs/$service.log file"
done
docker compose down

exit 0