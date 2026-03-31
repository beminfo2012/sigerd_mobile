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

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

console.log('--- ENVIRONMENT CHECK ---');
console.log('Supabase URL:', supabaseUrl);
// Extract project ID from URL
const projectId = supabaseUrl.split('//')[1].split('.')[0];
console.log('Project Reference ID:', projectId);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
    console.log('\n--- TABLE CHECK ---');
    console.log('Checking for table "s2id_records"...');

    // Check if we can select from it
    const { count, error } = await supabase
        .from('s2id_records')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error('ERROR accessing table:', error.message);
        if (error.code === '42P01') {
            console.error('Table does not exist (42P01).');
        }
    } else {
        console.log(`SUCCESS: Table "s2id_records" exists and is accessible.`);
        console.log(`Record Count: ${count}`);
    }

    console.log('\n--- DATA SAMPLE ---');
    const { data } = await supabase
        .from('s2id_records')
        .select('id, s2id_id, created_at, status')
        .order('created_at', { ascending: false })
        .limit(3);

    if (data && data.length > 0) {
        console.table(data);
    } else {
        console.log('No data found.');
    }
}

run();
