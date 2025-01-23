import { Task } from "@/types/task";
import { TaskList } from "../TaskList";
import { useState } from "react";
import { SortField, SortOrder } from "../TaskSorting";

interface TaskListContainerProps {
  tasks: Task[];
  onTasksChange?: () => void;
  selectedFolder: string | null;
  viewMode?: 'grid' | 'list';
  isLoading?: boolean;
}

export function TaskListContainer({
  tasks,
  onTasksChange,
  selectedFolder,
  viewMode = 'grid',
  isLoading = false
}: TaskListContainerProps) {
  const [sortField, setSortField] = useState<SortField>("dueDate");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  return (
    <TaskList
      tasks={tasks}
      onTasksChange={onTasksChange}
      selectedFolder={selectedFolder}
      viewMode={viewMode}
      isLoading={isLoading}
      sortField={sortField}
      sortOrder={sortOrder}
      statusFilter={statusFilter}
      priorityFilter={priorityFilter}
      categoryFilter={categoryFilter}
      searchQuery={searchQuery}
      onSortFieldChange={setSortField}
      onSortOrderChange={setSortOrder}
      onStatusChange={setStatusFilter}
      onPriorityChange={setPriorityFilter}
      onCategoryChange={setCategoryFilter}
      onSearchChange={setSearchQuery}
    />
  );
}