import { useState } from "react";

export function useTaskSelection() {
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());

  const handleTaskSelect = (taskId: string, selected: boolean) => {
    const newSelectedTasks = new Set(selectedTasks);
    if (selected) {
      newSelectedTasks.add(taskId);
    } else {
      newSelectedTasks.delete(taskId);
    }
    setSelectedTasks(newSelectedTasks);
  };

  const clearSelection = () => {
    setSelectedTasks(new Set());
  };

  return {
    selectedTasks,
    handleTaskSelect,
    clearSelection
  };
}