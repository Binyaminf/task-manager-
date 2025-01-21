import { useState } from "react";
import { Task } from "@/components/TaskCard";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { AuthWrapper } from "@/components/auth/AuthWrapper";
import { MainContent } from "@/components/layout/MainContent";
import { AuthStateHandler } from "@/components/auth/AuthStateHandler";
import { useTaskData } from "@/hooks/useTaskData";

const Index = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [session, setSession] = useState(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [authError, setAuthError] = useState<string | null>(null);

  const { data: tasks = [], isLoading, error } = useTaskData(session?.user?.id, selectedFolder);

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
    <>
      <AuthStateHandler 
        onSessionChange={setSession}
        onError={setAuthError}
      />
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
    </>
  );
};

export default Index;