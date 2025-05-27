
import { supabase } from "@/integrations/supabase/client";
import { UserContext } from "./types";
import { Task } from "@/types/task";

export function useUserContext() {
  const gatherUserContext = async (userId: string): Promise<UserContext> => {
    try {
      // Get user's recent tasks for context
      const { data: recentTasksData } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      // Transform database objects to match Task interface
      const recentTasks: Task[] = recentTasksData?.map(task => ({
        id: task.id,
        summary: task.summary,
        description: task.description,
        dueDate: task.due_date,
        estimatedDuration: task.estimated_duration,
        priority: task.priority as "High" | "Medium" | "Low",
        status: task.status as "To Do" | "In Progress" | "Done",
        category: task.category,
        externalLinks: task.external_links,
        folder_id: task.folder_id
      })) || [];

      // Analyze user patterns
      const categories = recentTasks.map(t => t.category).filter(Boolean);
      const priorities = recentTasks.map(t => t.priority);
      const durations = recentTasks.map(t => t.estimatedDuration).filter(Boolean);

      const categoryFreq = categories.reduce((acc, cat) => {
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const priorityFreq = priorities.reduce((acc, pri) => {
        acc[pri] = (acc[pri] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        recentTasks,
        commonCategories: Object.keys(categoryFreq).sort((a, b) => categoryFreq[b] - categoryFreq[a]).slice(0, 5),
        mostUsedPriority: Object.keys(priorityFreq).sort((a, b) => priorityFreq[b] - priorityFreq[a])[0] || 'Medium',
        averageDuration: durations.length > 0 ? '2h' : '1h', // Simplified for now
      };
    } catch (error) {
      console.error('Error gathering user context:', error);
      return { recentTasks: [], commonCategories: [], mostUsedPriority: 'Medium', averageDuration: '1h' };
    }
  };

  return { gatherUserContext };
}
