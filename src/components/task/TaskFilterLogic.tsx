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
    console.log('useTaskFiltering - Input tasks:', tasks);
    console.log('useTaskFiltering - selectedFolder:', selectedFolder);
    console.log('useTaskFiltering - searchQuery:', searchQuery);

    // First filter by folder
    let filteredTasks = tasks;
    
    // Only filter by folder if a folder is selected
    if (selectedFolder !== null) {
      console.log('Filtering by folder:', selectedFolder);
      filteredTasks = tasks.filter(task => {
        const matches = task.folder_id === selectedFolder;
        console.log('Task:', task.id, 'folder_id:', task.folder_id, 'matches:', matches);
        return matches;
      });
    }

    // Then filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredTasks = filteredTasks.filter(task => 
        task.summary.toLowerCase().includes(query) ||
        (task.description?.toLowerCase().includes(query))
      );
    }

    console.log('After folder filtering:', filteredTasks);

    // Then apply other filters
    const filtered = filterTasks(filteredTasks, statusFilter, priorityFilter, categoryFilter);
    console.log('After other filters:', filtered);

    const result = sortTasks(filtered, sortField, sortOrder);
    console.log('Final sorted result:', result);

    return result;
  }, [tasks, selectedFolder, sortField, sortOrder, statusFilter, priorityFilter, categoryFilter, searchQuery]);
}