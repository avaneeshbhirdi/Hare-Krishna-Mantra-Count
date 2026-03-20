const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    try {
        console.log("Connecting to Supabase at:", supabaseUrl);

        // Attempt a database query
        const { error } = await supabase.from('non_existent_table_for_test_' + Date.now()).select('*').limit(1);

        if (error) {
            // 42P01 error code is "relation does not exist", which confirms DB connection
            if (error.code === '42P01' || (error.message && error.message.includes('does not exist'))) {
                console.log("✅ Successfully reached Supabase database!");
            } else {
                console.log("Connected, but received unexpected DB error:", error);
            }
        } else {
            console.log("✅ Successfully reached Supabase database!");
        }
    } catch (err) {
        console.error("❌ Failed to reach Supabase database:", err.message);
    }
}

testConnection();
