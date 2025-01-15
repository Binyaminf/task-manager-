import { AITaskInterface } from "@/components/AITaskInterface";

interface AISectionProps {
  onTaskCreated: () => void;
}

export function AISection({ onTaskCreated }: AISectionProps) {
  return (
    <section className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold mb-4">AI Task Assistant</h2>
      <AITaskInterface onTaskCreated={onTaskCreated} />
    </section>
  );
}