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
    console.log('Fetching latest 10 s2id_records from Supabase...');

    const { data, error } = await supabase
        .from('s2id_records')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Fetch error:', error.message);
        return;
    }

    console.log(`Found ${data.length} records.`);

    if (data.length > 0) {
        data.forEach((r, i) => {
            console.log(`[${i}] ID: ${r.id} | UUID: ${r.s2id_id} | Created: ${r.created_at} | Updated: ${r.updated_at}`);
            console.log(`    Status: ${r.status}`);
            console.log(`    Denominacao: ${r.data?.tipificacao?.denominacao}`);
            console.log(`    Cobrade: ${r.data?.tipificacao?.cobrade}`);
            console.log('---');
        });
    } else {
        console.log('No records found in the cloud.');
    }
}

run();
