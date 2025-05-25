
import { useState } from "react";
import { EnhancedAITaskInterface } from "@/components/EnhancedAITaskInterface";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AISectionProps {
  onTaskCreated: () => void;
}

export function AISection({ onTaskCreated }: AISectionProps) {
  const [isExpanded, setIsExpanded] = useState(true); // Start expanded to show the enhanced features

  return (
    <section className="bg-white rounded-lg shadow-sm border border-blue-100">
      <Button
        variant="ghost"
        className="w-full flex items-center justify-between p-4 hover:bg-blue-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-blue-800">Enhanced AI Assistant</h2>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
            NEW
          </span>
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
          isExpanded ? "max-h-[800px]" : "max-h-0"
        )}
      >
        <div className="p-4 pt-0">
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-sm text-blue-800 font-medium mb-1">✨ Enhanced Features:</div>
            <div className="text-xs text-blue-700 space-y-1">
              <div>• Learns from your task history and patterns</div>
              <div>• Context-aware suggestions for better accuracy</div>
              <div>• Smart retry mechanism with detailed feedback</div>
              <div>• Confidence scoring for all AI predictions</div>
            </div>
          </div>
          <EnhancedAITaskInterface onTaskCreated={onTaskCreated} />
        </div>
      </div>
    </section>
  );
}
