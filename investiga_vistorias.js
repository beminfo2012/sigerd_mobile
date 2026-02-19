import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env
const envPath = join(__dirname, '.env.local');
let supabaseUrl = '';
let supabaseKey = '';

try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
            const k = key.trim();
            const v = valueParts.join('=').trim().replace(/^"(.*)"$/, '$1');
            if (k === 'VITE_SUPABASE_URL') supabaseUrl = v;
            if (k === 'VITE_SUPABASE_ANON_KEY') supabaseKey = v;
        }
    });
} catch (e) {
    console.error('Error loading .env.local:', e.message);
}

if (!supabaseUrl || !supabaseKey) {
    console.error('Credentials missing');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const arg = process.argv[2];

    if (arg === '--list-buckets') {
        console.log('Listing all storage buckets...');
        const { data, error } = await supabase.storage.listBuckets();
        if (error) {
            console.error('Error listing buckets:', error.message);
        } else {
            console.log('Buckets:', JSON.stringify(data, null, 2));
        }
        return;
    }

    if (arg === '--inspect-extra-tables') {
        // Already failed but kept for reference
        return;
    }

    console.log('Searching for "TD6M4" in vistorias...');
    const { data, error } = await supabase
        .from('vistorias')
        .select('*')
        .or('processo.ilike.%TD6M4%,vistoria_id.ilike.%TD6M4%');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Results:', JSON.stringify(data, null, 2));
}

run();
