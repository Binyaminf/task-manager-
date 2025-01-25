import { useCallback } from "react";
import { Task } from "@/types/task";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useTaskOperations(onTasksChange?: () => void) {
  const { toast } = useToast();

  const handleTaskClick = useCallback((task: Task) => {
    // Handle task click logic here
    console.log('Task clicked:', task);
  }, []);

  const handleDragEnd = useCallback(async (task: Task, newFolderId: string | null) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ folder_id: newFolderId })
        .eq('id', task.id);

      if (error) throw error;

      onTasksChange?.();
      
      toast({
        title: "Success",
        description: "Task moved successfully",
      });
    } catch (error) {
      console.error('Error moving task:', error);
      toast({
        title: "Error",
        description: "Failed to move task",
        variant: "destructive",
      });
    }
  }, [onTasksChange, toast]);

  return {
    handleTaskClick,
    handleDragEnd,
  };
}