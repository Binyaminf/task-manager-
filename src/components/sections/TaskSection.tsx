import { useState } from "react";
import { TaskHeader } from "@/components/TaskHeader";
import { FolderList } from "@/components/FolderList";
import { TaskListContainer } from "@/components/task/TaskListContainer";
import { TaskCalendar } from "@/components/task/TaskCalendar";
import { Task } from "@/components/TaskCard";
import { Button } from "../ui/button";
import { Calendar, List, ChevronDown, ChevronUp, LayoutGrid } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";

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
  const [currentView, setCurrentView] = useState<'list' | 'calendar'>(viewMode);

  return (
    <section className="bg-white rounded-lg shadow-sm p-2 sm:p-6">
      <div className="flex flex-col gap-4 mb-4 sm:mb-6">
        <TaskHeader onNewTask={onNewTask} />
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Tabs 
            value={currentView} 
            onValueChange={(value) => setCurrentView(value as 'list' | 'calendar')} 
            className="w-full sm:w-[400px]"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="list" className="flex items-center gap-2 h-10">
                <List className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">List View</span>
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex items-center gap-2 h-10">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">Calendar View</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
          {currentView === 'list' && (
            <div className="flex items-center gap-2">
              <Button
                variant={taskViewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTaskViewMode('grid')}
                className="h-10 px-4"
              >
                <LayoutGrid className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="ml-2 hidden sm:inline">Grid</span>
              </Button>
              <Button
                variant={taskViewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTaskViewMode('list')}
                className="h-10 px-4"
              >
                <List className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="ml-2 hidden sm:inline">List</span>
              </Button>
            </div>
          )}
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
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent className="space-y-2">
          <FolderList onFolderSelect={onFolderSelect} />
        </CollapsibleContent>
      </Collapsible>
      
      <div className="mt-6">
        {currentView === 'list' ? (
          <TaskListContainer 
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