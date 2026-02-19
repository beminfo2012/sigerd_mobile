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
    console.log('--- Testing s2id_records with valid UUID ---');

    const validUuid = '550e8400-e29b-41d4-a716-446655440000';
    const dummy = {
        s2id_id: validUuid,
        status: 'test_sync',
        data: { test: true },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    console.log('Attempting test insert with valid UUID:', validUuid);
    const { data, error } = await supabase.from('s2id_records').insert([dummy]).select();

    if (error) {
        console.error('Insert failed with error:', JSON.stringify(error, null, 2));
    } else {
        console.log('Insert SUCCESS!');
        console.log('Returned object keys:', Object.keys(data[0] || {}).join(', '));
        // Clean up
        await supabase.from('s2id_records').delete().eq('s2id_id', validUuid);
    }
}

run();
