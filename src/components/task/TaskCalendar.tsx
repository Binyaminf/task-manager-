import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Task } from "@/types/task";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Check, Clock } from "lucide-react";

interface TaskCalendarProps {
  tasks: Task[];
}

export function TaskCalendar({ tasks }: TaskCalendarProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const isMobile = useIsMobile();

  // Group tasks by date
  const tasksByDate = tasks.reduce((acc, task) => {
    const dateKey = format(new Date(task.dueDate), 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'Done':
        return 'bg-green-500';
      case 'In Progress':
        return 'bg-yellow-500';
      case 'To Do':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'High':
        return 'bg-red-500';
      case 'Medium':
        return 'bg-yellow-500';
      case 'Low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const TaskList = ({ tasks }: { tasks: Task[] }) => (
    <div className="space-y-2">
      {tasks.map((task) => (
        <div 
          key={task.id} 
          className="p-3 rounded-md bg-muted/50 hover:bg-muted transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className={cn("w-2 h-2 rounded-full", getPriorityColor(task.priority))} />
              <div className="font-medium">{task.summary}</div>
            </div>
            <div className="flex items-center gap-2">
              {task.status === 'Done' && (
                <Check className="h-4 w-4 text-green-500" />
              )}
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {task.estimatedDuration}
              </span>
            </div>
          </div>
          {task.description && (
            <div className="text-sm text-muted-foreground mt-2 line-clamp-2">
              {task.description}
            </div>
          )}
          <div className="flex items-center gap-2 mt-2">
            <Badge 
              variant="secondary" 
              className={cn("text-xs", getStatusColor(task.status))}
            >
              {task.status}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {task.category}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );

  // Custom day render function
  const renderDay = (day: Date) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const dayTasks = tasksByDate[dateKey] || [];

    if (dayTasks.length === 0) return null;

    const hasCompletedTasks = dayTasks.some(task => task.status === 'Done');
    const hasHighPriorityTasks = dayTasks.some(task => task.priority === 'High');

    const content = (
      <div className="absolute bottom-1 right-1 flex gap-1">
        <Badge 
          variant="secondary" 
          className={cn(
            "h-4 w-4 p-0 flex items-center justify-center text-xs cursor-pointer",
            hasHighPriorityTasks ? 'bg-red-100 text-red-600' :
            hasCompletedTasks ? 'bg-green-100 text-green-600' :
            'bg-blue-100 text-blue-600'
          )}
        >
          {dayTasks.length}
        </Badge>
        {hasCompletedTasks && (
          <Check className="h-3 w-3 text-green-500" />
        )}
      </div>
    );

    return isMobile ? (
      <div onClick={(e) => {
        e.stopPropagation();
        setSelectedDate(dateKey);
      }}>
        {content}
      </div>
    ) : (
      <HoverCard>
        <HoverCardTrigger asChild>
          <div>{content}</div>
        </HoverCardTrigger>
        <HoverCardContent className="w-80 p-0">
          <div className="p-4 space-y-2">
            <h4 className="font-semibold">
              {format(day, 'MMMM d, yyyy')}
            </h4>
            <TaskList tasks={dayTasks} />
          </div>
        </HoverCardContent>
      </HoverCard>
    );
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm">
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        className="rounded-md border w-full"
        components={{
          DayContent: ({ date }) => (
            <div className="relative w-full h-full">
              <div>{format(date, 'd')}</div>
              {renderDay(date)}
            </div>
          ),
        }}
      />

      <Dialog open={!!selectedDate} onOpenChange={() => setSelectedDate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Tasks for {selectedDate ? format(new Date(selectedDate), 'PPP') : ''}
            </DialogTitle>
          </DialogHeader>
          {selectedDate && tasksByDate[selectedDate] && (
            <TaskList tasks={tasksByDate[selectedDate]} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}