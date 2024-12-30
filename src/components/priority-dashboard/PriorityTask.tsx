import { Task } from "../TaskCard";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Flag, Timer, Calendar, CheckCircle } from "lucide-react";
import { formatDistanceToNow, isPast, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PriorityTaskProps {
  task: Task;
}

export function PriorityTask({ task }: PriorityTaskProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const dueDate = parseISO(task.dueDate);
  const isOverdue = isPast(dueDate);

  const handleStatusUpdate = async () => {
    const newStatus = task.status === "To Do" ? "In Progress" : "Done";
    
    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', task.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Task status updated",
    });
    
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
  };

  return (
    <Card className={cn(
      "transition-colors hover:bg-accent/5",
      isOverdue && "border-destructive"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="font-medium">{task.summary}</div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span className={cn(isOverdue && "text-destructive")}>
                  {isOverdue ? "Overdue by " : "Due in "}
                  {formatDistanceToNow(dueDate)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Timer className="h-4 w-4" />
                <span>{task.estimatedDuration}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className={cn(
                task.priority === "High" && "border-red-500 text-red-500",
                task.priority === "Medium" && "border-yellow-500 text-yellow-500",
                task.priority === "Low" && "border-green-500 text-green-500"
              )}>
                <Flag className="mr-1 h-3 w-3" />
                {task.priority}
              </Badge>
              <Badge variant="outline">
                {task.status}
              </Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleStatusUpdate}
            >
              <CheckCircle className="mr-1 h-4 w-4" />
              {task.status === "To Do" ? "Start" : "Complete"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/edit/${task.id}`)}
            >
              Edit
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}