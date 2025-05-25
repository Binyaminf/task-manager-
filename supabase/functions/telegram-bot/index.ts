import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Bot, webhookCallback } from "https://deno.land/x/grammy@v1.21.1/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Task interface
interface Task {
  id?: string;
  user_id?: string;
  summary: string;
  description?: string;
  dueDate: string;
  estimatedDuration: string;
  priority: "High" | "Medium" | "Low";
  status: "To Do" | "In Progress" | "Done";
  category: string;
  externalLinks?: string[];
  folder_id?: string | null;
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
        await bot.api.sendMessage(telegramUser.telegram_id, '🎉 Your account has been successfully verified! You can now use enhanced commands like "list tasks", "priority overview", or create tasks with intelligent AI analysis.')
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

    // Enhanced user context gathering function
    const gatherUserContext = async (userId: string): Promise<any> => {
      const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2")
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      try {
        // Get user's recent tasks for context
        const { data: recentTasks } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(20)

        // Analyze user patterns
        const categories = recentTasks?.map(t => t.category).filter(Boolean) || []
        const priorities = recentTasks?.map(t => t.priority) || []
        const durations = recentTasks?.map(t => t.estimated_duration).filter(Boolean) || []

        const categoryFreq = categories.reduce((acc, cat) => {
          acc[cat] = (acc[cat] || 0) + 1
          return acc
        }, {} as Record<string, number>)

        const priorityFreq = priorities.reduce((acc, pri) => {
          acc[pri] = (acc[pri] || 0) + 1
          return acc
        }, {} as Record<string, number>)

        return {
          recentTasks: recentTasks || [],
          commonCategories: Object.keys(categoryFreq).sort((a, b) => categoryFreq[b] - categoryFreq[a]).slice(0, 5),
          mostUsedPriority: Object.keys(priorityFreq).sort((a, b) => priorityFreq[b] - priorityFreq[a])[0] || 'Medium',
          averageDuration: durations.length > 0 ? '2h' : '1h',
          totalTasks: recentTasks?.length || 0
        }
      } catch (error) {
        console.error('Error gathering user context:', error)
        return { recentTasks: [], commonCategories: [], mostUsedPriority: 'Medium', averageDuration: '1h', totalTasks: 0 }
      }
    }

