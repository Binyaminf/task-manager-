import { useState } from "react";
import { TaskList } from "@/components/TaskList";
import { TaskHeader } from "@/components/TaskHeader";
import { Task } from "@/components/TaskCard";
import { useToast } from "@/components/ui/use-toast";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FolderList } from "@/components/FolderList";

const Index = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const queryClient = useQueryClient();
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  // Get session on load
  supabase.auth.getSession().then(({ data: { session } }) => {
    setSession(session);
  });

  // Listen for auth changes
  supabase.auth.onAuthStateChange((_event, session) => {
    setSession(session);
  });

  // Fetch tasks for logged-in user
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', session?.user?.id, selectedFolder],
    queryFn: async () => {
      if (!session?.user?.id) return [];

      console.log('Fetching tasks with selectedFolder:', selectedFolder);
      
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', session.user.id)
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

      console.log('Fetched tasks:', data);

      return data.map((task): Task => ({
        id: task.id,
        summary: task.summary,
        description: task.description || undefined,
        dueDate: task.due_date,
        estimatedDuration: task.estimated_duration,
        priority: task.priority as "High" | "Medium" | "Low",
        status: task.status as "To Do" | "In Progress" | "Done",
        category: task.category,
        externalLinks: task.external_links || undefined,
        folder_id: task.folder_id
      }));
    },
    enabled: !!session?.user?.id,
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
    return (
      <div className="container py-8">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  console.log('Rendering tasks:', tasks, 'selectedFolder:', selectedFolder);

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Task Manager</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {session.user.email}
          </span>
          <Button variant="outline" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      </div>
      <FolderList onFolderSelect={setSelectedFolder} />
      <TaskHeader onNewTask={handleNewTask} />
      <TaskList 
        tasks={tasks} 
        onTasksChange={handleTasksChange}
        selectedFolder={selectedFolder}
      />
    </div>
  );
};

export default Index;