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
    console.log('Testing insertion into vistorias...');
    const testVistoriaId = 'TEST-RLS-' + Date.now();
    const { data, error } = await supabase
        .from('vistorias')
        .insert({
            vistoria_id: testVistoriaId,
            status: 'draft',
            data_hora: new Date().toISOString()
        });

    if (error) {
        console.error('Insert Error:', error.message);
    } else {
        console.log('Insert Success:', data);
        // Clean up
        await supabase.from('vistorias').delete().eq('vistoria_id', testVistoriaId);
        console.log('Clean up done.');
    }
}

run();
