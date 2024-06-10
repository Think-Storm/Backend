FROM node:21.7.3-alpine3.20

# Environment information
ARG NODE_ENV

# Create and set the working directory
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN if [ "$NODE_ENV" = "prod" ]; then npm install --production; else npm install; fi

# Copy the rest of the application code to the working directory
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
RUN if [ "$NODE_ENV" = "prod" ]; then npm start; fi