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
    console.log('--- Inspecting s2id_records schema via RPC or info skip ---');

    // Attempting to insert a dummy record to see what happens
    const dummy = {
        s2id_id: 'test-' + Date.now(),
        status: 'test',
        data: { test: true },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    console.log('Attempting test insert...');
    const { data, error } = await supabase.from('s2id_records').insert([dummy]).select();

    if (error) {
        console.error('Insert failed:', error);
        if (error.code === '42P01') console.log('TABLE DOES NOT EXIST!');
    } else {
        console.log('Insert success:', data);
        // Clean up
        await supabase.from('s2id_records').delete().eq('s2id_id', dummy.s2id_id);
    }

    // Try to list schemas columns via PostgREST if allowed
    const { data: cols, error: colError } = await supabase.from('s2id_records').select().limit(1);
    if (colError) console.error('Select error:', colError);
}

run();
