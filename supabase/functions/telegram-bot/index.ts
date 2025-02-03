import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Bot, webhookCallback } from "https://deno.land/x/grammy@v1.21.1/mod.ts"
import { HfInference } from 'https://esm.sh/@huggingface/inference@2.3.2'

console.log('Initializing Telegram bot...');

const bot = new Bot(Deno.env.get("TELEGRAM_BOT_TOKEN") || "")
const hf = new HfInference(Deno.env.get("HUGGING_FACE_ACCESS_TOKEN"))

// Command handlers
bot.command("start", async (ctx) => {
  console.log('Received /start command from:', ctx.from);
  try {
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2")
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    )

    const telegramId = ctx.from?.id.toString()
    if (!telegramId) {
      console.error('No Telegram ID found in context');
      await ctx.reply("Error: Could not identify Telegram user.")
      return
    }

    console.log('Checking authentication for Telegram ID:', telegramId);

    // Check if user is already authenticated
    const { data: existingUser, error: fetchError } = await supabase
      .from('telegram_users')
      .select('user_id')
      .eq('telegram_id', telegramId)
      .maybeSingle()

    if (fetchError) {
      console.error('Error checking user:', fetchError)
      await ctx.reply("An error occurred while checking your authentication status.")
      return
    }

    if (existingUser) {
      console.log('Existing user found:', existingUser);
      await ctx.reply(
        "👋 Welcome back to your Task Manager bot!\n\n" +
        "You can:\n" +
        "1. Use commands like /tasks and /help\n" +
        "2. Or just chat naturally - I'll understand what you need!\n\n" +
        "Try saying things like:\n" +
        "• Show me my tasks\n" +
        "• Add a task to review the project by Friday\n" +
        "• What's on my todo list?"
      )
      return
    }

    // Generate a unique verification code
    const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    console.log('Generated verification code:', verificationCode);
    
    await ctx.reply(
      "🔐 To use this bot, you need to link it with your Task Manager account.\n\n" +
      "Please follow these steps:\n\n" +
      "1. Go to your Task Manager app\n" +
      "2. Navigate to Settings > Integrations > Telegram\n" +
      "3. Enter this verification code: " + verificationCode + "\n\n" +
      "The code will expire in 10 minutes.\n" +
      "Once verified, you can start using the bot!"
    )
  } catch (error) {
    console.error('Error in start command:', error)
    await ctx.reply("Sorry, there was an error processing your request. Please try again later.")
  }
})

bot.command("help", async (ctx) => {
  await ctx.reply(
    "🤖 Task Manager Bot Help:\n\n" +
    "Commands:\n" +
    "/tasks - List your recent tasks\n" +
    "/add <task> - Add a new task\n\n" +
    "Or just chat naturally! Try saying:\n" +
    "• Create a high priority task for tomorrow\n" +
    "• What tasks are due this week?\n" +
    "• Add a meeting with the team"
  )
})

bot.command("tasks", async (ctx) => {
  try {
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2")
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    )

    // Get user's Telegram ID
    const telegramId = ctx.from?.id.toString()
    
    // Get tasks from Supabase
    const { data: tasks, error } = await supabase
      .from("tasks")
      .select("summary, status, priority, due_date")
      .order("created_at", { ascending: false })
      .limit(5)

    if (error) {
      throw error
    }

    if (!tasks || tasks.length === 0) {
      await ctx.reply("You don't have any tasks yet!")
      return
    }

    const taskList = tasks
      .map((task, index) => {
        const dueDate = task.due_date ? new Date(task.due_date).toLocaleDateString() : "No due date"
        return `${index + 1}. ${task.summary}\n   📅 ${dueDate} | ⚡ ${task.priority} | 📋 ${task.status}`
      })
      .join("\n\n")

    await ctx.reply(
      "📝 Your Recent Tasks:\n\n" + taskList
    )
  } catch (error) {
    console.error("Error fetching tasks:", error)
    await ctx.reply("Sorry, there was an error fetching your tasks. Please try again later.")
  }
})

