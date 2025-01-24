import { Card } from "@/components/ui/card";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useState, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TaskLinks } from "./task/TaskLinks";
import { TaskCardHeader } from "./task/TaskCardHeader";
import { TaskCardContent } from "./task/TaskCardContent";
import { Task } from "@/types/task";

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  onDelete: () => void;
  isSelected?: boolean;
  onSelect?: (selected: boolean) => void;
}

export const TaskCard = memo(({ 
  task, 
  onClick, 
  onDelete,
  isSelected,
  onSelect,
}: TaskCardProps) => {
  const [folderName, setFolderName] = useState<string>("");
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const fetchFolderName = async () => {
      if (task.folder_id) {
        const { data, error } = await supabase
          .from('folders')
          .select('name')
          .eq('id', task.folder_id)
          .single();
        
        if (!error && data) {
          setFolderName(data.name);
        }
      }
    };

    fetchFolderName();
  }, [task.folder_id]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-move px-2 sm:px-0 touch-manipulation"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card 
        className={`
          w-full animate-task-fade-in shadow-sm 
          transition-all duration-200 ease-in-out
          ${isHovered ? 'shadow-md scale-[1.01]' : ''}
          ${isSelected ? 'ring-2 ring-primary' : ''}
          ${isDragging ? 'rotate-[1deg]' : ''}
        `}
      >
        <TaskCardHeader
          summary={task.summary}
          onClick={onClick}
          onDelete={onDelete}
          isSelected={isSelected}
          onSelect={onSelect}
        />
        
        <TaskCardContent
          description={task.description}
          priority={task.priority}
          status={task.status}
          category={task.category}
          folderName={folderName}
          dueDate={task.dueDate}
          estimatedDuration={task.estimatedDuration}
        />

        <TaskLinks links={task.externalLinks} />
      </Card>
    </div>
  );
});

TaskCard.displayName = 'TaskCard';