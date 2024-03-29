#!/bin/bash

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$DIR")"
DJANGO_DIR="$BACKEND_DIR/project"

cd "$BACKEND_DIR"
source "$BACKEND_DIR/venv/bin/activate"
cd "$DJANGO_DIR"

# Allow optionally passing a command, like so:
#   bash tools/venv-runner.sh do_something arg1 --arg2
${@:1}
