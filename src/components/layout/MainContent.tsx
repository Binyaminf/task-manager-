import { Suspense } from "react";
import { Task } from "@/types/task";
import { Header } from "@/components/layout/Header";
import { PrioritySection } from "@/components/sections/PrioritySection";
import { AISection } from "@/components/sections/AISection";
import { TaskSection } from "@/components/sections/TaskSection";
import { ErrorBoundary } from "react-error-boundary";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadingFallback } from "../common/LoadingFallback";

interface MainContentProps {
  session: any;
  tasks: Task[];
  viewMode: 'list' | 'calendar';
  selectedFolder: string | null;
  isLoading: boolean;
  onSignOut: () => void;
  onNewTask: (task: Partial<Task>) => void;
  onTasksChange: () => void;
  onViewModeChange: (mode: 'list' | 'calendar') => void;
  onFolderSelect: (folderId: string | null) => void;
}

export const MainContent = ({
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
}: MainContentProps) => {
  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <ErrorBoundary fallback={<div>Something went wrong</div>}>
        <Header
          userEmail={session.user.email}
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
          onSignOut={onSignOut}
        />

        <main className="container mx-auto py-2 px-2 md:py-6 md:px-4 lg:py-8 lg:px-6">
          <div className="space-y-4 md:space-y-6 lg:space-y-8">
            <Suspense fallback={<Skeleton className="h-[200px] w-full" />}>
              <PrioritySection />
            </Suspense>
            
            <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
              <AISection onTaskCreated={onTasksChange} />
            </Suspense>
            
            <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
              <TaskSection
                tasks={tasks}
                viewMode={viewMode}
                selectedFolder={selectedFolder}
                onNewTask={onNewTask}
                onTasksChange={onTasksChange}
                onFolderSelect={onFolderSelect}
                isLoading={isLoading}
              />
            </Suspense>
          </div>
        </main>
      </ErrorBoundary>
    </div>
  );
};