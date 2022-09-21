#!/bin/bash

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$DIR")"
DJANGO_DIR="$BACKEND_DIR/project"

cd "$BACKEND_DIR"
source "$BACKEND_DIR/venv/bin/activate"
cd "$DJANGO_DIR"

python manage.py runserver
