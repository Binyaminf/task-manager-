import { CardContent } from "@/components/ui/card";
import { TaskBadges } from "./TaskBadges";
import { TaskMetadata } from "./TaskMetadata";
import { Task } from "@/types/task";

interface TaskCardContentProps {
  description?: string;
  priority: Task['priority'];
  status: Task['status'];
  category: string;
  folderName: string;
  dueDate: string;
  estimatedDuration: string;
}

export const TaskCardContent = ({
  description,
  priority,
  status,
  category,
  folderName,
  dueDate,
  estimatedDuration,
}: TaskCardContentProps) => {
  return (
    <CardContent className="pb-4 px-3 sm:px-6">
      {description && (
        <p className="text-sm sm:text-base text-muted-foreground mb-4 line-clamp-2 transition-colors duration-200">
          {description}
        </p>
      )}
      
      <TaskBadges
        priority={priority}
        status={status}
        category={category}
        folderName={folderName}
      />

      <TaskMetadata
        dueDate={dueDate}
        estimatedDuration={estimatedDuration}
      />
    </CardContent>
  );
};