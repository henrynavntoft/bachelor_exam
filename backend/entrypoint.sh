#!/bin/sh

set -e  # Exit on error

echo "== Backend running in $RTE mode =="

echo "== Generating Prisma Client =="
npx prisma generate && npx prisma migrate deploy
# When new changes are made to the schema, run this to reset db, ELSE NEVER RUN THIS
#npx prisma migrate reset --force


if [ "$RTE" = "prod" ]; then
  echo "== Building TypeScript =="
  npx tsc

  echo "=== Production Mode ==="
  npm start
else
  echo "=== Development Mode ==="
  npm run dev &
  npx prisma studio
fi