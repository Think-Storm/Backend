# syntax = docker/dockerfile:1

# Adjust NODE_VERSION as desired
ARG NODE_VERSION=22
FROM node:${NODE_VERSION}-slim as base

LABEL fly_launch_runtime="NestJS/Prisma"

# NestJS/Prisma app lives here
WORKDIR /app

# Set production environment
ENV NODE_ENV="production"

# Throw-away build stage to reduce size of final image
FROM base as build

# Add build argument for GitHub token
ARG CONTRACT_ACCESS_TOKEN

# Install packages needed to build node modules
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential node-gyp openssl pkg-config python-is-python3

# Create .npmrc file for GitHub Packages authentication
RUN echo "//npm.pkg.github.com/:_authToken=${CONTRACT_ACCESS_TOKEN}" > .npmrc && \
    echo "@think-storm:registry=https://npm.pkg.github.com" >> .npmrc && \
    chmod 600 .npmrc

# Install node modules
COPY --link package-lock.json package.json ./
RUN npm ci --include=dev

# Generate Prisma Client
COPY --link prisma .
RUN npx prisma generate

# Copy application code
COPY --link . .

# Dummy URL to allow the build to complete
ENV DATABASE_URL='postgresql://user:password@host:5432/ts-db'
ENV DIRECT_URL='postgresql://user:password@host:5432/ts-db'
# Build application
RUN npm run build

# Final stage for app image
FROM base

# Install packages needed for deployment
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y openssl && \
    rm -rf /var/lib/apt/lists /var/cache/apt/archives

# Copy built application
COPY --from=build /app /app

# Copy the entrypoint script from the docker folder into /app
COPY --link docker/entrypoint.sh ./entrypoint.sh

# Ensure the entrypoint has execute permission
RUN chmod +x ./entrypoint.sh

# Start the server by default, this can be overwritten at runtime
EXPOSE 3001
ENTRYPOINT ./entrypoint.sh
