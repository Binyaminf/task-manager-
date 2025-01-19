import { useState } from "react";
import { Task } from "@/components/TaskCard";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthWrapper } from "@/components/auth/AuthWrapper";
import { LoadingFallback } from "@/components/common/LoadingFallback";
import { MainContent } from "@/components/layout/MainContent";

const Index = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [session, setSession] = useState(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [authError, setAuthError] = useState<string | null>(null);

  // Get session on load
  supabase.auth.getSession().then(({ data: { session } }) => {
    setSession(session);
  });

  // Listen for auth changes and handle errors
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN') {
      setAuthError(null);
      setSession(session);
    } else if (event === 'SIGNED_OUT') {
      setSession(null);
      setAuthError(null);
    } else if (event === 'USER_UPDATED') {
      setSession(session);
    } else if (event === 'PASSWORD_RECOVERY') {
      setAuthError('Please check your email to reset your password.');
    }
  });

  const { data: tasks = [], isLoading, error } = useQuery({
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
    return <AuthWrapper authError={authError} />;
  }

  if (error) {
    toast({
      title: "Error",
      description: "Failed to load tasks. Please try again.",
      variant: "destructive",
    });
  }

  return (
    <MainContent
      session={session}
      tasks={tasks}
      viewMode={viewMode}
      selectedFolder={selectedFolder}
      onSignOut={handleSignOut}
      onNewTask={handleNewTask}
      onTasksChange={handleTasksChange}
      onViewModeChange={setViewMode}
      onFolderSelect={setSelectedFolder}
      isLoading={isLoading}
    />
  );
};

export default Index;