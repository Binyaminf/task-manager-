import { useState, Suspense } from "react";
import { Task } from "@/components/TaskCard";
import { useToast } from "@/hooks/use-toast";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { PrioritySection } from "@/components/sections/PrioritySection";
import { AISection } from "@/components/sections/AISection";
import { TaskSection } from "@/components/sections/TaskSection";
import { ErrorBoundary } from "react-error-boundary";
import { Skeleton } from "@/components/ui/skeleton";

const LoadingFallback = () => (
  <div className="container py-8">
    <div className="space-y-8">
      <Skeleton className="h-[200px] w-full" />
      <Skeleton className="h-[300px] w-full" />
      <Skeleton className="h-[500px] w-full" />
    </div>
  </div>
);

const Index = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [session, setSession] = useState(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  // Get session on load
  supabase.auth.getSession().then(({ data: { session } }) => {
    setSession(session);
  });

  // Listen for auth changes
  supabase.auth.onAuthStateChange((_event, session) => {
    setSession(session);
  });

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', session?.user?.id, selectedFolder],
    queryFn: async () => {
      if (!session?.user?.id) return [];
      
      let query = supabase
        .from('tasks')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (selectedFolder) {
        query = query.eq('folder_id', selectedFolder);
      }
      
      const { data, error } = await query;
      
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
    staleTime: 1000 * 60, // Data stays fresh for 1 minute
    gcTime: 1000 * 60 * 5, // Cache persists for 5 minutes
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const handleNewTask = async (taskData: Partial<Task>) => {
    if (!session?.user?.id) return;

    const supabaseTask = {
      user_id: session.user.id,
      folder_id: selectedFolder,
      summary: taskData.summary,
      description: taskData.description,
      due_date: taskData.dueDate,
      estimated_duration: taskData.estimatedDuration,
      priority: taskData.priority,
      status: taskData.status,
      category: taskData.category,
      external_links: taskData.externalLinks
    };

    const { error } = await supabase
      .from('tasks')
      .insert([supabaseTask]);

    if (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Task created successfully",
    });
    
    queryClient.invalidateQueries({ queryKey: ['tasks', session?.user?.id, selectedFolder] });
  };

  const handleTasksChange = () => {
    queryClient.invalidateQueries({ queryKey: ['tasks', session?.user?.id, selectedFolder] });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (!session) {
    return (
      <div className="container max-w-md mx-auto py-8">
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={["google"]}
          redirectTo={window.location.origin}
        />
      </div>
    );
  }

  if (isLoading) {
    return <LoadingFallback />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ErrorBoundary fallback={<div>Something went wrong</div>}>
        <Header
          userEmail={session.user.email}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onSignOut={handleSignOut}
        />

        <main className="container mx-auto py-8 px-4">
          <div className="space-y-8">
            <Suspense fallback={<Skeleton className="h-[200px] w-full" />}>
              <PrioritySection />
            </Suspense>
            
            <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
              <AISection onTaskCreated={handleTasksChange} />
            </Suspense>
            
            <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
              <TaskSection
                tasks={tasks}
                viewMode={viewMode}
                selectedFolder={selectedFolder}
                onNewTask={handleNewTask}
                onTasksChange={handleTasksChange}
                onFolderSelect={setSelectedFolder}
              />
            </Suspense>
          </div>
        </main>
      </ErrorBoundary>
    </div>
  );
};

export default Index;
