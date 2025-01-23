import { Suspense, memo, useMemo } from "react";
import { DeleteTaskDialog } from "./task/DeleteTaskDialog";
import { DragEndEvent } from "@dnd-kit/core";
import { SortField, SortOrder } from "./TaskSorting";
import { useTaskFiltering } from "./task/TaskFilterLogic";
import { useTaskOperations } from "./task/TaskOperations";
import { useTaskSelection } from "@/hooks/useTaskSelection";
import { useTaskDeletion } from "@/hooks/useTaskDeletion";
import { useBatchOperations } from "@/hooks/useBatchOperations";
import { TaskListHeader } from "./task/TaskListHeader";
import { CollapsibleFilters } from "./task/CollapsibleFilters";
import { TaskListContent } from "./task/TaskListContent";
import { Task } from "./TaskCard";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { arrayMove } from "@dnd-kit/sortable";
import { TaskSkeleton, TaskSkeletonGrid } from "./common/TaskSkeleton";

interface TaskListProps {
  tasks: Task[];
  onTasksChange?: () => void;
  selectedFolder: string | null;
  viewMode?: 'grid' | 'list';
  isLoading?: boolean;
  sortField: SortField;
  sortOrder: SortOrder;
  statusFilter: string;
  priorityFilter: string;
  categoryFilter: string;
  searchQuery: string;
  onSortFieldChange: (field: SortField) => void;
  onSortOrderChange: (order: SortOrder) => void;
  onStatusChange: (status: string) => void;
  onPriorityChange: (priority: string) => void;
  onCategoryChange: (category: string) => void;
  onSearchChange: (query: string) => void;
}

const TaskList = memo(({ 
  tasks,
  onTasksChange,
  selectedFolder,
  viewMode = 'grid',
  isLoading = false,
  sortField,
  sortOrder,
  statusFilter,
  priorityFilter,
  categoryFilter,
  searchQuery,
  onSortFieldChange,
  onSortOrderChange,
  onStatusChange,
  onPriorityChange,
  onCategoryChange,
  onSearchChange,
}: TaskListProps) => {
  const { toast } = useToast();
  const { handleTaskClick, handleDragEnd } = useTaskOperations(onTasksChange);
  const { selectedTasks, handleTaskSelect, clearSelection } = useTaskSelection();
  const { taskToDelete, handleDeleteTask, confirmDelete, closeDeleteDialog } = useTaskDeletion(onTasksChange);
  const { handleBatchDelete, handleBatchStatusChange, handleBatchMoveToFolder } = useBatchOperations(onTasksChange);

  // Memoize filter options to prevent unnecessary re-renders
  const filterOptions = useMemo(() => ({
    categories: ["all", ...new Set(tasks.map(task => task.category))],
    statuses: ["all", ...new Set(tasks.map(task => task.status))],
    priorities: ["all", ...new Set(tasks.map(task => task.priority))]
  }), [tasks]);

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

  // Filter and sort tasks using memoized function
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

  const selectedTasksList = useMemo(() => 
    tasks.filter(task => selectedTasks.has(task.id)),
    [tasks, selectedTasks]
  );

  return (
    <>
      <TaskListHeader
        selectedTasks={selectedTasksList}
        sortField={sortField}
        sortOrder={sortOrder}
        statusFilter={statusFilter}
        priorityFilter={priorityFilter}
        categoryFilter={categoryFilter}
        searchQuery={searchQuery}
        filterOptions={filterOptions}
        onSortFieldChange={onSortFieldChange}
        onSortOrderChange={onSortOrderChange}
        onStatusChange={onStatusChange}
        onPriorityChange={onPriorityChange}
        onCategoryChange={onCategoryChange}
        onSearchChange={onSearchChange}
        onBatchStatusChange={(status) => handleBatchStatusChange(selectedTasks, status)}
        onBatchDelete={() => handleBatchDelete(selectedTasks)}
        onBatchMoveToFolder={(folderId) => handleBatchMoveToFolder(selectedTasks, folderId)}
        clearSelection={clearSelection}
      />

      <CollapsibleFilters
        sortField={sortField}
        sortOrder={sortOrder}
        statusFilter={statusFilter}
        priorityFilter={priorityFilter}
        categoryFilter={categoryFilter}
        searchQuery={searchQuery}
        statuses={filterOptions.statuses}
        priorities={filterOptions.priorities}
        categories={filterOptions.categories}
        onSortFieldChange={onSortFieldChange}
        onSortOrderChange={onSortOrderChange}
        onStatusChange={onStatusChange}
        onPriorityChange={onPriorityChange}
        onCategoryChange={onCategoryChange}
        onSearchChange={onSearchChange}
      />

      <Suspense fallback={viewMode === 'grid' ? <TaskSkeletonGrid /> : <TaskSkeleton />}>
        <TaskListContent
          tasks={filteredAndSortedTasks}
          viewMode={viewMode}
          isLoading={isLoading}
          selectedTasks={selectedTasks}
          onTaskClick={handleTaskClick}
          onTaskDelete={handleDeleteTask}
          onDragEnd={handleDragEndEvent}
          onTaskSelect={handleTaskSelect}
        />
      </Suspense>

      <DeleteTaskDialog
        taskToDelete={taskToDelete}
        onClose={closeDeleteDialog}
        onConfirm={confirmDelete}
      />
    </>
  );
});

TaskList.displayName = 'TaskList';

export { TaskList };