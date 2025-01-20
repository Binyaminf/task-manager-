import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Task } from "@/components/TaskCard";
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

  // Get priority color
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
          className="p-2 rounded-md bg-muted/50"
        >
          <div className="flex items-center gap-2">
            <Badge className={cn("w-2 h-2 rounded-full", getPriorityColor(task.priority))} />
            <div className="font-medium">{task.summary}</div>
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {format(new Date(task.dueDate), 'p')}
          </div>
          {task.description && (
            <div className="text-sm text-muted-foreground mt-1">
              {task.description}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  // Custom day render function
  const renderDay = (day: Date) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const dayTasks = tasksByDate[dateKey] || [];

    if (dayTasks.length === 0) return null;

    const content = (
      <Badge 
        variant="secondary" 
        className={cn(
          "absolute bottom-1 right-1 h-4 w-4 p-0 flex items-center justify-center text-xs cursor-pointer",
          dayTasks.some(task => task.priority === 'High') ? 'bg-red-100 text-red-600' :
          dayTasks.some(task => task.priority === 'Medium') ? 'bg-yellow-100 text-yellow-600' :
          'bg-green-100 text-green-600'
        )}
        onClick={(e) => {
          if (isMobile) {
            e.stopPropagation();
            setSelectedDate(dateKey);
          }
        }}
      >
        {dayTasks.length}
      </Badge>
    );

    return isMobile ? (
      content
    ) : (
      <HoverCard>
        <HoverCardTrigger asChild>
          {content}
        </HoverCardTrigger>
        <HoverCardContent className="w-80">
          <TaskList tasks={dayTasks} />
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