
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { AIAnalysis } from "@/hooks/useAIProcessing";

interface AIAnalysisDisplayProps {
  analysis: AIAnalysis;
}

export function AIAnalysisDisplay({ analysis }: AIAnalysisDisplayProps) {
  return (
    <div className="absolute right-2 top-2">
      <HoverCard>
        <HoverCardTrigger asChild>
          <Badge 
            variant={analysis.confidence > 0.7 ? "default" : "secondary"}
            className="cursor-help"
          >
            {Math.round(analysis.confidence * 100)}% confidence
          </Badge>
        </HoverCardTrigger>
        <HoverCardContent className="w-80">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">AI Analysis</h4>
            <div className="text-sm">
              Related keywords:
              <div className="flex flex-wrap gap-1 mt-1">
                {analysis.relatedKeywords.map((keyword, index) => (
                  <Badge key={index} variant="outline">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>
    </div>
  );
}
