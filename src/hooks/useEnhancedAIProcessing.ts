
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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

interface ProcessingState {
  step: 'idle' | 'analyzing' | 'gathering-context' | 'creating' | 'complete';
  error: string | null;
  lastText?: string;
  retryCount: number;
}

export function useEnhancedAIProcessing() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingState, setProcessingState] = useState<ProcessingState>({
    step: 'idle',
    error: null,
    retryCount: 0,
  });
  const [analysis, setAnalysis] = useState<EnhancedAIAnalysis | null>(null);
  const { toast } = useToast();

  const gatherUserContext = async (userId: string): Promise<any> => {
    try {
      // Get user's recent tasks for context
      const { data: recentTasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      // Analyze user patterns
      const categories = recentTasks?.map(t => t.category).filter(Boolean) || [];
      const priorities = recentTasks?.map(t => t.priority) || [];
      const durations = recentTasks?.map(t => t.estimated_duration).filter(Boolean) || [];

      const categoryFreq = categories.reduce((acc, cat) => {
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const priorityFreq = priorities.reduce((acc, pri) => {
        acc[pri] = (acc[pri] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        recentTasks: recentTasks || [],
        commonCategories: Object.keys(categoryFreq).sort((a, b) => categoryFreq[b] - categoryFreq[a]).slice(0, 5),
        mostUsedPriority: Object.keys(priorityFreq).sort((a, b) => priorityFreq[b] - priorityFreq[a])[0] || 'Medium',
        averageDuration: durations.length > 0 ? '2h' : '1h', // Simplified for now
      };
    } catch (error) {
      console.error('Error gathering user context:', error);
      return { recentTasks: [], commonCategories: [], mostUsedPriority: 'Medium', averageDuration: '1h' };
    }
  };

  const processAIRequest = async (input: string) => {
    if (!input.trim()) {
      toast({
        title: "Error",
        description: "Please enter some text",
        variant: "destructive",
      });
      return false;
    }

    setIsProcessing(true);
    setProcessingState({ 
      step: 'gathering-context', 
      error: null, 
      lastText: input.trim(),
      retryCount: 0 
    });

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user?.id) {
        throw new Error("User not authenticated");
      }

      // Gather user context
      const userContext = await gatherUserContext(session.session.user.id);
      
      setProcessingState({ 
        step: 'analyzing', 
        error: null, 
        lastText: input.trim(),
        retryCount: 0 
      });

      const currentTime = new Date().toISOString();
      console.log('Sending enhanced request with context:', { input: input.trim(), userContext });
      
      const { data, error } = await supabase.functions.invoke('process-task-text', {
        body: { 
          text: input.trim(),
          currentTime: currentTime,
          userContext: userContext // Include user context
        }
      });

      if (error) {
        console.error('Error from Edge Function:', error);
        throw error;
      }

      console.log('Enhanced Edge Function response:', data);

      if (!data) {
        throw new Error('No data received from Edge Function');
      }

      setProcessingState({ 
        step: 'creating', 
        error: null, 
        lastText: input.trim(),
        retryCount: 0 
      });

      if (data.type === 'search') {
        toast({
          title: "Search Results",
          description: `Found ${data.results.length} matching tasks`,
        });
        return false;
      } else if (data.type === 'create') {
        // Enhanced analysis with context
        const enhancedAnalysis: EnhancedAIAnalysis = {
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

        setAnalysis(enhancedAnalysis);
        
        const { error: createError } = await supabase
          .from('tasks')
          .insert([{
            user_id: session.session.user.id,
            summary: data.task.summary,
            description: data.task.description,
            due_date: data.task.dueDate,
            estimated_duration: data.task.estimatedDuration,
            priority: data.task.priority,
            status: data.task.status || "To Do",
            category: data.task.category,
            folder_id: null
          }]);

        if (createError) throw createError;

        setProcessingState({ 
          step: 'complete', 
          error: null, 
          lastText: input.trim(),
          retryCount: 0 
        });
        
        toast({
          title: "Success",
          description: "Task created with enhanced AI analysis",
        });
        
        return true;
      } else {
        throw new Error('Unknown response type from edge function');
      }
    } catch (error: any) {
      console.error('Error processing enhanced AI request:', error);
      
      const currentRetryCount = processingState.retryCount + 1;
      
      setProcessingState({ 
        step: 'idle', 
        error: error.message || "Failed to process your request", 
        lastText: input.trim(),
        retryCount: currentRetryCount
      });
      
      // Provide more helpful error messages
      let errorMessage = "Failed to process your request. Please try again.";
      if (error.message?.includes('timeout')) {
        errorMessage = "Request timed out. The AI service might be busy. Please try again.";
      } else if (error.message?.includes('authentication')) {
        errorMessage = "Authentication failed. Please refresh and try again.";
      } else if (currentRetryCount < 3) {
        errorMessage = `Processing failed. Retry ${currentRetryCount}/3 available.`;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      if (processingState.step === 'complete') {
        setTimeout(() => {
          setIsProcessing(false);
        }, 1500);
      } else {
        setIsProcessing(false);
      }
    }
  };

  const retryLastRequest = async () => {
    if (processingState.lastText && processingState.retryCount < 3) {
      return processAIRequest(processingState.lastText);
    }
    return false;
  };

  const clearAnalysis = () => {
    setAnalysis(null);
    setProcessingState({ 
      step: 'idle', 
      error: null, 
      retryCount: 0 
    });
  };

  return {
    isProcessing,
    processingState,
    analysis,
    processAIRequest,
    retryLastRequest,
    clearAnalysis
  };
}
