
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, List, ArrowDownUp, FileText, Grid, Calendar, ArrowRightCircle } from "lucide-react";
import { Task } from "@/types/task";
import { TaskForm } from "./TaskForm";
import { BatchTaskCreation } from "./task/BatchTaskCreation";
import { TaskTemplates } from "./task/TaskTemplates";
import { Popover, PopoverTrigger, PopoverContent } from "./ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TaskHeaderProps {
  onNewTask: (task: Partial<Task>) => void;
  viewMode?: 'grid' | 'list' | 'calendar';
  onViewModeChange?: (mode: 'grid' | 'list' | 'calendar') => void;
}

export function TaskHeader({ 
  onNewTask, 
  viewMode = 'grid', 
  onViewModeChange 
}: TaskHeaderProps) {
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

  // Convert onNewTask to async function for TaskTemplates compatibility
  const handleCreateTemplateTask = async (task: Partial<Task>) => {
    onNewTask(task);
    return Promise.resolve();
  };

  // Handle view mode change
  const handleViewModeChange = (mode: 'grid' | 'list' | 'calendar') => {
    if (onViewModeChange) {
      onViewModeChange(mode);
    }
  };

  // Get the appropriate view mode icon
  const getViewModeIcon = () => {
    switch (viewMode) {
      case 'list':
        return <List className="h-4 w-4 mr-2" />;
      case 'calendar':
        return <Calendar className="h-4 w-4 mr-2" />;
      case 'grid':
      default:
        return <Grid className="h-4 w-4 mr-2" />;
    }
  };

  return (
    <div className="flex justify-between items-center">
      <h2 className="text-xl font-semibold">Tasks</h2>

      <div className="flex space-x-2">
        {isMobile ? (
          <div className="flex space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  {getViewModeIcon()}
                  <span className="sr-only">View</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleViewModeChange('grid')}>
                  <Grid className="h-4 w-4 mr-2" />
                  Grid View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleViewModeChange('list')}>
                  <List className="h-4 w-4 mr-2" />
                  List View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleViewModeChange('calendar')}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Calendar View
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

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
          </div>
        ) : (
          <>
            <div className="flex border rounded-md overflow-hidden">
              <Button
                variant={viewMode === 'grid' ? "default" : "ghost"}
                size="sm"
                onClick={() => handleViewModeChange('grid')}
                className="rounded-none border-r"
              >
                <Grid className="h-4 w-4" />
                <span className="ml-1">Grid</span>
              </Button>
              <Button
                variant={viewMode === 'list' ? "default" : "ghost"}
                size="sm"
                onClick={() => handleViewModeChange('list')}
                className="rounded-none border-r"
              >
                <List className="h-4 w-4" />
                <span className="ml-1">List</span>
              </Button>
              <Button
                variant={viewMode === 'calendar' ? "default" : "ghost"}
                size="sm"
                onClick={() => handleViewModeChange('calendar')}
                className="rounded-none"
              >
                <Calendar className="h-4 w-4" />
                <span className="ml-1">Calendar</span>
              </Button>
            </div>
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

      <TaskForm
        open={showNewTaskForm}
        onOpenChange={setShowNewTaskForm}
        onSubmit={handleAddTask}
        initialData={undefined}
      />

      <BatchTaskCreation
        open={showBatchCreation}
        onClose={() => setShowBatchCreation(false)}
        onCreateTasks={handleCreateTasks}
      />

      <TaskTemplates
        open={showTemplates}
        onClose={() => setShowTemplates(false)}
        onCreateTask={handleCreateTemplateTask}
      />
    </div>
  );
}
