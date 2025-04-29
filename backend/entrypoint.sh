#!/bin/sh

set -e  # Stop the script immediately if a command fails

echo "== Backend running in $RTE mode =="

# Make sure prisma client is generated
echo "== Generating Prisma Client =="
npx prisma generate

if [ "$RTE" = "prod" ]; then
  echo "=== Production Mode ==="
  npm run start
else
  echo "=== Development Mode ==="
  npm run dev
fi