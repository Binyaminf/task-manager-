import { Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TaskBadges } from "./task/TaskBadges";
import { TaskMetadata } from "./task/TaskMetadata";
import { TaskLinks } from "./task/TaskLinks";

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
  folder_id: string | null;
}

export function TaskCard({ 
  task, 
  onClick, 
  onDelete,
  isSelected,
  onSelect,
}: { 
  task: Task; 
  onClick: () => void; 
  onDelete: () => void;
  isSelected?: boolean;
  onSelect?: (selected: boolean) => void;
}) {
  const [folderName, setFolderName] = useState<string>("");

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
      className="cursor-move"
    >
      <Card className={`w-full animate-task-fade-in ${isSelected ? 'ring-2 ring-primary' : ''}`}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              {onSelect && (
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={onSelect}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-1"
                />
              )}
              <CardTitle className="text-lg font-semibold">{task.summary}</CardTitle>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={onClick}
                className="h-8 w-8 cursor-pointer"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onDelete}
                className="h-8 w-8 text-destructive cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pb-2">
          {task.description && (
            <p className="text-sm text-muted-foreground mb-4">{task.description}</p>
          )}
          
          <TaskBadges
            priority={task.priority}
            status={task.status}
            category={task.category}
            folderName={folderName}
          />

          <TaskMetadata
            dueDate={task.dueDate}
            estimatedDuration={task.estimatedDuration}
          />
        </CardContent>

        <TaskLinks links={task.externalLinks} />
      </Card>
    </div>
  );
}