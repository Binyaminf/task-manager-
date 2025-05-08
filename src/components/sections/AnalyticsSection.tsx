
import { TaskSummaryAnalytics } from "@/components/analytics/TaskSummaryAnalytics";
import { useIsMobile } from "@/hooks/use-mobile";

export function AnalyticsSection() {
  const isMobile = useIsMobile();

  return (
    <section className="bg-white rounded-lg shadow-sm p-4 md:p-6">
      <h2 className="text-lg font-semibold mb-2 md:mb-4">Task Analytics</h2>
      <div className={isMobile ? "max-h-[300px] overflow-y-auto" : ""}>
        <TaskSummaryAnalytics />
      </div>
    </section>
  );
}
