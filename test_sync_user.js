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
    console.log('--- Testing s2id_records with user_id ---');

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        console.error('No authenticated user found!');
        return;
    }
    console.log('Current User ID:', user.id);

    const validUuid = '550e8400-e29b-41d4-a716-446655440001';
    const dummy = {
        s2id_id: validUuid,
        status: 'test_sync_with_user',
        data: { test: true },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: user.id // Trying to see if this column exists and satisfies RLS
    };

    console.log('Attempting check for user_id column...');
    const { data, error } = await supabase.from('s2id_records').insert([dummy]).select();

    if (error) {
        console.error('Insert failed:', JSON.stringify(error, null, 2));
        if (error.message.includes('column "user_id" of relation "s2id_records" does not exist')) {
            console.log('COLUMN user_id DOES NOT EXIST.');
        }
    } else {
        console.log('Insert SUCCESS with user_id!');
        // Clean up
        await supabase.from('s2id_records').delete().eq('s2id_id', validUuid);
    }
}

run();
