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
    const paths = [
        '018/2026', '019/2026',
        'd1a41dc7-4f66-412f-a0c7-e45b8cf9f3d5', // #019 UUID
        'c0e58d02-e8a4-4a39-a594-d83113b6bf3b'  // #018 UUID
    ];
    for (const path of paths) {
        console.log(`\n--- Storage check for: ${path} ---`);
        const { data, error } = await supabase.storage.from('vistorias').list(path);
        if (error) {
            console.error(`Error listing ${path}:`, error.message);
        } else {
            if (data && data.length > 0) {
                console.log(`Found ${data.length} files:`);
                data.forEach(file => console.log(`  - ${file.name} (${file.metadata?.size || 'unknown'} bytes)`));
            } else {
                console.log('No files found in this folder.');
            }
        }
    }
}

run();
