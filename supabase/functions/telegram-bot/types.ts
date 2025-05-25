
export interface Task {
  id?: string;
  user_id?: string;
  summary: string;
  description?: string;
  dueDate: string;
  estimatedDuration: string;
  priority: "High" | "Medium" | "Low";
  status: "To Do" | "In Progress" | "Done";
  category: string;
  externalLinks?: string[];
  folder_id?: string | null;
}

export interface UserContext {
  recentTasks: any[];
  commonCategories: string[];
  mostUsedPriority: string;
  averageDuration: string;
  totalTasks: number;
}

export interface TelegramUser {
  id: string;
  telegram_id: string;
  user_id?: string;
  verification_code?: string;
}
