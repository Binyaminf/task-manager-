import { useState } from "react";
import { TaskHeader } from "@/components/TaskHeader";
import { FolderList } from "@/components/FolderList";
import { TaskList } from "@/components/TaskList";
import { TaskCalendar } from "@/components/task/TaskCalendar";
import { Task } from "@/components/TaskCard";
import { Button } from "../ui/button";
import { ChevronDown, ChevronUp, LayoutGrid, List } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";

interface TaskSectionProps {
  tasks: Task[];
  viewMode: 'list' | 'calendar';
  selectedFolder: string | null;
  isLoading?: boolean;
  onNewTask: (task: Partial<Task>) => void;
  onTasksChange: () => void;
  onFolderSelect: (folderId: string | null) => void;
}

export function TaskSection({
  tasks,
  viewMode,
  selectedFolder,
  isLoading = false,
  onNewTask,
  onTasksChange,
  onFolderSelect,
}: TaskSectionProps) {
  const [taskViewMode, setTaskViewMode] = useState<'grid' | 'list'>('grid');
  const [isFoldersExpanded, setIsFoldersExpanded] = useState(true);

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
      
      <Collapsible
        open={isFoldersExpanded}
        onOpenChange={setIsFoldersExpanded}
        className="mb-6"
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-500">Folders</h3>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              {isFoldersExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent className="space-y-2">
          <FolderList onFolderSelect={onFolderSelect} />
        </CollapsibleContent>
      </Collapsible>
      
      <div className="mt-6">
        {viewMode === 'list' ? (
          <TaskList 
            tasks={tasks} 
            onTasksChange={onTasksChange}
            selectedFolder={selectedFolder}
            viewMode={taskViewMode}
            isLoading={isLoading}
          />
        ) : (
          <TaskCalendar tasks={tasks} />
        )}
      </div>
    </section>
  );
}