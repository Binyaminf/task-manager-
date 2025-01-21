import { useState, useEffect } from "react";
import { Task } from "@/components/TaskCard";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthWrapper } from "@/components/auth/AuthWrapper";
import { MainContent } from "@/components/layout/MainContent";

const Index = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [session, setSession] = useState(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [authError, setAuthError] = useState<string | null>(null);

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Auth error:', error);
        setAuthError("Failed to get session. Please try logging in again.");
        return;
      }
      console.log('Initial session:', session);
      setSession(session);
    });

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, 'Session:', session);
      if (event === 'SIGNED_IN') {
        setAuthError(null);
        setSession(session);
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setAuthError(null);
        queryClient.clear();
      } else if (event === 'TOKEN_REFRESHED') {
        setSession(session);
      } else if (event === 'USER_UPDATED') {
        setSession(session);
      }
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: ['tasks', session?.user?.id, selectedFolder],
    queryFn: async () => {
      console.log('Fetching tasks for user:', session?.user?.id);
      if (!session?.user?.id) {
        console.log('No user session, returning empty array');
        return [];
      }
      
      try {
        let query = supabase
          .from('tasks')
          .select('*')
          .eq('user_id', session.user.id);

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
    enabled: !!session?.user?.id,
    retry: 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const handleNewTask = async (taskData: Partial<Task>) => {
    if (!session?.user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to create tasks",
        variant: "destructive",
      });
      return;
    }

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
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
      return;
    }
    navigate("/");
  };

  if (!session) {
    return <AuthWrapper authError={authError} />;
  }

  if (error) {
    console.error('Query error:', error);
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
      isLoading={isLoading}
      onSignOut={handleSignOut}
      onNewTask={handleNewTask}
      onTasksChange={handleTasksChange}
      onViewModeChange={setViewMode}
      onFolderSelect={setSelectedFolder}
    />
  );
};

export default Index;