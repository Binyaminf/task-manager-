
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Task } from "../../../src/types/task.ts";

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

    // Generate a simple summary without relying on an external AI service
    const summary = generateLocalSummary(tasks);
    
    return new Response(
      JSON.stringify({
        summary,
        model: "Local Summarization Engine"
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

// Local summarization logic that doesn't rely on external AI services
function generateLocalSummary(tasks: any[]): string {
  // Count tasks by priority
  const priorityCounts = {
    High: tasks.filter(t => t.priority === 'High').length,
    Medium: tasks.filter(t => t.priority === 'Medium').length, 
    Low: tasks.filter(t => t.priority === 'Low').length
  };
  
  // Count tasks by due date urgency
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const overdueTasks = tasks.filter(t => new Date(t.dueDate) < now).length;
  const dueTodayTasks = tasks.filter(t => {
    const dueDate = new Date(t.dueDate);
    return dueDate >= now && dueDate.getDate() === now.getDate() && 
           dueDate.getMonth() === now.getMonth() && 
           dueDate.getFullYear() === now.getFullYear();
  }).length;
  
  const dueTomorrowTasks = tasks.filter(t => {
    const dueDate = new Date(t.dueDate);
    return dueDate.getDate() === tomorrow.getDate() && 
           dueDate.getMonth() === tomorrow.getMonth() && 
           dueDate.getFullYear() === tomorrow.getFullYear();
  }).length;

  // Check for common categories
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
    .slice(0, 2);
  
  // Generate summary text
  let summaryText = `You have ${tasks.length} priority task${tasks.length !== 1 ? 's' : ''}.\n\n`;
  
  // Add priority breakdown
  summaryText += `Priority breakdown: `;
  if (priorityCounts.High > 0) summaryText += `${priorityCounts.High} high, `;
  if (priorityCounts.Medium > 0) summaryText += `${priorityCounts.Medium} medium, `;
  if (priorityCounts.Low > 0) summaryText += `${priorityCounts.Low} low`;
  summaryText += `.\n\n`;
  
  // Add timing information
  if (overdueTasks > 0) {
    summaryText += `⚠️ ${overdueTasks} task${overdueTasks !== 1 ? 's are' : ' is'} overdue.\n`;
  }
  
  if (dueTodayTasks > 0) {
    summaryText += `${dueTodayTasks} task${dueTodayTasks !== 1 ? 's' : ''} due today.\n`;
  }
  
  if (dueTomorrowTasks > 0) {
    summaryText += `${dueTomorrowTasks} task${dueTomorrowTasks !== 1 ? 's' : ''} due tomorrow.\n`;
  }
  
  // Add category information if relevant
  if (topCategories.length > 0) {
    summaryText += `\nMost common categories: ${topCategories.map(c => `${c[0]} (${c[1]})`).join(', ')}.\n`;
  }
  
  // Add specific task summary for the highest priority task
  const highPriorityTasks = tasks.filter(t => t.priority === 'High');
  if (highPriorityTasks.length > 0) {
    const mostUrgent = highPriorityTasks.sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    )[0];
    
    summaryText += `\nMost urgent task: "${mostUrgent.summary}" (due ${new Date(mostUrgent.dueDate).toLocaleDateString()})`;
  }
  
  return summaryText;
}
