#!/bin/bash
# Start backend server in background
cd backend && npm run dev &
BACKEND_PID=$!

# Start frontend server
cd ../frontend && npm run dev

# Cleanup on exit
trap "kill $BACKEND_PID" EXIT
