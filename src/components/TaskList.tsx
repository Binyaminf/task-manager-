import { Task } from "./TaskCard";
import { useState } from "react";
import { TaskFilterBar } from "./task/TaskFilterBar";
import { DeleteTaskDialog } from "./task/DeleteTaskDialog";
import { TaskGrid } from "./task/TaskGrid";
import { DragEndEvent } from "@dnd-kit/core";
import { SortField, SortOrder } from "./TaskSorting";
import { useTaskFiltering } from "./task/TaskFilterLogic";
import { useTaskOperations } from "./task/TaskOperations";
import { BatchActions } from "./task/BatchActions";
import { useTaskSelection } from "@/hooks/useTaskSelection";
import { useTaskDeletion } from "@/hooks/useTaskDeletion";
import { useBatchOperations } from "@/hooks/useBatchOperations";

interface TaskListProps {
  tasks: Task[];
  onTasksChange?: () => void;
  selectedFolder: string | null;
}

export function TaskList({ tasks, onTasksChange, selectedFolder }: TaskListProps) {
  const [sortField, setSortField] = useState<SortField>("dueDate");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const { handleTaskClick, handleDragEnd } = useTaskOperations(onTasksChange);
  const { selectedTasks, handleTaskSelect, clearSelection } = useTaskSelection();
  const { taskToDelete, handleDeleteTask, confirmDelete, closeDeleteDialog } = useTaskDeletion(onTasksChange);
  const { handleBatchDelete, handleBatchStatusChange, handleBatchMoveToFolder } = useBatchOperations(onTasksChange);

  // Get unique filter options
  const categories = ["all", ...new Set(tasks.map(task => task.category))];
  const statuses = ["all", ...new Set(tasks.map(task => task.status))];
  const priorities = ["all", ...new Set(tasks.map(task => task.priority))];

  const handleDragEndEvent = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const activeTask = tasks.find(task => task.id === active.id);
    if (!activeTask) return;

    if (over.id.toString().startsWith('folder-')) {
      const folderId = over.id.toString().replace('folder-', '');
      handleDragEnd(activeTask, folderId === 'none' ? null : folderId);
    }
  };

  // Filter and sort tasks
  const filteredAndSortedTasks = useTaskFiltering({
    tasks,
    selectedFolder,
    sortField,
    sortOrder,
    statusFilter,
    priorityFilter,
    categoryFilter,
  });

  return (
    <>
      <BatchActions
        selectedTasks={tasks.filter(task => selectedTasks.has(task.id))}
        onStatusChange={(status) => {
          handleBatchStatusChange(selectedTasks, status);
          clearSelection();
        }}
        onDelete={() => {
          handleBatchDelete(selectedTasks);
          clearSelection();
        }}
        onMoveToFolder={(folderId) => {
          handleBatchMoveToFolder(selectedTasks, folderId);
          clearSelection();
        }}
      />

      <TaskFilterBar
        sortField={sortField}
        sortOrder={sortOrder}
        statusFilter={statusFilter}
        priorityFilter={priorityFilter}
        categoryFilter={categoryFilter}
        statuses={statuses}
        priorities={priorities}
        categories={categories}
        onSortFieldChange={setSortField}
        onSortOrderChange={setSortOrder}
        onStatusChange={setStatusFilter}
        onPriorityChange={setPriorityFilter}
        onCategoryChange={setCategoryFilter}
      />

      <TaskGrid
        tasks={filteredAndSortedTasks}
        onTaskClick={handleTaskClick}
        onTaskDelete={handleDeleteTask}
        onDragEnd={handleDragEndEvent}
        selectedTasks={selectedTasks}
        onTaskSelect={handleTaskSelect}
      />

      <DeleteTaskDialog
        taskToDelete={taskToDelete}
        onClose={closeDeleteDialog}
        onConfirm={confirmDelete}
      />
    </>
  );
}