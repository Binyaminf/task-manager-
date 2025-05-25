
import { gatherUserContext } from "./userContext.ts";

export async function handleStartCommand(ctx: any) {
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
        // User is already verified, show enhanced capabilities
        await ctx.reply(
          "🚀 *Welcome back!* Your account is verified and ready.\n\n" +
          "✨ *Enhanced AI Features:*\n" +
          "• Smart task creation with context awareness\n" +
          "• Intelligent priority and deadline suggestions\n" +
          "• Learning from your task patterns\n\n" +
          "💬 *Try saying:*\n" +
          "• \"Create a task to finish the report by Friday\"\n" +
          "• \"List my high priority tasks\"\n" +
          "• \"Show my task overview\"\n" +
          "• \"What should I work on next?\"",
          { parse_mode: 'Markdown' }
        )
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
    await ctx.reply(
      `🔗 *Link Your Account*\n\n` +
      `Your verification code is: \`${verificationCode}\`\n\n` +
      `Enter this code in the web application to unlock:\n` +
      `✨ Enhanced AI task processing\n` +
      `🧠 Context-aware suggestions\n` +
      `📊 Smart priority detection\n` +
      `📅 Intelligent scheduling\n\n` +
      `Once linked, I'll learn from your task patterns to provide better assistance!`,
      { parse_mode: 'Markdown' }
    )
  } catch (error) {
    console.error('Unexpected error in start command:', error)
    await ctx.reply("An unexpected error occurred. Please try again later.")
  }
}

export async function handleHelpCommand(ctx: any) {
  console.log('Help command received from:', ctx.chat.id)
  await ctx.reply(
    "🤖 *Enhanced AI Task Assistant*\n\n" +
    "💡 *Smart Commands:*\n" +
    "• Just describe your task naturally - I'll understand!\n" +
    "• 'create task: [description]' - Create with AI analysis\n" +
    "• 'list tasks' or /list - Show your tasks\n" +
    "• 'priority overview' or /priority - Priority breakdown\n" +
    "• 'what should I work on?' - AI recommendations\n\n" +
    "🔧 *System Commands:*\n" +
    "• /start - Get verification code\n" +
    "• /help - Show this help\n\n" +
    "✨ *AI Features:*\n" +
    "• Learns from your task history\n" +
    "• Smart priority detection\n" +
    "• Context-aware scheduling\n" +
    "• Confidence scoring for suggestions",
    { parse_mode: 'Markdown' }
  )
}

export async function handleListTasks(ctx: any) {
  const chatId = ctx.chat.id.toString()
  
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
      await ctx.reply("Sorry, there was an error checking your verification status. Please try again.")
      return
    }

    if (!telegramUser?.user_id) {
      await ctx.reply("🔗 Your Telegram account isn't linked yet. Use /start to get a verification code and unlock enhanced features!")
      return
    }

    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', telegramUser.user_id)
      .neq('status', 'Done')
      .order('due_date', { ascending: true })
      .limit(8)

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError)
      await ctx.reply("Sorry, there was an error fetching your tasks. Please try again.")
      return
    }

    if (!tasks?.length) {
      await ctx.reply("📝 You don't have any active tasks yet. Try creating one by describing it naturally!")
      return
    }

    let taskList = "📋 *Your Active Tasks*\n\n"
    
    tasks.forEach((task, index) => {
      const priority = task.priority === 'High' ? '🔴' : task.priority === 'Medium' ? '🟠' : '🟢'
      const dueInfo = task.due_date ? ` (Due: ${new Date(task.due_date).toLocaleDateString()})` : ''
      taskList += `${priority} ${task.summary}${dueInfo}\n`
    })

    if (tasks.length >= 8) {
      taskList += "\n_Showing first 8 tasks. Use the web app to see all tasks._"
    }

    await ctx.reply(taskList, { parse_mode: 'Markdown' })
  } catch (error) {
    console.error('Unexpected error in list command:', error)
    await ctx.reply("An unexpected error occurred. Please try again later.")
  }
}

