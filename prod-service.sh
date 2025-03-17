#!/bin/bash

# Function to display help message
show_help() {
    echo "Usage: $0 [command]"
    echo "Commands:"
    echo "  start    Start the production environment containers"
    echo "  stop     Stop and remove the production environment containers"
    echo "  help     Display this help message"
}

# Check if an argument is provided
if [ $# -eq 0 ]; then
    show_help
    exit 1
fi

# Get the command argument
command=$1

check_image_exists() {
  if [[ "$(docker images -q thinkstorm-backend:latest 2> /dev/null)" == "" ]]; then
    echo "Building the image..."
    docker compose -f docker/docker-compose.app.yml build app
  else
    echo "Image already exists. Skipping build."
  fi
}

case $command in
    "start")
        # Launch docker-compose with both base and production configurations
        check_image_exists
        docker compose -f docker/docker-compose.db.yml -f docker/docker-compose.prod.yml up -d
        ;;
    "stop")
        # Stop and remove containers
        docker compose -f docker/docker-compose.db.yml -f docker/docker-compose.prod.yml down
        ;;
    "help")
        show_help
        ;;
    "clean")
        # Remove the Docker image
        if [[ "$(docker images -q thinkstorm-backend:latest 2> /dev/null)" != "" ]]; then
            docker rmi thinkstorm-backend:latest
            echo "Image removed successfully."
        else
            echo "Image does not exist. Nothing to remove."
        fi
        ;;
    *)
        echo "Invalid command. Use 'start', 'stop', or 'help'"
        show_help
        exit 1
        ;;
esac
