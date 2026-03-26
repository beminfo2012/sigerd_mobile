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
} else {
    // try .env
    const envPathNormal = join(__dirname, '.env');
    if (fs.existsSync(envPathNormal)) {
        fs.readFileSync(envPathNormal, 'utf8').split('\n').forEach(line => {
            const [k, ...v] = line.split('=');
            if (k && v.length > 0) env[k.trim()] = v.join('=').trim().replace(/^\"(.*)\"$/, '$1');
        });
    }
}

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function run() {
    console.log('Inspecting profiles table...');
    const { data, error } = await supabase.from('profiles').select('*').limit(1);
    
    if (error) {
        console.error('Error:', error);
    } else {
        if (data && data.length > 0) {
            console.log('Columns found:', Object.keys(data[0]).join(', '));
            console.log('Sample record:', JSON.stringify(data[0], null, 2));
        } else {
            console.log('No records found in profiles table.');
            // Try to get one user if any
            const { data: users, error: userError } = await supabase.from('profiles').select('id').limit(1);
            if (userError) console.error('User error:', userError);
            else console.log('Users found (IDs only):', users);
        }
    }
}

run();
