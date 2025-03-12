
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

    // Fixed: Start command to work multiple times by fixing the upsert operation
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
        // Check if user exists first
        const { data: existingUser } = await supabase
          .from('telegram_users')
          .select('id, user_id')
          .eq('telegram_id', chatId)
          .maybeSingle()
        
        if (existingUser) {
          if (existingUser.user_id) {
            // User is already verified, just inform them
            await ctx.reply("You are already verified. You can use commands like 'list tasks' or 'priority overview'.")
            return
          }
          
          // User exists but not verified, update verification code
          const { error } = await supabase
            .from('telegram_users')
            .update({ verification_code: verificationCode })
            .eq('telegram_id', chatId)
            
          if (error) {
            console.error('Error updating verification code:', error)
            await ctx.reply("Sorry, there was an error generating your verification code. Please try again.")
            return
          }
        } else {
          // New user, insert record
          const { error } = await supabase
            .from('telegram_users')
            .insert([{ 
              telegram_id: chatId,
              verification_code: verificationCode
            }])
            
          if (error) {
            console.error('Error storing verification code:', error)
            await ctx.reply("Sorry, there was an error generating your verification code. Please try again.")
            return
          }
        }

        console.log('Verification code generated successfully:', verificationCode)
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
        "• 'priority overview' or /priority - Show your task priorities\n" +
        "• /start - Get a new verification code\n" +
        "• /help - Show this help message\n\n" +
        "You can also simply chat with me using natural language and I'll try to assist you."
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

    // New: Priority overview command
    bot.command("priority", async (ctx) => {
      console.log('Priority command received from:', ctx.chat.id)
      await handlePriorityOverview(ctx)
    })

    // Handle text messages for commands without /
    bot.hears("help", async (ctx) => {
      console.log('Help text received from:', ctx.chat.id)
      await ctx.reply(
        "Here are the commands I understand:\n\n" +
        "• 'list tasks' or /list - Show your upcoming tasks\n" +
        "• 'priority overview' or /priority - Show your task priorities\n" +
        "• /start - Get a new verification code\n" +
        "• /help - Show this help message\n\n" +
        "You can also simply chat with me using natural language and I'll try to assist you."
      )
    })

    bot.hears("list tasks", async (ctx) => {
      console.log('List tasks text received from:', ctx.chat.id)
      await bot.commands.get("list")?.(ctx)
    })

    // New: Handle "priority overview" text command
    bot.hears("priority overview", async (ctx) => {
      console.log('Priority overview text received from:', ctx.chat.id)
      await handlePriorityOverview(ctx)
    })
    
    // New: AI-powered free text handling
    bot.on("message", async (ctx) => {
      console.log('Received message:', JSON.stringify(ctx.message, null, 2))
      if (!ctx.message.text) {
        await ctx.reply("I can only process text messages.")
        return
      }

      const text = ctx.message.text.toLowerCase()
      console.log('Processing text message:', text)
      
      // Skip if message was already handled by command handlers
      if (
        text.startsWith('/') || 
        text === "help" || 
        text === "list tasks" || 
        text === "priority overview"
      ) {
        return
      }
      
      // Process as free text query
      await handleFreeTextQuery(ctx)
    })

    // Function to handle priority overview
    async function handlePriorityOverview(ctx) {
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

        // Fetch tasks and group by priority
        const { data: tasks, error: tasksError } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', telegramUser.user_id)
          .neq('status', 'Done')

        if (tasksError) {
          console.error('Error fetching tasks:', tasksError)
          await ctx.reply("Sorry, there was an error fetching your tasks. Please try again.")
          return
        }

        if (!tasks?.length) {
          await ctx.reply("You don't have any active tasks yet.")
          return
        }

        // Group tasks by priority
        const priorityGroups = {
          'High': [],
          'Medium': [],
          'Low': []
        };

        tasks.forEach(task => {
          if (priorityGroups[task.priority]) {
            priorityGroups[task.priority].push(task);
          }
        });

        let response = "📊 *PRIORITY OVERVIEW* 📊\n\n";

        for (const [priority, priorityTasks] of Object.entries(priorityGroups)) {
          if (priorityTasks.length > 0) {
            const emoji = priority === 'High' ? '🔴' : (priority === 'Medium' ? '🟠' : '🟢');
            response += `${emoji} *${priority} Priority (${priorityTasks.length})*\n`;
            
            priorityTasks.slice(0, 3).forEach(task => {
              response += `• ${task.summary}\n`;
            });
            
            if (priorityTasks.length > 3) {
              response += `  _...and ${priorityTasks.length - 3} more_\n`;
            }
            
            response += '\n';
          }
        }

        const totalTasks = tasks.length;
        const highPriorityCount = priorityGroups['High'].length;
        const mediumPriorityCount = priorityGroups['Medium'].length;
        const lowPriorityCount = priorityGroups['Low'].length;

        response += `*Summary:* You have ${totalTasks} active tasks\n`;
        response += `🔴 High: ${highPriorityCount} | 🟠 Medium: ${mediumPriorityCount} | 🟢 Low: ${lowPriorityCount}`;

        await ctx.reply(response, { parse_mode: 'Markdown' });
      } catch (error) {
        console.error('Unexpected error in priority overview:', error)
        await ctx.reply("An unexpected error occurred. Please try again later.")
      }
    }

    // Function to handle free text queries with AI
    async function handleFreeTextQuery(ctx) {
      const chatId = ctx.chat.id.toString()
      const userMessage = ctx.message.text
      
      const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2")
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      try {
        // First check if user is verified
        const { data: telegramUser, error: userError } = await supabase
          .from('telegram_users')
          .select('*')
          .eq('telegram_id', chatId)
          .maybeSingle()

        if (userError) {
          console.error('Error fetching telegram user:', userError)
          await ctx.reply("Sorry, there was an error processing your message. Please try again.")
          return
        }

        if (!telegramUser?.user_id) {
          await ctx.reply("Your Telegram account is not linked yet. Please use the /start command to get a verification code.")
          return
        }

        // Fetch user's tasks for context
        const { data: tasks, error: tasksError } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', telegramUser.user_id)
          .order('due_date', { ascending: true })
          .limit(10)

        if (tasksError) {
          console.error('Error fetching tasks for AI context:', tasksError)
        }

        // Process with OpenAI if API key is available
        const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
        if (!openaiApiKey) {
          console.log('No OpenAI API key found, using fallback response')
          await ctx.reply("I understand you're trying to ask me something, but I'm not sure how to help with that specific request. Try using one of my commands like 'list tasks' or 'priority overview' instead.")
          return
        }

        await ctx.reply("Processing your request...");

        // Create a context with user's tasks
        let taskContext = "The user has no tasks."
        if (tasks && tasks.length > 0) {
          taskContext = "Here are the user's current tasks:\n" + 
            tasks.map((task, i) => 
              `${i+1}. ${task.summary} (Priority: ${task.priority}, Status: ${task.status}, Due: ${task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No date'})`
            ).join("\n")
        }

        // Call OpenAI
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${openaiApiKey}`
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system", 
                content: `You are a helpful task management assistant in a Telegram bot.
                You help users understand their tasks and priorities. Keep responses brief and conversational.
                Available commands: 'list tasks', 'priority overview', '/start', '/help'.
                ${taskContext}`
              },
              { role: "user", content: userMessage }
            ],
            max_tokens: 500
          })
        });

        if (!response.ok) {
          const error = await response.text();
          console.error('OpenAI API error:', error);
          await ctx.reply("I'm having trouble processing your request right now. Please try one of my standard commands like 'list tasks' or 'priority overview'.");
          return;
        }

        const data = await response.json();
        const aiResponse = data.choices[0].message.content;
        
        await ctx.reply(aiResponse);
      } catch (error) {
        console.error('Error in AI response:', error)
        await ctx.reply("I'm sorry, but I encountered an error while processing your message. Please try using standard commands like 'list tasks' or 'priority overview'.")
      }
    }

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
