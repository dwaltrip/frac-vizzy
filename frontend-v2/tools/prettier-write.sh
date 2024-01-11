#!/bin/bash

THIS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$THIS_DIR")"

cd "$PROJECT_DIR"
fnm use --log-level error
npx prettier --write "src/**/*.{js,jsx,ts,tsx}"
