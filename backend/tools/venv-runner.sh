#!/bin/bash

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$DIR")"
DJANGO_DIR="$ROOT_DIR/project"

cd "$ROOT_DIR"
source "$ROOT_DIR/venv/bin/activate"
cd "$DJANGO_DIR"

# Allow optionally passing a command, like so:
#   bash tools/venv-runner.sh do_something arg1 --arg2
${@:1}
