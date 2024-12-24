import { Task } from "@/components/TaskCard";

export const sortTasks = (
  tasks: Task[],
  sortField: "dueDate" | "priority" | "status" | "category",
  sortOrder: "asc" | "desc"
) => {
  return [...tasks].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case "dueDate":
        comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        break;
      case "priority": {
        const priorityOrder = { High: 3, Medium: 2, Low: 1 };
        comparison = (priorityOrder[a.priority] || 0) - (priorityOrder[b.priority] || 0);
        break;
      }
      case "status": {
        const statusOrder = { "To Do": 1, "In Progress": 2, "Done": 3 };
        comparison = (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0);
        break;
      }
      case "category":
        comparison = a.category.localeCompare(b.category);
        break;
    }
    return sortOrder === "asc" ? comparison : -comparison;
  });
};

export const filterTasks = (
  tasks: Task[],
  statusFilter: string,
  priorityFilter: string,
  categoryFilter: string
) => {
  return tasks.filter(task => {
    if (statusFilter !== "all" && task.status !== statusFilter) return false;
    if (priorityFilter !== "all" && task.priority !== priorityFilter) return false;
    if (categoryFilter !== "all" && task.category !== categoryFilter) return false;
    return true;
  });
};