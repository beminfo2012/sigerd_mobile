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
    console.log('--- Testing vistorias RLS ---');

    const dummy = {
        vistoria_id: 'TEST-' + Date.now(),
        agente: 'Test Runner',
        created_at: new Date().toISOString()
    };

    console.log('Attempting test insert into vistorias...');
    const { data, error } = await supabase.from('vistorias').insert([dummy]).select();

    if (error) {
        console.error('Insert failed:', JSON.stringify(error, null, 2));
    } else {
        console.log('Insert SUCCESS into vistorias!');
        console.log('Returned object keys:', Object.keys(data[0] || {}).join(', '));
        // Clean up
        await supabase.from('vistorias').delete().eq('vistoria_id', dummy.vistoria_id);
    }
}

run();
