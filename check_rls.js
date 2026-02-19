import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env
const env = {};
try {
    const envPath = join(__dirname, '.env.local');
    if (fs.existsSync(envPath)) {
        fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
            const [k, ...v] = line.split('=');
            if (k && v.length > 0) env[k.trim()] = v.join('=').trim().replace(/^\"(.*)\"$/, '$1');
        });
    }
} catch (e) { console.error('Env load error:', e); }

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function run() {
    console.log('--- Checking RLS status of vistorias table ---');

    // We can try to query information_schema or just infer.
    // Since we don't have direct SQL, we'll try to use the rpc if available.
    // Alternatively, we just assume that if insert works as anon, RLS is either off or allowed.

    // Let's try to check the 's2id_records' RLS again but specifically for SELECT.
    const { data: s2idSelect, error: s2idError } = await supabase.from('s2id_records').select('*').limit(1);
    console.log('S2ID Select Error:', s2idError ? s2idError.message : 'NONE');

    // If SELECT works (as anon), then the "Enable read for public" policy is working.
    // Since INSERT failed, "Enable all for authenticated users" is likely the only one for INSERT and it's blocking anon.
}

run();
