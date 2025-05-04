
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Define Task interface locally instead of importing from src/types
interface Task {
  id: string;
  summary: string;
  description?: string;
  dueDate: string;
  estimatedDuration: string;
  priority: "High" | "Medium" | "Low";
  status: "To Do" | "In Progress" | "Done";
  category: string;
  externalLinks?: string[];
  folder_id: string | null;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tasks } = await req.json();
    
    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      throw new Error('No tasks provided or invalid tasks array');
    }

    console.log(`Generating summary for ${tasks.length} tasks`);

    // Generate an enhanced summary without relying on an external AI service
    const summary = generateEnhancedSummary(tasks);
    
    return new Response(
      JSON.stringify({
        summary,
        model: "Enhanced Local Summarization Engine"
      }),
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Error in summarize-tasks function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        suggestions: [
          "Check that you're providing a valid array of tasks",
          "Try with fewer tasks if you're hitting limits",
          "Check your network connection"
        ]
      }),
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  }
});

// Enhanced summarization logic with more insights and patterns
function generateEnhancedSummary(tasks: Task[]): string {
  // Count tasks by priority
  const priorityCounts = {
    High: tasks.filter(t => t.priority === 'High').length,
    Medium: tasks.filter(t => t.priority === 'Medium').length, 
    Low: tasks.filter(t => t.priority === 'Low').length
  };
  
  // Count tasks by status
  const statusCounts = {
    'To Do': tasks.filter(t => t.status === 'To Do').length,
    'In Progress': tasks.filter(t => t.status === 'In Progress').length,
    'Done': tasks.filter(t => t.status === 'Done').length
  };
  
  // Count tasks by due date urgency
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  const overdueTasks = tasks.filter(t => new Date(t.dueDate) < now);
  const dueTodayTasks = tasks.filter(t => {
    const dueDate = new Date(t.dueDate);
    return dueDate >= now && dueDate.getDate() === now.getDate() && 
           dueDate.getMonth() === now.getMonth() && 
           dueDate.getFullYear() === now.getFullYear();
  });
  
  const dueTomorrowTasks = tasks.filter(t => {
    const dueDate = new Date(t.dueDate);
    return dueDate.getDate() === tomorrow.getDate() && 
           dueDate.getMonth() === tomorrow.getMonth() && 
           dueDate.getFullYear() === tomorrow.getFullYear();
  });
  
  const dueNextWeekTasks = tasks.filter(t => {
    const dueDate = new Date(t.dueDate);
    return dueDate > tomorrow && dueDate <= nextWeek;
  });

  // Analyze categories
  const categories = tasks.map(t => t.category);
  const categoryCounts: Record<string, number> = {};
  
  categories.forEach(category => {
    if (!categoryCounts[category]) {
      categoryCounts[category] = 1;
    } else {
      categoryCounts[category]++;
    }
  });
  
  // Get the top categories
  const topCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  
  // Calculate estimated time commitment
  let totalEstimatedHours = 0;
  const nonDoneTasks = tasks.filter(t => t.status !== 'Done');
  
  nonDoneTasks.forEach(task => {
    const duration = task.estimatedDuration;
    if (duration) {
      // Handle different duration formats (1h, 2d, etc.)
      if (duration.endsWith('h')) {
        totalEstimatedHours += parseFloat(duration);
      } else if (duration.endsWith('d')) {
        totalEstimatedHours += parseFloat(duration) * 8; // Assume 8 hours per day
      } else if (duration.endsWith('m')) {
        totalEstimatedHours += parseFloat(duration) / 60;
      }
    }
  });
  
  // Find task patterns and insights
  const highPriorityAndUrgent = tasks.filter(t => 
    t.priority === 'High' && new Date(t.dueDate) < nextWeek && t.status !== 'Done'
  );
  
  // Generate summary text
  let summaryText = `📋 *TASK SUMMARY* 📋\n\n`;
  summaryText += `You have ${tasks.length} task${tasks.length !== 1 ? 's' : ''} in total`;
  summaryText += ` (${statusCounts['To Do']} to do, ${statusCounts['In Progress']} in progress, ${statusCounts['Done']} done).\n\n`;
  
  // Add priority breakdown
  summaryText += `*Priority breakdown:*\n`;
  if (priorityCounts.High > 0) summaryText += `🔴 High: ${priorityCounts.High}\n`;
  if (priorityCounts.Medium > 0) summaryText += `🟠 Medium: ${priorityCounts.Medium}\n`;
  if (priorityCounts.Low > 0) summaryText += `🟢 Low: ${priorityCounts.Low}\n`;
  summaryText += `\n`;
  
  // Add timing information with more insights
  if (overdueTasks.length > 0) {
    summaryText += `⚠️ *Overdue:* ${overdueTasks.length} task${overdueTasks.length !== 1 ? 's' : ''}\n`;
    
    // List top 2 overdue high priority tasks if they exist
    const overdueHighPriorityTasks = overdueTasks.filter(t => t.priority === 'High');
    if (overdueHighPriorityTasks.length > 0) {
      summaryText += `  Most urgent: ${overdueHighPriorityTasks.slice(0, 2).map(t => `"${t.summary}"`).join(', ')}\n`;
    }
  }
  
  if (dueTodayTasks.length > 0) {
    summaryText += `⏰ *Due today:* ${dueTodayTasks.length} task${dueTodayTasks.length !== 1 ? 's' : ''}\n`;
    
    // List a few due today tasks if they exist
    if (dueTodayTasks.length > 0) {
      summaryText += `  Including: ${dueTodayTasks.slice(0, 2).map(t => `"${t.summary}"`).join(', ')}\n`;
    }
  }
  
  if (dueTomorrowTasks.length > 0) {
    summaryText += `📆 *Due tomorrow:* ${dueTomorrowTasks.length} task${dueTomorrowTasks.length !== 1 ? 's' : ''}\n`;
  }
  
  if (dueNextWeekTasks.length > 0) {
    summaryText += `🗓 *Due this week:* ${dueNextWeekTasks.length} task${dueNextWeekTasks.length !== 1 ? 's' : ''}\n`;
  }
  
  // Add estimated time commitment
  if (totalEstimatedHours > 0) {
    summaryText += `\n⏱ *Estimated work remaining:* ${Math.round(totalEstimatedHours * 10) / 10} hours`;
    if (totalEstimatedHours > 40) {
      summaryText += ` (${Math.round(totalEstimatedHours / 8 * 10) / 10} days)`;
    }
    summaryText += `\n`;
  }
  
  // Add category information with insights
  if (topCategories.length > 0) {
    summaryText += `\n📚 *Top categories:*\n`;
    topCategories.forEach(([category, count]) => {
      summaryText += `• ${category}: ${count} tasks\n`;
    });
  }
  
  // Provide actionable insights
  summaryText += `\n🔍 *Insights:*\n`;
  
  if (highPriorityAndUrgent.length > 0) {
    summaryText += `• You have ${highPriorityAndUrgent.length} high-priority tasks due soon\n`;
  }
  
  if (overdueTasks.length > statusCounts['To Do'] * 0.3 && overdueTasks.length > 2) {
    summaryText += `• Consider rescheduling some overdue tasks\n`;
  }
  
  if (priorityCounts.High > priorityCounts.Medium + priorityCounts.Low) {
    summaryText += `• Many tasks marked high-priority - consider reprioritizing\n`;
  }
  
  if (dueTodayTasks.length + dueTomorrowTasks.length > 10) {
    summaryText += `• You have many tasks due in the next 48 hours\n`;
  }
  
  const mostUrgentHighPriority = tasks
    .filter(t => t.priority === 'High' && t.status !== 'Done')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];
  
  if (mostUrgentHighPriority) {
    summaryText += `\n🔥 *Most urgent high priority:* "${mostUrgentHighPriority.summary}" (due ${new Date(mostUrgentHighPriority.dueDate).toLocaleDateString()})`;
  }
  
  return summaryText;
}
