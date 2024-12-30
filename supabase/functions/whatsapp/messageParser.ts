export interface ParsedTask {
  summary: string;
  description?: string;
  dueDate?: string;
  estimatedDuration?: string;
  priority?: string;
  category?: string;
}

export function parseTaskMessage(message: string): ParsedTask {
  const task: ParsedTask = {
    summary: '',
  };

  // Check if message starts with "task:"
  if (!message.toLowerCase().startsWith('task:')) {
    return task;
  }

  const lines = message.split('\n');
  
  // First line after "task:" is the summary
  task.summary = lines[0].replace(/^task:/i, '').trim();

  // Parse additional fields from remaining lines
  lines.slice(1).forEach(line => {
    const [key, value] = line.split(':').map(s => s.trim());
    if (!key || !value) return;

    switch (key.toLowerCase()) {
      case 'due':
        task.dueDate = value;
        break;
      case 'time':
        task.estimatedDuration = value;
        break;
      case 'priority':
        if (['high', 'medium', 'low'].includes(value.toLowerCase())) {
          task.priority = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
        }
        break;
      case 'category':
        task.category = value;
        break;
      case 'desc':
        task.description = value;
        break;
    }
  });

  return task;
}