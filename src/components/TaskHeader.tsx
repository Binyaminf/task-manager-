
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, List, ArrowDownUp, FileText } from "lucide-react";
import { Task } from "@/types/task";
import { TaskForm } from "./TaskForm";
import { BatchTaskCreation } from "./task/BatchTaskCreation";
import { TaskTemplates } from "./task/TaskTemplates";
import { Popover, PopoverTrigger, PopoverContent } from "./ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

interface TaskHeaderProps {
  onNewTask: (task: Partial<Task>) => void;
}

export function TaskHeader({ onNewTask }: TaskHeaderProps) {
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [showBatchCreation, setShowBatchCreation] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const handleAddTask = (task: Partial<Task>) => {
    onNewTask(task);
    setShowNewTaskForm(false);
  };

  const handleCreateTasks = async (tasks: Partial<Task>[]) => {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to create tasks",
        variant: "destructive",
      });
      return;
    }

    const userId = sessionData.session.user.id;
    
    // Prepare tasks for insertion
    const tasksToInsert = tasks.map(task => ({
      user_id: userId,
      summary: task.summary || "Untitled Task",
      description: task.description || "",
      due_date: task.dueDate || null,
      estimated_duration: task.estimatedDuration || "",
      priority: task.priority || "Medium",
      status: task.status || "To Do",
      category: task.category || "",
      folder_id: task.folder_id || null,
    }));

    // Insert all tasks in a batch
    const { error } = await supabase
      .from('tasks')
      .insert(tasksToInsert);

    if (error) {
      console.error('Error creating tasks:', error);
      throw new Error('Failed to create tasks');
    }
  };

  return (
    <div className="flex justify-between items-center">
      <h2 className="text-xl font-semibold">Tasks</h2>

      <div className="flex space-x-2">
        {isMobile ? (
          <Popover>
            <PopoverTrigger asChild>
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-screen max-w-[200px] p-0" align="end">
              <div className="flex flex-col">
                <Button variant="ghost" onClick={() => setShowNewTaskForm(true)} className="justify-start">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  New Task
                </Button>
                <Button variant="ghost" onClick={() => setShowBatchCreation(true)} className="justify-start">
                  <List className="h-4 w-4 mr-2" />
                  Batch Create
                </Button>
                <Button variant="ghost" onClick={() => setShowTemplates(true)} className="justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Templates
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          <>
            <Button onClick={() => setShowTemplates(true)} variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Templates
            </Button>
            <Button onClick={() => setShowBatchCreation(true)} variant="outline">
              <List className="h-4 w-4 mr-2" />
              Batch Create
            </Button>
            <Button onClick={() => setShowNewTaskForm(true)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </>
        )}
      </div>

      {showNewTaskForm && (
        <TaskForm
          onSubmit={handleAddTask}
          onCancel={() => setShowNewTaskForm(false)}
        />
      )}

      <BatchTaskCreation
        open={showBatchCreation}
        onClose={() => setShowBatchCreation(false)}
        onCreateTasks={handleCreateTasks}
      />

      <TaskTemplates
        open={showTemplates}
        onClose={() => setShowTemplates(false)}
        onCreateTask={onNewTask}
      />
    </div>
  );
}
