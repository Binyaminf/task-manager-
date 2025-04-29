
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { AIAnalysis } from "@/hooks/useAIProcessing";
import { CircleCheck, CircleHelp } from "lucide-react";

interface AIAnalysisDisplayProps {
  analysis: AIAnalysis;
}

export function AIAnalysisDisplay({ analysis }: AIAnalysisDisplayProps) {
  // Helper function to determine confidence level
  const getConfidenceLevel = (score: number) => {
    if (score >= 0.8) return "high";
    if (score >= 0.6) return "medium";
    return "low";
  };

  // Get badge variant based on confidence
  const getBadgeVariant = (score: number) => {
    const level = getConfidenceLevel(score);
    return level === "high" ? "default" : level === "medium" ? "secondary" : "outline";
  };

  // Format confidence percentage
  const formatConfidence = (score: number) => {
    return `${Math.round(score * 100)}%`;
  };

  return (
    <div className="absolute right-2 top-2">
      <HoverCard>
        <HoverCardTrigger asChild>
          <Badge 
            variant={getBadgeVariant(analysis.confidence)}
            className="cursor-help flex items-center gap-1"
          >
            {analysis.confidence > 0.7 ? (
              <CircleCheck className="h-3 w-3" />
            ) : (
              <CircleHelp className="h-3 w-3" />
            )}
            {formatConfidence(analysis.confidence)} confidence
          </Badge>
        </HoverCardTrigger>
        <HoverCardContent className="w-80">
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">AI Analysis Details</h4>
            
            {analysis.details && (
              <div className="space-y-2">
                {Object.entries(analysis.details).map(([key, detail]) => (
                  <div key={key} className="text-sm">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium capitalize">{key}</span>
                      <Badge 
                        variant={getBadgeVariant(detail.confidence)}
                        className="text-xs h-5"
                      >
                        {formatConfidence(detail.confidence)}
                      </Badge>
                    </div>
                    <div className="text-xs bg-muted/50 p-1.5 rounded-sm">
                      <span className="font-medium">{detail.value}</span>
                      {detail.reason && (
                        <span className="block text-muted-foreground mt-0.5 text-[10px]">
                          {detail.reason}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="text-sm">
              <span className="text-xs font-medium">Related keywords:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {analysis.relatedKeywords.map((keyword, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
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
