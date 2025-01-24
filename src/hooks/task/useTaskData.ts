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

      // Map the database fields to match our Task interface
      return data.map(item => ({
        id: item.id,
        summary: item.summary,
        description: item.description || undefined,
        dueDate: item.due_date,
        estimatedDuration: item.estimated_duration,
        priority: item.priority as Task['priority'],
        status: item.status as Task['status'],
        category: item.category,
        externalLinks: item.external_links || undefined,
        folder_id: item.folder_id,
      }));
    },
    enabled: !!userId,
  });
}