export async function handlePriorityOverview(ctx: any) {
  const chatId = ctx.chat.id.toString()
  
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
      await ctx.reply("Sorry, there was an error checking your verification status. Please try again.")
      return
    }

    if (!telegramUser?.user_id) {
      await ctx.reply("🔗 Your Telegram account isn't linked yet. Use /start to get a verification code and unlock enhanced features!")
      return
    }

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
      await ctx.reply("📝 You don't have any active tasks yet. Try creating one by describing it naturally!")
      return
    }

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

    response += `*Summary:* ${totalTasks} active tasks\n`;
    response += `🔴 High: ${highPriorityCount} | 🟠 Medium: ${mediumPriorityCount} | 🟢 Low: ${lowPriorityCount}`;

    await ctx.reply(response, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Unexpected error in priority overview:', error)
    await ctx.reply("An unexpected error occurred. Please try again later.")
  }
}

export async function handleAIRecommendations(ctx: any) {
  const chatId = ctx.chat.id.toString()
  
  const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2")
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    const { data: telegramUser } = await supabase
      .from('telegram_users')
      .select('*')
      .eq('telegram_id', chatId)
      .maybeSingle()

    if (!telegramUser?.user_id) {
      await ctx.reply("🔗 Link your account with /start to get AI recommendations!")
      return
    }

    await ctx.reply("🧠 Analyzing your tasks to provide recommendations...")

    // Get user's tasks
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', telegramUser.user_id)
      .neq('status', 'Done')
      .order('due_date', { ascending: true })

    if (!tasks?.length) {
      await ctx.reply("📝 You don't have any active tasks. Create some tasks first, then I can provide intelligent recommendations!")
      return
    }

    // Analyze tasks for recommendations
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const overdueTasks = tasks.filter(t => t.due_date && t.due_date < today)
    const todayTasks = tasks.filter(t => t.due_date === today)
    const tomorrowTasks = tasks.filter(t => t.due_date === tomorrow)
    const highPriorityTasks = tasks.filter(t => t.priority === 'High')
    const quickTasks = tasks.filter(t => t.estimated_duration && 
      (t.estimated_duration.includes('30m') || t.estimated_duration.includes('1h')))

    let recommendations = "🎯 *AI Recommendations*\n\n"

    if (overdueTasks.length > 0) {
      recommendations += `🚨 *Urgent: ${overdueTasks.length} overdue tasks*\n`
      recommendations += `• ${overdueTasks[0].summary}\n`
      if (overdueTasks.length > 1) {
        recommendations += `• And ${overdueTasks.length - 1} more...\n`
      }
      recommendations += "\n"
    }

    if (todayTasks.length > 0) {
      recommendations += `📅 *Today: ${todayTasks.length} tasks due*\n`
      recommendations += `• ${todayTasks[0].summary}\n`
      if (todayTasks.length > 1) {
        recommendations += `• And ${todayTasks.length - 1} more...\n`
      }
      recommendations += "\n"
    }

    if (highPriorityTasks.length > 0) {
      recommendations += `🔴 *High Priority: ${highPriorityTasks.length} tasks*\n`
      recommendations += `• ${highPriorityTasks[0].summary}\n`
      recommendations += "\n"
    }

    if (quickTasks.length > 0) {
      recommendations += `⚡ *Quick Wins: ${quickTasks.length} short tasks*\n`
      recommendations += `• ${quickTasks[0].summary} (${quickTasks[0].estimated_duration})\n`
      recommendations += "\n"
    }

    // AI suggestion
    if (overdueTasks.length > 0) {
      recommendations += "💡 *AI Suggestion:* Start with overdue tasks to get back on track!"
    } else if (todayTasks.length > 0) {
      recommendations += "💡 *AI Suggestion:* Focus on today's tasks first!"
    } else if (highPriorityTasks.length > 0) {
      recommendations += "💡 *AI Suggestion:* Tackle high priority tasks while you have energy!"
    } else if (quickTasks.length > 0) {
      recommendations += "💡 *AI Suggestion:* Start with quick tasks to build momentum!"
    } else {
      recommendations += "💡 *AI Suggestion:* Great job staying on top of things! Consider working on longer-term tasks."
    }

    await ctx.reply(recommendations, { parse_mode: 'Markdown' })
  } catch (error) {
    console.error('Error in AI recommendations:', error)
    await ctx.reply("❌ Error generating recommendations. Please try again.")
  }
}
