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

      return data.map((task): Task => ({
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
    
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
  };

  if (isLoading) return <div>Loading...</div>;

  return <TaskEdit tasks={tasks || []} onSave={handleSaveTask} />;
};

const App = () => {
  // Configure Supabase auth with correct redirect URL
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) {
      const currentUrl = window.location.origin;
      supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/edit/:taskId" element={<TaskEditWrapper />} />
          </Routes>
        </TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;