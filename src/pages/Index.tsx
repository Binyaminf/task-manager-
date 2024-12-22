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
import { useQuery } from "@tanstack/react-query";

const Index = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);

  // Get session on load
  supabase.auth.getSession().then(({ data: { session } }) => {
    setSession(session);
  });

  // Listen for auth changes
  supabase.auth.onAuthStateChange((_event, session) => {
    setSession(session);
  });

  // Fetch tasks for logged-in user
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return [];
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
      return data;
    },
    enabled: !!session?.user?.id,
  });

  const handleNewTask = async (taskData) => {
    const { data, error } = await supabase
      .from('tasks')
      .insert([{ ...taskData, user_id: session.user.id }])
      .select()
      .single();

    if (error) {
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
  };

  const handleTaskClick = (task: Task) => {
    toast({
      title: "Task Selected",
      description: `You clicked on "${task.summary}"`,
    });
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
      <TaskHeader onNewTask={handleNewTask} />
      <TaskList tasks={tasks} onTaskClick={handleTaskClick} />
    </div>
  );
};

export default Index;