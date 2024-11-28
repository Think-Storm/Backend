#!/bin/sh

NODE_ENV=production
npx prisma migrate deploy
npm run start:prod