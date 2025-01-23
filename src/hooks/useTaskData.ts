import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "@/types/task";
import { useToast } from "@/hooks/use-toast";

export function useTaskData(userId: string | undefined, selectedFolder: string | null) {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['tasks', userId, selectedFolder],
    queryFn: async () => {
      console.log('Fetching tasks for user:', userId);
      if (!userId) {
        console.log('No user session, returning empty array');
        return [];
      }
      
      try {
        let query = supabase
          .from('tasks')
          .select('*')
          .eq('user_id', userId);

        console.log('Initial query:', query);

        if (selectedFolder) {
          query = query.eq('folder_id', selectedFolder);
          console.log('Added folder filter:', selectedFolder);
        }
        
        const { data, error } = await query;
        
        if (error) {
          console.error('Error fetching tasks:', error);
          toast({
            title: "Error",
            description: "Failed to load tasks. Please try again.",
            variant: "destructive",
          });
          return [];
        }

        console.log('Raw tasks data:', data);
        
        if (!data || data.length === 0) {
          console.log('No tasks found for user');
          return [];
        }

        const mappedTasks = data.map((task): Task => ({
          id: task.id,
          summary: task.summary,
          description: task.description || undefined,
          dueDate: task.due_date,
          estimatedDuration: task.estimated_duration,
          priority: task.priority as Task["priority"],
          status: task.status as Task["status"],
          category: task.category,
          externalLinks: task.external_links || undefined,
          folder_id: task.folder_id
        }));

        console.log('Mapped tasks:', mappedTasks);
        return mappedTasks;
      } catch (err) {
        console.error('Unexpected error fetching tasks:', err);
        toast({
          title: "Error",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
        return [];
      }
    },
    enabled: !!userId,
    retry: 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}