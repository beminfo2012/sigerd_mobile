import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env
const env = {};
const envPath = join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
        const [k, ...v] = line.split('=');
        if (k && v.length > 0) env[k.trim()] = v.join('=').trim().replace(/^\"(.*)\"$/, '$1');
    });
}

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

// Create client with NO auth header (truly anon) options if needed, 
// but standard client with anon key is sufficient to test RLS "TO public"
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
    console.log('--- VERIFYING PUBLIC READ ACCESS ---');

    // Attempt to access without signing in
    const { data, error, count } = await supabase
        .from('s2id_records')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error('❌ READ ACCESS BLOCKED!');
        console.error('Error:', error.message);
        console.error('Details:', error);
    } else {
        console.log('✅ READ ACCESS SUCCESS!');
        console.log(`Table is readable by anonymous users. Records: ${count}`);
    }
}

run();
