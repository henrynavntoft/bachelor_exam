#!/bin/sh

echo "== Frontend running in $RTE mode =="

if [ "$RTE" = "prod" ]; then
  echo "=== Production Mode ==="
  npm run start
else
  echo "=== Development Mode ==="
  npm run dev
fi