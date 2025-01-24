import { Suspense, memo } from "react";
import { DeleteTaskDialog } from "./task/DeleteTaskDialog";
import { SortField, SortOrder } from "./TaskSorting";
import { TaskListHeader } from "./task/TaskListHeader";
import { CollapsibleFilters } from "./task/CollapsibleFilters";
import { TaskListContent } from "./task/TaskListContent";
import { Task } from "@/types/task";
import { TaskSkeleton, TaskSkeletonGrid } from "./common/TaskSkeleton";
import { useTaskListLogic } from "@/hooks/task/useTaskListLogic";

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
  const {
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
  } = useTaskListLogic({
    tasks,
    onTasksChange,
    selectedFolder,
    sortField,
    sortOrder,
    statusFilter,
    priorityFilter,
    categoryFilter,
    searchQuery,
  });

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