#!/bin/sh

echo "== Frontend running in $RTE mode =="

if [ "$RTE" = "prod" ]; then
  echo "=== Production Mode ==="
  echo "Running build..."
  npm run build
  npm run start
else
  echo "=== Development Mode ==="
  npm run dev
fi