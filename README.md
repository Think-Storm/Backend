## Description

Main backend for the ThinkStorm project (API and DB relationships)
## Installation

```bash
npm install

# add the pre-commit hook
npm run prepare
```

## First-time running the server locally
You first need to create the db and seed it.

- You need to download [postgreSQL](https://www.postgresql.org/download) and create a database on your local setup.
- You then need to create a *.env* file with the environment variables from the *.env_example* and replace the values by the ones that apply for your local configuration.
- Finally you can run the following commands to fill your db with the schema and the seeds.

```bash
# generate the db schema up until the latest migration and generates the prisma client
npm run db:migrate

# filling the db with the seeds
npm run db:seed
```

## Running the app

```bash
# development
npm run start

# watch mode
npm run start:dev

# production mode
npm run start:prod
```

## Test

```bash
# run all tests
npm run test:full
```
Or you can run them separately:

```bash
# run unit tests
npm run test:unit

# run e2e tests
npm run test:e2e
```
