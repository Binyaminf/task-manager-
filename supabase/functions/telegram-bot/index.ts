
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

    // Set command handlers first, before handling the webhook
    bot.command("start", async (ctx) => {
      console.log('Start command received from:', ctx.chat.id)
      console.log('Full start command context:', JSON.stringify(ctx.update, null, 2))
      
      const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase()
      const chatId = ctx.chat.id.toString()
      
      const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2")
      const supabaseUrl = Deno.env.get('SUPABASE_URL')
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
      
      if (!supabaseUrl || !supabaseKey) {
        console.error('Supabase credentials missing:', { supabaseUrl: !!supabaseUrl, supabaseKey: !!supabaseKey })
        await ctx.reply("Sorry, there was an error with the bot configuration. Please try again later.")
        return
      }

      const supabase = createClient(supabaseUrl, supabaseKey)
      console.log('Supabase client initialized with service role for verification code storage')

      try {
        // Store or update the verification code
        const { error } = await supabase
          .from('telegram_users')
          .upsert([
            { 
              telegram_id: chatId,
              verification_code: verificationCode
            }
          ], {
            onConflict: 'telegram_id'
          })

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

    // Handle all other messages
    bot.on("message", async (ctx) => {
      try {
        console.log('Message handler triggered')
        console.log('Message type:', ctx.update.message?.text ? 'text' : 'other')
        console.log('Full context:', JSON.stringify(ctx.update, null, 2))
        
        const rawMessageText = ctx.message?.text
        console.log('Raw message text:', rawMessageText)
        
        if (!rawMessageText) {
          console.log('No message text found')
          await ctx.reply("I can only process text messages.")
          return
        }

        const messageText = rawMessageText.toLowerCase()
        const chatId = ctx.chat.id.toString()
        console.log('Processing message:', messageText, 'from chat ID:', chatId)

        // Initialize Supabase client with service role
        const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2")
        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
        
        if (!supabaseUrl || !supabaseKey) {
          console.error('Supabase credentials not found')
          throw new Error('Database configuration missing')
        }

        const supabase = createClient(supabaseUrl, supabaseKey)
        console.log('Supabase client initialized with service role')

        // Check if the user is verified
        const { data: telegramUser, error: userError } = await supabase
          .from('telegram_users')
          .select('*')
          .eq('telegram_id', chatId)
          .maybeSingle()

        console.log('Telegram user query result:', { data: telegramUser, error: userError })

        if (userError) {
          console.error('Error checking user verification:', userError)
          await ctx.reply("Sorry, there was an error processing your request. Please try again.")
          return
        }

        // If user is not verified or has no user_id, provide guidance
        if (!telegramUser?.user_id) {
          console.log('User not verified, telegramUser:', telegramUser)
          await ctx.reply("Your Telegram account is not linked yet. Please use the /start command to get a verification code.")
          return
        }

        console.log('User is verified with user_id:', telegramUser.user_id)

        // Process the message based on content
        if (messageText.includes('list tasks')) {
          console.log('Fetching tasks for user:', telegramUser.user_id)
          
          const { data: tasks, error: tasksError } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', telegramUser.user_id)
            .order('due_date', { ascending: true })
            .limit(5)

          console.log('Tasks query result:', { data: tasks, error: tasksError })

          if (tasksError) {
            console.error('Error fetching tasks:', tasksError)
            await ctx.reply("Sorry, there was an error fetching your tasks. Please try again.")
            return
          }

          if (!tasks?.length) {
            console.log('No tasks found')
            await ctx.reply("You don't have any tasks yet.")
            return
          }

          console.log('Found tasks:', tasks)
          const taskList = tasks
            .map(task => `• ${task.summary}${task.due_date ? ` (Due: ${new Date(task.due_date).toLocaleDateString()})` : ''}`)
            .join('\n')

          await ctx.reply(`Here are your latest tasks:\n\n${taskList}`)
          console.log('Successfully sent task list to user')
        } else if (messageText === 'help') {
          await ctx.reply(
            "Here are the commands I understand:\n\n" +
            "• 'list tasks' - Show your upcoming tasks\n" +
            "• /start - Get a new verification code\n\n" +
            "If you need help, just send 'help' and I'll show you this message again."
          )
        } else {
          console.log('Sending help message for unknown command')
          await ctx.reply(
            "I don't understand that command. Here are the commands I understand:\n\n" +
            "• 'list tasks' - Show your upcoming tasks\n" +
            "• /start - Get a new verification code\n\n" +
            "If you need help, just send 'help' and I'll show you this message again."
          )
        }
      } catch (error) {
        console.error('Error in message handler:', error)
        await ctx.reply("Sorry, there was an error processing your message. Please try again.")
      }
    })

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

    // Set up webhook if it's a setup request
    if (body.action === 'setup-webhook') {
      const webhookUrl = body.webhookUrl
      console.log('Setting up webhook URL:', webhookUrl)
      
      try {
        await bot.api.setWebhook(webhookUrl)
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

    // Set up webhook handler with error logging
    try {
      const handler = webhookCallback(bot, "std/http")
      console.log('Webhook handler set up successfully')
      
      const response = await handler(req)
      console.log('Webhook handler processed request')
      
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
      console.error('Error in webhook handler:', error)
      throw error
    }

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

