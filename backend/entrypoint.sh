#!/bin/sh

set -e  # Exit on error

echo "== Backend running in $RTE mode =="

echo "== Generating Prisma Client =="
npx prisma generate

if [ "$RTE" = "prod" ]; then
  echo "== Running Prisma Migrate =="
  npx prisma migrate deploy

  echo "== Building TypeScript =="
  npx tsc

  echo "=== Production Mode ==="
  npm start
else
  echo "=== Development Mode ==="
  npm run dev
fi