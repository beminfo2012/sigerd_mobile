import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://flsppiyjmcrjqulosrqs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsc3BwaXlqbWNyanF1bG9zcnFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMDM2NTksImV4cCI6MjA4MjY3OTY1OX0.TmRPTae3ptQILfAvEvdVnKwnqIdI0FgFQ7jh1vev-gs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkS2id() {
    console.log('--- Diagnosticando Supabase: s2id_records (ESM Mode) ---');

    try {
        // 1. Verificar se a tabela existe e quantos registros tem
        const { data, error, count } = await supabase
            .from('s2id_records')
            .select('*', { count: 'exact' });

        if (error) {
            console.error('ERRO ao acessar s2id_records:', error.message);
            console.error('Code:', error.code);
            console.error('Hint:', error.hint);
        } else {
            console.log('CONEXÃO BEM-SUCEDIDA!');
            console.log('Total de registros encontrados:', count);

            if (data && data.length > 0) {
                console.log('\nExemplos de s2id_id presentes:');
                data.slice(0, 5).forEach(r => console.log(`- ${r.s2id_id} (Status: ${r.status}, Updated: ${r.updated_at})`));

                console.log('\nEstrutura do primeiro registro:');
                console.log(JSON.stringify(data[0], (key, value) =>
                    typeof value === 'string' && value.length > 100 ? value.substring(0, 50) + '...' : value
                    , 2));
            } else {
                console.log('\nAVISO: Tabela está VAZIA no Supabase para este Usuário/RLS.');
            }
        }
    } catch (err) {
        console.error('Erro inesperado no script:', err);
    }
}

checkS2id();
