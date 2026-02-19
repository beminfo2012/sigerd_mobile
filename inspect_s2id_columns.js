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
    console.log('Inspecting s2id_records columns...');
    const { data, error } = await supabase
        .from('s2id_records')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Fetch error:', error.message);
        return;
    }

    if (data.length > 0) {
        console.log('Columns found:', Object.keys(data[0]).join(', '));
    } else {
        console.log('Table is accessible but empty. Cannot infer columns easily via select.');
        // Try an insert to see if we can infer more or just default to known structure
    }
}

run();
