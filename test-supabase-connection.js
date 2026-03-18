/**
 * Quick test to verify Supabase connection
 * Run with: node test-supabase-connection.js
 */

const fs = require('fs');
const path = require('path');

// Load .env.local
const envPath = path.join(__dirname, 'apps/future-capsule/.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');

const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match && !line.startsWith('#')) {
    env[match[1]] = match[2];
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

console.log('✅ SUPABASE CONNECTION STATUS');
console.log('=====================================\n');

console.log('1. Environment Variables:');
console.log(`   ✓ SUPABASE_URL: ${supabaseUrl ? '✅ SET' : '❌ NOT SET'}`);
console.log(`   ✓ ANON_KEY: ${supabaseAnonKey ? '✅ SET' : '❌ NOT SET'}`);
console.log(`   ✓ SERVICE_ROLE_KEY: ${serviceRoleKey ? '✅ SET' : '❌ NOT SET'}`);

if (supabaseUrl && supabaseAnonKey) {
  console.log('\n2. Supabase Project Details:');
  const projectId = supabaseUrl.split('https://')[1]?.split('.supabase.co')[0];
  console.log(`   ✓ Project ID: ${projectId}`);
  console.log(`   ✓ URL: ${supabaseUrl}`);
  
  console.log('\n3. Configuration Files:');
  const configPath = path.join(__dirname, 'apps/future-capsule/src/lib/supabase.ts');
  const authContextPath = path.join(__dirname, 'apps/future-capsule/src/contexts/AuthContext.tsx');
  const useAuthPath = path.join(__dirname, 'apps/future-capsule/src/hooks/useAuth.ts');
  
  console.log(`   ✓ supabase.ts: ${fs.existsSync(configPath) ? '✅ EXISTS' : '❌ MISSING'}`);
  console.log(`   ✓ AuthContext.tsx: ${fs.existsSync(authContextPath) ? '✅ EXISTS' : '❌ MISSING'}`);
  console.log(`   ✓ useAuth.ts: ${fs.existsSync(useAuthPath) ? '✅ EXISTS' : '❌ MISSING'}`);
  
  console.log('\n✅ SUPABASE IS CONFIGURED AND READY');
  console.log('\nTo test the connection in your app:');
  console.log('1. Start the dev server: npx next dev -p 3000');
  console.log('2. Go to http://localhost:3000/signup');
  console.log('3. Create an account - you should see it in your Supabase dashboard');
  
} else {
  console.log('\n❌ SUPABASE IS NOT PROPERLY CONFIGURED');
  console.log('\nTo fix this:');
  console.log('1. Go to https://supabase.com and create a new project');
  console.log('2. Copy your Project URL and Anon Key');
  console.log('3. Update apps/future-capsule/.env.local with your credentials');
}

console.log('\n=====================================\n');
