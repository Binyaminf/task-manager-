import { Badge } from "@/components/ui/badge";
import { Folder } from "lucide-react";
import { getPriorityColor, getStatusColor } from "./TaskColors";

interface TaskBadgesProps {
  priority: "High" | "Medium" | "Low";
  status: "To Do" | "In Progress" | "Done";
  category: string;
  folderName?: string;
}

export function TaskBadges({ priority, status, category, folderName }: TaskBadgesProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <Badge variant="secondary" className={`${getPriorityColor(priority)} text-white`}>
        {priority}
      </Badge>
      <Badge variant="secondary" className={`${getStatusColor(status)} text-white`}>
        {status}
      </Badge>
      {folderName && (
        <Badge variant="outline" className="flex items-center gap-1">
          <Folder className="h-3 w-3" />
          {folderName}
        </Badge>
      )}
      <Badge variant="outline">{category}</Badge>
    </div>
  );
}