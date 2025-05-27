
import { EnhancedAIAnalysis, UserContext } from "./types";
import { Task } from "@/types/task";

export function useAIAnalysis() {
  const createEnhancedAnalysis = (
    data: any,
    userContext: UserContext
  ): EnhancedAIAnalysis => {
    return {
      confidence: data.analysis?.confidence || 0.8,
      relatedKeywords: data.analysis?.relatedKeywords || [],
      suggestions: {
        category: {
          value: data.task.category,
          confidence: data.analysis?.details?.category?.confidence || 0.7,
          reason: data.analysis?.details?.category?.reason || "Based on task content"
        },
        priority: {
          value: data.task.priority,
          confidence: data.analysis?.details?.priority?.confidence || 0.7,
          reason: data.analysis?.details?.priority?.reason || "Based on urgency indicators"
        },
        dueDate: {
          value: data.task.dueDate,
          confidence: data.analysis?.details?.dueDate?.confidence || 0.6,
          reason: data.analysis?.details?.dueDate?.reason || "Based on time references"
        },
        duration: {
          value: data.task.estimatedDuration,
          confidence: data.analysis?.details?.duration?.confidence || 0.6,
          reason: data.analysis?.details?.duration?.reason || "Based on task complexity"
        }
      },
      contextUsed: {
        similarTasks: userContext.recentTasks.slice(0, 3),
        userPatterns: {
          commonCategories: userContext.commonCategories,
          averageDuration: userContext.averageDuration,
          priorityTrends: userContext.mostUsedPriority
        }
      }
    };
  };

  return { createEnhancedAnalysis };
}
