// supabase/functions/reset-worker-password/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    console.log("1. Received Auth Header:", !!authHeader)

    if (!authHeader) throw new Error('Missing Authorization header')

    // 1. Identify who is calling this function
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      console.log("2. Auth Verification Failed:", authError?.message)
      throw new Error('Invalid or expired token')
    }
    console.log("3. User Verified:", user.id)

    // 2. Verify the caller is an Admin
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      console.log("4. Role Check Failed. Found role:", profile?.role)
      throw new Error('Only admins can reset passwords')
    }
    console.log("5. Admin Privileges Confirmed.")

    // 3. Get the payload
    const { workerId, newPassword } = await req.json()

    // 4. Create an ADMIN client (God Mode)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 5. Force update the worker
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      workerId,
      { password: newPassword }
    )

    if (updateError) {
      console.log("6. Password Update Failed:", updateError.message)
      throw updateError
    }

    console.log("7. Password Successfully Changed!")
    return new Response(JSON.stringify({ message: 'Password updated successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.log("🚨 ERROR CAUGHT:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})