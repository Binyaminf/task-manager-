import { Task } from "../TaskCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from 'react-router-dom';

export function useTaskOperations(onTasksChange?: () => void) {
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleTaskClick = (task: Task) => {
    navigate(`/edit/${task.id}`);
  };

  const handleDragEnd = async (task: Task, folderId: string | null) => {
    const { error } = await supabase
      .from('tasks')
      .update({ folder_id: folderId })
      .eq('id', task.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to move task to folder",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Task moved to folder",
      });
      onTasksChange?.();
    }
  };

  return {
    handleTaskClick,
    handleDragEnd,
  };
}