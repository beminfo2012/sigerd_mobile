import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://flsppiyjmcrjqulosrqs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsc3BwaXlqbWNyanF1bG9zcnFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMDM2NTksImV4cCI6MjA4MjY3OTY1OX0.TmRPTae3ptQILfAvEvdVnKwnqIdI0FgFQ7jh1vev-gs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
    console.log('--- Inspecting column types ---');
    const { data, error } = await supabase.rpc('get_table_info', { table_name: 'vistorias' });

    if (error) {
        // Fallback: try to get column names and simple data from information_schema via a trick or just checking the record keys again
        console.log('RPC get_table_info not available. Checking sample data types...');
        const { data: sample } = await supabase.from('vistorias').select('*').limit(1);
        if (sample && sample.length > 0) {
            const keys = Object.keys(sample[0]);
            keys.forEach(k => {
                console.log(`${k}: ${typeof sample[0][k]}`);
            });
        }
    } else {
        console.log('Table info:', data);
    }
}

run();
