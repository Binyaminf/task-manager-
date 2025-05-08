
import { useState } from "react";
import { TaskHeader } from "@/components/TaskHeader";
import { FolderList } from "@/components/FolderList";
import { TaskListContainer } from "@/components/task/TaskListContainer";
import { TaskCalendar } from "@/components/task/TaskCalendar";
import { Task } from "@/types/task";
import { Button } from "../ui/button";
import { Calendar, List, ChevronDown, ChevronUp, LayoutGrid } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();

  return (
    <section className="bg-white rounded-lg shadow-sm p-2 sm:p-6">
      <div className="flex flex-col gap-4 mb-4 sm:mb-6">
        <TaskHeader onNewTask={onNewTask} />
        <div className={`flex ${isMobile ? "flex-col" : "sm:flex-row sm:items-center"} gap-4`}>
          <Tabs 
            value={currentView} 
            onValueChange={(value) => setCurrentView(value as 'list' | 'calendar')} 
            className="w-full sm:w-auto"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="list" className="flex items-center gap-2 h-10">
                <List className="h-4 w-4" />
                <span>List</span>
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex items-center gap-2 h-10">
                <Calendar className="h-4 w-4" />
                <span>Calendar</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
          {currentView === 'list' && (
            <div className="flex items-center gap-2">
              <Button
                variant={taskViewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTaskViewMode('grid')}
                className="flex-1 sm:flex-none h-10 px-4"
              >
                <LayoutGrid className="h-4 w-4 mr-2" />
                Grid
              </Button>
              <Button
                variant={taskViewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTaskViewMode('list')}
                className="flex-1 sm:flex-none h-10 px-4"
              >
                <List className="h-4 w-4 mr-2" />
                List
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
          <div className={isMobile ? "overflow-x-auto -mx-2 px-2" : ""}>
            <TaskCalendar tasks={tasks} />
          </div>
        )}
      </div>
    </section>
  );
}