    // Enhanced start command
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
    })

    // Enhanced help command
    bot.command("help", async (ctx) => {
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
    })

    // Enhanced list command
    bot.command("list", async (ctx) => {
      console.log('List command received from:', ctx.chat.id)
      await handleListTasks(ctx)
    })

    // Enhanced priority command
    bot.command("priority", async (ctx) => {
      console.log('Priority command received from:', ctx.chat.id)
      await handlePriorityOverview(ctx)
    })

    // NEW: AI recommendations command
    bot.command("recommend", async (ctx) => {
      console.log('Recommend command received from:', ctx.chat.id)
      await handleAIRecommendations(ctx)
    })

    // Enhanced create command
    bot.command("create", async (ctx) => {
      console.log('Create command received from:', ctx.chat.id)
      const text = ctx.message?.text?.replace('/create', '').trim();
      if (!text) {
        await ctx.reply("📝 Please provide a task description.\n\n*Example:* `/create Finish project report by Friday - high priority`");
        return;
      }
      await handleEnhancedTaskCreation(ctx, text);
    });

    // Enhanced text message handlers
    bot.hears("help", async (ctx) => {
      console.log('Help text received from:', ctx.chat.id)
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
    })

    bot.hears("list tasks", async (ctx) => {
      console.log('List tasks text received from:', ctx.chat.id)
      await handleListTasks(ctx)
    })

    bot.hears("priority overview", async (ctx) => {
      console.log('Priority overview text received from:', ctx.chat.id)
      await handlePriorityOverview(ctx)
    })

    // NEW: AI recommendation triggers
    bot.hears(/what should I work on/i, async (ctx) => {
      console.log('AI recommendation request received')
      await handleAIRecommendations(ctx)
    })

    bot.hears(/recommendations?/i, async (ctx) => {
      console.log('AI recommendation request received')
      await handleAIRecommendations(ctx)
    })
    
    bot.hears(/create task:(.+)/i, async (ctx) => {
      console.log('Create task pattern matched');
      const text = ctx.match[1].trim();
      await handleEnhancedTaskCreation(ctx, text);
    });
    
    // Enhanced free text handling
    bot.on("message:text", async (ctx) => {
      if (!ctx.message.text) return
      
      const text = ctx.message.text.toLowerCase()
      console.log('Processing text message:', text)
      
      // Skip if message was already handled
      if (
        text.startsWith('/') || 
        text === "help" || 
        text === "list tasks" || 
        text === "priority overview" ||
        text.toLowerCase().startsWith('create task:') ||
        /what should I work on/i.test(text) ||
        /recommendations?/i.test(text)
      ) {
        return
      }
      
      // Enhanced task detection
      if (isProbablyTaskDescription(text)) {
        await ctx.reply("🤖 This looks like a task description. Let me create it with enhanced AI analysis...");
        await handleEnhancedTaskCreation(ctx, ctx.message.text);
        return;
      }
      
      // Process as general query with enhanced AI
      await handleEnhancedFreeTextQuery(ctx)
    })

    // Enhanced task description detection
    function isProbablyTaskDescription(text: string): boolean {
      const taskKeywords = [
        'todo', 'to-do', 'to do', 'task', 'finish', 'complete', 'work on', 'create', 
        'prepare', 'write', 'send', 'review', 'check', 'call', 'email', 'meeting',
        'appointment', 'deadline', 'schedule', 'remind', 'remember', 'need to', 'have to',
        'should', 'must', 'urgent', 'important', 'asap'
      ];
      
      const timeKeywords = [
        'today', 'tomorrow', 'next week', 'monday', 'tuesday', 'wednesday', 'thursday',
        'friday', 'saturday', 'sunday', 'morning', 'afternoon', 'evening', 'night',
        'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august',
        'september', 'october', 'november', 'december', 'by', 'due', 'deadline'
      ];
      
      const priorityKeywords = ['urgent', 'important', 'asap', 'critical', 'high priority', 'low priority'];
      
      const hasTaskKeyword = taskKeywords.some(keyword => text.includes(keyword));
      const hasTimeKeyword = timeKeywords.some(keyword => text.includes(keyword));
      const hasPriorityKeyword = priorityKeywords.some(keyword => text.includes(keyword));
      
      const appropriateLength = text.length > 8 && text.length < 300;
      const isNotQuestion = !text.includes('?') || text.includes('?') && (hasTaskKeyword || hasTimeKeyword);
      
      return appropriateLength && isNotQuestion && (hasTaskKeyword || (hasTimeKeyword && hasTaskKeyword) || hasPriorityKeyword);
    }

    // Enhanced task creation with context
    async function handleEnhancedTaskCreation(ctx: any, taskDescription: string) {
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
          await ctx.reply("🔗 Your Telegram account isn't linked yet. Use /start to get a verification code and unlock enhanced AI features!")
          return
        }
        
        await ctx.reply("🧠 Processing your task with enhanced AI analysis...");

        // Gather user context for enhanced processing
        const userContext = await gatherUserContext(telegramUser.user_id);
        console.log('User context gathered:', userContext);

        // Call the enhanced process-task-text edge function
        const { data: processedTask, error: processError } = await supabase.functions.invoke('process-task-text', {
          body: { 
            text: taskDescription,
            currentTime: new Date().toISOString(),
            userContext: userContext // Enhanced with user context
          }
        })

        if (processError || !processedTask) {
          console.error('Error processing task:', processError)
          await ctx.reply("❌ I couldn't process your task. Please try again with a clearer description.")
          return
        }
        
        console.log('Enhanced processed task:', JSON.stringify(processedTask, null, 2))

        if (processedTask.type !== 'create') {
          await ctx.reply("🤔 I couldn't understand this as a task. Please try again with a clearer description.")
          return
        }

        const taskData = processedTask.task;
        const analysis = processedTask.analysis;
        
        // Create the task in the database
        const { data: createdTask, error: createError } = await supabase
          .from('tasks')
          .insert([{
            user_id: telegramUser.user_id,
            summary: taskData.summary,
            description: taskData.description,
            due_date: taskData.dueDate,
            estimated_duration: taskData.estimatedDuration,
            priority: taskData.priority,
            status: taskData.status || "To Do",
            category: taskData.category,
            folder_id: null
          }])
          .select()
          .single()

        if (createError) {
          console.error('Error creating task:', createError)
          await ctx.reply("❌ Sorry, there was an error creating your task. Please try again.")
          return
        }

        // Enhanced confirmation with AI insights
        let response = "✅ *Task Created Successfully!*\n\n";
        response += `📋 *${taskData.summary}*\n\n`;
        response += `📅 Due: ${new Date(taskData.dueDate).toLocaleDateString()}\n`;
        response += `⏱️ Duration: ${taskData.estimatedDuration}\n`;
        response += `🔔 Priority: ${taskData.priority}\n`;
        response += `📁 Category: ${taskData.category}\n`;
        
        // Add AI confidence information
        if (analysis?.confidence) {
          const confidence = Math.round(analysis.confidence * 100);
          response += `\n🧠 *AI Confidence: ${confidence}%*\n`;
          
          if (confidence >= 80) {
            response += "✨ High confidence in all suggestions";
          } else if (confidence >= 60) {
            response += "🤔 Medium confidence - you may want to review details";
          } else {
            response += "⚠️ Low confidence - please verify the details";
          }
        }

        // Show patterns used
        if (userContext.totalTasks > 0) {
          response += `\n\n📊 *Based on your ${userContext.totalTasks} tasks:*\n`;
          if (userContext.commonCategories.length > 0) {
            response += `• Your common categories: ${userContext.commonCategories.slice(0, 3).join(", ")}\n`;
          }
          response += `• Your typical priority: ${userContext.mostUsedPriority}\n`;
          response += `• Average duration: ${userContext.averageDuration}`;
        }

        await ctx.reply(response, { parse_mode: 'Markdown' });
      } catch (error) {
        console.error('Unexpected error in enhanced task creation:', error)
        await ctx.reply("❌ An unexpected error occurred. Please try again later.")
      }
    }

    // NEW: AI Recommendations function
    async function handleAIRecommendations(ctx) {
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

    // Enhanced list tasks
    async function handleListTasks(ctx) {
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

    // Enhanced priority overview
    async function handlePriorityOverview(ctx) {
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

    // Enhanced free text query handling
    async function handleEnhancedFreeTextQuery(ctx) {
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

    // Log any errors that occur during message handling
    bot.catch((err) => {
      console.error('Error in bot message handler:', err)
    })

    // Set up webhook handler 
    const handler = webhookCallback(bot, "std/http")
    console.log('Enhanced webhook handler set up successfully')
    
    const response = await handler(req)
    console.log('Enhanced webhook handler processed request successfully')
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
