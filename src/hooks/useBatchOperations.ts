import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "@/components/TaskCard";

export function useBatchOperations(onTasksChange?: () => void) {
  const { toast } = useToast();

  const handleBatchDelete = async (selectedTasks: Set<string>) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .in('id', Array.from(selectedTasks));

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete tasks",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Tasks deleted successfully",
      });
      onTasksChange?.();
    }
  };

  const handleBatchStatusChange = async (selectedTasks: Set<string>, newStatus: Task['status']) => {
    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .in('id', Array.from(selectedTasks));

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Task status updated successfully",
      });
      onTasksChange?.();
    }
  };

  const handleBatchMoveToFolder = async (selectedTasks: Set<string>, folderId: string | null) => {
    const { error } = await supabase
      .from('tasks')
      .update({ folder_id: folderId })
      .in('id', Array.from(selectedTasks));

    if (error) {
      toast({
        title: "Error",
        description: "Failed to move tasks",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Tasks moved successfully",
      });
      onTasksChange?.();
    }
  };

  return {
    handleBatchDelete,
    handleBatchStatusChange,
    handleBatchMoveToFolder
  };
}