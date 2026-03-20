const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    try {
        // Try a simple operation to see if the connection is successful,
        // like fetching a single row from a known table or an arbitrary one, 
        // or getting auth session status.
        // If no tables are known, we can query auth.admin (which shouldn't work with anon key, but gives a response), 
        // or just try to get session.
        console.log("Connecting to Supabase at:", supabaseUrl);

        // Instead of querying a non-existent table, we can just call a harmless method
        const { data: { session }, error: authError } = await supabase.auth.getSession();

        // Auth getSession doesn't make a network call if it's purely checking local storage,
        // but we have no session. We need a network call.
        // Let's query a system view or try to call an invalid table to see if network works without crashing

        const { error } = await supabase.from('non_existent_table_for_test_' + Date.now()).select('*').limit(1);

        if (error) {
            // "relation does not exist" or similar error means we successfully contacted the db
            if (error.code === '42P01' || error.message.includes('does not exist')) {
                console.log("✅ Successfully connected to Supabase database!");
            } else {
                console.log("Connected, but received unexpected DB error:", error);
            }
        } else {
            console.log("✅ Successfully connected to Supabase database!");
        }
    } catch (err) {
        console.error("❌ Failed to connect to Supabase database:", err.message);
    }
}

testConnection();
