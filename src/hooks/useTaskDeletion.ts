import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "@/types/task";

export function useTaskDeletion(onTasksChange?: () => void) {
  const { toast } = useToast();
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  const handleDeleteTask = (task: Task) => {
    setTaskToDelete(task);
  };

  const confirmDelete = async () => {
    if (!taskToDelete) return;

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskToDelete.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Task deleted successfully",
      });
      onTasksChange?.();
    }
    setTaskToDelete(null);
  };

  return {
    taskToDelete,
    handleDeleteTask,
    confirmDelete,
    closeDeleteDialog: () => setTaskToDelete(null)
  };
}
