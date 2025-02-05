import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Bot, webhookCallback } from "https://deno.land/x/grammy@v1.21.1/mod.ts"

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
    const body = await req.json().catch(() => null)
    console.log('Received request body:', body)

    if (!body || !body.action) {
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const { action, code } = body

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

      console.log('Processing verification code:', code)

      const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2")
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      // For now, just simulate verification success
      // In a real implementation, you would verify the code against stored values
      return new Response(
        JSON.stringify({ success: true }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Handle Telegram webhook updates
    if (!Deno.env.get('TELEGRAM_BOT_TOKEN')) {
      console.error('TELEGRAM_BOT_TOKEN is not set')
      throw new Error('Telegram bot token not configured')
    }

    const bot = new Bot(Deno.env.get('TELEGRAM_BOT_TOKEN') ?? '')

    // Set up bot commands
    bot.command("start", async (ctx) => {
      const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      console.log('Generated verification code:', verificationCode);
      
      // Store the verification code temporarily (in a real implementation, you'd store this in the database)
      await ctx.reply(`Welcome! Your verification code is: ${verificationCode}\n\nPlease enter this code in the web application to link your Telegram account.`);
    });

    // Handle regular messages
    bot.on("message", async (ctx) => {
      const messageText = ctx.message.text;
      if (!messageText) {
        await ctx.reply("I can only process text messages.");
        return;
      }

      // Example response - you can expand this based on your needs
      await ctx.reply("I received your message! In the future, I'll be able to help you manage your tasks.");
    });

    const handler = webhookCallback(bot, "std/http")
    
    // Process the webhook update
    const response = await handler(req)
    
    // Add CORS headers to the webhook response
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
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message,
        stack: error.stack 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})