import { useState } from "react";
import { AITaskInterface } from "@/components/AITaskInterface";
import { ChevronDown, ChevronUp, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AISectionProps {
  onTaskCreated: () => void;
}

export function AISection({ onTaskCreated }: AISectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section className="bg-white rounded-lg shadow-sm">
      <Button
        variant="ghost"
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">AI Task Assistant</h2>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5" />
        ) : (
          <ChevronDown className="h-5 w-5" />
        )}
      </Button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-300",
          isExpanded ? "max-h-[500px]" : "max-h-0"
        )}
      >
        <div className="p-4 pt-0">
          <AITaskInterface onTaskCreated={onTaskCreated} />
        </div>
      </div>
    </section>
  );
}