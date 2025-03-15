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

case $command in
    "start")
        # Launch docker-compose with both base and production configurations
        docker compose -f docker/docker-compose.base.yml -f docker/docker-compose.prod.yml up -d
        ;;
    "stop")
        # Stop and remove containers
        docker compose -f docker/docker-compose.base.yml -f docker/docker-compose.prod.yml down
        ;;
    "help")
        show_help
        ;;
    *)
        echo "Invalid command. Use 'start', 'stop', or 'help'"
        show_help
        exit 1
        ;;
esac
