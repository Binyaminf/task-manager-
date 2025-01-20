import { Task } from "../TaskCard";
import { Checkbox } from "../ui/checkbox";
import { format } from "date-fns";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Clock, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { getPriorityColor, getStatusColor } from "./TaskColors";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface TaskListViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onTaskDelete: (task: Task) => void;
  selectedTasks: Set<string>;
  onTaskSelect?: (taskId: string, selected: boolean) => void;
}

type GroupKey = 'status' | 'priority' | 'category' | 'none';

export function TaskListView({
  tasks,
  onTaskClick,
  onTaskDelete,
  selectedTasks,
  onTaskSelect,
}: TaskListViewProps) {
  const [groupBy, setGroupBy] = useState<GroupKey>('none');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (groupName: string) => {
    const newExpandedGroups = new Set(expandedGroups);
    if (expandedGroups.has(groupName)) {
      newExpandedGroups.delete(groupName);
    } else {
      newExpandedGroups.add(groupName);
    }
    setExpandedGroups(newExpandedGroups);
  };

  const groupTasks = () => {
    if (groupBy === 'none') return { 'All Tasks': tasks };

    return tasks.reduce((groups, task) => {
      const key = task[groupBy];
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(task);
      return groups;
    }, {} as Record<string, Task[]>);
  };

  const TaskItem = ({ task }: { task: Task }) => (
    <div
      className="flex items-center gap-4 p-4 bg-white border rounded-lg hover:bg-gray-50 transition-colors animate-task-fade-in"
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
        <div className="flex items-center gap-2 mb-2">
          <h3 className="font-medium truncate">{task.summary}</h3>
          <Badge variant="secondary" className={cn("text-white", getPriorityColor(task.priority))}>
            {task.priority}
          </Badge>
          <Badge variant="secondary" className={cn("text-white", getStatusColor(task.status))}>
            {task.status}
          </Badge>
        </div>
        
        {task.description && (
          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
            {task.description}
          </p>
        )}
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>Due: {format(new Date(task.dueDate), 'PP')}</span>
          </div>
          <span>Duration: {task.estimatedDuration}</span>
          <Badge variant="outline">{task.category}</Badge>
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
  );

  const groupedTasks = groupTasks();

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {(['none', 'status', 'priority', 'category'] as const).map((option) => (
          <Button
            key={option}
            variant={groupBy === option ? "default" : "outline"}
            onClick={() => setGroupBy(option)}
            className="capitalize"
          >
            {option === 'none' ? 'No Grouping' : option}
          </Button>
        ))}
      </div>

      <div className="space-y-4">
        {Object.entries(groupedTasks).map(([groupName, groupTasks]) => (
          <div key={groupName} className="space-y-2">
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => toggleGroup(groupName)}
            >
              {expandedGroups.has(groupName) ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              <h3 className="font-semibold text-lg">
                {groupName} ({groupTasks.length})
              </h3>
            </div>
            
            {expandedGroups.has(groupName) && (
              <div className="space-y-2 pl-6">
                {groupTasks.map((task) => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}