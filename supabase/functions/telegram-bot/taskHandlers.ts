
import { gatherUserContext } from "./userContext.ts";

export async function handleEnhancedTaskCreation(ctx: any, taskDescription: string) {
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
