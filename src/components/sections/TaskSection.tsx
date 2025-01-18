import { useState } from "react";
import { TaskHeader } from "@/components/TaskHeader";
import { FolderList } from "@/components/FolderList";
import { TaskList } from "@/components/TaskList";
import { TaskCalendar } from "@/components/task/TaskCalendar";
import { Task } from "@/components/TaskCard";
import { CollapsibleFilters } from "../task/CollapsibleFilters";
import { Button } from "../ui/button";
import { LayoutGrid, List } from "lucide-react";

interface TaskSectionProps {
  tasks: Task[];
  viewMode: 'list' | 'calendar';
  selectedFolder: string | null;
  onNewTask: (task: Partial<Task>) => void;
  onTasksChange: () => void;
  onFolderSelect: (folderId: string | null) => void;
}

export function TaskSection({
  tasks,
  viewMode,
  selectedFolder,
  onNewTask,
  onTasksChange,
  onFolderSelect,
}: TaskSectionProps) {
  const [taskViewMode, setTaskViewMode] = useState<'grid' | 'list'>('grid');

  return (
    <section className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <TaskHeader onNewTask={onNewTask} />
        <div className="flex items-center gap-2">
          <Button
            variant={taskViewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTaskViewMode('grid')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={taskViewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTaskViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="mt-6">
        <FolderList onFolderSelect={onFolderSelect} />
      </div>
      
      <div className="mt-6">
        {viewMode === 'list' ? (
          <TaskList 
            tasks={tasks} 
            onTasksChange={onTasksChange}
            selectedFolder={selectedFolder}
            viewMode={taskViewMode}
          />
        ) : (
          <TaskCalendar tasks={tasks} />
        )}
      </div>
    </section>
  );
}