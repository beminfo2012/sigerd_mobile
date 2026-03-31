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
    console.log('--- DEEP DEBUG S2ID RECORDS ---');

    const { data, error } = await supabase
        .from('s2id_records')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Fetch error:', error.message);
        return;
    }

    console.log(`Found ${data.length} records.`);

    if (data.length > 0) {
        data.forEach((r, i) => {
            console.log(`\nRecord [${i}]`);
            console.log(`  ID (INT): ${r.id} (${typeof r.id})`);
            console.log(`  S2ID_ID (UUID): ${r.s2id_id} (${typeof r.s2id_id})`);
            console.log(`  Updated At: ${r.updated_at} (${typeof r.updated_at})`);
            console.log(`  Created At: ${r.created_at}`);
            console.log(`  Status: ${r.status}`);
            console.log(`  Data Keys: ${r.data ? Object.keys(r.data).join(', ') : 'NULL'}`);
            if (r.data && r.data.tipificacao) {
                console.log(`  Tipificacao: ${JSON.stringify(r.data.tipificacao)}`);
            }
        });
    } else {
        console.log('No records found.');
    }
}

run();
