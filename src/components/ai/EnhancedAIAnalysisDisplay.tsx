
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Brain, Target, Calendar, Clock, Folder, TrendingUp } from "lucide-react";
import { EnhancedAIAnalysis } from "@/hooks/ai/types";
import { Task } from "@/types/task";

interface EnhancedAIAnalysisDisplayProps {
  analysis: EnhancedAIAnalysis;
}

export function EnhancedAIAnalysisDisplay({ analysis }: EnhancedAIAnalysisDisplayProps) {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600";
    if (confidence >= 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return "High confidence";
    if (confidence >= 0.6) return "Medium confidence";
    return "Low confidence";
  };

  return (
    <Card className="mt-4 border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <Brain className="h-4 w-4" />
          Enhanced AI Analysis
        </CardTitle>
        <CardDescription>
          AI analyzed your request using context from your task history
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Confidence */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Overall Confidence</span>
          <div className="flex items-center gap-2">
            <Progress value={analysis.confidence * 100} className="w-20" />
            <span className={`text-sm ${getConfidenceColor(analysis.confidence)}`}>
              {Math.round(analysis.confidence * 100)}%
            </span>
          </div>
        </div>

        {/* AI Suggestions */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              <span className="text-xs font-medium">Priority</span>
            </div>
            <Badge variant="outline" className="text-xs">
              {analysis.suggestions.priority.value}
            </Badge>
            <div className="text-xs text-muted-foreground">
              {getConfidenceText(analysis.suggestions.priority.confidence)}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <Folder className="h-3 w-3" />
              <span className="text-xs font-medium">Category</span>
            </div>
            <Badge variant="outline" className="text-xs">
              {analysis.suggestions.category.value}
            </Badge>
            <div className="text-xs text-muted-foreground">
              {getConfidenceText(analysis.suggestions.category.confidence)}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span className="text-xs font-medium">Due Date</span>
            </div>
            <Badge variant="outline" className="text-xs">
              {new Date(analysis.suggestions.dueDate.value).toLocaleDateString()}
            </Badge>
            <div className="text-xs text-muted-foreground">
              {getConfidenceText(analysis.suggestions.dueDate.confidence)}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span className="text-xs font-medium">Duration</span>
            </div>
            <Badge variant="outline" className="text-xs">
              {analysis.suggestions.duration.value}
            </Badge>
            <div className="text-xs text-muted-foreground">
              {getConfidenceText(analysis.suggestions.duration.confidence)}
            </div>
          </div>
        </div>

        {/* Context Used */}
        {analysis.contextUsed.userPatterns.commonCategories.length > 0 && (
          <div className="pt-3 border-t border-blue-200">
            <div className="flex items-center gap-1 mb-2">
              <TrendingUp className="h-3 w-3" />
              <span className="text-xs font-medium">Used Your Patterns</span>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Common categories: {analysis.contextUsed.userPatterns.commonCategories.slice(0, 3).join(", ")}</div>
              <div>Typical duration: {analysis.contextUsed.userPatterns.averageDuration}</div>
              <div>Priority trend: {analysis.contextUsed.userPatterns.priorityTrends}</div>
            </div>
          </div>
        )}

        {/* Related Keywords */}
        {analysis.relatedKeywords.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {analysis.relatedKeywords.slice(0, 6).map((keyword, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {keyword}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
