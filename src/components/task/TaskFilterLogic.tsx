import { useMemo } from "react";
import { Task } from "../TaskCard";
import { filterTasks, sortTasks } from "@/utils/taskUtils";
import { SortField, SortOrder } from "../TaskSorting";

interface TaskFilterLogicProps {
  tasks: Task[];
  selectedFolder: string | null;
  sortField: SortField;
  sortOrder: SortOrder;
  statusFilter: string;
  priorityFilter: string;
  categoryFilter: string;
}

export function useTaskFiltering({
  tasks,
  selectedFolder,
  sortField,
  sortOrder,
  statusFilter,
  priorityFilter,
  categoryFilter,
}: TaskFilterLogicProps) {
  return useMemo(() => {
    console.log('useTaskFiltering - Input tasks:', tasks);
    console.log('useTaskFiltering - selectedFolder:', selectedFolder);

    // First filter by folder
    const folderFilteredTasks = tasks.filter(task => {
      console.log('Checking task:', task.id, 'folder_id:', task.folder_id, 'against selectedFolder:', selectedFolder);
      if (selectedFolder === null) {
        return true; // Show all tasks when no folder is selected
      }
      return task.folder_id === selectedFolder;
    });

    console.log('Folder filtered tasks:', folderFilteredTasks);

    // Then apply other filters
    const filtered = filterTasks(folderFilteredTasks, statusFilter, priorityFilter, categoryFilter);
    const result = sortTasks(filtered, sortField, sortOrder);

    console.log('Final filtered and sorted tasks:', result);
    return result;
  }, [tasks, selectedFolder, sortField, sortOrder, statusFilter, priorityFilter, categoryFilter]);
}