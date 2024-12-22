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

const DEMO_TASKS: Task[] = [
  {
    id: "1",
    summary: "Design new landing page",
    description: "Create a modern and engaging landing page design for our product",
    dueDate: "2024-04-15",
    estimatedDuration: "4h",
    priority: "High",
    status: "In Progress",
    category: "Design",
    externalLinks: ["https://figma.com/file1"],
  },
  {
    id: "2",
    summary: "Update documentation",
    description: "Review and update the API documentation with new endpoints",
    dueDate: "2024-04-20",
    priority: "Medium",
    status: "To Do",
    category: "Documentation",
  },
  {
    id: "3",
    summary: "Fix navigation bug",
    description: "Address the navigation issue reported in mobile view",
    estimatedDuration: "2h",
    priority: "High",
    status: "To Do",
    category: "Development",
    externalLinks: ["https://github.com/issue/123"],
  },
];

const Index = () => {
  const [tasks] = useState<Task[]>(DEMO_TASKS);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);

  supabase.auth.getSession().then(({ data: { session } }) => {
    setSession(session);
  });

  supabase.auth.onAuthStateChange((_event, session) => {
    setSession(session);
  });

  const handleNewTask = () => {
    toast({
      title: "Coming Soon",
      description: "Task creation will be implemented in the next iteration",
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