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
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
  'https://example.vercel.app';

// Other defaults to prevent validation errors
process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || 'build-time-secret';
process.env.GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || 'placeholder';
process.env.GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || 'placeholder';
process.env.STRIPE_API_KEY = process.env.STRIPE_API_KEY || 'sk_test_placeholder';
process.env.STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder';
process.env.POSTGRES_URL = process.env.POSTGRES_URL || 'postgresql://user:pass@localhost/db';
process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || 're_placeholder';
process.env.RESEND_FROM = process.env.RESEND_FROM || 'noreply@example.com';

console.log('Building with environment variables set...');
console.log('CI:', process.env.CI);
console.log('NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL);

// Run the build
const { execSync } = require('child_process');

try {
  process.chdir('apps/nextjs');
  execSync('bun run build:vercel', { stdio: 'inherit' });
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}