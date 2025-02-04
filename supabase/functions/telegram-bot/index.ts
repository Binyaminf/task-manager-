import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Bot, webhookCallback } from "https://deno.land/x/grammy@v1.21.1/mod.ts"
import { HfInference } from 'https://esm.sh/@huggingface/inference@2.3.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Parse request body
    const { action, code } = await req.json()
    console.log('Received request:', { action, code })

    if (action === 'verify') {
      if (!code) {
        return new Response(
          JSON.stringify({ error: 'Verification code is required' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2")
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") || "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
      )

      // Verify the code matches a pending verification
      // For now, just return success
      return new Response(
        JSON.stringify({ success: true }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Handle Telegram webhook updates
    const bot = new Bot(Deno.env.get("TELEGRAM_BOT_TOKEN") || "")
    const handler = webhookCallback(bot, "std/http")
    const response = await handler(req)
    
    // Add CORS headers to the response
    const newHeaders = new Headers(response.headers)
    Object.entries(corsHeaders).forEach(([key, value]) => {
      newHeaders.set(key, value)
    })
    
    return new Response(response.body, {
      status: response.status,
      headers: newHeaders,
    })

  } catch (error) {
    console.error('Error processing request:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})