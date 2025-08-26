#!/bin/bash
echo "🏪 Starting BuyLock Vendor Dashboard..."
cd vendor-dashboard
VENDOR_PORT=5001 tsx server/index.ts &
VENDOR_PID=$!
echo "📱 Vendor Dashboard started with PID: $VENDOR_PID"
echo "🌐 Access at: http://localhost:5001"
echo "📧 Demo login: vendor@buylock.com / password123"