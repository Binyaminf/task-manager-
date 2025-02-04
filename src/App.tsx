import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Settings from "./pages/Settings";
import TaskEdit from "./components/TaskEdit";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "@/types/task";
import { useToast } from "@/hooks/use-toast";
import { Session } from "@supabase/supabase-js";
import { useState, useEffect } from "react";
import { AuthStateHandler } from "./components/auth/AuthStateHandler";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

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

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TooltipProvider>
          <AuthStateHandler 
            onSessionChange={setSession}
            onError={setAuthError}
          />
          <Routes>
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/edit/:taskId" 
              element={
                <ProtectedRoute>
                  <TaskEditWrapper />
                </ProtectedRoute>
              } 
            />
            <Route path="/login" element={!session ? <Navigate to="/" /> : null} />
          </Routes>
          <Toaster />
          <Sonner />
        </TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
