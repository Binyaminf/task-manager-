import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Bot, webhookCallback } from "https://deno.land/x/grammy@v1.21.1/mod.ts"

const bot = new Bot(Deno.env.get("TELEGRAM_BOT_TOKEN") || "")

// Command handlers
bot.command("start", async (ctx) => {
  await ctx.reply(
    "👋 Welcome to your Task Manager bot!\n\n" +
    "Available commands:\n" +
    "/tasks - List your tasks\n" +
    "/add - Add a new task\n" +
    "/help - Show this help message"
  )
})

bot.command("help", async (ctx) => {
  await ctx.reply(
    "🤖 Task Manager Bot Help:\n\n" +
    "/tasks - List your recent tasks\n" +
    "/add <task> - Add a new task\n" +
    "Example: /add Buy groceries"
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

bot.command("add", async (ctx) => {
  try {
    const taskSummary = ctx.match
    if (!taskSummary) {
      await ctx.reply("Please provide a task description.\nExample: /add Buy groceries")
      return
    }

    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2")
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    )

    // Get user's Telegram ID
    const telegramId = ctx.from?.id.toString()

    // Add task to Supabase
    const { data: task, error } = await supabase
      .from("tasks")
      .insert([{
        summary: taskSummary,
        status: "TODO",
        priority: "MEDIUM",
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        estimated_duration: "1h",
        category: "Telegram"
      }])
      .select()
      .single()

    if (error) {
      throw error
    }

    await ctx.reply(
      "✅ Task added successfully!\n\n" +
      `Summary: ${task.summary}\n` +
      `Status: ${task.status}\n` +
      `Priority: ${task.priority}\n` +
      `Due Date: ${new Date(task.due_date).toLocaleDateString()}`
    )
  } catch (error) {
    console.error("Error adding task:", error)
    await ctx.reply("Sorry, there was an error adding your task. Please try again later.")
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