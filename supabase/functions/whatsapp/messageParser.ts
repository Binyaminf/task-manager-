export interface ParsedTask {
  summary: string;
  description?: string;
  dueDate?: string;
  estimatedDuration?: string;
  priority?: "High" | "Medium" | "Low";
  category?: string;
}

export function parseTaskMessage(message: string): ParsedTask {
  const lines = message.toLowerCase().split('\n');
  const task: ParsedTask = {
    summary: '',
    priority: 'Medium',
    category: 'WhatsApp'
  };

  for (const line of lines) {
    if (line.startsWith('task:')) {
      task.summary = line.substring(5).trim();
    } else if (line.startsWith('due:')) {
      task.dueDate = new Date(line.substring(4).trim()).toISOString();
    } else if (line.startsWith('time:')) {
      task.estimatedDuration = line.substring(5).trim();
    } else if (line.startsWith('priority:')) {
      const priority = line.substring(9).trim();
      if (['high', 'medium', 'low'].includes(priority)) {
        task.priority = priority.charAt(0).toUpperCase() + priority.slice(1) as "High" | "Medium" | "Low";
      }
    } else if (line.startsWith('category:')) {
      task.category = line.substring(9).trim();
    } else if (line.startsWith('desc:')) {
      task.description = line.substring(5).trim();
    }
  }

  // Set default values if not provided
  if (!task.dueDate) {
    task.dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  }
  if (!task.estimatedDuration) {
    task.estimatedDuration = '1h';
  }

  return task;
}