import { TaskFilters } from "../TaskFilters";
import { TaskSorting } from "../TaskSorting";
import { SortField, SortOrder } from "../TaskSorting";

interface TaskFilterBarProps {
  sortField: SortField;
  sortOrder: SortOrder;
  statusFilter: string;
  priorityFilter: string;
  categoryFilter: string;
  statuses: string[];
  priorities: string[];
  categories: string[];
  onSortFieldChange: (field: SortField) => void;
  onSortOrderChange: (order: SortOrder) => void;
  onStatusChange: (status: string) => void;
  onPriorityChange: (priority: string) => void;
  onCategoryChange: (category: string) => void;
}

export function TaskFilterBar({
  sortField,
  sortOrder,
  statusFilter,
  priorityFilter,
  categoryFilter,
  statuses,
  priorities,
  categories,
  onSortFieldChange,
  onSortOrderChange,
  onStatusChange,
  onPriorityChange,
  onCategoryChange,
}: TaskFilterBarProps) {
  return (
    <div className="mb-6 space-y-4">
      <TaskSorting
        sortField={sortField}
        sortOrder={sortOrder}
        onSortFieldChange={onSortFieldChange}
        onSortOrderChange={onSortOrderChange}
      />
      <TaskFilters
        statuses={statuses}
        priorities={priorities}
        categories={categories}
        statusFilter={statusFilter}
        priorityFilter={priorityFilter}
        categoryFilter={categoryFilter}
        onStatusChange={onStatusChange}
        onPriorityChange={onPriorityChange}
        onCategoryChange={onCategoryChange}
      />
    </div>
  );
}