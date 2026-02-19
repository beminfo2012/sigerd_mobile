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

async function run() {
    console.log('Testing access modes for s2id_records...');

    // 1. Anonymous Access
    console.log('\n--- Test 1: Anonymous Client ---');
    const anonClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: anonData, error: anonError } = await anonClient
        .from('s2id_records')
        .select('id, s2id_id')
        .limit(1);

    if (anonError) {
        console.error('Anon Access Failed:', anonError.message);
    } else {
        console.log(`Anon Access Success: Found ${anonData.length} records.`);
    }

    // 2. Authenticated Access
    console.log('\n--- Test 2: Authenticated Client ---');
    const authClient = createClient(supabaseUrl, supabaseAnonKey);
    // Use a test login if possible, or just try to sign up a temp user
    const email = `test_access_${Date.now()}@example.com`;
    const password = 'password123';

    const { data: authData, error: authError } = await authClient.auth.signUp({
        email,
        password,
    });

    if (authError) {
        console.error('Auth User Creation Failed:', authError.message);
    } else {
        console.log('Auth User Created:', authData.user.id);
        const { data: accessData, error: accessError } = await authClient
            .from('s2id_records')
            .select('id, s2id_id')
            .limit(1);

        if (accessError) {
            console.error('Authenticated Access Failed:', accessError.message);
        } else {
            console.log(`Authenticated Access Success: Found ${accessData.length} records.`);
        }
    }
}

run();
