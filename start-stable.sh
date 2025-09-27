#!/bin/bash

# STABLE STARTUP SCRIPT FOR AIC CRM
echo "🚀 Starting AIC CRM in STABLE mode..."

# Kill any existing processes
echo "🧹 Cleaning up existing processes..."
pkill -f "next dev" 2>/dev/null || true
sleep 2

# Clean cache
echo "🗑️ Cleaning cache..."
rm -rf .next 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "⚠️  WARNING: .env.local not found!"
    echo "Please copy your environment variables to .env.local"
    echo "You can use .env as a template"
fi

# Start the development server
echo "🎯 Starting development server..."
npm run dev


