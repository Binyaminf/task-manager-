
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
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Log request details
    console.log('Request method:', req.method);
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));
    
    const body = await req.json()
    console.log('Received webhook request:', JSON.stringify(body, null, 2))

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
      const webhookUrl = body.webhookUrl
      console.log('Setting up webhook URL:', webhookUrl)
      
      try {
        // Remove any existing webhook first
        await bot.api.deleteWebhook()
        console.log('Deleted existing webhook')
        
        // Set the new webhook
        await bot.api.setWebhook(webhookUrl)
        console.log('Set new webhook successfully')
        
        return new Response(
          JSON.stringify({ success: true, message: 'Webhook set successfully' }),
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

      // Check if the user is verified
      const { data: telegramUser, error: userError } = await supabase
        .from('telegram_users')
        .select('*')
        .eq('telegram_id', chatId)
        .maybeSingle()

      if (userError || !telegramUser?.user_id) {
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
      const chatId = ctx.chat.id.toString()
      const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2")
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      // Check if the user is verified
      const { data: telegramUser, error: userError } = await supabase
        .from('telegram_users')
        .select('*')
        .eq('telegram_id', chatId)
        .maybeSingle()

      if (userError || !telegramUser?.user_id) {
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
    })

    // Handle all other messages
    bot.on("message", async (ctx) => {
      console.log('Received message:', ctx.message)
      if (!ctx.message.text) {
        await ctx.reply("I can only process text messages.")
        return
      }

      // For unrecognized commands, show help message
      await ctx.reply(
        "I don't understand that command. Here are the commands I understand:\n\n" +
        "• 'list tasks' or /list - Show your upcoming tasks\n" +
        "• /start - Get a new verification code\n" +
        "• /help - Show this help message\n\n" +
        "If you need help, just send 'help' and I'll show you this message again."
      )
    })

    // Set up webhook handler
    const handler = webhookCallback(bot, "std/http")
    console.log('Webhook handler set up successfully')
    
    const response = await handler(req)
    console.log('Webhook handler processed request successfully')
    
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
