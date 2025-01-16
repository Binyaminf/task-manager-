import { TaskFilterBar } from "./TaskFilterBar";
import { BatchActions } from "./BatchActions";
import { Task } from "../TaskCard";

interface TaskListHeaderProps {
  selectedTasks: Task[];
  sortField: string;
  sortOrder: string;
  statusFilter: string;
  priorityFilter: string;
  categoryFilter: string;
  filterOptions: {
    statuses: string[];
    priorities: string[];
    categories: string[];
  };
  onSortFieldChange: (field: any) => void;
  onSortOrderChange: (order: any) => void;
  onStatusChange: (status: string) => void;
  onPriorityChange: (priority: string) => void;
  onCategoryChange: (category: string) => void;
  onBatchStatusChange: (status: string) => void;
  onBatchDelete: () => void;
  onBatchMoveToFolder: (folderId: string) => void;
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