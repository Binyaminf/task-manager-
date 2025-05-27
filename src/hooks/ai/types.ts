
import { Task } from "@/types/task";

export interface EnhancedAIAnalysis {
  confidence: number;
  relatedKeywords: string[];
  suggestions: {
    category: { value: string; confidence: number; reason: string };
    priority: { value: string; confidence: number; reason: string };
    dueDate: { value: string; confidence: number; reason: string };
    duration: { value: string; confidence: number; reason: string };
  };
  contextUsed: {
    similarTasks: Task[];
    userPatterns: {
      commonCategories: string[];
      averageDuration: string;
      priorityTrends: string;
    };
  };
}

export interface ProcessingState {
  step: 'idle' | 'analyzing' | 'gathering-context' | 'creating' | 'complete';
  error: string | null;
  lastText?: string;
  retryCount: number;
}

export interface UserContext {
  recentTasks: Task[];
  commonCategories: string[];
  mostUsedPriority: string;
  averageDuration: string;
}
