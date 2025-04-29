import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface AIAnalysisDetail {
  value: string;
  confidence: number;
  reason: string;
}

export interface AIAnalysisDetails {
  priority?: AIAnalysisDetail;
  category?: AIAnalysisDetail;
  dueDate?: AIAnalysisDetail;
  duration?: AIAnalysisDetail;
  [key: string]: AIAnalysisDetail | undefined;
}

export interface AIAnalysis {
  confidence: number;
  relatedKeywords: string[];
  details?: AIAnalysisDetails;
}

interface ProcessingState {
  step: 'idle' | 'analyzing' | 'creating' | 'complete';
  error: string | null;
  lastText?: string;
}

export function useAIProcessing() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingState, setProcessingState] = useState<ProcessingState>({
    step: 'idle',
    error: null,
  });
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const { toast } = useToast();

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
    setProcessingState({ step: 'analyzing', error: null, lastText: input.trim() });

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user?.id) {
        throw new Error("User not authenticated");
      }

      const currentTime = new Date().toISOString();
      console.log('Sending request to Edge Function with text:', input.trim());
      
      const { data, error } = await supabase.functions.invoke('process-task-text', {
        body: { 
          text: input.trim(),
          currentTime: currentTime
        }
      });

      if (error) {
        console.error('Error from Edge Function:', error);
        throw error;
      }

      console.log('Edge Function response:', data);

      if (!data) {
        throw new Error('No data received from Edge Function');
      }

      setProcessingState({ step: 'creating', error: null, lastText: input.trim() });

      if (data.type === 'search') {
        toast({
          title: "Search Results",
          description: `Found ${data.results.length} matching tasks`,
        });
        return false;
      } else if (data.type === 'create') {
        setAnalysis(data.analysis);
        
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
            folder_id: null // Default to no folder
          }]);

        if (createError) throw createError;

        setProcessingState({ step: 'complete', error: null, lastText: input.trim() });
        
        toast({
          title: "Success",
          description: "Task created successfully",
        });
        
        return true;
      } else {
        throw new Error('Unknown response type from edge function');
      }
    } catch (error: any) {
      console.error('Error processing AI request:', error);
      setProcessingState({ 
        step: 'idle', 
        error: error.message || "Failed to process your request", 
        lastText: input.trim()
      });
      toast({
        title: "Error",
        description: error.message || "Failed to process your request. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      // Keep processing state for a moment so user can see the "complete" state
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
    if (processingState.lastText) {
      return processAIRequest(processingState.lastText);
    }
    return false;
  };

  return {
    isProcessing,
    processingState,
    analysis,
    processAIRequest,
    retryLastRequest
  };
}
