import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://flsppiyjmcrjqulosrqs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsc3BwaXlqbWNyanF1bG9zcnFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMDM2NTksImV4cCI6MjA4MjY3OTY1OX0.TmRPTae3ptQILfAvEvdVnKwnqIdI0FgFQ7jh1vev-gs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCols() {
  const { data, error } = await supabase.from('vistorias')
    .select('id, vistoria_id, created_at, bairro, categoria_risco, nivel_risco, latitude, longitude, endereco')
    .order('created_at', { ascending: false })
    .limit(250);

  if (error) {
    console.error("Error querying vistorias:", error);
  } else {
    console.log("Success! Rows:", data.length);
  }
}
checkCols();
