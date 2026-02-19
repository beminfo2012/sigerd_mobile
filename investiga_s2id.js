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
    console.log('--- Inspecting s2id_records table ---');
    const { data: records, error } = await supabase
        .from('s2id_records')
        .select('*')
        .limit(10);

    if (error) {
        console.error('Error fetching s2id_records:', error);
    } else {
        console.log(`Found ${records.length} records.`);
        if (records.length > 0) {
            console.log('Columns:', Object.keys(records[0]).join(', '));
            console.log('Sample Data:', JSON.stringify(records.slice(0, 2), null, 2));
        }
    }

    // Also check vistorias for "TD6M4" specifically in any field that might link
    console.log('\n--- Searching for TD6M4 in s2id_records ---');
    const { data: searchResults, error: searchError } = await supabase
        .from('s2id_records')
        .select('*')
        .or(`status.ilike.%TD6M4%,s2id_id.ilike.%TD6M4%`);

    if (searchError) {
        // Maybe try searching inside the 'data' jsonb column
        const { data: jsonSearch, error: jsonError } = await supabase
            .from('s2id_records')
            .select('*'); // We'll filter in JS if needed

        const filtered = (jsonSearch || []).filter(r => JSON.stringify(r).includes('TD6M4'));
        console.log(`Found ${filtered.length} records via JSON string search.`);
        if (filtered.length > 0) {
            console.log(JSON.stringify(filtered, null, 2));
        }
    } else {
        console.log(`Found ${searchResults.length} records via direct search.`);
        if (searchResults.length > 0) {
            console.log(JSON.stringify(searchResults, null, 2));
        }
    }
}

run();
