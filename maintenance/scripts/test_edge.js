import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://flsppiyjmcrjqulosrqs.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsc3BwaXlqbWNyanF1bG9zcnFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMDM2NTksImV4cCI6MjA1MjY3OTY1OX0.TmRPTae3ptQILfAvEvdVnKwnqIdI0FgFQ7jh1vev-gs'
const supabase = createClient(supabaseUrl, supabaseKey)

async function testEdgeFunction() {
    console.log("Calling Edge Function 'refine-report'...");
    try {
        const { data, error } = await supabase.functions.invoke('refine-report', {
            body: { text: "casa caiu no morro" }
        })
        if (error) {
            console.error("EDGE FUNCTION FAILED:", error);
        } else {
            console.log("EDGE FUNCTION SUCCESS! Data:", data);
        }
    } catch (e) {
        console.error("THROWN ERROR:", e.message);
    }
}

testEdgeFunction();
