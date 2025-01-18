import { Task } from "../TaskCard";
import { Checkbox } from "../ui/checkbox";
import { format } from "date-fns";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Trash2 } from "lucide-react";
import { getPriorityColor, getStatusColor } from "./TaskColors";

interface TaskListViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onTaskDelete: (task: Task) => void;
  selectedTasks: Set<string>;
  onTaskSelect?: (taskId: string, selected: boolean) => void;
}

export function TaskListView({
  tasks,
  onTaskClick,
  onTaskDelete,
  selectedTasks,
  onTaskSelect,
}: TaskListViewProps) {
  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="flex items-center gap-4 p-4 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
        >
          {onTaskSelect && (
            <Checkbox
              checked={selectedTasks.has(task.id)}
              onCheckedChange={(checked) =>
                onTaskSelect(task.id, checked as boolean)
              }
            />
          )}
          
          <div className="flex-1 min-w-0" onClick={() => onTaskClick(task)}>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium truncate">{task.summary}</h3>
              <Badge variant="secondary" className={`${getPriorityColor(task.priority)} text-white`}>
                {task.priority}
              </Badge>
              <Badge variant="secondary" className={`${getStatusColor(task.status)} text-white`}>
                {task.status}
              </Badge>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>Due: {format(new Date(task.dueDate), 'PP')}</span>
              <span>Duration: {task.estimatedDuration}</span>
              <span>Category: {task.category}</span>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="text-gray-500 hover:text-red-500"
            onClick={() => onTaskDelete(task)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}