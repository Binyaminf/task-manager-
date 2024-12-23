import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Task } from "./TaskCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TaskForm } from "./TaskForm";

interface TaskHeaderProps {
  onNewTask: (task: Partial<Task>) => void;
}

export function TaskHeader({ onNewTask }: TaskHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold">Tasks</h1>
        <p className="text-gray-500 mt-1">Manage your tasks efficiently</p>
      </div>
      <Dialog>
        <DialogTrigger asChild>
          <Button className="gap-2">
            <PlusCircle className="w-4 h-4" />
            New Task
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
          </DialogHeader>
          <TaskForm onSubmit={onNewTask} />
        </DialogContent>
      </Dialog>
    </div>
  );
}