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

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function run() {
    console.log('Inspecting s2id_records schema...');

    // We can't query information_schema easily with supabase-js unless we have a specialized function,
    // but we can try to insert an empty record and see what fails (Constraint Violation vs RLS),
    // OR we can rely on our previous `select` which showed `id`, `s2id...`

    // Let's try to sign up a temp user to get an authenticated session, then inspect/insert.
    const email = `debug_${Date.now()}@test.com`;
    const password = 'password123';

    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
    });

    if (authError) {
        console.error('Auth setup failed:', authError.message);
        return;
    }

    console.log('Authenticated as temp user:', authData.user.id);

    // Try to insert a minimal record to Probe for missing columns
    const testId = crypto.randomUUID();
    const payload = {
        s2id_id: testId,
        // Missing data, status, etc. to see if they are required
    };

    const { data, error } = await supabase
        .from('s2id_records')
        .insert([payload])
        .select();

    if (error) {
        console.error('Insert probe error:', error);
        console.log('Error Details:', JSON.stringify(error, null, 2));
    } else {
        console.log('Insert probe SUCCESS! Record created.');
        // Clean up
        await supabase.from('s2id_records').delete().eq('s2id_id', testId);
    }
}

run();
