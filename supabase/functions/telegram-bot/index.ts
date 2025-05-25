
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Bot, webhookCallback } from "https://deno.land/x/grammy@v1.21.1/mod.ts"
import { 
  handleStartCommand, 
  handleHelpCommand, 
  handleListTasks, 
  handlePriorityOverview, 
  handleAIRecommendations 
} from "./commandHandlers.ts"
import { handleEnhancedTaskCreation } from "./taskHandlers.ts"
import { handleEnhancedFreeTextQuery } from "./aiHandlers.ts"
import { isProbablyTaskDescription } from "./taskDetection.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    console.log('Received OPTIONS request')
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Clone the request before consuming its body
    const clonedReq = req.clone()
    
    // Log request details
    console.log('Received webhook request')
    console.log('Request method:', req.method)
    console.log('Request headers:', Object.fromEntries(req.headers.entries()))
    
    const body = await clonedReq.json()
    console.log('Request body:', JSON.stringify(body, null, 2))

    // Initialize bot with error handling
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
    if (!botToken) {
      console.error('TELEGRAM_BOT_TOKEN not found')
      throw new Error('Bot token not configured')
    }
    
    const bot = new Bot(botToken)
    console.log('Bot initialized successfully')

    // Handle webhook setup request
    if (body.action === 'setup-webhook') {
      console.log('Setting up webhook...')
      const webhookUrl = body.webhookUrl
      console.log('Webhook URL:', webhookUrl)
      
      try {
        // Delete any existing webhook first
        await bot.api.deleteWebhook()
        console.log('Deleted existing webhook')
        
        // Set the new webhook with specific allowed updates
        await bot.api.setWebhook(webhookUrl, {
          allowed_updates: ["message", "callback_query", "my_chat_member"]
        })
        console.log('Set new webhook successfully')
        
        // Verify webhook info
        const webhookInfo = await bot.api.getWebhookInfo()
        console.log('Webhook info:', JSON.stringify(webhookInfo, null, 2))
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Webhook set successfully',
            webhookInfo 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )
      } catch (error) {
        console.error('Error setting webhook:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to set webhook', details: error.message }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500 
          }
        )
      }
    }

    // Handle verification from web app
    if (body.action === 'verify') {
      console.log('Processing verification request:', body)
      
      if (!body.code || !body.userId) {
        return new Response(
          JSON.stringify({ error: 'Verification code and user ID are required' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2")
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      console.log('Looking for verification code:', body.code.toUpperCase())

      // Find the telegram user with this verification code
      const { data: telegramUser, error: findError } = await supabase
        .from('telegram_users')
        .select('*')
        .eq('verification_code', body.code.toUpperCase())
        .maybeSingle()

      if (findError || !telegramUser) {
        console.error('Error finding verification code:', findError)
        return new Response(
          JSON.stringify({ error: 'Invalid verification code' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Update the telegram user with the user_id and clear the verification code
      const { error: updateError } = await supabase
        .from('telegram_users')
        .update({ 
          user_id: body.userId,
          verification_code: null 
        })
        .eq('id', telegramUser.id)

      if (updateError) {
        console.error('Error updating telegram user:', updateError)
        return new Response(
          JSON.stringify({ error: 'Failed to verify telegram user' }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      try {
        await bot.api.sendMessage(telegramUser.telegram_id, '🎉 Your account has been successfully verified! You can now use enhanced commands like "list tasks", "priority overview", or create tasks with intelligent AI analysis.')
      } catch (error) {
        console.error('Error sending confirmation message:', error)
      }

      return new Response(
        JSON.stringify({ success: true }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Configure bot to not use webhookReply
    bot.api.config.use((prev, method, payload) => {
      console.log('API method called:', method)
      console.log('API payload:', JSON.stringify(payload, null, 2))
      // Force webhookReply to false for all API calls
      return prev(method, { ...payload, webhook_reply: false })
    })

    // Enhanced commands
    bot.command("start", handleStartCommand)
    bot.command("help", handleHelpCommand)
    bot.command("list", handleListTasks)
    bot.command("priority", handlePriorityOverview)
    bot.command("recommend", handleAIRecommendations)

    // Enhanced create command
    bot.command("create", async (ctx) => {
      console.log('Create command received from:', ctx.chat.id)
      const text = ctx.message?.text?.replace('/create', '').trim();
      if (!text) {
        await ctx.reply("📝 Please provide a task description.\n\n*Example:* `/create Finish project report by Friday - high priority`");
        return;
      }
      await handleEnhancedTaskCreation(ctx, text);
    });

    // Enhanced text message handlers
    bot.hears("help", handleHelpCommand)
    bot.hears("list tasks", handleListTasks)
    bot.hears("priority overview", handlePriorityOverview)

    // AI recommendation triggers
    bot.hears(/what should I work on/i, handleAIRecommendations)
    bot.hears(/recommendations?/i, handleAIRecommendations)
    
    bot.hears(/create task:(.+)/i, async (ctx) => {
      console.log('Create task pattern matched');
      const text = ctx.match[1].trim();
      await handleEnhancedTaskCreation(ctx, text);
    });
    
    // Enhanced free text handling
    bot.on("message:text", async (ctx) => {
      if (!ctx.message.text) return
      
      const text = ctx.message.text.toLowerCase()
      console.log('Processing text message:', text)
      
      // Skip if message was already handled
      if (
        text.startsWith('/') || 
        text === "help" || 
        text === "list tasks" || 
        text === "priority overview" ||
        text.toLowerCase().startsWith('create task:') ||
        /what should I work on/i.test(text) ||
        /recommendations?/i.test(text)
      ) {
        return
      }
      
      // Enhanced task detection
      if (isProbablyTaskDescription(text)) {
        await ctx.reply("🤖 This looks like a task description. Let me create it with enhanced AI analysis...");
        await handleEnhancedTaskCreation(ctx, ctx.message.text);
        return;
      }
      
      // Process as general query with enhanced AI
      await handleEnhancedFreeTextQuery(ctx)
    })

    // Log any errors that occur during message handling
    bot.catch((err) => {
      console.error('Error in bot message handler:', err)
    })

    // Set up webhook handler 
    const handler = webhookCallback(bot, "std/http")
    console.log('Enhanced webhook handler set up successfully')
    
    const response = await handler(req)
    console.log('Enhanced webhook handler processed request successfully')
    console.log('Response status:', response.status)
    
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
