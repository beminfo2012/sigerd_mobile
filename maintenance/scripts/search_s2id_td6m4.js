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
    console.log('Searching for "TD6M4" in s2id_records JSON data...');
    const { data, error } = await supabase
        .from('s2id_records')
        .select('*');

    if (error) {
        console.error('Fetch error:', error.message);
        return;
    }

    const filtered = data.filter(r => JSON.stringify(r).includes('TD6M4'));
    console.log(`Found ${filtered.length} matches.`);
    if (filtered.length > 0) {
        console.log(JSON.stringify(filtered, null, 2));
    } else {
        console.log('No records found containing "TD6M4".');
    }
}

run();
