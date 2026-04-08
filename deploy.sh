#!/bin/bash

echo "🚀 chat-api Deploy started"

cd /var/www/chat-api || exit

# Pull latest code
git pull origin master

# Install dependencies
npm install

# Restart backend using PM2
pm2 restart chat-api || pm2 start index.js --name chat-api

echo "✅ chat-api Deploy completed"
