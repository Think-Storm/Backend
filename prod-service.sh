#!/bin/bash

# Function to display help message
show_help() {
    echo "Usage: $0 [command] [env] [options]"
    echo "Commands:"
    echo "  start [env]    Start the containers (env: dev|prod, default: production)"
    echo "  stop [env]     Stop and remove the containers (env: dev|prod, default: production)"
    echo "  help          Display this help message"
    echo "  clean         Remove the Docker image"
    echo "Options:"
    echo "  --port PORT   Specify the host port to use (default: 3000)"
}

# Check if an argument is provided
if [ $# -eq 0 ]; then
    show_help
    exit 1
fi

# Get the command argument
command=$1

# Default values
env_type="prod"
host_port="3000"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        start|stop)
            command=$1
            shift
            if [[ $# -gt 0 && $1 != --* ]]; then
                env_type=$1
                shift
            fi
            ;;
        --port)
            shift
            if [[ $# -gt 0 ]]; then
                host_port=$1
                shift
            else
                echo "Error: --port requires a value"
                exit 1
            fi
            ;;
        help|clean)
            command=$1
            shift
            ;;
        *)
            shift
            ;;
    esac
done

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
        # Launch docker-compose with base and environment-specific configurations
        check_image_exists $env_type
        case $env_type in
            "dev")
                HOST_PORT=$host_port docker compose -f docker/docker-compose.db.yml -f docker/docker-compose.dev.yml up -d
                ;;
            "prod")
                HOST_PORT=$host_port docker compose -f docker/docker-compose.db.yml -f docker/docker-compose.prod.yml up -d
                ;;
            *)
                echo "Invalid environment type. Use 'dev' or 'prod'"
                exit 1
                ;;
        esac
        ;;
    "stop")
        # Stop and remove containers based on environment
        case $env_type in
            "dev")
                docker compose -f docker/docker-compose.db.yml -f docker/docker-compose.dev.yml down
                ;;
            "prod")
                docker compose -f docker/docker-compose.db.yml -f docker/docker-compose.prod.yml down
                ;;
            *)
                echo "Invalid environment type. Use 'dev' or 'prod'"
                exit 1
                ;;
        esac
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
