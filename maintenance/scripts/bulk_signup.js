import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://flsppiyjmcrjqulosrqs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsc3BwaXlqbWNyanF1bG9zcnFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMDM2NTksImV4cCI6MjA4MjY3OTY1OX0.TmRPTae3ptQILfAvEvdVnKwnqIdI0FgFQ7jh1vev-gs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const accounts = [
    { email: 'saude@redap.com', role: 'Redap_Saude', name: 'Secretaria de Saúde' },
    { email: 'securb@redap.com', role: 'Redap_Obras', name: 'Secretaria de Serviços Urbanos' },
    { email: 'social@redap.com', role: 'Redap_Social', name: 'Secretaria de Assistência Social' },
    { email: 'educacao@redap.com', role: 'Redap_Educacao', name: 'Secretaria de Educação' },
    { email: 'agricultura@redap.com', role: 'Redap_Agricultura', name: 'Secretaria de Agricultura' },
    { email: 'interior@redap.com', role: 'Redap_Interior', name: 'Secretaria de Interior' },
    { email: 'administracao@redap.com', role: 'Redap_Administracao', name: 'Secretaria de Administração' },
    { email: 'cdl@redap.com', role: 'Redap_CDL', name: 'CDL - Comércio e Serviços' },
    { email: 'cesan@redap.com', role: 'Redap_Cesan', name: 'CESAN - Água e Esgoto' },
    { email: 'defesasocial@redap.com', role: 'Redap_DefesaSocial', name: 'Secretaria de Defesa Social' },
    { email: 'esporte@redap.com', role: 'Redap_EsporteTurismo', name: 'Secretaria de Esporte e Turismo' },
    { email: 'transportes@redap.com', role: 'Redap_Transportes', name: 'Secretaria de Transportes' },
    { email: 'defesa@redap.com', role: 'Agente de Defesa Civil', name: 'Agente de Teste' },
    { email: 'admin@redap.com', role: 'Admin', name: 'Administrador de Teste' }
];

async function createAccounts() {
    console.log('Iniciando cadastro dos contas no Supabase...');
    for (const acc of accounts) {
        console.log(`Criando: ${acc.email}...`);

        // 1. Cria a conta no banco 
        const { data, error } = await supabase.auth.signUp({
            email: acc.email,
            password: 'redap123',
            options: {
                data: {
                    full_name: acc.name,
                    role: acc.role
                }
            }
        });

        if (error) {
            console.error(`- Falha ao criar Auth para ${acc.email}: ${error.message}`);
        } else if (data && data.user) {
            console.log(`- Conta Auth cirada com sucesso. ID: ${data.user.id}`);

            // 2. Atualiza ou insere o perfil real garantindo o Role e Nome
            // Utilizando UPSERT. Como não estamos usando admin_key, pode bater no RLS,
            // mas algumas baselines permitem UPSERT em nome do próprio auth.uid()
            const { error: profileError } = await supabase.from('profiles').upsert({
                id: data.user.id,
                full_name: acc.name,
                role: acc.role,
                is_active: true,
                updated_at: new Date().toISOString()
            });

            if (profileError) {
                console.log(`Aviso ao checar profile: ${profileError.message}. Possivelmente a Trigger já resolveu isso.`);
            } else {
                console.log(`- Perfil confirmado.`);
            }
        }
    }
    console.log('Processo Finalizado.');
}

createAccounts();
