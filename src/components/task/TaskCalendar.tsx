import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Task } from "@/components/TaskCard";
import { format } from "date-fns";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TaskCalendarProps {
  tasks: Task[];
}

export function TaskCalendar({ tasks }: TaskCalendarProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());

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

  // Custom day render function
  const renderDay = (day: Date) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const dayTasks = tasksByDate[dateKey] || [];

    if (dayTasks.length === 0) return null;

    return (
      <HoverCard>
        <HoverCardTrigger>
          <Badge 
            variant="secondary" 
            className={cn(
              "absolute bottom-1 right-1 h-4 w-4 p-0 flex items-center justify-center text-xs",
              dayTasks.some(task => task.priority === 'High') ? 'bg-red-100 text-red-600' :
              dayTasks.some(task => task.priority === 'Medium') ? 'bg-yellow-100 text-yellow-600' :
              'bg-green-100 text-green-600'
            )}
          >
            {dayTasks.length}
          </Badge>
        </HoverCardTrigger>
        <HoverCardContent className="w-80">
          <div className="space-y-2">
            {dayTasks.map((task) => (
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
              </div>
            ))}
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
    </div>
  );
}