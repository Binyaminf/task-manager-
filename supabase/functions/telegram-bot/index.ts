import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Bot, webhookCallback } from "https://deno.land/x/grammy@v1.21.1/mod.ts"
import { HfInference } from 'https://esm.sh/@huggingface/inference@2.3.2'

const bot = new Bot(Deno.env.get("TELEGRAM_BOT_TOKEN") || "")
const hf = new HfInference(Deno.env.get("HUGGING_FACE_ACCESS_TOKEN"))

// Command handlers
bot.command("start", async (ctx) => {
  await ctx.reply(
    "👋 Welcome to your Task Manager bot!\n\n" +
    "You can:\n" +
    "1. Use commands like /tasks and /help\n" +
    "2. Or just chat naturally - I'll understand what you need!\n\n" +
    "Try saying things like:\n" +
    "• Show me my tasks\n" +
    "• Add a task to review the project by Friday\n" +
    "• What's on my todo list?"
  )
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
  try {
    const text = ctx.message.text

    // Skip if it's a command
    if (text.startsWith('/')) return

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

    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2")
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    )

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