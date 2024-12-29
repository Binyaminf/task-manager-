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
    // First filter by folder
    const folderFilteredTasks = tasks.filter(task => {
      if (selectedFolder === null) {
        return true; // Show all tasks when no folder is selected
      }
      return task.folder_id === selectedFolder;
    });

    // Then apply other filters
    const filtered = filterTasks(folderFilteredTasks, statusFilter, priorityFilter, categoryFilter);
    return sortTasks(filtered, sortField, sortOrder);
  }, [tasks, selectedFolder, sortField, sortOrder, statusFilter, priorityFilter, categoryFilter]);
}