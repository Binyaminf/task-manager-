import { TaskHeader } from "@/components/TaskHeader";
import { FolderList } from "@/components/FolderList";
import { TaskList } from "@/components/TaskList";
import { TaskCalendar } from "@/components/task/TaskCalendar";
import { Task } from "@/components/TaskCard";

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
  return (
    <section className="bg-white rounded-lg shadow-sm p-6">
      <TaskHeader onNewTask={onNewTask} />
      <div className="mt-6">
        <FolderList onFolderSelect={onFolderSelect} />
      </div>
      <div className="mt-6">
        {viewMode === 'list' ? (
          <TaskList 
            tasks={tasks} 
            onTasksChange={onTasksChange}
            selectedFolder={selectedFolder}
          />
        ) : (
          <TaskCalendar tasks={tasks} />
        )}
      </div>
    </section>
  );
}