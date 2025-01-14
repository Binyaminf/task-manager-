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
import { BatchActions } from "./task/BatchActions";

interface TaskListProps {
  tasks: Task[];
  onTasksChange?: () => void;
  selectedFolder: string | null;
}

export function TaskList({ tasks, onTasksChange, selectedFolder }: TaskListProps) {
  const { toast } = useToast();
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
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
    setSelectedTasks(new Set());
    setTaskToDelete(task);
  };

  const handleBatchDelete = async () => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .in('id', Array.from(selectedTasks));

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete tasks",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Tasks deleted successfully",
      });
      setSelectedTasks(new Set());
      onTasksChange?.();
    }
  };

  const handleBatchStatusChange = async (newStatus: Task['status']) => {
    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .in('id', Array.from(selectedTasks));

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Task status updated successfully",
      });
      setSelectedTasks(new Set());
      onTasksChange?.();
    }
  };

  const handleBatchMoveToFolder = async (folderId: string | null) => {
    const { error } = await supabase
      .from('tasks')
      .update({ folder_id: folderId })
      .in('id', Array.from(selectedTasks));

    if (error) {
      toast({
        title: "Error",
        description: "Failed to move tasks",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Tasks moved successfully",
      });
      setSelectedTasks(new Set());
      onTasksChange?.();
    }
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

  const handleTaskSelect = (taskId: string, selected: boolean) => {
    const newSelectedTasks = new Set(selectedTasks);
    if (selected) {
      newSelectedTasks.add(taskId);
    } else {
      newSelectedTasks.delete(taskId);
    }
    setSelectedTasks(newSelectedTasks);
  };

  return (
    <>
      <BatchActions
        selectedTasks={tasks.filter(task => selectedTasks.has(task.id))}
        onStatusChange={handleBatchStatusChange}
        onDelete={handleBatchDelete}
        onMoveToFolder={handleBatchMoveToFolder}
      />

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
        selectedTasks={selectedTasks}
        onTaskSelect={handleTaskSelect}
      />

      <DeleteTaskDialog
        taskToDelete={taskToDelete}
        onClose={() => setTaskToDelete(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
}