export const getPriorityColor = (priority: "High" | "Medium" | "Low") => {
  switch (priority) {
    case "High":
      return "bg-red-500";
    case "Medium":
      return "bg-yellow-500";
    case "Low":
      return "bg-green-500";
    default:
      return "bg-gray-500";
  }
};

export const getStatusColor = (status: "To Do" | "In Progress" | "Done") => {
  switch (status) {
    case "To Do":
      return "bg-gray-500";
    case "In Progress":
      return "bg-blue-500";
    case "Done":
      return "bg-green-500";
    default:
      return "bg-gray-500";
  }
};