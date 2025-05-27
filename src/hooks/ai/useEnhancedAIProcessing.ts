
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { EnhancedAIAnalysis, ProcessingState } from "./types";
import { useUserContext } from "./useUserContext";
import { useAIAnalysis } from "./useAIAnalysis";
import { useTaskCreation } from "./useTaskCreation";

export function useEnhancedAIProcessing() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingState, setProcessingState] = useState<ProcessingState>({
    step: 'idle',
    error: null,
    retryCount: 0,
  });
  const [analysis, setAnalysis] = useState<EnhancedAIAnalysis | null>(null);
  
  const { toast } = useToast();
  const { gatherUserContext } = useUserContext();
  const { createEnhancedAnalysis } = useAIAnalysis();
  const { createTask } = useTaskCreation();

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
          userContext: userContext
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
        const enhancedAnalysis = createEnhancedAnalysis(data, userContext);
        setAnalysis(enhancedAnalysis);
        
        const success = await createTask(data.task, session.session.user.id);
        
        if (success) {
          setProcessingState({ 
            step: 'complete', 
            error: null, 
            lastText: input.trim(),
            retryCount: 0 
          });
          
          return true;
        }
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
