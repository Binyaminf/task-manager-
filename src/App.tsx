import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import TaskEdit from "./components/TaskEdit";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "./components/TaskCard";
import { useToast } from "@/hooks/use-toast";

const queryClient = new QueryClient();

const TaskEditWrapper = () => {
  const { toast } = useToast();
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user?.id) return [];
      
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching tasks:', error);
        toast({
          title: "Error",
          description: "Failed to load tasks",
          variant: "destructive",
        });
        return [];
      }

      return data as Task[];
    },
  });

  const handleSaveTask = async (editedTask: Task) => {
    const { error } = await supabase
      .from('tasks')
      .update({
        summary: editedTask.summary,
        description: editedTask.description,
        due_date: editedTask.dueDate,
        estimated_duration: editedTask.estimatedDuration,
        priority: editedTask.priority,
        status: editedTask.status,
        category: editedTask.category,
        external_links: editedTask.externalLinks,
        folder_id: editedTask.folder_id
      })
      .eq('id', editedTask.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Task updated successfully",
    });
    
    // Invalidate and refetch tasks
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
  };

  if (isLoading) return <div>Loading...</div>;

  return <TaskEdit tasks={tasks || []} onSave={handleSaveTask} />;
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/edit/:taskId" element={<TaskEditWrapper />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;