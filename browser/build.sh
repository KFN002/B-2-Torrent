#!/bin/bash

echo "Building B2 Secure Browser for all platforms..."

cd browser

# Install dependencies
npm install

# Build for all platforms
npm run build

echo "Build complete! Executables in browser/dist/"
