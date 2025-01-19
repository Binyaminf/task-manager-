import { Task } from "./TaskCard";
import { useState, useMemo, useCallback, Suspense, memo } from "react";
import { DeleteTaskDialog } from "./task/DeleteTaskDialog";
import { TaskGrid } from "./task/TaskGrid";
import { DragEndEvent } from "@dnd-kit/core";
import { SortField, SortOrder } from "./TaskSorting";
import { useTaskFiltering } from "./task/TaskFilterLogic";
import { useTaskOperations } from "./task/TaskOperations";
import { useTaskSelection } from "@/hooks/useTaskSelection";
import { useTaskDeletion } from "@/hooks/useTaskDeletion";
import { useBatchOperations } from "@/hooks/useBatchOperations";
import { ErrorBoundary } from "react-error-boundary";
import { TaskListHeader } from "./task/TaskListHeader";
import { TaskSkeleton, TaskSkeletonGrid } from "./common/TaskSkeleton";
import { CollapsibleFilters } from "./task/CollapsibleFilters";
import { TaskListView } from "./task/TaskListView";

interface TaskListProps {
  tasks: Task[];
  onTasksChange?: () => void;
  selectedFolder: string | null;
  viewMode?: 'grid' | 'list';
  isLoading?: boolean;
}

const TaskList = memo(({ 
  tasks, 
  onTasksChange, 
  selectedFolder,
  viewMode = 'grid',
  isLoading = false
}: TaskListProps) => {
  const [sortField, setSortField] = useState<SortField>("dueDate");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const { handleTaskClick, handleDragEnd } = useTaskOperations(onTasksChange);
  const { selectedTasks, handleTaskSelect, clearSelection } = useTaskSelection();
  const { taskToDelete, handleDeleteTask, confirmDelete, closeDeleteDialog } = useTaskDeletion(onTasksChange);
  const { handleBatchDelete, handleBatchStatusChange, handleBatchMoveToFolder } = useBatchOperations(onTasksChange);

  // Memoize filter options
  const filterOptions = useMemo(() => {
    console.log('Recalculating filter options');
    const categories = ["all", ...new Set(tasks.map(task => task.category))];
    const statuses = ["all", ...new Set(tasks.map(task => task.status))];
    const priorities = ["all", ...new Set(tasks.map(task => task.priority))];
    return { categories, statuses, priorities };
  }, [tasks]);

  const handleDragEndEvent = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeTask = tasks.find(task => task.id === active.id);
    if (!activeTask) return;

    if (over.id.toString().startsWith('folder-')) {
      const folderId = over.id.toString().replace('folder-', '');
      handleDragEnd(activeTask, folderId === 'none' ? null : folderId);
    }
  }, [tasks, handleDragEnd]);

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

  const selectedTasksList = useMemo(() => 
    tasks.filter(task => selectedTasks.has(task.id)),
    [tasks, selectedTasks]
  );

  if (isLoading) {
    return viewMode === 'grid' ? <TaskSkeletonGrid /> : <TaskSkeleton />;
  }

  if (!tasks || tasks.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No tasks found. Create a new task to get started.
      </div>
    );
  }

  return (
    <ErrorBoundary fallback={<div>Something went wrong</div>}>
      <TaskListHeader
        selectedTasks={selectedTasksList}
        sortField={sortField}
        sortOrder={sortOrder}
        statusFilter={statusFilter}
        priorityFilter={priorityFilter}
        categoryFilter={categoryFilter}
        searchQuery={searchQuery}
        filterOptions={filterOptions}
        onSortFieldChange={setSortField}
        onSortOrderChange={setSortOrder}
        onStatusChange={setStatusFilter}
        onPriorityChange={setPriorityFilter}
        onCategoryChange={setCategoryFilter}
        onSearchChange={setSearchQuery}
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
        onSortFieldChange={setSortField}
        onSortOrderChange={setSortOrder}
        onStatusChange={setStatusFilter}
        onPriorityChange={setPriorityChange}
        onCategoryChange={setCategoryFilter}
        onSearchChange={setSearchQuery}
      />

      <Suspense fallback={viewMode === 'grid' ? <TaskSkeletonGrid /> : <TaskSkeleton />}>
        {viewMode === 'grid' ? (
          <TaskGrid
            tasks={filteredAndSortedTasks}
            onTaskClick={handleTaskClick}
            onTaskDelete={handleDeleteTask}
            onDragEnd={handleDragEndEvent}
            selectedTasks={selectedTasks}
            onTaskSelect={handleTaskSelect}
          />
        ) : (
          <TaskListView
            tasks={filteredAndSortedTasks}
            onTaskClick={handleTaskClick}
            onTaskDelete={handleDeleteTask}
            selectedTasks={selectedTasks}
            onTaskSelect={handleTaskSelect}
          />
        )}
      </Suspense>

      <DeleteTaskDialog
        taskToDelete={taskToDelete}
        onClose={closeDeleteDialog}
        onConfirm={confirmDelete}
      />
    </ErrorBoundary>
  );
});

TaskList.displayName = 'TaskList';

export { TaskList };