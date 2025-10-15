#!/usr/bin/env node

// Set default environment variables for Vercel build
process.env.CI = '1';

// Use existing env vars or set defaults
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
  'pk_test_aHVtYmxlLXRyb2xsLTMxLmNsZXJrLmFjY291bnRzLmRldiQ';

process.env.CLERK_SECRET_KEY =
  process.env.CLERK_SECRET_KEY ||
  'sk_test_6wqbPofYobmQc3FWEzgETz6WJvIR43BEQEHaYbRMf4';

process.env.NEXT_PUBLIC_APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
  'https://example.vercel.app');

// Other defaults to prevent validation errors
process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || 'build-time-secret';
process.env.GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || 'placeholder';
process.env.GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || 'placeholder';
process.env.STRIPE_API_KEY = process.env.STRIPE_API_KEY || 'sk_test_placeholder';
process.env.STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder';
process.env.POSTGRES_URL = process.env.POSTGRES_URL || 'postgresql://user:pass@localhost/db';
process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || 're_placeholder';
process.env.RESEND_FROM = process.env.RESEND_FROM || 'noreply@example.com';

// N8N Configuration - should be set in Vercel environment variables
// These are fallbacks only for build-time validation
if (!process.env.N8N_WEBHOOK_URL) {
  console.warn('⚠️  N8N_WEBHOOK_URL not set - using placeholder for build');
  process.env.N8N_WEBHOOK_URL = 'http://placeholder-n8n-url.example.com/webhook/requirement-analysis';
}
if (!process.env.N8N_COMPETITOR_DISCOVERY_URL) {
  console.warn('⚠️  N8N_COMPETITOR_DISCOVERY_URL not set - using placeholder for build');
  process.env.N8N_COMPETITOR_DISCOVERY_URL = 'http://placeholder-n8n-url.example.com/webhook/competitor-discovery';
}
if (!process.env.N8N_API_KEY) {
  console.warn('⚠️  N8N_API_KEY not set - runtime requests may fail');
  process.env.N8N_API_KEY = 'placeholder_api_key';
}

console.log('Building with environment variables set...');
console.log('Current directory:', process.cwd());
console.log('CI:', process.env.CI);
console.log('NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL);

// Run the build
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

try {
  // Debug: Show current directory structure
  console.log('Current working directory:', process.cwd());
  console.log('Directory contents:', fs.readdirSync('.'));

  // Find the correct nextjs directory
  let nextjsPath = null;

  // Possible paths to check
  const possiblePaths = [
    'apps/nextjs',           // From repo root
    'nextjs',                // From apps directory
    '../nextjs',             // From sibling directory
    '.',                     // Current directory if already in nextjs
    '../../apps/nextjs',     // From deep subdirectory
    '../apps/nextjs'         // From subdirectory
  ];

  // Check if we're already in the nextjs directory
  if (fs.existsSync('package.json')) {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    if (pkg.name === '@saasfly/nextjs') {
      nextjsPath = '.';
      console.log('Already in nextjs directory');
    }
  }

  // If not, search for the nextjs directory
  if (!nextjsPath) {
    for (const testPath of possiblePaths) {
      const packagePath = path.join(testPath, 'package.json');
      if (fs.existsSync(packagePath)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
          if (pkg.name === '@saasfly/nextjs') {
            nextjsPath = testPath;
            console.log(`Found nextjs at: ${testPath}`);
            break;
          }
        } catch (e) {
          // Continue searching
        }
      }
    }
  }

  if (!nextjsPath) {
    console.error('ERROR: Could not find the nextjs application directory!');
    console.error('Searched paths:', possiblePaths);
    process.exit(1);
  }

  console.log('Changing to directory:', nextjsPath);
  process.chdir(nextjsPath);

  console.log('Running build in:', process.cwd());
  console.log('Directory contents after change:', fs.readdirSync('.'));

  // Run the build
  execSync('bun run build:vercel', { stdio: 'inherit' });
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}