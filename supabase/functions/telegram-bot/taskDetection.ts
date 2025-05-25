
export function isProbablyTaskDescription(text: string): boolean {
  const taskKeywords = [
    'todo', 'to-do', 'to do', 'task', 'finish', 'complete', 'work on', 'create', 
    'prepare', 'write', 'send', 'review', 'check', 'call', 'email', 'meeting',
    'appointment', 'deadline', 'schedule', 'remind', 'remember', 'need to', 'have to',
    'should', 'must', 'urgent', 'important', 'asap'
  ];
  
  const timeKeywords = [
    'today', 'tomorrow', 'next week', 'monday', 'tuesday', 'wednesday', 'thursday',
    'friday', 'saturday', 'sunday', 'morning', 'afternoon', 'evening', 'night',
    'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august',
    'september', 'october', 'november', 'december', 'by', 'due', 'deadline'
  ];
  
  const priorityKeywords = ['urgent', 'important', 'asap', 'critical', 'high priority', 'low priority'];
  
  const hasTaskKeyword = taskKeywords.some(keyword => text.includes(keyword));
  const hasTimeKeyword = timeKeywords.some(keyword => text.includes(keyword));
  const hasPriorityKeyword = priorityKeywords.some(keyword => text.includes(keyword));
  
  const appropriateLength = text.length > 8 && text.length < 300;
  const isNotQuestion = !text.includes('?') || text.includes('?') && (hasTaskKeyword || hasTimeKeyword);
  
  return appropriateLength && isNotQuestion && (hasTaskKeyword || (hasTimeKeyword && hasTaskKeyword) || hasPriorityKeyword);
}
