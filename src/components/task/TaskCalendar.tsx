
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Task } from "@/types/task";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getPriorityColor } from "./TaskColors";

interface TaskCalendarProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

export function TaskCalendar({ tasks, onTaskClick }: TaskCalendarProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const { toast } = useToast();

  // Process tasks for the calendar
  const tasksByDate = tasks.reduce((acc, task) => {
    if (!task.dueDate) return acc;
    
    const dueDate = task.dueDate.split('T')[0]; // Extract just the date part
    if (!acc[dueDate]) {
      acc[dueDate] = [];
    }
    acc[dueDate].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  // Function to highlight dates with tasks
  const isDayWithTask = (day: Date): boolean => {
    const dateStr = day.toISOString().split('T')[0];
    return !!tasksByDate[dateStr];
  };

  // Function to get the highest priority for a date
  const getHighestPriority = (day: Date): Task['priority'] | null => {
    const dateStr = day.toISOString().split('T')[0];
    const tasksForDay = tasksByDate[dateStr];
    
    if (!tasksForDay || tasksForDay.length === 0) return null;
    
    // Get the highest priority (High > Medium > Low)
    const priorityOrder = { "High": 3, "Medium": 2, "Low": 1 };
    return tasksForDay.reduce((highest, task) => {
      return priorityOrder[task.priority] > priorityOrder[highest.priority] ? task : highest;
    }, tasksForDay[0]).priority;
  };

  // Function to render tasks for the selected date
  const renderTasksForSelectedDate = () => {
    if (!date) return null;
    
    const dateStr = date.toISOString().split('T')[0];
    const tasksForDay = tasksByDate[dateStr];
    
    if (!tasksForDay || tasksForDay.length === 0) {
      return (
        <div className="text-center py-4 text-muted-foreground">
          No tasks for this date
        </div>
      );
    }
    
    return (
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {tasksForDay.map(task => (
          <Card 
            key={task.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onTaskClick(task)}
          >
            <CardContent className="p-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium">{task.summary}</div>
                  <div className="text-sm text-muted-foreground">
                    {task.estimatedDuration && `${task.estimatedDuration} • `}
                    {task.category}
                  </div>
                </div>
                <Badge style={{ backgroundColor: getPriorityColor(task.priority) }}>
                  {task.priority}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="border rounded-md"
          modifiers={{
            hasTask: (day) => isDayWithTask(day),
            highPriority: (day) => getHighestPriority(day) === "High",
            mediumPriority: (day) => getHighestPriority(day) === "Medium",
            lowPriority: (day) => getHighestPriority(day) === "Low",
          }}
          modifiersStyles={{
            selected: { backgroundColor: "var(--accent)" },
            highPriority: { 
              backgroundColor: "rgba(239, 68, 68, 0.2)",
              fontWeight: "bold" 
            },
            mediumPriority: { 
              backgroundColor: "rgba(249, 115, 22, 0.2)" 
            },
            lowPriority: { 
              backgroundColor: "rgba(34, 197, 94, 0.2)" 
            },
          }}
        />
        <div className="mt-4 flex justify-center space-x-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
            <span className="text-xs">High</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-orange-500 rounded-full mr-1"></div>
            <span className="text-xs">Medium</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
            <span className="text-xs">Low</span>
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="font-medium mb-2">
          Tasks for {date?.toLocaleDateString(undefined, { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </h3>
        {renderTasksForSelectedDate()}
      </div>
    </div>
  );
}
