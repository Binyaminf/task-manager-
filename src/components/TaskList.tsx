import { Task } from "./TaskCard";
import { useNavigate } from 'react-router-dom';
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { sortTasks, filterTasks } from "@/utils/taskUtils";
import { TaskFilterBar } from "./task/TaskFilterBar";
import { DeleteTaskDialog } from "./task/DeleteTaskDialog";
import { TaskGrid } from "./task/TaskGrid";
import { DragEndEvent } from "@dnd-kit/core";
import { SortField, SortOrder } from "./TaskSorting";

interface TaskListProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onTasksChange?: () => void;
  selectedFolder: string | null;
}

export function TaskList({ tasks, onTaskClick, onTasksChange, selectedFolder }: TaskListProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [sortField, setSortField] = useState<SortField>("dueDate");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const categories = useMemo(() => ["all", ...new Set(tasks.map(task => task.category))], [tasks]);
  const statuses = useMemo(() => ["all", ...new Set(tasks.map(task => task.status))], [tasks]);
  const priorities = useMemo(() => ["all", ...new Set(tasks.map(task => task.priority))], [tasks]);

  const handleTaskClick = (task: Task) => {
    onTaskClick?.(task);
    navigate(`/edit/${task.id}`);
  };

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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const activeTask = tasks.find(task => task.id === active.id);
    if (!activeTask) return;

    // If dropping on a folder
    if (over.id.toString().startsWith('folder-')) {
      const folderId = over.id.toString().replace('folder-', '');
      
      const { error } = await supabase
        .from('tasks')
        .update({ folder_id: folderId === 'none' ? null : folderId })
        .eq('id', activeTask.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to move task to folder",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Task moved to folder",
        });
        onTasksChange?.();
      }
    }
  };

  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    // First filter by folder if one is selected
    const folderFilteredTasks = selectedFolder === null 
      ? tasks 
      : tasks.filter(task => task.folder_id === selectedFolder);

    // Then apply other filters
    const filtered = filterTasks(folderFilteredTasks, statusFilter, priorityFilter, categoryFilter);
    return sortTasks(filtered, sortField, sortOrder);
  }, [tasks, selectedFolder, sortField, sortOrder, statusFilter, priorityFilter, categoryFilter]);

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
        onDragEnd={handleDragEnd}
      />

      <DeleteTaskDialog
        taskToDelete={taskToDelete}
        onClose={() => setTaskToDelete(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
}