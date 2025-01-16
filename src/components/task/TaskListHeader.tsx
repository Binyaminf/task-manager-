import { TaskFilterBar } from "./TaskFilterBar";
import { BatchActions } from "./BatchActions";
import { Task } from "../TaskCard";
import { SortField, SortOrder } from "../TaskSorting";

interface TaskListHeaderProps {
  selectedTasks: Task[];
  sortField: SortField;
  sortOrder: SortOrder;
  statusFilter: string;
  priorityFilter: string;
  categoryFilter: string;
  filterOptions: {
    statuses: string[];
    priorities: string[];
    categories: string[];
  };
  onSortFieldChange: (field: SortField) => void;
  onSortOrderChange: (order: SortOrder) => void;
  onStatusChange: (status: string) => void;
  onPriorityChange: (priority: string) => void;
  onCategoryChange: (category: string) => void;
  onBatchStatusChange: (status: Task['status']) => void;
  onBatchDelete: () => void;
  onBatchMoveToFolder: (folderId: string | null) => void;
  clearSelection: () => void;
}

export const TaskListHeader = ({
  selectedTasks,
  sortField,
  sortOrder,
  statusFilter,
  priorityFilter,
  categoryFilter,
  filterOptions,
  onSortFieldChange,
  onSortOrderChange,
  onStatusChange,
  onPriorityChange,
  onCategoryChange,
  onBatchStatusChange,
  onBatchDelete,
  onBatchMoveToFolder,
  clearSelection,
}: TaskListHeaderProps) => {
  return (
    <div className="mb-6">
      <BatchActions
        selectedTasks={selectedTasks}
        onStatusChange={(status) => {
          onBatchStatusChange(status);
          clearSelection();
        }}
        onDelete={() => {
          onBatchDelete();
          clearSelection();
        }}
        onMoveToFolder={(folderId) => {
          onBatchMoveToFolder(folderId);
          clearSelection();
        }}
      />

      <TaskFilterBar
        sortField={sortField}
        sortOrder={sortOrder}
        statusFilter={statusFilter}
        priorityFilter={priorityFilter}
        categoryFilter={categoryFilter}
        statuses={filterOptions.statuses}
        priorities={filterOptions.priorities}
        categories={filterOptions.categories}
        onSortFieldChange={onSortFieldChange}
        onSortOrderChange={onSortOrderChange}
        onStatusChange={onStatusChange}
        onPriorityChange={onPriorityChange}
        onCategoryChange={onCategoryChange}
      />
    </div>
  );
};