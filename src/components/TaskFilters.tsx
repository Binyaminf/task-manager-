import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();

  return (
    <div className={`flex flex-col md:flex-row gap-2 md:gap-4 ${isMobile ? 'w-full' : ''}`}>
      <Select value={statusFilter} onValueChange={onStatusChange}>
        <SelectTrigger className={isMobile ? 'w-full' : 'w-[180px]'}>
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
        <SelectTrigger className={isMobile ? 'w-full' : 'w-[180px]'}>
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
        <SelectTrigger className={isMobile ? 'w-full' : 'w-[180px]'}>
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