import { Task } from "./TaskCard";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { TaskFilterBar } from "./task/TaskFilterBar";
import { DeleteTaskDialog } from "./task/DeleteTaskDialog";
import { TaskGrid } from "./task/TaskGrid";
import { DragEndEvent } from "@dnd-kit/core";
import { SortField, SortOrder } from "./TaskSorting";
import { useTaskFiltering } from "./task/TaskFilterLogic";
import { useTaskOperations } from "./task/TaskOperations";
import { supabase } from "@/integrations/supabase/client";

interface TaskListProps {
  tasks: Task[];
  onTasksChange?: () => void;
  selectedFolder: string | null;
}

export function TaskList({ tasks, onTasksChange, selectedFolder }: TaskListProps) {
  const { toast } = useToast();
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [sortField, setSortField] = useState<SortField>("dueDate");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const { handleTaskClick, handleDragEnd } = useTaskOperations(onTasksChange);

  // Get unique filter options
  const categories = useMemo(() => ["all", ...new Set(tasks.map(task => task.category))], [tasks]);
  const statuses = useMemo(() => ["all", ...new Set(tasks.map(task => task.status))], [tasks]);
  const priorities = useMemo(() => ["all", ...new Set(tasks.map(task => task.priority))], [tasks]);

  const handleDeleteTask = async (task: Task) => {
    setTaskToDelete(task);
  };

  const confirmDelete = async () => {
    if (!taskToDelete) return;

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskToDelete.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Task deleted successfully",
      });
      onTasksChange?.();
    }
    setTaskToDelete(null);
  };

  const handleDragEndEvent = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const activeTask = tasks.find(task => task.id === active.id);
    if (!activeTask) return;

    if (over.id.toString().startsWith('folder-')) {
      const folderId = over.id.toString().replace('folder-', '');
      handleDragEnd(activeTask, folderId === 'none' ? null : folderId);
    }
  };

  // Filter and sort tasks
  const filteredAndSortedTasks = useTaskFiltering({
    tasks,
    selectedFolder,
    sortField,
    sortOrder,
    statusFilter,
    priorityFilter,
    categoryFilter,
  });

  return (
    <>
      <TaskFilterBar
        sortField={sortField}
        sortOrder={sortOrder}
        statusFilter={statusFilter}
        priorityFilter={priorityFilter}
        categoryFilter={categoryFilter}
        statuses={statuses}
        priorities={priorities}
        categories={categories}
        onSortFieldChange={setSortField}
        onSortOrderChange={setSortOrder}
        onStatusChange={setStatusFilter}
        onPriorityChange={setPriorityFilter}
        onCategoryChange={setCategoryFilter}
      />

      <TaskGrid
        tasks={filteredAndSortedTasks}
        onTaskClick={handleTaskClick}
        onTaskDelete={handleDeleteTask}
        onDragEnd={handleDragEndEvent}
      />

      <DeleteTaskDialog
        taskToDelete={taskToDelete}
        onClose={() => setTaskToDelete(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
}