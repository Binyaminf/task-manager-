
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
    const body = await req.json()
    console.log('Received request body:', body)

    const bot = new Bot(Deno.env.get('TELEGRAM_BOT_TOKEN') ?? '')
    
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

    // Handle verification from web app
    if (body.action === 'verify') {
      if (!body.code) {
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
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      console.log('Looking for verification code:', body.code.toUpperCase())

      // Find the telegram user with this verification code
      const { data: telegramUser, error: findError } = await supabase
        .from('telegram_users')
        .select('*')
        .eq('verification_code', body.code.toUpperCase())
        .single()

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

      // Send confirmation message to the user
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

    // Set up bot commands
    bot.command("start", async (ctx) => {
      console.log('Received start command from chat ID:', ctx.chat.id)
      
      const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase()
      const chatId = ctx.chat.id.toString()
      
      const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2")
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

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
      
      await ctx.reply(`Welcome! Your verification code is: ${verificationCode}\n\nPlease enter this code in the web application to link your Telegram account.`)
    })

    // Handle all other messages
    bot.on("message", async (ctx) => {
      try {
        console.log('Received message event')
        
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

        const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2")
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Check if the user is verified
        const { data: telegramUser, error: userError } = await supabase
          .from('telegram_users')
          .select('user_id')
          .eq('telegram_id', chatId)
          .maybeSingle()

        console.log('Telegram user data:', telegramUser, 'Error:', userError)

        if (userError) {
          console.error('Error checking user verification:', userError)
          await ctx.reply("Sorry, there was an error processing your request. Please try again.")
          return
        }

        // If user is not verified, provide guidance
        if (!telegramUser?.user_id) {
          console.log('User not verified')
          if (!messageText.startsWith('/start')) {
            await ctx.reply("Your Telegram account is not linked yet. Please use the /start command to get a verification code.")
          }
          return
        }

        console.log('User is verified, user_id:', telegramUser.user_id)

        // Process the message based on content
        if (messageText.includes('list tasks')) {
          console.log('Fetching tasks for user')
          const { data: tasks, error: tasksError } = await supabase
            .from('tasks')
            .select('summary, due_date')
            .eq('user_id', telegramUser.user_id)
            .order('due_date', { ascending: true })
            .limit(5)

          console.log('Tasks query result:', tasks, 'Error:', tasksError)

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
        } else {
          console.log('Unknown command')
          await ctx.reply("I understand you want to interact with your tasks. You can try commands like 'list tasks' to see your upcoming tasks.")
        }
      } catch (error) {
        console.error('Error in message handler:', error)
        await ctx.reply("Sorry, there was an error processing your message. Please try again.")
      }
    })

    // Set up webhook handler
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
