
import { Task } from "@/types/task";
import { TaskGrid } from "./TaskGrid";
import { TaskListView } from "./TaskListView";
import { DragEndEvent } from "@dnd-kit/core";
import { ErrorBoundary } from "react-error-boundary";
import { TaskSkeleton, TaskSkeletonGrid } from "../common/TaskSkeleton";
import { useIsMobile } from "@/hooks/use-mobile";

interface TaskListContentProps {
  tasks: Task[];
  viewMode: 'grid' | 'list';
  isLoading: boolean;
  selectedTasks: Set<string>;
  onTaskClick: (task: Task) => void;
  onTaskDelete: (task: Task) => void;
  onDragEnd: (event: DragEndEvent) => void;
  onTaskSelect: (taskId: string, selected: boolean) => void;
}

export function TaskListContent({
  tasks,
  viewMode,
  isLoading,
  selectedTasks,
  onTaskClick,
  onTaskDelete,
  onDragEnd,
  onTaskSelect,
}: TaskListContentProps) {
  const isMobile = useIsMobile();

  if (isLoading) {
    return viewMode === 'grid' ? <TaskSkeletonGrid /> : <TaskSkeleton />;
  }

  if (!tasks || tasks.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No tasks found. Create a new task to get started.
      </div>
    );
  }

  return (
    <ErrorBoundary fallback={<div>Something went wrong</div>}>
      {viewMode === 'grid' ? (
        <div className={isMobile ? "-mx-2 px-2" : ""}>
          <TaskGrid
            tasks={tasks}
            onTaskClick={onTaskClick}
            onTaskDelete={onTaskDelete}
            onDragEnd={onDragEnd}
            selectedTasks={selectedTasks}
            onTaskSelect={onTaskSelect}
          />
        </div>
      ) : (
        <TaskListView
          tasks={tasks}
          onTaskClick={onTaskClick}
          onTaskDelete={onTaskDelete}
          selectedTasks={selectedTasks}
          onTaskSelect={onTaskSelect}
        />
      )}
    </ErrorBoundary>
  );
}
