import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TaskFiltersProps {
  statuses: string[];
  priorities: string[];
  categories: string[];
  statusFilter: string;
  priorityFilter: string;
  categoryFilter: string;
  onStatusChange: (value: string) => void;
  onPriorityChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
}

export function TaskFilters({
  statuses,
  priorities,
  categories,
  statusFilter,
  priorityFilter,
  categoryFilter,
  onStatusChange,
  onPriorityChange,
  onCategoryChange,
}: TaskFiltersProps) {
  return (
    <div className="flex flex-wrap gap-4">
      <Select value={statusFilter} onValueChange={onStatusChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filter by status..." />
        </SelectTrigger>
        <SelectContent>
          {statuses.map(status => (
            <SelectItem key={status} value={status}>
              {status === "all" ? "All Statuses" : status}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={priorityFilter} onValueChange={onPriorityChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filter by priority..." />
        </SelectTrigger>
        <SelectContent>
          {priorities.map(priority => (
            <SelectItem key={priority} value={priority}>
              {priority === "all" ? "All Priorities" : priority}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={categoryFilter} onValueChange={onCategoryChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filter by category..." />
        </SelectTrigger>
        <SelectContent>
          {categories.map(category => (
            <SelectItem key={category} value={category}>
              {category === "all" ? "All Categories" : category}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}