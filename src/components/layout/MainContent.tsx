
import { Header } from "@/components/layout/Header";
import { FolderList } from "@/components/FolderList";
import { TaskSection } from "@/components/sections/TaskSection";
import { PrioritySection } from "@/components/sections/PrioritySection";
import { AnalyticsSection } from "@/components/sections/AnalyticsSection";
import { AISection } from "@/components/sections/AISection";
import { useIsMobile } from "@/hooks/use-mobile";

interface MainContentProps {
  session: any;
  tasks: any[];
  viewMode: 'grid' | 'list' | 'calendar';
  selectedFolder: string | null;
  isLoading: boolean;
  onSignOut: () => void;
  onNewTask: (task: any) => void;
  onTasksChange?: () => void;
  onViewModeChange: (mode: 'grid' | 'list' | 'calendar') => void;
  onFolderSelect: (folderId: string | null) => void;
}

export function MainContent({
  session,
  tasks,
  viewMode,
  selectedFolder,
  isLoading,
  onSignOut,
  onNewTask,
  onTasksChange,
  onViewModeChange,
  onFolderSelect,
}: MainContentProps) {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        userEmail={session?.user?.email} 
        viewMode={viewMode === 'calendar' ? 'calendar' : 'list'} 
        onViewModeChange={onViewModeChange}
        onSignOut={onSignOut} 
      />
      
      <div className="container mx-auto p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Sidebar - folders */}
          <div className={isMobile ? "col-span-1" : "col-span-3 lg:col-span-2"}>
            <section className="bg-white rounded-lg shadow-sm p-4 md:p-6">
              <FolderList 
                selectedFolder={selectedFolder}
                onFolderSelect={onFolderSelect}
              />
            </section>
          </div>

          {/* Main content area */}
          <div className={`${isMobile ? "col-span-1" : "col-span-9 lg:col-span-7"}`}>
            <TaskSection
              tasks={tasks}
              onNewTask={onNewTask}
              viewMode={viewMode}
              onViewModeChange={onViewModeChange}
              onTasksChange={onTasksChange}
              selectedFolder={selectedFolder}
              isLoading={isLoading}
            />
          </div>

          {/* Right sidebar */}
          {!isMobile && (
            <div className="hidden lg:block lg:col-span-3">
              <div className="space-y-6">
                <PrioritySection tasks={tasks} />
                <AnalyticsSection />
                <AISection onTaskCreated={onTasksChange || (() => {})} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
