import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://flsppiyjmcrjqulosrqs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsc3BwaXlqbWNyanF1bG9zcnFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMDM2NTksImV4cCI6MjA4MjY3OTY1OX0.TmRPTae3ptQILfAvEvdVnKwnqIdI0FgFQ7jh1vev-gs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkS2idDetails() {
    console.log('--- Detalhando s2id_records no Supabase ---');

    try {
        const { data, error } = await supabase
            .from('s2id_records')
            .select('id, s2id_id, status, created_at, updated_at, user_id')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Erro:', error.message);
        } else {
            console.log(`Encontrados ${data.length} registros:`);
            data.forEach((r, i) => {
                console.log(`[${i + 1}] ID: ${r.id} | BusinessID: ${r.s2id_id} | Status: ${r.status} | User: ${r.user_id || 'N/A'}`);
            });

            if (data.length > 0) {
                const uniqueUsers = [...new Set(data.map(r => r.user_id))];
                console.log('\nUsuários únicos detectados:', uniqueUsers);
            }
        }
    } catch (err) {
        console.error('Erro inesperado:', err);
    }
}

checkS2idDetails();
