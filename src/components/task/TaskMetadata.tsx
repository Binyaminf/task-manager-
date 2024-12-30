import { Calendar, Clock } from "lucide-react";
import { format } from "date-fns";

interface TaskMetadataProps {
  dueDate: string;
  estimatedDuration: string;
}

export function TaskMetadata({ dueDate, estimatedDuration }: TaskMetadataProps) {
  return (
    <div className="space-y-2 text-sm text-muted-foreground">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4" />
        <span>{format(new Date(dueDate), 'PPP')}</span>
      </div>
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4" />
        <span>{estimatedDuration}</span>
      </div>
    </div>
  );
}