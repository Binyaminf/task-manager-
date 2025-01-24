import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "@/types/task";

export function useTaskData(userId: string | undefined, selectedFolder: string | null) {
  return useQuery({
    queryKey: ['tasks', userId, selectedFolder],
    queryFn: async () => {
      if (!userId) return [];

      const query = supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId);

      if (selectedFolder) {
        query.eq('folder_id', selectedFolder);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching tasks:', error);
        throw error;
      }

      return data as Task[];
    },
    enabled: !!userId,
  });
}