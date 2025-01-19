import { useState } from "react";
import { TaskFilterBar } from "./TaskFilterBar";
import { SortField, SortOrder } from "../TaskSorting";
import { ChevronDown, ChevronUp, Filter } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

interface CollapsibleFiltersProps {
  sortField: SortField;
  sortOrder: SortOrder;
  statusFilter: string;
  priorityFilter: string;
  categoryFilter: string;
  searchQuery: string;
  statuses: string[];
  priorities: string[];
  categories: string[];
  onSortFieldChange: (field: SortField) => void;
  onSortOrderChange: (order: SortOrder) => void;
  onStatusChange: (status: string) => void;
  onPriorityChange: (priority: string) => void;
  onCategoryChange: (category: string) => void;
  onSearchChange: (query: string) => void;
}

export function CollapsibleFilters(props: CollapsibleFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasActiveFilters =
    props.statusFilter !== "all" ||
    props.priorityFilter !== "all" ||
    props.categoryFilter !== "all" ||
    props.searchQuery.trim() !== "";

  return (
    <div className="bg-white rounded-lg shadow-sm mb-4">
      <Button
        variant="ghost"
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-primary" />
          <span className="text-lg font-semibold">Filters & Search</span>
          {hasActiveFilters && (
            <span className="bg-primary/10 text-primary text-sm px-2 py-1 rounded-full">
              Active
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5" />
        ) : (
          <ChevronDown className="h-5 w-5" />
        )}
      </Button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-300",
          isExpanded ? "max-h-[500px]" : "max-h-0"
        )}
      >
        <div className="p-4 pt-0">
          <TaskFilterBar {...props} />
        </div>
      </div>
    </div>
  );
}