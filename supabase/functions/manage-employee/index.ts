// @ts-ignore : Deno specific import
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore : Deno specific import
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers for browser requests
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: any) => {
    // Handle CORS preflight request
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 1. Get the Authorization header from the incoming request
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            throw new Error('Missing Authorization header')
        }

        // 2. Extract action and data from request body
        const { action, payload } = await req.json()
        if (!action || !payload) {
            throw new Error('Missing action or payload in request body')
        }

        // 3. Initialize Supabase Admin Client (using Service Role Key from Env)
        // The SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are automatically injected by Deno/Supabase
        const supabaseAdmin = createClient(
            // @ts-ignore : Deno global
            Deno.env.get('SUPABASE_URL') ?? '',
            // @ts-ignore : Deno global
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )

        // 4. Verify the caller is actually a super_admin
        // We get the user ID from the JWT token passed in the header
        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
        if (authError || !user) {
            throw new Error('Unauthorized or invalid token')
        }

        const { data: callerData, error: callerError } = await supabaseAdmin
            .from('employees')
            .select('role')
            .eq('id', user.id)
            .single()

        if (callerError || callerData?.role !== 'super_admin') {
            throw new Error('Forbidden: Only super_admin can perform this action')
        }

        // 5. Execute requested action
        let resultData = null

        if (action === 'create') {
            const { email, password, firstName, lastName, employeeCode, baseSalary, role, bankName, bankAccountNumber } = payload

            // A. Create Auth User
            const { data: newUserData, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email: email,
                password: password,
                email_confirm: true // bypass email confirmation
            })

            if (createError) throw new Error(`Auth Creation Failed: ${createError.message}`)

            const newUserId = newUserData.user.id

            // B. Insert Profile Data
            const { error: profileError } = await supabaseAdmin.from('employees').insert({
                id: newUserId,
                employee_code: employeeCode,
                first_name: firstName,
                last_name: lastName,
                role: role,
                base_salary: baseSalary, // Passed as string/number to be stored safely in DECIMAL(15,2)
                bank_name: bankName || null,
                bank_account_number: bankAccountNumber || null
            })

            // C. Rollback if profile creation fails
            if (profileError) {
                // Rollback: delete the auth user
                await supabaseAdmin.auth.admin.deleteUser(newUserId)
                throw new Error(`Profile Creation Failed: ${profileError.message}. User creation rolled back.`)
            }

            resultData = { id: newUserId, message: 'User created successfully' }
        }
        else if (action === 'delete') {
            const { id: targetId } = payload

            // Prevent deleting oneself
            if (targetId === user.id) {
                throw new Error('Cannot delete your own account')
            }

            // A. Delete Profile first (Due to FK constraints)
            const { error: dbError } = await supabaseAdmin.from('employees').delete().eq('id', targetId)
            if (dbError) throw new Error(`Profile Deletion Failed: ${dbError.message}`)

            // B. Delete Auth User
            const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(targetId)
            if (deleteAuthError) throw new Error(`Auth Deletion Failed: ${deleteAuthError.message}`)

            resultData = { message: 'User deleted successfully' }
        }
        else {
            throw new Error(`Invalid action: ${action}`)
        }

        // 6. Return Success Response
        return new Response(
            JSON.stringify({ success: true, data: resultData }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error: any) {
        // Return Error Response
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
