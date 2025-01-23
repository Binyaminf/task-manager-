import { useMemo } from "react";
import { Task } from "@/types/task";
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
  searchQuery: string;
}

export function useTaskFiltering({
  tasks,
  selectedFolder,
  sortField,
  sortOrder,
  statusFilter,
  priorityFilter,
  categoryFilter,
  searchQuery,
}: TaskFilterLogicProps) {
  return useMemo(() => {
    // First filter by folder for better performance
    let filteredTasks = selectedFolder !== null
      ? tasks.filter(task => task.folder_id === selectedFolder)
      : tasks;

    // Then apply search filter if present
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredTasks = filteredTasks.filter(task => 
        task.summary.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query)
      );
    }

    // Apply other filters
    filteredTasks = filterTasks(filteredTasks, statusFilter, priorityFilter, categoryFilter);

    // Finally sort the filtered tasks
    return sortTasks(filteredTasks, sortField, sortOrder);
  }, [
    tasks,
    selectedFolder,
    sortField,
    sortOrder,
    statusFilter,
    priorityFilter,
    categoryFilter,
    searchQuery
  ]);
}