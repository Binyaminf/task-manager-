
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TaskSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function TaskSearch({ searchQuery, onSearchChange }: TaskSearchProps) {
  return (
    <div className="relative">
      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search tasks..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-8 pr-10"
      />
      {searchQuery && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1.5 h-6 w-6 text-muted-foreground hover:text-foreground"
          onClick={() => onSearchChange("")}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