// Handle natural language messages
bot.on("message:text", async (ctx) => {
  console.log('Received text message:', ctx.message.text);
  try {
    const text = ctx.message.text
    const telegramId = ctx.from?.id.toString()

    if (!telegramId) {
      console.error('No Telegram ID found in message context');
      await ctx.reply("Error: Could not identify Telegram user.")
      return
    }

    // Skip if it's a command
    if (text.startsWith('/')) return

    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2")
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    )

    // Check if user is authenticated
    const { data: telegramUser, error: userError } = await supabase
      .from('telegram_users')
      .select('user_id')
      .eq('telegram_id', telegramId)
      .maybeSingle()

    if (userError || !telegramUser) {
      console.log('User not authenticated:', telegramId);
      await ctx.reply(
        "🔒 You need to authenticate first!\n" +
        "Please use the /start command to begin the authentication process."
      )
      return
    }

    console.log('Processing message:', text)

    // Classify the intent using Hugging Face
    const classification = await hf.textClassification({
      model: 'facebook/bart-large-mnli',
      inputs: text,
      parameters: {
        candidate_labels: [
          "create task",
          "list tasks",
          "update task",
          "delete task",
          "other"
        ]
      }
    })

    console.log('Classification result:', classification)

    const intent = classification.labels[0]
    const confidence = classification.scores[0]

    if (confidence < 0.5) {
      await ctx.reply("I'm not sure what you want to do. Try being more specific or use commands like /tasks or /add.")
      return
    }

    switch (intent) {
      case "create task": {
        // Process task creation using the existing process-task-text function
        const { data, error } = await supabase.functions.invoke('process-task-text', {
          body: { 
            text: text,
            currentTime: new Date().toISOString()
          }
        })

        if (error) throw error

        if (data.type === 'create') {
          const { error: createError } = await supabase
            .from('tasks')
            .insert([{
              summary: data.task.summary,
              description: data.task.description,
              due_date: data.task.dueDate,
              estimated_duration: data.task.estimatedDuration,
              priority: data.task.priority,
              status: "To Do",
              category: data.task.category
            }])

          if (createError) throw createError

          await ctx.reply(
            "✅ Task created!\n\n" +
            `Summary: ${data.task.summary}\n` +
            `Due: ${new Date(data.task.dueDate).toLocaleDateString()}\n` +
            `Priority: ${data.task.priority}\n` +
            `Category: ${data.task.category}`
          )
        }
        break
      }

      case "list tasks": {
        // Reuse the /tasks command logic
        const { data: tasks, error } = await supabase
          .from("tasks")
          .select("summary, status, priority, due_date")
          .order("created_at", { ascending: false })
          .limit(5)

        if (error) throw error

        if (!tasks || tasks.length === 0) {
          await ctx.reply("You don't have any tasks yet!")
          return
        }

        const taskList = tasks
          .map((task, index) => {
            const dueDate = task.due_date ? new Date(task.due_date).toLocaleDateString() : "No due date"
            return `${index + 1}. ${task.summary}\n   📅 ${dueDate} | ⚡ ${task.priority} | 📋 ${task.status}`
          })
          .join("\n\n")

        await ctx.reply("📝 Here are your tasks:\n\n" + taskList)
        break
      }

      default:
        await ctx.reply(
          "I understood you want to " + intent + ", but I'm not sure how to help with that yet.\n" +
          "Try creating or listing tasks, or use /help to see what I can do!"
        )
    }
  } catch (error) {
    console.error("Error processing message:", error)
    await ctx.reply("Sorry, I encountered an error processing your request. Please try again or use /help to see available commands.")
  }
})

// Error handling
bot.catch((err) => {
  console.error("Bot error:", err)
})

// Handle CORS preflight requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  console.log('Received webhook request:', req.method, req.url);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const handler = webhookCallback(bot, "std/http")
    const response = await handler(req)
    return response
  } catch (error) {
    console.error("Webhook error:", error)
    return new Response("Error processing webhook", { status: 500 })
  }
})