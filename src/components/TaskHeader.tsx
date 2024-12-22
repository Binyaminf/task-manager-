import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Task } from "./TaskCard";

interface TaskHeaderProps {
  onNewTask: (task: Partial<Task>) => void;
}

export function TaskHeader({ onNewTask }: TaskHeaderProps) {
  const handleClick = () => {
    // Example task data
    const newTask: Partial<Task> = {
      summary: "New Task",
      priority: "Medium",
      status: "To Do",
      category: "General",
      dueDate: new Date().toISOString(),
      estimatedDuration: "1h"
    };
    onNewTask(newTask);
  };

  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold">Tasks</h1>
        <p className="text-gray-500 mt-1">Manage your tasks efficiently</p>
      </div>
      <Button onClick={handleClick} className="gap-2">
        <PlusCircle className="w-4 h-4" />
        New Task
      </Button>
    </div>
  );
}