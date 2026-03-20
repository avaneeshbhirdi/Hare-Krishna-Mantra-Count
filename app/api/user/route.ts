import { NextResponse } from 'next/server'
import { createClient } from '../../../utils/supabase/server'

export async function GET() {
    // 1. Initialize the secure server-side Supabase client (reads HTTP-only cookies)
    const supabase = await createClient()

    // 2. getUser() decrypts and verifies the JWT token natively and securely
    const { data: { user }, error } = await supabase.auth.getUser()

    // 3. Prevent unauthorized access
    if (error || !user) {
        return NextResponse.json({ error: 'Unauthorized request' }, { status: 401 })
    }

    // 4. Return data attaching the authenticated User ID
    return NextResponse.json({
        message: 'Action completed securely',
        userId: user.id,
        userEmail: user.email
    })
}
