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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TaskListProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onTasksChange?: () => void;
}

type SortField = "dueDate" | "priority" | "status" | "category";
type SortOrder = "asc" | "desc";

export function TaskList({ tasks, onTaskClick, onTasksChange }: TaskListProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [sortField, setSortField] = useState<SortField>("dueDate");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

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

  // Get unique categories, statuses, and priorities for filters
  const categories = useMemo(() => ["all", ...new Set(tasks.map(task => task.category))], [tasks]);
  const statuses = useMemo(() => ["all", ...new Set(tasks.map(task => task.status))], [tasks]);
  const priorities = useMemo(() => ["all", ...new Set(tasks.map(task => task.priority))], [tasks]);

  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = [...tasks];

    // Apply filters
    if (statusFilter !== "all") {
      filtered = filtered.filter(task => task.status === statusFilter);
    }
    if (priorityFilter !== "all") {
      filtered = filtered.filter(task => task.priority === priorityFilter);
    }
    if (categoryFilter !== "all") {
      filtered = filtered.filter(task => task.category === categoryFilter);
    }

    // Sort tasks
    return filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "dueDate":
          comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          break;
        case "priority": {
          const priorityOrder = { High: 3, Medium: 2, Low: 1 };
          comparison = (priorityOrder[a.priority] || 0) - (priorityOrder[b.priority] || 0);
          break;
        }
        case "status": {
          const statusOrder = { "To Do": 1, "In Progress": 2, "Done": 3 };
          comparison = (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0);
          break;
        }
        case "category":
          comparison = a.category.localeCompare(b.category);
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [tasks, sortField, sortOrder, statusFilter, priorityFilter, categoryFilter]);

  return (
    <>
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap gap-4">
          <Select value={sortField} onValueChange={(value: SortField) => setSortField(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dueDate">Due Date</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
              <SelectItem value="status">Status</SelectItem>
              <SelectItem value="category">Category</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortOrder} onValueChange={(value: SortOrder) => setSortOrder(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort order..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Ascending</SelectItem>
              <SelectItem value="desc">Descending</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status..." />
            </SelectTrigger>
            <SelectContent>
              {statuses.map(status => (
                <SelectItem key={status} value={status}>
                  {status === "all" ? "All Statuses" : status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by priority..." />
            </SelectTrigger>
            <SelectContent>
              {priorities.map(priority => (
                <SelectItem key={priority} value={priority}>
                  {priority === "all" ? "All Priorities" : priority}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by category..." />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category === "all" ? "All Categories" : category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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