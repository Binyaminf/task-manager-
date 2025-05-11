import { TaskHeader } from "@/components/TaskHeader";
import { TaskListContainer } from "@/components/task/TaskListContainer";
import { Task } from "@/types/task";
import { useIsMobile } from "@/hooks/use-mobile";

interface TaskSectionProps {
  tasks: Task[];
  onNewTask: (task: Partial<Task>) => void;
  onTasksChange?: () => void;
  selectedFolder: string | null;
  viewMode?: 'grid' | 'list' | 'calendar';
  onViewModeChange?: (mode: 'grid' | 'list' | 'calendar') => void;
  isLoading?: boolean;
}

export function TaskSection({
  tasks,
  onNewTask,
  onTasksChange,
  selectedFolder,
  viewMode = 'grid',
  onViewModeChange,
  isLoading = false,
}: TaskSectionProps) {
  const isMobile = useIsMobile();

  return (
    <section className="bg-white rounded-lg shadow-sm p-4 md:p-6">
      <div className="mb-6">
        <TaskHeader 
          onNewTask={onNewTask} 
          viewMode={viewMode} 
          onViewModeChange={onViewModeChange}
        />
      </div>

      <TaskListContainer
        tasks={tasks}
        onTasksChange={onTasksChange}
        selectedFolder={selectedFolder}
        viewMode={viewMode}
        isLoading={isLoading}
      />
    </section>
  );
}
