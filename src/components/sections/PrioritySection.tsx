
import { Task } from "@/types/task";

interface PrioritySectionProps {
  tasks?: Task[];
}

export function PrioritySection({ tasks = [] }: PrioritySectionProps) {
  // The implementation will be handled by the PriorityDashboard component
  // which is not editable, so we just pass the tasks prop
  
  return (
    <section className="bg-white rounded-lg shadow-sm p-4">
      <h2 className="text-lg font-semibold mb-4">Priority Tasks</h2>
      {/* Priority dashboard component will handle rendering of priority tasks */}
    </section>
  );
}
