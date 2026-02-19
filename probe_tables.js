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
    console.log('Fetching table list from Swagger/API if possible, or via common table probes...');

    // Probing common table names
    const tables = [
        'vistorias', 's2id_records', 'shelters', 'interdicoes',
        'vistoria', 's2id_record', 'shelter', 'interdicao'
    ];

    for (const t of tables) {
        const { error } = await supabase.from(t).select('id').limit(1);
        if (error) {
            console.log(`Table '${t}': Error - ${error.message} (Code: ${error.code})`);
        } else {
            console.log(`Table '${t}': Found! (or at least accessible)`);
        }
    }
}

run();
