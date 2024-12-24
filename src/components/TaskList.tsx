import { TaskCard, Task } from "./TaskCard";
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TaskFilters } from "./TaskFilters";
import { TaskSorting, SortField, SortOrder } from "./TaskSorting";
import { sortTasks, filterTasks } from "@/utils/taskUtils";

interface TaskListProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onTasksChange?: () => void;
}

export function TaskList({ tasks, onTaskClick, onTasksChange }: TaskListProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [sortField, setSortField] = useState<SortField>("dueDate");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Get unique categories, statuses, and priorities for filters
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

  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    const filtered = filterTasks(tasks, statusFilter, priorityFilter, categoryFilter);
    return sortTasks(filtered, sortField, sortOrder);
  }, [tasks, sortField, sortOrder, statusFilter, priorityFilter, categoryFilter]);

  return (
    <>
      <div className="mb-6 space-y-4">
        <TaskSorting
          sortField={sortField}
          sortOrder={sortOrder}
          onSortFieldChange={setSortField}
          onSortOrderChange={setSortOrder}
        />
        <TaskFilters
          statuses={statuses}
          priorities={priorities}
          categories={categories}
          statusFilter={statusFilter}
          priorityFilter={priorityFilter}
          categoryFilter={categoryFilter}
          onStatusChange={setStatusFilter}
          onPriorityChange={setPriorityFilter}
          onCategoryChange={setCategoryFilter}
        />
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {filteredAndSortedTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onClick={() => handleTaskClick(task)}
            onDelete={() => handleDeleteTask(task)}
          />
        ))}
      </div>

      <AlertDialog open={!!taskToDelete} onOpenChange={() => setTaskToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the task
              "{taskToDelete?.summary}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}