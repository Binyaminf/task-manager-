import { Task } from "./TaskCard";
import { useState, useMemo, useCallback, Suspense } from "react";
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
import { Skeleton } from "./ui/skeleton";

interface TaskListProps {
  tasks: Task[];
  onTasksChange?: () => void;
  selectedFolder: string | null;
}

const TaskGridFallback = () => (
  <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: 6 }).map((_, i) => (
      <Skeleton key={i} className="h-[200px] w-full" />
    ))}
  </div>
);

export function TaskList({ tasks, onTasksChange, selectedFolder }: TaskListProps) {
  const [sortField, setSortField] = useState<SortField>("dueDate");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const { handleTaskClick, handleDragEnd } = useTaskOperations(onTasksChange);
  const { selectedTasks, handleTaskSelect, clearSelection } = useTaskSelection();
  const { taskToDelete, handleDeleteTask, confirmDelete, closeDeleteDialog } = useTaskDeletion(onTasksChange);
  const { handleBatchDelete, handleBatchStatusChange, handleBatchMoveToFolder } = useBatchOperations(onTasksChange);

  // Memoize filter options
  const filterOptions = useMemo(() => {
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
  });

  const selectedTasksList = useMemo(() => 
    tasks.filter(task => selectedTasks.has(task.id)),
    [tasks, selectedTasks]
  );

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
        filterOptions={filterOptions}
        onSortFieldChange={setSortField}
        onSortOrderChange={setSortOrder}
        onStatusChange={setStatusFilter}
        onPriorityChange={setPriorityFilter}
        onCategoryChange={setCategoryFilter}
        onBatchStatusChange={handleBatchStatusChange}
        onBatchDelete={handleBatchDelete}
        onBatchMoveToFolder={handleBatchMoveToFolder}
        clearSelection={clearSelection}
      />

      <Suspense fallback={<TaskGridFallback />}>
        <TaskGrid
          tasks={filteredAndSortedTasks}
          onTaskClick={handleTaskClick}
          onTaskDelete={handleDeleteTask}
          onDragEnd={handleDragEndEvent}
          selectedTasks={selectedTasks}
          onTaskSelect={handleTaskSelect}
        />
      </Suspense>

      <DeleteTaskDialog
        taskToDelete={taskToDelete}
        onClose={closeDeleteDialog}
        onConfirm={confirmDelete}
      />
    </ErrorBoundary>
  );
}