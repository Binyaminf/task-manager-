import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

interface TaskHeaderProps {
  onNewTask: () => void;
}

export function TaskHeader({ onNewTask }: TaskHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold">Tasks</h1>
        <p className="text-gray-500 mt-1">Manage your tasks efficiently</p>
      </div>
      <Button onClick={onNewTask} className="gap-2">
        <PlusCircle className="w-4 h-4" />
        New Task
      </Button>
    </div>
  );
}