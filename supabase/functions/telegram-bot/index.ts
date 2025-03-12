
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Bot, webhookCallback } from "https://deno.land/x/grammy@v1.21.1/mod.ts"

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
        await bot.api.sendMessage(telegramUser.telegram_id, 'Your account has been successfully verified! You can now use commands like "list tasks" to interact with your tasks.')
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

    // Set up command handlers
    bot.command("start", async (ctx) => {
      console.log('Start command received from:', ctx.chat.id)
      
      const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase()
      const chatId = ctx.chat.id.toString()
      
      const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2")
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      try {
        // Store or update the verification code
        const { error } = await supabase
          .from('telegram_users')
          .upsert([
            { 
              telegram_id: chatId,
              verification_code: verificationCode
            }
          ])

        if (error) {
          console.error('Error storing verification code:', error)
          await ctx.reply("Sorry, there was an error generating your verification code. Please try again.")
          return
        }

        console.log('Verification code stored successfully:', verificationCode)
        await ctx.reply(`Welcome! Your verification code is: ${verificationCode}\n\nPlease enter this code in the web application to link your Telegram account.`)
      } catch (error) {
        console.error('Unexpected error in start command:', error)
        await ctx.reply("An unexpected error occurred. Please try again later.")
      }
    })

    bot.command("help", async (ctx) => {
      console.log('Help command received from:', ctx.chat.id)
      await ctx.reply(
        "Here are the commands I understand:\n\n" +
        "• 'list tasks' or /list - Show your upcoming tasks\n" +
        "• /start - Get a new verification code\n" +
        "• /help - Show this help message\n\n" +
        "If you need help, just send 'help' and I'll show you this message again."
      )
    })

    bot.command("list", async (ctx) => {
      console.log('List command received from:', ctx.chat.id)
      const chatId = ctx.chat.id.toString()
      
      const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2")
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      try {
        // Check if the user is verified
        const { data: telegramUser, error: userError } = await supabase
          .from('telegram_users')
          .select('*')
          .eq('telegram_id', chatId)
          .maybeSingle()

        if (userError) {
          console.error('Error fetching telegram user:', userError)
          await ctx.reply("Sorry, there was an error checking your verification status. Please try again.")
          return
        }

        if (!telegramUser?.user_id) {
          await ctx.reply("Your Telegram account is not linked yet. Please use the /start command to get a verification code.")
          return
        }

        // Fetch tasks
        const { data: tasks, error: tasksError } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', telegramUser.user_id)
          .order('due_date', { ascending: true })
          .limit(5)

        if (tasksError) {
          console.error('Error fetching tasks:', tasksError)
          await ctx.reply("Sorry, there was an error fetching your tasks. Please try again.")
          return
        }

        if (!tasks?.length) {
          await ctx.reply("You don't have any tasks yet.")
          return
        }

        const taskList = tasks
          .map(task => `• ${task.summary}${task.due_date ? ` (Due: ${new Date(task.due_date).toLocaleDateString()})` : ''}`)
          .join('\n')

        await ctx.reply(`Here are your latest tasks:\n\n${taskList}`)
      } catch (error) {
        console.error('Unexpected error in list command:', error)
        await ctx.reply("An unexpected error occurred. Please try again later.")
      }
    })

    // Handle text messages for commands without /
    bot.hears("help", async (ctx) => {
      console.log('Help text received from:', ctx.chat.id)
      await ctx.reply(
        "Here are the commands I understand:\n\n" +
        "• 'list tasks' or /list - Show your upcoming tasks\n" +
        "• /start - Get a new verification code\n" +
        "• /help - Show this help message\n\n" +
        "If you need help, just send 'help' and I'll show you this message again."
      )
    })

    bot.hears("list tasks", async (ctx) => {
      console.log('List tasks text received from:', ctx.chat.id)
      await bot.commands.get("list")?.(ctx)
    })

    // Handle all other messages with improved logging
    bot.on("message", async (ctx) => {
      console.log('Received message:', JSON.stringify(ctx.message, null, 2))
      if (!ctx.message.text) {
        await ctx.reply("I can only process text messages.")
        return
      }

      console.log('Processing text message:', ctx.message.text)
      // For unrecognized commands, show help message
      await ctx.reply(
        "I don't understand that command. Here are the commands I understand:\n\n" +
        "• 'list tasks' or /list - Show your upcoming tasks\n" +
        "• /start - Get a new verification code\n" +
        "• /help - Show this help message\n\n" +
        "If you need help, just send 'help' and I'll show you this message again."
      )
    })

    // Log any errors that occur during message handling
    bot.catch((err) => {
      console.error('Error in bot message handler:', err)
    })

    // Set up webhook handler
    const handler = webhookCallback(bot, "std/http")
    console.log('Webhook handler set up successfully')
    
    // Process the request with the original request
    const response = await handler(req)
    console.log('Webhook handler processed request successfully')
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
