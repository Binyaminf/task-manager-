import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type SortField = "dueDate" | "priority" | "status" | "category";
export type SortOrder = "asc" | "desc";

interface TaskSortingProps {
  sortField: SortField;
  sortOrder: SortOrder;
  onSortFieldChange: (value: SortField) => void;
  onSortOrderChange: (value: SortOrder) => void;
}

export function TaskSorting({
  sortField,
  sortOrder,
  onSortFieldChange,
  onSortOrderChange,
}: TaskSortingProps) {
  return (
    <div className="flex flex-wrap gap-4">
      <Select value={sortField} onValueChange={onSortFieldChange}>
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

      <Select value={sortOrder} onValueChange={onSortOrderChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Sort order..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="asc">Ascending</SelectItem>
          <SelectItem value="desc">Descending</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}