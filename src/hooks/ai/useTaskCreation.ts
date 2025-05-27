
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useTaskCreation() {
  const { toast } = useToast();

  const createTask = async (taskData: any, userId: string): Promise<boolean> => {
    try {
      const { error: createError } = await supabase
        .from('tasks')
        .insert([{
          user_id: userId,
          summary: taskData.summary,
          description: taskData.description,
          due_date: taskData.dueDate,
          estimated_duration: taskData.estimatedDuration,
          priority: taskData.priority,
          status: taskData.status || "To Do",
          category: taskData.category,
          folder_id: null
        }]);

      if (createError) throw createError;

      toast({
        title: "Success",
        description: "Task created with enhanced AI analysis",
      });
      
      return true;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  };

  return { createTask };
}
