import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Bot, webhookCallback } from "https://deno.land/x/grammy@v1.21.1/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    console.log('Received request body:', body)

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

      return new Response(
        JSON.stringify({ success: true }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Handle Telegram webhook updates
    const bot = new Bot(Deno.env.get('TELEGRAM_BOT_TOKEN') ?? '')

    bot.command("start", async (ctx) => {
      const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase()
      const chatId = ctx.chat.id.toString()
      
      console.log('Generated verification code:', verificationCode, 'for chat ID:', chatId)
      
      const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2")
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      // Store the verification code
      const { error } = await supabase
        .from('telegram_users')
        .insert([
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
      
      await ctx.reply(`Welcome! Your verification code is: ${verificationCode}\n\nPlease enter this code in the web application to link your Telegram account.`)
    })

    bot.on("message", async (ctx) => {
      const messageText = ctx.message.text
      const chatId = ctx.chat.id.toString()

      if (!messageText) {
        await ctx.reply("I can only process text messages.")
        return
      }

      console.log('Received message:', messageText, 'from chat ID:', chatId)

      const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2")
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      // Check if the user is verified
      const { data: telegramUser } = await supabase
        .from('telegram_users')
        .select('user_id')
        .eq('telegram_id', chatId)
        .single()

      if (!telegramUser?.user_id) {
        await ctx.reply("Your Telegram account is not linked yet. Please use the /start command to get a verification code.")
        return
      }

      // Process the message based on content
      if (messageText.toLowerCase().includes('list tasks')) {
        const { data: tasks } = await supabase
          .from('tasks')
          .select('summary, due_date')
          .eq('user_id', telegramUser.user_id)
          .order('due_date', { ascending: true })
          .limit(5)

        if (!tasks?.length) {
          await ctx.reply("You don't have any tasks yet.")
          return
        }

        const taskList = tasks
          .map(task => `• ${task.summary} ${task.due_date ? `(Due: ${new Date(task.due_date).toLocaleDateString()})` : ''}`)
          .join('\n')

        await ctx.reply(`Here are your latest tasks:\n\n${taskList}`)
      } else {
        await ctx.reply("I understand you want to interact with your tasks. You can try commands like 'list tasks' to see your upcoming tasks.")
      }
    })

    const handler = webhookCallback(bot, "std/http")
    const response = await handler(req)
    
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