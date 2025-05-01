#!/bin/sh

echo "== Frontend running in $RTE mode =="

if [ "$RTE" = "prod" ]; then
  echo "=== Production Mode ==="
  if [ ! -d ".next" ]; then
    echo "No .next folder found, running build..."
    npm run build
  else
    echo ".next folder exists, skipping build."
  fi
  npm run start
else
  echo "=== Development Mode ==="
  npm run dev
fi