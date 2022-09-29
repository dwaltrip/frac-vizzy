#!/bin/bash

# TODO: Specificy node version w/ .node-version (or whatever it's called)
# Do `fnm use` or whatever.

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$(dirname "$DIR")/frontend"

cd "$FRONTEND_DIR"
npm run start
