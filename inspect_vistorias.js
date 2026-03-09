import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://flsppiyjmcrjqulosrqs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsc3BwaXlqbWNyanF1bG9zcnFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMDM2NTksImV4cCI6MjA4MjY3OTY1OX0.TmRPTae3ptQILfAvEvdVnKwnqIdI0FgFQ7jh1vev-gs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
    console.log('--- Inspecting vistorias table ---');
    const { data, error } = await supabase.from('vistorias').select('*').limit(1);

    let output = '';
    if (error) {
        output = 'Error fetching vistorias: ' + JSON.stringify(error, null, 2);
    } else if (data && data.length > 0) {
        output += 'Columns found: ' + Object.keys(data[0]).join(', ') + '\n\n';
        output += 'Sample record:\n' + JSON.stringify(data[0], null, 2);
    } else {
        output = 'No records found in vistorias table.';
    }

    fs.writeFileSync('vistorias_schema_inspect.txt', output, 'utf8');
    console.log('Results written to vistorias_schema_inspect.txt');
}

run();
