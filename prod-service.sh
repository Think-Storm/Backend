#!/bin/bash

# Function to display help message
show_help() {
    echo "Usage: $0 [command]"
    echo "Commands:"
    echo "  start [env]    Start the containers (env: dev|prod, default: production)"
    echo "  stop          Stop and remove the production environment containers"
    echo "  help          Display this help message"
    echo "  clean         Remove the Docker image"
}

# Check if an argument is provided
if [ $# -eq 0 ]; then
    show_help
    exit 1
fi

# Get the command argument
command=$1

check_image_exists() {
  local env_type=$1
  local image_name="thinkstorm-backend-$env_type"
  if [[ "$(docker images -q $image_name:latest 2> /dev/null)" == "" ]]; then
    echo "Building the image..."
    docker compose -f docker/docker-compose.app.yml build app-$env_type
  else
    echo "Image already exists. Skipping build."
  fi
}

case $command in
    "start")
        # Get the environment type (default to production)
        env_type=${2:-prod}
        
        # Launch docker-compose with base and environment-specific configurations
        check_image_exists $env_type
        case $env_type in
            "dev")
                docker compose -f docker/docker-compose.db.yml -f docker/docker-compose.dev.yml up -d
                ;;
            "prod")
                docker compose -f docker/docker-compose.db.yml -f docker/docker-compose.prod.yml up -d
                ;;
            *)
                echo "Invalid environment type. Use 'development' or 'production'"
                exit 1
                ;;
        esac
        ;;
    "stop")
        # Stop and remove containers
        docker compose -f docker/docker-compose.db.yml -f docker/docker-compose.prod.yml down
        ;;
    "help")
        show_help
        ;;
    "clean")
        # Remove both dev and prod Docker images if they exist
        if [[ "$(docker images -q thinkstorm-backend-dev:latest 2> /dev/null)" != "" ]]; then
            docker rmi thinkstorm-backend-dev:latest
            echo "Dev image removed successfully."
        else
            echo "Dev image does not exist. Nothing to remove."
        fi

        if [[ "$(docker images -q thinkstorm-backend-prod:latest 2> /dev/null)" != "" ]]; then
            docker rmi thinkstorm-backend-prod:latest
            echo "Prod image removed successfully."
        else
            echo "Prod image does not exist. Nothing to remove."
        fi
        ;;
    *)
        echo "Invalid command. Use 'start', 'stop', or 'help'"
        show_help
        exit 1
        ;;
esac
