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
    console.log('Searching for "Marcelo" in profiles table...');
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('full_name', '%Marcelo%');

    if (error) {
        console.error('Fetch error:', error.message);
    } else {
        console.log(`Found ${data.length} profiles.`);
        if (data.length > 0) {
            console.log('Profile details:', JSON.stringify(data, null, 2));
        }
    }
}

run();
