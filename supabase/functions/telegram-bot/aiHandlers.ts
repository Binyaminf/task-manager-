
import { gatherUserContext } from "./userContext.ts";

export async function handleEnhancedFreeTextQuery(ctx: any) {
  const chatId = ctx.chat.id.toString()
  const userMessage = ctx.message.text
  
  console.log('Processing enhanced free text query:', userMessage)
  
  const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2")
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
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
      await ctx.reply("🔗 Link your account with /start to unlock enhanced AI conversations!")
      return
    }

    // Gather user context for enhanced responses
    const userContext = await gatherUserContext(telegramUser.user_id);

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      console.log('No OpenAI API key found, using enhanced fallback response')
      await ctx.reply(
        "🤖 I understand you're asking me something! Here are some things I can help with:\n\n" +
        "📝 Create tasks by describing them naturally\n" +
        "📋 'list tasks' - See your active tasks\n" +
        "📊 'priority overview' - See task priorities\n" +
        "🎯 'what should I work on?' - Get AI recommendations\n" +
        "❓ /help - See all commands\n\n" +
        "Try describing a task or asking for your task overview!"
      )
      return
    }

    await ctx.reply("🧠 Processing your request with enhanced AI...");

    // Enhanced context with user's task data
    let taskContext = "The user has no tasks yet."
    if (userContext.totalTasks > 0) {
      const { data: recentTasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', telegramUser.user_id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (recentTasks && recentTasks.length > 0) {
        taskContext = "Here are the user's recent tasks:\n" + 
          recentTasks.map((task, i) => 
            `${i+1}. ${task.summary} (Priority: ${task.priority}, Status: ${task.status}, Due: ${task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No date'})`
          ).join("\n") +
          `\n\nUser patterns: Common categories: ${userContext.commonCategories.join(", ")}, Typical priority: ${userContext.mostUsedPriority}, Average duration: ${userContext.averageDuration}`
      }
    }

    console.log('Sending enhanced request to OpenAI')
    
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
            content: `You are an enhanced AI task management assistant in a Telegram bot.
            You help users understand their tasks, provide intelligent recommendations, and assist with productivity.
            You have access to their task history and patterns to provide personalized advice.
            Keep responses brief, friendly, and actionable. Use emojis appropriately.
            
            Available commands: 'create task: [description]', 'list tasks', 'priority overview', 'what should I work on?', '/start', '/help'.
            
            Current user context:
            ${taskContext}
            
            You can suggest specific actions like creating tasks, checking priorities, or working on specific items based on their patterns.`
          },
          { role: "user", content: userMessage }
        ],
        max_tokens: 300,
        temperature: 0.7
      })
    });

    console.log('Enhanced OpenAI response status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenAI API error:', errorText)
      await ctx.reply("🤔 I'm having trouble processing your request right now. Please try one of my standard commands like 'list tasks' or 'priority overview'.")
      return
    }

    const data = await response.json()
    console.log('Enhanced OpenAI response:', JSON.stringify(data, null, 2))
    
    const aiResponse = data.choices[0].message.content
    await ctx.reply(aiResponse)
  } catch (error) {
    console.error('Error in enhanced AI response:', error)
    await ctx.reply("❌ I encountered an error while processing your message. Please try using standard commands like 'list tasks' or 'priority overview'.")
  }
}
