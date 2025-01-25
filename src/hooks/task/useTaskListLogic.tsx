import { useMemo } from "react";
import { Task } from "@/types/task";
import { SortField, SortOrder } from "@/components/TaskSorting";
import { useTaskFiltering } from "./useTaskFiltering";
import { useTaskOperations } from "./useTaskOperations";
import { useTaskSelection } from "./useTaskSelection";
import { useTaskDeletion } from "./useTaskDeletion";
import { useBatchOperations } from "./useBatchOperations";
import { DragEndEvent } from "@dnd-kit/core";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { arrayMove } from "@dnd-kit/sortable";

interface UseTaskListLogicProps {
  tasks: Task[];
  onTasksChange?: () => void;
  selectedFolder: string | null;
  sortField: SortField;
  sortOrder: SortOrder;
  statusFilter: string;
  priorityFilter: string;
  categoryFilter: string;
  searchQuery: string;
}

export function useTaskListLogic({
  tasks,
  onTasksChange,
  selectedFolder,
  sortField,
  sortOrder,
  statusFilter,
  priorityFilter,
  categoryFilter,
  searchQuery,
}: UseTaskListLogicProps) {
  const { toast } = useToast();
  const { handleTaskClick, handleDragEnd } = useTaskOperations(onTasksChange);
  const { selectedTasks, handleTaskSelect, clearSelection } = useTaskSelection();
  const { taskToDelete, handleDeleteTask, confirmDelete, closeDeleteDialog } = useTaskDeletion(onTasksChange);
  const { handleBatchDelete, handleBatchStatusChange, handleBatchMoveToFolder } = useBatchOperations(onTasksChange);

  // Memoize filter options
  const filterOptions = useMemo(() => ({
    categories: ["all", ...new Set(tasks.map(task => task.category))],
    statuses: ["all", ...new Set(tasks.map(task => task.status))],
    priorities: ["all", ...new Set(tasks.map(task => task.priority))]
  }), [tasks]);

  // Filter and sort tasks
  const filteredAndSortedTasks = useTaskFiltering({
    tasks,
    selectedFolder,
    sortField,
    sortOrder,
    statusFilter,
    priorityFilter,
    categoryFilter,
    searchQuery,
  });

  // Memoize drag end handler
  const handleDragEndEvent = useMemo(() => async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeTask = tasks.find(task => task.id === active.id);
    if (!activeTask) return;

    if (over.id.toString().startsWith('folder-')) {
      const folderId = over.id.toString().replace('folder-', '');
      handleDragEnd(activeTask, folderId === 'none' ? null : folderId);
    } else {
      const oldIndex = tasks.findIndex(t => t.id === active.id);
      const newIndex = tasks.findIndex(t => t.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedTasks = arrayMove(tasks, oldIndex, newIndex);
        
        try {
          for (let i = 0; i < reorderedTasks.length; i++) {
            const { error } = await supabase
              .from('tasks')
              .update({ order: i })
              .eq('id', reorderedTasks[i].id);

            if (error) throw error;
          }
          
          onTasksChange?.();
        } catch (error) {
          console.error('Error updating task order:', error);
          toast({
            title: "Error",
            description: "Failed to update task order",
            variant: "destructive",
          });
        }
      }
    }
  }, [tasks, handleDragEnd, onTasksChange, toast]);

  const selectedTasksList = useMemo(() => 
    tasks.filter(task => selectedTasks.has(task.id)),
    [tasks, selectedTasks]
  );

  return {
    filterOptions,
    selectedTasks,
    selectedTasksList,
    taskToDelete,
    filteredAndSortedTasks,
    handleTaskClick,
    handleTaskSelect,
    handleDeleteTask,
    handleDragEndEvent,
    confirmDelete,
    closeDeleteDialog,
    clearSelection,
    handleBatchDelete,
    handleBatchStatusChange,
    handleBatchMoveToFolder,
  };
}