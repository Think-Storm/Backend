#!/bin/sh

NODE_ENV=production
npx prisma migrate deploy
npm run db:seed
npm run start:prod