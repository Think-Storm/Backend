# Adjust NODE_VERSION as desired
ARG NODE_VERSION=21.6.2
FROM node:${NODE_VERSION}-slim AS base

# Set working directory to `/app`
WORKDIR /app

# Set environment to development
ENV NODE_ENV="development"

# Throw-away build stage to reduce size of final image
FROM base AS build

# Install packages needed to build node modules
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential node-gyp openssl pkg-config python-is-python3

# Copy package files for dependency installation
COPY --link package.json package-lock.json ./
RUN npm ci --include=dev

# Copy Prisma schema for generating the Prisma client
COPY --link prisma ./prisma
RUN npx prisma generate

# Copy application code
COPY --link . ./

# Build application
RUN npm run build

# Final stage for app image
FROM base

# Install packages needed for deployment
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y openssl && \
    rm -rf /var/lib/apt/lists /var/cache/apt/archives

# Copy built application and entrypoint script
COPY --from=build /app /app
COPY test/docker/entrypoint.sh /app/entrypoint.sh

# Set permissions to make the entrypoint script executable
RUN chmod +x /app/entrypoint.sh

# Expose ports (if needed, e.g., for debugging)
EXPOSE 3000

# Entrypoint for running tests
ENTRYPOINT ["/app/entrypoint.sh"]
