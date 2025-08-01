#!/usr/bin/env node

// Simple start script for deployment platforms that require npm start
const { spawn } = require('child_process');

const child = spawn('npx', ['tsx', 'server/bot-only.ts'], {
  stdio: 'inherit',
  env: process.env
});

child.on('exit', (code) => {
  process.exit(code);
});

child.on('error', (err) => {
  console.error('Failed to start bot:', err);
  process.exit(1);
});
