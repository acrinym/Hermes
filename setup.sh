#!/bin/sh
set -e

cd "$(dirname "$0")"

for dir in server hermes-extension; do
  if [ -f "$dir/package.json" ]; then
    echo "Installing dependencies for $dir..."
    (cd "$dir" && npm install --silent)
  fi
done

echo "Dependencies installed. You can now run 'npm test' inside 'server/' or 'hermes-extension/'."
