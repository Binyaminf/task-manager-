import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Clock, Link as LinkIcon, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Task {
  id: string;
  summary: string;
  description?: string;
  dueDate: string;
  estimatedDuration: string;
  priority: "High" | "Medium" | "Low";
  status: "To Do" | "In Progress" | "Done";
  category: string;
  externalLinks?: string[];
}

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  onDelete?: () => void;
}

export function TaskCard({ task, onClick, onDelete }: TaskCardProps) {
  const priorityColors = {
    High: "bg-red-100 text-red-800",
    Medium: "bg-yellow-100 text-yellow-800",
    Low: "bg-green-100 text-green-800",
  };

  const statusColors = {
    "To Do": "bg-gray-100 text-gray-800",
    "In Progress": "bg-blue-100 text-blue-800",
    Done: "bg-green-100 text-green-800",
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.();
  };

  return (
    <Card
      className={cn(
        "p-4 hover:shadow-md transition-shadow cursor-pointer animate-task-fade-in group",
        task.status === "Done" && "opacity-75"
      )}
      onClick={onClick}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <h3 className="font-medium text-lg">{task.summary}</h3>
          <div className="flex items-center gap-2">
            <Badge className={priorityColors[task.priority]}>{task.priority}</Badge>
            <Button
              variant="ghost"
              size="icon"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleDelete}
              aria-label="Delete task"
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>

        {task.description && (
          <p className="text-sm text-gray-600 line-clamp-2">{task.description}</p>
        )}

        <div className="flex flex-wrap gap-2 items-center text-sm text-gray-500">
          {task.dueDate && (
            <div className="flex items-center gap-1">
              <CalendarIcon className="w-4 h-4" />
              <span>{new Date(task.dueDate).toLocaleDateString()}</span>
            </div>
          )}
          {task.estimatedDuration && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{task.estimatedDuration}</span>
            </div>
          )}
          {task.externalLinks?.length > 0 && (
            <div className="flex items-center gap-1">
              <LinkIcon className="w-4 h-4" />
              <span>{task.externalLinks.length} links</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Badge variant="outline">{task.category}</Badge>
          <Badge className={statusColors[task.status]}>{task.status}</Badge>
        </div>
      </div>
    </Card>
  );
}