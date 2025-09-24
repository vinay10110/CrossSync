import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

// Validate environment variables
if (!supabaseUrl) {
  console.error('❌ VITE_SUPABASE_URL is not defined in your .env file');
  console.error('📝 Please create a .env file in the client directory with:');
  console.error('   VITE_SUPABASE_URL=your-supabase-project-url');
  console.error('   VITE_SUPABASE_KEY=your-supabase-anon-key');
  throw new Error('Supabase URL is required. Please check your .env file configuration.');
}

if (!supabaseKey) {
  console.error('❌ VITE_SUPABASE_KEY is not defined in your .env file');
  console.error('📝 Please create a .env file in the client directory with:');
  console.error('   VITE_SUPABASE_URL=your-supabase-project-url');
  console.error('   VITE_SUPABASE_KEY=your-supabase-anon-key');
  throw new Error('Supabase Key is required. Please check your .env file configuration.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);