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
            className="absolute bottom-1 right-1 h-4 w-4 p-0 flex items-center justify-center text-xs"
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
                <div className="font-medium">{task.summary}</div>
                <div className="text-sm text-muted-foreground">
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