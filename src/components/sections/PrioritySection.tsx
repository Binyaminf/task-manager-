import { PriorityDashboard } from "@/components/priority-dashboard/PriorityDashboard";

export function PrioritySection() {
  return (
    <section className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold mb-4">Priority Overview</h2>
      <PriorityDashboard />
    </section>
  );
}