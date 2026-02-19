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
    console.log('Testing insertion into s2id_records...');
    const testUuid = '00000000-0000-0000-0000-000000000000'; // Dummy UUID
    const { data, error } = await supabase
        .from('s2id_records')
        .upsert({
            s2id_id: testUuid,
            id_local: 'TEST_SYNC',
            status: 'draft',
            data: { test: true, note: 'Check RLS' }
        }, { onConflict: 's2id_id' });

    if (error) {
        console.error('Insert Error:', error.message);
        console.error('Error Details:', error);
    } else {
        console.log('Insert Success:', data);

        // Clean up
        await supabase.from('s2id_records').delete().eq('s2id_id', testUuid);
        console.log('Clean up done.');
    }
}

run();
