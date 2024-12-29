import { Calendar, Clock, ArrowRight, Edit2, Trash2, Folder } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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

const getPriorityColor = (priority: Task["priority"]) => {
  switch (priority) {
    case "High":
      return "bg-red-500";
    case "Medium":
      return "bg-yellow-500";
    case "Low":
      return "bg-green-500";
    default:
      return "bg-gray-500";
  }
};

const getStatusColor = (status: Task["status"]) => {
  switch (status) {
    case "To Do":
      return "bg-gray-500";
    case "In Progress":
      return "bg-blue-500";
    case "Done":
      return "bg-green-500";
    default:
      return "bg-gray-500";
  }
};

export function TaskCard({ 
  task, 
  onClick, 
  onDelete 
}: { 
  task: Task; 
  onClick: () => void; 
  onDelete: () => void; 
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
      <Card className="w-full animate-task-fade-in">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg font-semibold">{task.summary}</CardTitle>
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
          
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="secondary" className={`${getPriorityColor(task.priority)} text-white`}>
              {task.priority}
            </Badge>
            <Badge variant="secondary" className={`${getStatusColor(task.status)} text-white`}>
              {task.status}
            </Badge>
            {folderName && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Folder className="h-3 w-3" />
                {folderName}
              </Badge>
            )}
            <Badge variant="outline">{task.category}</Badge>
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{format(new Date(task.dueDate), 'PPP')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{task.estimatedDuration}</span>
            </div>
          </div>
        </CardContent>

        {task.externalLinks && task.externalLinks.length > 0 && (
          <CardFooter className="pt-2">
            <div className="flex flex-wrap gap-2">
              {task.externalLinks.map((link, index) => (
                <a
                  key={index}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-600"
                >
                  Link {index + 1}
                  <ArrowRight className="h-3 w-3" />
                </a>
              ))}
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}