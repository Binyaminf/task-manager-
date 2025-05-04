
import { TaskSummaryAnalytics } from "@/components/analytics/TaskSummaryAnalytics";

export function AnalyticsSection() {
  return (
    <section className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold mb-4">Task Analytics</h2>
      <TaskSummaryAnalytics />
    </section>
  );
}
