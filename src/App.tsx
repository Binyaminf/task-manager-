import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import TaskEdit from "./components/TaskEdit";
import { useState } from "react";
import { Task } from "./components/TaskCard";

const queryClient = new QueryClient();

const App = () => {
  const [tasks, setTasks] = useState<Task[]>([]); // Initialize with your tasks

  const handleSaveTask = (editedTask: Task) => {
    setTasks(tasks.map(task => (task.id === editedTask.id ? editedTask : task)));
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/edit/:taskId" element={<TaskEdit tasks={tasks} onSave={handleSaveTask} />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
